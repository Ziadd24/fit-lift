import { NextRequest } from "next/server";

const ADMIN_TOKEN = "fitgym-admin-token-v1";

export function verifyAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);
  return token === ADMIN_TOKEN;
}

export function getAdminToken(): string {
  return ADMIN_TOKEN;
}
