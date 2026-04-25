import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth, verifyCoachAuth } from "@/lib/auth";
import { sanitizeHtml } from "@/lib/sanitize";

const MAX_ASSIGNMENT_BYTES = 50 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

function getSafeExtension(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (ext === "jpg") return "jpeg";
  return ext || "bin";
}

function getStoredFileType(mimeType: string): "image" | "pdf" | "video" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  return "video";
}

export async function POST(req: NextRequest) {
  const coachId = await verifyCoachAuth(req);
  const isAdmin = await verifyAdminAuth(req);

  if (!coachId && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const memberIdStr = String(formData.get("member_id") || "");
  const title = sanitizeHtml(String(formData.get("title") || "Body Measurement Assessment")).slice(0, 200);
  const notes = sanitizeHtml(String(formData.get("notes") || "")).slice(0, 5000);
  const dueDateInput = String(formData.get("due_date") || "");
  const measurementFieldsRaw = String(formData.get("measurement_fields") || "{}");
  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);

  const memberId = Number.parseInt(memberIdStr, 10);
  if (!Number.isInteger(memberId)) {
    return NextResponse.json({ error: "Valid member_id is required" }, { status: 400 });
  }

  if (files.length === 0) {
    return NextResponse.json({ error: "At least one file is required" }, { status: 400 });
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > MAX_ASSIGNMENT_BYTES) {
    return NextResponse.json({ error: "Combined file size exceeds 50MB" }, { status: 400 });
  }

  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: `Unsupported file type: ${file.name}` }, { status: 400 });
    }
  }

  let measurementFields: Record<string, string | number> = {};
  try {
    const parsed = JSON.parse(measurementFieldsRaw || "{}");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      measurementFields = Object.entries(parsed).reduce<Record<string, string | number>>((acc, [key, value]) => {
        if (typeof value === "string" || typeof value === "number") {
          acc[key] = value;
        }
        return acc;
      }, {});
    }
  } catch {
    return NextResponse.json({ error: "Invalid measurement_fields payload" }, { status: 400 });
  }

  const dueDate = dueDateInput ? new Date(dueDateInput) : null;
  if (dueDateInput && Number.isNaN(dueDate?.getTime())) {
    return NextResponse.json({ error: "Invalid due_date" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const assignmentId = randomUUID();
  const bucket = "coach-uploads";
  const uploadedPaths: string[] = [];

  try {
    const uploadsToInsert: Record<string, unknown>[] = [];

    for (const file of files) {
      const extension = getSafeExtension(file);
      const storagePath = `assignments/${assignmentId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
      const bytes = await file.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, bytes, { contentType: file.type, upsert: false });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      uploadedPaths.push(storagePath);
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);

      uploadsToInsert.push({
        coach_id: coachId || null,
        member_id: memberId,
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_type: getStoredFileType(file.type),
        file_size: file.size,
        category: "body_measurement_assignment",
        title,
        description: notes || null,
        assignment_id: assignmentId,
        assignment_title: title,
        assignment_kind: "body_measurement_assignment",
        due_date: dueDate ? dueDate.toISOString() : null,
        coach_notes: notes || null,
        measurement_fields: measurementFields,
        assignment_status: "pending",
      });
    }

    const { data: inserted, error: insertError } = await supabase
      .from("coach_uploads")
      .insert(uploadsToInsert)
      .select("*, members(name), coaches(name)");

    if (insertError) {
      throw new Error(insertError.message);
    }

    const memberName = inserted?.[0]?.members?.name ?? "Client";
    const noticeBits = [
      "Your coach sent a new body measurement assessment.",
      notes ? `Notes: ${notes}` : "",
      dueDate ? `Due by ${dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.` : "",
      `Files attached: ${files.length}.`,
    ].filter(Boolean);

    await supabase.from("announcements").insert({
      title,
      content: noticeBits.join(" "),
      is_global: false,
      target_member_id: memberId,
    });

    return NextResponse.json({
      assignmentId,
      memberName,
      uploads: (inserted || []).map((upload: any) => ({
        id: upload.id,
        file_url: upload.file_url,
        file_name: upload.file_name,
        file_type: upload.file_type,
        file_size: upload.file_size,
        category: upload.category,
        title: upload.title,
        description: upload.description,
        member_id: upload.member_id,
        coach_id: upload.coach_id,
        created_at: upload.created_at,
        member_name: upload.members?.name ?? null,
        coach_name: upload.coaches?.name ?? null,
        assignment_id: upload.assignment_id,
        assignment_title: upload.assignment_title,
        assignment_kind: upload.assignment_kind,
        due_date: upload.due_date,
        coach_notes: upload.coach_notes,
        measurement_fields: upload.measurement_fields,
        assignment_status: upload.assignment_status,
      })),
    }, { status: 201 });
  } catch (error) {
    if (uploadedPaths.length > 0) {
      await supabase.storage.from(bucket).remove(uploadedPaths);
    }

    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to send assessment",
    }, { status: 500 });
  }
}
