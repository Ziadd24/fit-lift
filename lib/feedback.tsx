"use client";

import React from "react";
import { toast } from "react-hot-toast";

export function getErrorMessage(error: unknown, fallback = "Something went wrong.") {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}

export function shouldRetryRequest(failureCount: number, error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  const nonRetryable =
    message.includes("invalid") ||
    message.includes("unauthorized") ||
    message.includes("forbidden") ||
    message.includes("not found") ||
    message.includes("missing");

  return !nonRetryable && failureCount < 2;
}

export function getRetryDelay(attemptIndex: number) {
  return Math.min(1000 * 2 ** attemptIndex, 8000);
}

export function showConfirmToast({
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
}: {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
}) {
  toast.custom((t) => (
    <div
      style={{
        background: "#16161A",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: 14,
        color: "#FFFFFF",
        width: 320,
        boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 12 }}>{message}</div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button
          type="button"
          onClick={() => toast.dismiss(t.id)}
          style={{
            minHeight: 40,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            color: "#FFFFFF",
            cursor: "pointer",
          }}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={() => {
            toast.dismiss(t.id);
            onConfirm();
          }}
          style={{
            minHeight: 40,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid rgba(239,68,68,0.25)",
            background: "rgba(239,68,68,0.16)",
            color: "#FCA5A5",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  ));
}
