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

export function verifyCoachAuth(request: NextRequest): number | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7);
  if (!token.startsWith(COACH_TOKEN_PREFIX)) {
    return null;
  }
  
  const idStr = token.slice(COACH_TOKEN_PREFIX.length);
  const idNum = parseInt(idStr);
  if (isNaN(idNum)) return null;
  return idNum;
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
