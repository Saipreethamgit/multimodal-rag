import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { Document } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const docs = await query<Document>(
      `SELECT id, name, file_type, file_size, created_at
       FROM documents
       ORDER BY created_at DESC`
    );
    return NextResponse.json({ ok: true, documents: docs });
  } catch (err) {
    console.error("[documents] error:", err);
    return NextResponse.json({ ok: false, error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ ok: false, error: "ID required" }, { status: 400 });
    await query(`DELETE FROM documents WHERE id = $1`, [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[documents/delete] error:", err);
    return NextResponse.json({ ok: false, error: "Delete failed" }, { status: 500 });
  }
}
