import crypto from "crypto";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

function getJwtSecret(): string {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "ADMIN_JWT_SECRET is not set or too short (min 32 chars). " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
    );
  }
  return secret;
}

const ADMIN_TOKEN_EXPIRY = "8h";
const COACH_TOKEN_EXPIRY = "24h";

// ─── Admin ────────────────────────────────────────────

export async function createAdminToken(): Promise<string> {
  return jwt.sign(
    { role: "admin", iat: Math.floor(Date.now() / 1000) },
    getJwtSecret(),
    { expiresIn: ADMIN_TOKEN_EXPIRY }
  );
}

export function verifyAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { role?: string };
    return decoded.role === "admin";
  } catch { return false; }
}

// ─── Coach ────────────────────────────────────────────

export async function createCoachToken(coachId: number): Promise<string> {
  return jwt.sign(
    { role: "coach", sub: coachId, iat: Math.floor(Date.now() / 1000) },
    getJwtSecret(),
    { expiresIn: COACH_TOKEN_EXPIRY }
  );
}

export function verifyCoachAuth(request: NextRequest): number | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as {
      role?: string;
      sub?: number | string;
    };
    if (decoded.role !== "coach") return null;
    const coachId = typeof decoded.sub === "string" ? parseInt(decoded.sub, 10) : decoded.sub;
    if (typeof coachId !== "number" || Number.isNaN(coachId)) return null;
    return coachId;
  } catch { return null; }
}

// ─── Timing-safe compare ──────────────────────────────

export function timingSafeCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// ─── Password hashing (backward-compatible) ───────────

const PASSWORD_SALT = process.env.PASSWORD_SALT || "fitgym-salt-v1";

export async function hashPassword(password: string): Promise<string> {
  return crypto
    .createHash("sha256")
    .update(password + PASSWORD_SALT)
    .digest("hex");
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const computedHash = await hashPassword(password);
  return timingSafeCompare(computedHash, hash);
}
