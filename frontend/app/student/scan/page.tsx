"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Keyboard } from "lucide-react";
import { QrScanner } from "@/components/student/qr-scanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiClientError } from "@/lib/api-client";
import { getShop, getWalletBalance, payByQrScan, queryKeys } from "@/lib/api/student";
import { formatCurrency } from "@/lib/format";
import type { QrScanResult } from "@/types/student";

const SUCCESS_REDIRECT_MS = 2000;

type Step = "scanning" | "manual" | "amount" | "success";

export default function ScanPage() {
  return (
    <Suspense>
      <ScanFlow />
    </Suspense>
  );
}

function ScanFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const shopIdFromQuery = searchParams.get("shopId");

  const [step, setStep] = useState<Step>("scanning");
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QrScanResult | null>(null);

  const { data: wallet } = useQuery({ queryKey: queryKeys.walletBalance, queryFn: getWalletBalance });

  // Arriving from Shop Detail: the shop is already known, so skip the
  // viewfinder and go straight to amount entry (Module 1 §2.2).
  const shopQuery = useQuery({
    queryKey: queryKeys.shop(shopIdFromQuery ?? ""),
    queryFn: () => getShop(shopIdFromQuery as string),
    enabled: Boolean(shopIdFromQuery),
  });

  useEffect(() => {
    if (shopQuery.data && !qrToken) {
      setQrToken(shopQuery.data.shop.qrToken);
      setStep("amount");
    }
  }, [shopQuery.data, qrToken]);

  const payment = useMutation({
    mutationFn: payByQrScan,
    onSuccess: (paymentResult) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.walletBalance });
      void queryClient.invalidateQueries({ queryKey: ["wallet", "transactions"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.prepaidBalances });
      setResult(paymentResult);
      setStep("success");
    },
    onError: (mutationError) => {
      setError(
        mutationError instanceof ApiClientError ? mutationError.message : "Payment failed — please try again.",
      );
    },
  });

  // Bounce back once the success screen has been seen.
  useEffect(() => {
    if (step !== "success") return;
    const timer = window.setTimeout(() => {
      router.push(shopIdFromQuery ? `/student/shops/${shopIdFromQuery}` : "/student");
    }, SUCCESS_REDIRECT_MS);
    return () => window.clearTimeout(timer);
  }, [step, router, shopIdFromQuery]);

  function handleDecode(token: string) {
    setQrToken(token);
    setError(null);
    setStep("amount");
  }

  function handleManualSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = manualToken.trim();
    if (!trimmed) {
      setError("Enter the code shown at the counter.");
      return;
    }
    handleDecode(trimmed);
  }

  function handlePay(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (wallet && parsed > wallet.balance) {
      setError("insufficient");
      return;
    }
    if (!qrToken) return;

    payment.mutate({ qrToken, amount: parsed });
  }

  if (step === "success" && result) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-4 py-16 text-center">
        <CheckCircle2 className="h-16 w-16 animate-in zoom-in-50 text-state-success" strokeWidth={1.5} />
        <div>
          <p className="font-display text-2xl font-semibold tabular-nums text-text-primary">
            {formatCurrency(result.amount)}
          </p>
          <p className="mt-1 text-sm text-text-secondary">Paid to {result.shop.name}</p>
        </div>
        <p className="text-xs text-text-secondary">
          {result.source === "prepaid_balance" ? "Deducted from your meal plan" : "Deducted from your wallet"}
        </p>
      </div>
    );
  }

  if (shopIdFromQuery && shopQuery.isPending) {
    return <Skeleton className="mx-auto h-64 w-full max-w-sm" />;
  }

  if (step === "amount") {
    const isInsufficient = error === "insufficient";

    return (
      <div className="mx-auto max-w-sm space-y-6">
        <div>
          <h1 className="font-display text-xl font-semibold text-text-primary">Enter amount</h1>
          {shopQuery.data ? (
            <p className="mt-1 text-sm text-text-secondary">Paying {shopQuery.data.shop.name}</p>
          ) : null}
          {wallet ? (
            <p className="mt-1 text-xs text-text-secondary">
              Wallet balance: <span className="tabular-nums">{formatCurrency(wallet.balance)}</span>
            </p>
          ) : null}
        </div>

        <form onSubmit={handlePay} className="space-y-4">
          <Input
            label="Amount (BDT)"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            autoFocus
            value={amount}
            disabled={payment.isPending}
            onChange={(event) => setAmount(event.target.value)}
          />

          {isInsufficient ? (
            <div className="rounded-control border border-state-danger/30 bg-state-danger/5 p-3">
              <p className="text-sm text-state-danger">Insufficient wallet balance.</p>
              <Button asChild variant="secondary" size="sm" className="mt-2 w-auto">
                <Link href="/student/wallet/add-money">Add Money</Link>
              </Button>
            </div>
          ) : error ? (
            <p className="text-sm text-state-danger">{error}</p>
          ) : null}

          <Button type="submit" className="w-full" loading={payment.isPending}>
            {payment.isPending ? "Processing payment…" : "Confirm Payment"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            disabled={payment.isPending}
            onClick={() => {
              setStep("scanning");
              setQrToken(null);
              setAmount("");
              setError(null);
            }}
          >
            Scan a different code
          </Button>
        </form>
      </div>
    );
  }

  if (step === "manual") {
    return (
      <div className="mx-auto max-w-sm space-y-6">
        <h1 className="font-display text-xl font-semibold text-text-primary">Enter code manually</h1>

        <form onSubmit={handleManualSubmit} className="space-y-4">
          <Input
            label="Shop code"
            autoFocus
            value={manualToken}
            onChange={(event) => setManualToken(event.target.value)}
            error={error ?? undefined}
          />
          <Button type="submit" className="w-full">
            Continue
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("scanning")}>
            Back to scanner
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm space-y-4">
      <div className="text-center">
        <h1 className="font-display text-xl font-semibold text-text-primary">Scan to Pay</h1>
        <p className="mt-1 text-sm text-text-secondary">Point your camera at the shop&apos;s QR code.</p>
      </div>

      <QrScanner onDecode={handleDecode} />

      <Button variant="ghost" className="w-full" onClick={() => setStep("manual")}>
        <Keyboard className="h-4 w-4" />
        Enter code manually
      </Button>
    </div>
  );
}
