"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

function OtpInput({ length = 6, value, onChange, error, disabled, autoFocus }: OtpInputProps) {
  const digits = React.useMemo(() => {
    const arr = value.split("").slice(0, length);
    while (arr.length < length) arr.push("");
    return arr;
  }, [value, length]);

  const refs = React.useRef<Array<HTMLInputElement | null>>([]);

  function setDigit(index: number, digit: string) {
    const next = [...digits];
    next[index] = digit;
    onChange(next.join(""));
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    setDigit(index, digit);
    if (digit && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      if (digits[index]) {
        setDigit(index, "");
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
        setDigit(index - 1, "");
      }
      event.preventDefault();
    } else if (event.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    event.preventDefault();
    onChange(pasted.padEnd(length, "").slice(0, length).replace(/ /g, ""));
    const focusIndex = Math.min(pasted.length, length - 1);
    refs.current[focusIndex]?.focus();
  }

  return (
    <div className="w-full">
      <div className="flex justify-between gap-2 sm:gap-3">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              refs.current[index] = el;
            }}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            autoFocus={autoFocus && index === 0}
            disabled={disabled}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            aria-label={`Digit ${index + 1} of ${length}`}
            aria-invalid={Boolean(error)}
            className={cn(
              "h-12 w-full max-w-[48px] rounded-control border bg-bg-surface text-center text-lg font-semibold text-text-primary outline-none transition-all",
              "border-border-subtle focus:scale-105 focus:border-accent-secondary focus:ring-1 focus:ring-accent-secondary",
              error && "border-state-danger focus:border-state-danger focus:ring-state-danger",
              disabled && "opacity-40",
            )}
          />
        ))}
      </div>
      {error ? <p className="mt-1.5 text-xs text-state-danger animate-in fade-in slide-in-from-top-1">{error}</p> : null}
    </div>
  );
}

export { OtpInput };
