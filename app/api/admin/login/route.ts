import { NextRequest, NextResponse } from "next/server";
import { getAdminToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  const expectedUser = process.env.ADMIN_USERNAME || "admin";
  const expectedPass = process.env.ADMIN_PASSWORD || "admin123";

  if (username === expectedUser && password === expectedPass) {
    return NextResponse.json({ success: true, token: getAdminToken() });
  }

  return NextResponse.json(
    { success: false, error: "Invalid credentials" },
    { status: 401 }
  );
}
