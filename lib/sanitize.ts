export function sanitizeHtml(input: string): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export function sanitizeSearchFilter(input: string): string {
  if (typeof input !== "string") return "";
  return input.replace(/[%,().*]/g, "").trim().slice(0, 200);
}

export function validateMaxLength(input: string, maxLength: number): string {
  if (typeof input !== "string") return "";
  return input.slice(0, maxLength);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}