import { NextRequest, NextResponse } from "next/server";
import { createAdminToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;

  if (!expectedUser || !expectedPass) {
    return NextResponse.json(
      { error: "Admin login is not configured. Contact the system administrator." },
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
    return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
  }

  const userMatch = username === expectedUser;
  const passMatch = password === expectedPass;

  if (!userMatch || !passMatch) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createAdminToken();
  return NextResponse.json({ success: true, token });
}