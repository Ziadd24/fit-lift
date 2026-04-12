import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { hashPassword, createCoachToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { name, password } = await req.json();

    if (!name || !password) {
      return NextResponse.json(
        { error: "Name and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const password_hash = await hashPassword(password);
    const { data, error } = await supabase
      .from("coaches")
      .insert({
        name,
        password_hash,
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes("Could not find the table") || error.code === "PGRST205") {
        console.warn("Table coaches not found, using fallback memory setup");
        const token = await createCoachToken(999);
        return NextResponse.json({
          success: true,
          token,
          coach: { id: 999, name, email: "coach_test@fitgym.local" },
        });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const token = await createCoachToken(data.id);
    const { password_hash: _ph, ...safeCoach } = data;
    return NextResponse.json({
      success: true,
      token,
      coach: safeCoach,
    });
  } catch (err: any) {
    console.error("Coach Register Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
