"use client";

import React from "react";

type Props = {
  children: React.ReactNode;
  label: string;
};

type State = {
  hasError: boolean;
};

export class DashboardErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error(`[${this.props.label}] boundary`, error);
  }

  private retry = () => {
    this.setState({ hasError: false });
  };

  private report = () => {
    if (typeof window !== "undefined") {
      window.open(
        `mailto:support@fitlift.app?subject=${encodeURIComponent(`${this.props.label} dashboard issue`)}`,
        "_blank"
      );
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          background: "#16161A",
          border: "1px solid rgba(239,68,68,0.18)",
          borderRadius: 18,
          padding: 24,
          color: "#FFFFFF",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{this.props.label} hit a snag.</div>
        <div style={{ color: "var(--color-text-secondary)", fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
          The section failed gracefully. You can retry now or report it without losing the rest of the dashboard.
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={this.retry}
            style={{
              minHeight: 44,
              padding: "10px 14px",
              borderRadius: 12,
              border: "none",
              background: "#7CFC00",
              color: "#111114",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
          <button
            type="button"
            onClick={this.report}
            style={{
              minHeight: 44,
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.05)",
              color: "#FFFFFF",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Report
          </button>
        </div>
      </div>
    );
  }
}
