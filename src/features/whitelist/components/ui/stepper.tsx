"use client";

import React from "react";

export type StepState = "inactive" | "active" | "done";

export interface Step {
  id: string;
  label: string;
  state: StepState;
}

interface ProgressStepperProps {
  steps: Step[];
  className?: string;
}

const ACCENT = "oklch(0.87 0.12 192)";
const ACCENT_SOFT = "oklch(0.87 0.12 192 / 0.12)";
const ACCENT_LINE = "oklch(0.87 0.12 192 / 0.26)";
const GRAD =
  "linear-gradient(108deg, #ffffff 0%, oklch(0.87 0.12 192) 50%, oklch(0.70 0.15 192) 100%)";

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 14 14"
      width={14}
      height={14}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="2,7 5.5,10.5 12,3.5" />
    </svg>
  );
}

export function ProgressStepper({ steps }: ProgressStepperProps) {
  return (
    <div style={{ width: "100%", marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
        {steps.map((step, i) => {
          const isDone = step.state === "done";
          const isActive = step.state === "active";
          const nodeStyle: React.CSSProperties = {
            width: 32,
            height: 32,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            fontSize: 12.5,
            fontWeight: 700,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            flexShrink: 0,
            transition: "all 0.3s",
            ...(isDone
              ? {
                  background: ACCENT_SOFT,
                  border: `1px solid ${ACCENT_LINE}`,
                  color: ACCENT,
                }
              : isActive
                ? {
                    background: GRAD,
                    border: "1px solid transparent",
                    color: "oklch(0.18 0.04 192)",
                    boxShadow: `0 0 0 4px ${ACCENT_SOFT}, 0 0 18px -2px oklch(0.84 0.13 192 / 0.55)`,
                  }
                : {
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.11)",
                    color: "rgba(245,248,252,0.34)",
                  }),
          };
          return (
            <React.Fragment key={step.id}>
              <div data-step={step.id} style={nodeStyle}>
                {isDone ? <CheckIcon /> : <span>{i + 1}</span>}
              </div>
              {i < steps.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    margin: "0 2px",
                    background: "rgba(255,255,255,0.11)",
                    overflow: "hidden",
                    borderRadius: 999,
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: isDone ? "100%" : "0%",
                      background: ACCENT,
                      transition: "width 0.5s ease",
                      boxShadow: isDone ? "0 0 8px oklch(0.84 0.13 192 / 0.55)" : "none",
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", width: "100%", marginTop: 9 }}>
        {steps.map((step, i) => (
          <React.Fragment key={step.id}>
            <span
              style={{
                width: 32,
                flexShrink: 0,
                textAlign: "center",
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: "0.05em",
                color:
                  step.state === "done"
                    ? ACCENT
                    : step.state === "active"
                      ? "#F5F8FC"
                      : "rgba(245,248,252,0.34)",
                transition: "color 0.3s",
              }}
            >
              {step.label}
            </span>
            {i < steps.length - 1 && <div style={{ flex: 1 }} />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
