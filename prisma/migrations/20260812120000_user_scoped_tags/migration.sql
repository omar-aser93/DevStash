-- Tags were previously globally unique. Split shared legacy tags by item owner
-- before making each tag belong to exactly one user.
ALTER TABLE "tags" ADD COLUMN "userId" TEXT;
DROP INDEX "tags_name_key";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "tags" AS tag
    WHERE NOT EXISTS (
      SELECT 1
      FROM "_ItemTags" AS item_tag
      WHERE item_tag."B" = tag."id"
    )
  ) THEN
    RAISE EXCEPTION
      'Cannot migrate orphaned tags: assign an owner before applying user_scoped_tags';
  END IF;
END $$;

CREATE TEMP TABLE "_tag_user_migrations" AS
SELECT DISTINCT
  item_tag."B" AS "oldTagId",
  item."userId",
  MIN(item."userId") OVER (PARTITION BY item_tag."B") AS "ownerUserId",
  CASE
    WHEN item."userId" = MIN(item."userId") OVER (PARTITION BY item_tag."B")
      THEN item_tag."B"
    ELSE md5(item_tag."B" || ':' || item."userId")
  END AS "newTagId"
FROM "_ItemTags" AS item_tag
JOIN "items" AS item ON item."id" = item_tag."A";

UPDATE "tags" AS tag
SET "userId" = migration."userId"
FROM "_tag_user_migrations" AS migration
WHERE tag."id" = migration."oldTagId"
  AND migration."newTagId" = migration."oldTagId";

INSERT INTO "tags" ("id", "name", "userId")
SELECT migration."newTagId", tag."name", migration."userId"
FROM "_tag_user_migrations" AS migration
JOIN "tags" AS tag ON tag."id" = migration."oldTagId"
WHERE migration."newTagId" <> migration."oldTagId";

UPDATE "_ItemTags" AS item_tag
SET "B" = migration."newTagId"
FROM "items" AS item, "_tag_user_migrations" AS migration
WHERE item."id" = item_tag."A"
  AND migration."oldTagId" = item_tag."B"
  AND migration."userId" = item."userId";

ALTER TABLE "tags" ALTER COLUMN "userId" SET NOT NULL;
CREATE INDEX "tags_userId_idx" ON "tags"("userId");
CREATE UNIQUE INDEX "tags_userId_name_key" ON "tags"("userId", "name");
ALTER TABLE "tags"
  ADD CONSTRAINT "tags_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
