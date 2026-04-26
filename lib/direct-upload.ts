import { validateImageFile, validateImageBytes } from "./validate-file";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

export interface DirectUploadResult {
  url: string;
  filename: string;
}

export async function uploadImageDirect(
  file: File,
  adminToken: string,
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

  // Step 1: Get signed URL from server (small request, bypasses Vercel 4.5MB limit)
  const signedUrlRes = await fetch("/api/upload/signed-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ filename, contentType: safeContentType }),
  });

  if (!signedUrlRes.ok) {
    const contentType = signedUrlRes.headers.get("content-type") || "";
    const errorText = contentType.includes("application/json")
      ? (await signedUrlRes.json()).error
      : await signedUrlRes.text();
    throw new Error(errorText || "Failed to get upload URL");
  }

  const { signedUrl, path } = await signedUrlRes.json();

  // Step 2: Upload directly to Supabase using signed URL (bypasses Vercel limit, works with RLS)
  const uploadRes = await fetch(signedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": safeContentType,
    },
    body: file,
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error(`Upload failed: ${errorText}`);
  }

  // Build public URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;

  return {
    url: publicUrl,
    filename: path,
  };
}
