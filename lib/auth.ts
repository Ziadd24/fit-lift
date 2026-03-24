import { NextRequest } from "next/server";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSecret(): string {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "ADMIN_JWT_SECRET is not set or too short (min 32 chars). " +
        "Add it to your .env.local file."
    );
  }
  return secret;
}

// Minimal JWT implementation — no external dependency needed.
// Uses the Web Crypto API available in Next.js Edge / Node runtimes.

async function hmacSign(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Buffer.from(sig).toString("base64url");
}

async function hmacVerify(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expected = await hmacSign(payload, secret);
  // Constant-time comparison to prevent timing attacks
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

function b64url(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

// ─── Public API ──────────────────────────────────────────────────────────────

const ADMIN_TOKEN_TTL_HOURS = 8; // token expires after 8 hours

/**
 * Issue a signed JWT for the admin session.
 * Call this after validating username + password.
 */
export async function createAdminToken(): Promise<string> {
  const secret = getSecret();
  const header = b64url({ alg: "HS256", typ: "JWT" });
  const payload = b64url({
    sub: "admin",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + ADMIN_TOKEN_TTL_HOURS * 3600,
  });
  const sig = await hmacSign(`${header}.${payload}`, secret);
  return `${header}.${payload}.${sig}`;
}

/**
 * Verify a JWT from the Authorization header.
 * Returns true only if the signature is valid AND the token has not expired.
 */
export async function verifyAdminAuth(request: NextRequest): Promise<boolean> {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return false;
    const token = authHeader.slice(7);

    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const [header, payload, signature] = parts;
    const secret = getSecret();

    const valid = await hmacVerify(`${header}.${payload}`, signature, secret);
    if (!valid) return false;

    const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
    const now = Math.floor(Date.now() / 1000);
    if (claims.exp && claims.exp < now) return false; // expired
    if (claims.sub !== "admin") return false;

    return true;
  } catch {
    return false;
  }
}
