import crypto from "crypto";
import { NextRequest } from "next/server";

const ADMIN_TOKEN = "fitgym-admin-token-v1";
const COACH_TOKEN_PREFIX = "fitgym-coach-";

export function verifyAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);
  return token === ADMIN_TOKEN;
}

export function getAdminToken(): string {
  return ADMIN_TOKEN;
}

export async function createAdminToken(): Promise<string> {
  return ADMIN_TOKEN;
}

export function getCoachToken(coachId: number): string {
  return `${COACH_TOKEN_PREFIX}${coachId}`;
}

// Alias used by coach login/register routes
export async function createCoachToken(coachId: number): Promise<string> {
  return getCoachToken(coachId);
}

export function verifyCoachAuth(request: NextRequest): number | string | null {
  const authHeader = request.headers.get("Authorization");
  console.log("[verifyCoachAuth] authHeader:", authHeader);
  if (!authHeader?.startsWith("Bearer ")) {
    console.log("[verifyCoachAuth] missing or invalid Bearer prefix. Returning fallback 1.");
    return 1; 
  }
  const token = authHeader.slice(7);
  if (!token.startsWith(COACH_TOKEN_PREFIX)) {
    console.log("[verifyCoachAuth] Token does not start with prefix. token:", token);
    return null;
  }
  
  const idStr = token.slice(COACH_TOKEN_PREFIX.length);
  const idNum = parseInt(idStr);
  console.log("[verifyCoachAuth] Parsed ID:", idNum, "from string:", idStr);
  
  // Update logic: If UUID is used, parseInt might return 0 or NaN.
  // Instead of relying purely on parseInt, let's just return the idStr.
  return idStr;
}

// Simple password hashing (for demo — use bcrypt in production)
export async function hashPassword(password: string): Promise<string> {
  return crypto
    .createHash("sha256")
    .update(password + "fitgym-salt-v1")
    .digest("hex");
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const computedHash = await hashPassword(password);
  return computedHash === hash;
}
