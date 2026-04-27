"use client"

import { useRef, useState } from "react"
import { FileImage, FileText, Upload, X, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
const BUCKET = "nota-transaksi"

interface NotaUploadProps {
  folder: "pembelian" | "penjualan"
  existingUrl?: string | null
  onUploadComplete: (url: string | null) => void
  disabled?: boolean
}

export function NotaUpload({
  folder,
  existingUrl,
  onUploadComplete,
  disabled,
}: NotaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [removed, setRemoved] = useState(false)

  const currentUrl = removed ? null : (preview ?? existingUrl ?? null)
  const isImage = (url: string | null) =>
    url ? !url.toLowerCase().includes(".pdf") && url !== "pdf" : false
  const isPdf = (url: string | null) =>
    url
      ? url.toLowerCase().endsWith(".pdf") || fileName?.toLowerCase().endsWith(".pdf")
      : false

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)

    if (!ACCEPTED.includes(file.type)) {
      setUploadError("Format tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF.")
      return
    }
    if (file.size > MAX_SIZE) {
      setUploadError("Ukuran file maksimal 5MB.")
      return
    }

    setFileName(file.name)

    if (file.type !== "application/pdf") {
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)
    } else {
      setPreview("pdf")
    }

    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split(".").pop() ?? "jpg"
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false })

      if (error) throw error

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
      setRemoved(false)
      onUploadComplete(data.publicUrl)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal upload"
      setUploadError(msg)
      setPreview(null)
      setFileName(null)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const handleRemove = () => {
    setPreview(null)
    setFileName(null)
    setRemoved(true)
    setUploadError(null)
    onUploadComplete(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.pdf"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || uploading}
      />

      {currentUrl && currentUrl !== "pdf" ? (
        <div className="relative inline-flex items-start gap-2">
          {isImage(currentUrl) && currentUrl !== "pdf" ? (
            <a href={currentUrl} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentUrl}
                alt="Nota"
                className="h-24 w-24 rounded-lg object-cover border hover:opacity-90 transition-opacity"
              />
            </a>
          ) : (
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 h-24 px-4 rounded-lg border bg-muted/50 hover:bg-muted transition-colors"
            >
              <FileText className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground max-w-[120px] truncate">
                {fileName ?? "Nota.pdf"}
              </span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          )}
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/80"
              aria-label="Hapus nota"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ) : currentUrl === "pdf" ? (
        <div className="relative inline-flex items-start gap-2">
          <div className="flex items-center gap-2 h-24 px-4 rounded-lg border bg-muted/50">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground max-w-[120px] truncate">
              {fileName ?? "Nota.pdf"}
            </span>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/80"
              aria-label="Hapus nota"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ) : null}

      {!currentUrl || currentUrl === null ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className="gap-2"
        >
          {uploading ? (
            <>
              <Upload className="h-4 w-4 animate-pulse" />
              Mengunggah...
            </>
          ) : (
            <>
              <FileImage className="h-4 w-4" />
              Upload Nota
            </>
          )}
        </Button>
      ) : (
        !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="gap-2 text-muted-foreground"
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Mengunggah..." : "Ganti Nota"}
          </Button>
        )
      )}

      {uploadError && (
        <p className="text-xs text-destructive">{uploadError}</p>
      )}

      <p className="text-xs text-muted-foreground">
        JPG, PNG, WEBP, atau PDF. Maks 5MB.
      </p>
    </div>
  )
}
