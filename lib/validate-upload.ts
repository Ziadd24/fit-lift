const ALLOWED_UPLOAD_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
]);

const MAX_UPLOAD_SIZE = 8 * 1024 * 1024; // 8MB

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
  safeExtension?: string;
}

export function validateUploadFile(file: File): UploadValidationResult {
  // Check file type
  if (!ALLOWED_UPLOAD_TYPES.has(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: JPEG, PNG, GIF, WebP, PDF`,
    };
  }

  // Check file size
  if (file.size > MAX_UPLOAD_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is 8MB.`,
    };
  }

  // Determine safe extension
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext) {
    return {
      valid: false,
      error: "File must have an extension",
    };
  }

  const safeExtension = ext === "jpg" ? "jpeg" : ext;

  return {
    valid: true,
    safeExtension,
  };
}

export function validateUploadBytes(bytes: ArrayBuffer, declaredType: string): boolean {
  // Basic validation - ensure bytes match declared type
  // For a production app, you'd want more sophisticated magic number checking
  if (declaredType === "application/pdf") {
    // PDF starts with %PDF
    const view = new Uint8Array(bytes);
    return view[0] === 0x25 && view[1] === 0x50 && view[2] === 0x44 && view[3] === 0x46;
  }

  // For images, we rely on the browser's type detection
  return true;
}

export function getFileTypeFromMimeType(mimeType: string): "image" | "pdf" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  return "image"; // fallback
}
