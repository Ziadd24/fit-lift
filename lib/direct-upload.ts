import { supabase } from "./supabase";
import { validateImageFile, validateImageBytes } from "./validate-file";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

export interface DirectUploadResult {
  url: string;
  filename: string;
}

export async function uploadImageDirect(
  file: File,
  bucket: string = "gym-photos"
): Promise<DirectUploadResult> {
  // Validate file
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Validate bytes
  const bytes = await file.arrayBuffer();
  if (!validateImageBytes(bytes, file.type)) {
    throw new Error("File content does not match declared type.");
  }

  // Generate filename
  const ext = validation.safeExtension;
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const safeContentType = ALLOWED_IMAGE_TYPES.has(file.type) ? file.type : "image/jpeg";

  // Upload directly to Supabase (bypasses Vercel 4.5MB limit)
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filename, bytes, {
      contentType: safeContentType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filename);

  return {
    url: urlData.publicUrl,
    filename,
  };
}
