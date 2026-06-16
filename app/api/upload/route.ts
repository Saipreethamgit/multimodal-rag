import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { ingestFile } from "@/lib/ingest";
import type { UploadResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { ok: false, error: `Unsupported file type: ${file.type}` },
        { status: 415 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { ok: false, error: "File exceeds 20 MB limit" },
        { status: 413 }
      );
    }

    // Save to disk
    const uploadDir = path.join(process.cwd(), "uploads");
    await mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.name) || "";
    const savedName = `${uuidv4()}${ext}`;
    const savedPath = path.join(uploadDir, savedName);

    const bytes = await file.arrayBuffer();
    await writeFile(savedPath, Buffer.from(bytes));

    // Run ingestion pipeline
    const { documentId, chunksCreated } = await ingestFile(
      savedPath,
      file.name,
      file.type,
      file.size
    );

    return NextResponse.json({ ok: true, documentId, chunksCreated });
  } catch (err) {
    console.error("[upload] error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
