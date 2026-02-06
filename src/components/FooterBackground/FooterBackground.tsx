// src/components/FooterBackground/FooterBackground.tsx
import React from "react";

export function FooterBackground(props: {
  children: React.ReactNode;
  overlayOpacity?: number; // 0..1
}) {
  const { children, overlayOpacity = 0.18 } = props;

  return (
    <div className="relative overflow-hidden bg-[#0b2b4c] text-white">
      {/* overlay grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[url('/grid-overlay-footer.png')] bg-repeat opacity-20"
        style={{ opacity: overlayOpacity }}
      />

      {/* optional subtle gradient like many UCD blocks use */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.25) 100%)",
        }}
      />

      {/* content sits above overlays */}
      <div className="relative">{children}</div>
    </div>
  );
}
