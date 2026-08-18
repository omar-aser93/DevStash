import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { getItemById } from "@/lib/queries/items";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // <-- await the promise
  const userId = await getCurrentUserId();
  const item = await getItemById(userId, id);

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}