import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { uploadFileToR2 } from "@/lib/r2";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

// Define constraints
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];
const ALLOWED_FILE_EXTENSIONS = [
  ".pdf", ".txt", ".md", ".json", ".yaml", ".yml", ".xml", ".csv", ".toml", ".ini",
];
const ALLOWED_IMAGE_MIMES = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];
const ALLOWED_FILE_MIMES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/json",
  "application/x-yaml",
  "text/yaml",
  "application/xml",
  "text/xml",
  "text/csv",
  "application/toml",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
];

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPro: true },
  });

  if (!user?.isPro) {
    return NextResponse.json(
      { error: "File uploads require a Pro subscription" },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as "image" | "file" | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!type) {
    return NextResponse.json({ error: "File type (image/file) is required" }, { status: 400 });
  }

  // Validate file size and extension
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  const mime = file.type;

  if (type === "image") {
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "Image must be less than 5MB" }, { status: 400 });
    }
    if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext) || !ALLOWED_IMAGE_MIMES.includes(mime)) {
      return NextResponse.json({ error: "Invalid image type. Allowed: PNG, JPG, JPEG, GIF, WebP, SVG" }, { status: 400 });
    }
  } else if (type === "file") {
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File must be less than 10MB" }, { status: 400 });
    }
    // Check extension or mime (allow either)
    const isValidExt = ALLOWED_FILE_EXTENSIONS.includes(ext);
    const isValidMime = ALLOWED_FILE_MIMES.includes(mime);
    if (!isValidExt && !isValidMime) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }
  } else {
    return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
  }

  // Generate unique key
  const key = `user_${userId}/${randomUUID()}_${file.name}`;

  // Convert File to Buffer
  const buffer = Buffer.from(await file.arrayBuffer());

  // Upload to R2
  try {
    const url = await uploadFileToR2(key, buffer, file.type);
    return NextResponse.json({
      url,
      key,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}