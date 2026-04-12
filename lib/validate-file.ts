const IMAGE_SIGNATURES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  "image/gif": [0x47, 0x49, 0x46, 0x38],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
};

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  safeExtension: string;
}

export function validateImageFile(file: File): FileValidationResult {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File too large (max 10MB)", safeExtension: "" };
  }
  if (file.size === 0) {
    return { valid: false, error: "Empty file", safeExtension: "" };
  }
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: "Invalid file type. Allowed: jpg, jpeg, png, gif, webp",
      safeExtension: "",
    };
  }
  return { valid: true, safeExtension: ext };
}

export function validateImageBytes(
  buffer: ArrayBuffer,
  declaredMimeType: string
): boolean {
  const bytes = new Uint8Array(buffer);
  const mimeType = declaredMimeType.toLowerCase();

  for (const [type, signature] of Object.entries(IMAGE_SIGNATURES)) {
    if (mimeType === type || mimeType === type.replace("jpeg", "jpg")) {
      let matches = true;
      for (let i = 0; i < signature.length; i++) {
        if (bytes[i] !== signature[i]) { matches = false; break; }
      }
      if (matches) return true;
    }
  }

  const header = new TextDecoder().decode(bytes.slice(0, 50)).toLowerCase();
  if (
    header.includes("<!doctype") ||
    header.includes("<html") ||
    header.includes("<script") ||
    header.includes("<?xml")
  ) return false;

  if (mimeType === "image/webp" && bytes.length > 12) {
    return bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  }
  return true;
}