import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  const body = await req.json();
  // TODO: Insert into a Supabase 'contacts' table when available.
  console.warn("[ACTION_REQUIRED] Unprocessed Contact Form Submission:", body);
  return NextResponse.json({ success: true });
}