import { NextRequest, NextResponse } from "next/server";
import { createAdminToken, timingSafeCompare } from "@/lib/auth";
import { rateLimit, getClientIp, RateLimitPresets } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = await rateLimit(`admin-login:${ip}`, RateLimitPresets.login);

  if (!limit.allowed) {
    const retryAfterSec = Math.ceil((limit.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
    );
  }

  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;

  if (!expectedUser || !expectedPass) {
    return NextResponse.json(
      { error: "Admin login is not configured." },
      { status: 503 }
    );
  }

  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { username, password } = body;
  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 }
    );
  }

  const userMatch = timingSafeCompare(username, expectedUser);
  const passMatch = timingSafeCompare(password, expectedPass);

  if (!userMatch || !passMatch) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createAdminToken();
  return NextResponse.json({ success: true, token });
}
