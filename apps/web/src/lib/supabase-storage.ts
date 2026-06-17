import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Server-side client (API routes) — uses anon key, bucket policies allow anon INSERT/SELECT
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const STORAGE_BUCKET = 'upload'

/**
 * Upload a File to Supabase Storage.
 * Path: transactions/{transactionId}/{timestamp}-{sanitizedName}
 * Returns the public URL.
 */
export async function uploadAttachment(
  transactionId: string,
  file: File
): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `transactions/${transactionId}/${Date.now()}-${safeName}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`)
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}
