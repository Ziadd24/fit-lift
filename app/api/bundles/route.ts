import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("bundles").select("*").order("price", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = getSupabaseAdmin();
  const body = await req.json();
  const { name, price, period, features, highlight } = body;
  if (!name || price === undefined) return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
  if (name.length > 100) return NextResponse.json({ error: "Name too long" }, { status: 400 });
  if (typeof price !== "number" || price < 0) return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  const { data, error } = await supabase.from("bundles").insert({
    name: name.slice(0, 100), price,
    period: (period || "/ mo").slice(0, 50),
    features: Array.isArray(features) ? features.slice(0, 20) : [],
    highlight: !!highlight,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}