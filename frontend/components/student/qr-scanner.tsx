"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import { CameraOff } from "lucide-react";

interface QrScannerProps {
  /** Fires once per successful decode; the parent stops rendering the scanner. */
  onDecode: (token: string) => void;
}

/**
 * Camera viewfinder for the payment loop (Module 0 §3.10). Full-bleed on
 * mobile, contained on desktop — the parent decides the frame.
 */
export function QrScanner({ onDecode }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Held in a ref so the effect below never re-runs when the callback identity
  // changes — restarting the camera mid-scan is jarring and slow.
  const onDecodeRef = useRef(onDecode);
  useEffect(() => {
    onDecodeRef.current = onDecode;
  }, [onDecode]);

  useEffect(() => {
    let controls: IScannerControls | undefined;
    let disposed = false;
    let hasDecoded = false;

    const reader = new BrowserQRCodeReader();

    reader
      .decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (result) => {
        if (!result || hasDecoded) return;
        hasDecoded = true;
        controls?.stop();
        onDecodeRef.current(result.getText());
      })
      .then((activeControls) => {
        if (disposed) {
          activeControls.stop();
          return;
        }
        controls = activeControls;
      })
      .catch((cause: unknown) => {
        if (disposed) return;
        const isPermissionDenied = cause instanceof DOMException && cause.name === "NotAllowedError";
        setError(
          isPermissionDenied
            ? "Camera access was denied. Enable it in your browser settings, or enter the code manually."
            : "Couldn't start the camera. Enter the code manually instead.",
        );
      });

    return () => {
      disposed = true;
      controls?.stop();
    };
  }, []);

  if (error) {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-card border border-border-subtle bg-bg-surface p-6 text-center">
        <CameraOff className="h-10 w-10 text-text-secondary" strokeWidth={1.5} />
        <p className="text-sm text-text-secondary">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-card bg-black">
      <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
      {/* Framing reticle — tells the user where to aim without obscuring the feed. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-2/3 w-2/3 rounded-card border-2 border-accent-primary/70" />
      </div>
    </div>
  );
}
