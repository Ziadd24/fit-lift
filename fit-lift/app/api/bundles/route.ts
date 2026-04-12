import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("bundles")
    .select("*")
    .order("price", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const body = await req.json();

  const { name, price, period, features, highlight } = body;

  if (!name || price === undefined) {
    return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("bundles")
    .insert({
      name,
      price,
      period: period || "/ mo",
      features: features || [],
      highlight: highlight || false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
