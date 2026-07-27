"use client";

import { QRCodeSVG } from "qrcode.react";

interface QrCodeDisplayProps {
  token: string;
  label?: string;
  size?: number;
}

/**
 * Preview face of the QR component (Module 0 §3.10). Rendered on Shop Detail so
 * a student can see the code they'd be scanning; the shop-side regenerable
 * display belongs to the Shop module.
 */
export function QrCodeDisplay({ token, label, size = 176 }: QrCodeDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-border-subtle bg-bg-surface p-6">
      {/* Quiet zone in white — scanners need the light background to lock on. */}
      <div className="rounded-control bg-white p-3">
        <QRCodeSVG value={token} size={size} level="M" marginSize={0} />
      </div>
      {label ? <p className="text-xs text-text-secondary">{label}</p> : null}
    </div>
  );
}
