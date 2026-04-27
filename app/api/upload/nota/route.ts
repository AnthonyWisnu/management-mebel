import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"])

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
}

// Deteksi MIME type dari magic bytes — tidak bisa dimanipulasi dari browser
function detectMimeType(buf: Buffer): string | null {
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg"
  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png"
  // PDF: 25 50 44 46 (%PDF)
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return "application/pdf"
  // WebP: RIFF????WEBP
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return "image/webp"
  return null
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Request tidak valid" }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  const folder = formData.get("folder") as string | null

  if (!file) return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 })

  if (!folder || !["pembelian", "penjualan"].includes(folder)) {
    return NextResponse.json({ error: "Folder tidak valid" }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Ukuran file maksimal 5MB" }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const mimeType = detectMimeType(buffer)

  if (!mimeType || !ALLOWED_TYPES.has(mimeType)) {
    return NextResponse.json(
      { error: "Format tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF." },
      { status: 400 }
    )
  }

  const ext = EXT_MAP[mimeType]
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from("nota-transaksi")
    .upload(path, buffer, { contentType: mimeType, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data } = supabase.storage.from("nota-transaksi").getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl })
}
