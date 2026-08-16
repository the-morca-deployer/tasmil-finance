"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuthStore } from "@/store/use-auth";
import { useSponsorshipMe } from "../hooks/use-sponsorship-me";

/**
 * Compact sponsor-status badge that lives in the top nav between the nav
 * links and the wallet menu. Renders nothing when the user isn't enrolled
 * (no flash for guests). On hover it expands a tooltip with rank, quota
 * remaining, and a deep-link into the detail page.
 */
export function SponsorIndicator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data } = useSponsorshipMe(isAuthenticated);
  const [hover, setHover] = useState(false);

  if (!data || !data.enrolled || data.rank == null) return null;

  const used = data.usage?.txCount ?? 0;
  const maxTx = data.config.maxTxPerUser;
  const remaining = Math.max(0, maxTx - used);

  return (
    // Outer wrapper holds the hover state for both the icon and its tooltip.
    // It is no longer a Link so the tooltip can carry its own CTA link without
    // nesting one anchor inside another.
    <span
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative inline-flex items-center justify-center"
    >
      <Link
        href="/rewards/gas-sponsorship"
        aria-label={`Gas sponsorship active - ${remaining} of ${maxTx} transactions remaining`}
        className="inline-flex items-center justify-center transition-transform hover:scale-105"
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 50% 30%, rgba(150,238,250,0.45), transparent 60%), conic-gradient(from 210deg, #0369A1, #67E8F9 28%, #9FEFFB 50%, #67E8F9 72%, #0369A1)",
          boxShadow: "0 0 0 1px rgba(103,232,249,0.55), 0 0 18px -6px rgba(103,232,249,0.50)",
        }}
      >
        <span
          className="grid place-items-center"
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "radial-gradient(circle at 50% 32%, #0c1418, #070a0c 78%)",
            boxShadow: "inset 0 1px 4px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(103,232,249,0.22)",
          }}
        >
          <Image
            src="/protocols/tasmil.svg"
            alt=""
            width={16}
            height={16}
            style={{
              width: 16,
              height: "auto",
              filter: "drop-shadow(0 0 4px rgba(103,232,249,0.4))",
            }}
          />
        </span>
      </Link>

      {/* Tooltip - outer span adds a transparent top "bridge" (paddingTop) so the
          pointer can reach the CTA without crossing a dead gap. */}
      <span
        style={{
          position: "absolute",
          top: "100%",
          right: 0,
          zIndex: 50,
          paddingTop: 10,
          fontFamily: "'Hanken Grotesk', system-ui, -apple-system, sans-serif",
          letterSpacing: "-0.01em",
          opacity: hover ? 1 : 0,
          pointerEvents: hover ? "auto" : "none",
          transform: hover ? "translateY(0)" : "translateY(-4px)",
          transition: "opacity .18s ease, transform .18s ease",
        }}
      >
        <span
          style={{
            display: "block",
            width: 240,
            padding: "12px 14px",
            borderRadius: 12,
            background: "rgba(15,17,21,0.96)",
            border: "1px solid rgba(255,255,255,0.14)",
            boxShadow: "0 14px 32px -10px #000, 0 0 24px -10px rgba(103,232,249,0.4)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#67E8F9",
              }}
            >
              Gas Sponsorship
            </span>
            <span
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 11,
                color: "rgba(244,247,251,0.58)",
              }}
            >
              #{data.rank}/{data.cohortSize}
            </span>
          </div>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: "#F4F7FB",
              marginBottom: 2,
            }}
          >
            You&rsquo;re in the Top {data.cohortSize}
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: "rgba(244,247,251,0.58)",
              lineHeight: 1.4,
              marginBottom: 8,
            }}
          >
            Free gas on Farming and AI Chat.
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              paddingTop: 8,
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {Array.from({ length: maxTx }, (_, i) => (
              <span
                key={i}
                style={{
                  display: "block",
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background:
                    i < used
                      ? "linear-gradient(110deg,#ffffff,#67E8F9 52%,#0EA5E9)"
                      : "rgba(255,255,255,0.08)",
                  border: i < used ? "1px solid transparent" : "1px solid rgba(255,255,255,0.14)",
                }}
              />
            ))}
            <span
              style={{
                marginLeft: "auto",
                fontSize: 11,
                color: "rgba(244,247,251,0.58)",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              }}
            >
              {remaining} left
            </span>
          </div>
          <Link
            href="/rewards/gas-sponsorship"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              marginTop: 10,
              paddingTop: 10,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              fontSize: 12.5,
              fontWeight: 700,
              color: "#67E8F9",
              textDecoration: "none",
            }}
          >
            View Details →
          </Link>
        </span>
      </span>
    </span>
  );
}
