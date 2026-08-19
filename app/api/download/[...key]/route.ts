import { NextResponse, NextRequest } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { getFileFromR2 } from "@/lib/r2";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key: keyParts } = await params;
  const key = keyParts.join("/"); // Reconstruct the full key

  const userId = await getCurrentUserId();

  // Verify the user owns an item with this file key
  const item = await prisma.item.findFirst({
    where: {
      userId,
      fileKey: key,
    },
    select: { id: true, fileUrl: true },
  });

  if (!item) {
    return NextResponse.json({ error: "Unauthorized or file not found" }, { status: 403 });
  }

  try {
    const { Body, ContentType } = await getFileFromR2(key);
    if (!Body) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const stream = Body as ReadableStream;
    const response = new NextResponse(stream);
    response.headers.set("Content-Type", ContentType || "application/octet-stream");
    response.headers.set("Content-Disposition", `attachment; filename="${key.split("_").pop()}"`);
    return response;
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Failed to retrieve file" }, { status: 500 });
  }
}