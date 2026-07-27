"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PaymentMethodCard, type PaymentProvider } from "@/components/student/payment-method-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { ApiClientError } from "@/lib/api-client";
import { getWalletBalance, initiateAddMoney, queryKeys } from "@/lib/api/student";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const QUICK_AMOUNTS = [100, 500, 1000, 2000] as const;
const MIN_AMOUNT = 10;
const MAX_AMOUNT = 50_000;

export default function AddMoneyPage() {
  return (
    <Suspense>
      <AddMoneyForm />
    </Suspense>
  );
}

function AddMoneyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [provider, setProvider] = useState<PaymentProvider | null>(null);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: wallet } = useQuery({ queryKey: queryKeys.walletBalance, queryFn: getWalletBalance });

  // The gateway returns the student here with `?ref=`. The webhook is what
  // actually settles the transaction, so refresh rather than trusting the URL.
  const returnedRef = searchParams.get("ref");
  useEffect(() => {
    if (!returnedRef) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.walletBalance });
    void queryClient.invalidateQueries({ queryKey: ["wallet", "transactions"] });
    toast({
      title: "Checkout complete",
      description: "Your balance updates as soon as the payment is confirmed.",
    });
    router.replace("/student/wallet/add-money");
  }, [returnedRef, queryClient, router]);

  const mutation = useMutation({
    mutationFn: initiateAddMoney,
    onSuccess: (result) => {
      // Hand off to the provider's hosted checkout.
      window.location.assign(result.checkoutUrl);
    },
    onError: (mutationError) => {
      setError(
        mutationError instanceof ApiClientError
          ? mutationError.message
          : "Payment failed — please try again.",
      );
    },
  });

  const parsedAmount = Number(amount);
  const isAmountValid =
    amount !== "" &&
    Number.isFinite(parsedAmount) &&
    parsedAmount >= MIN_AMOUNT &&
    parsedAmount <= MAX_AMOUNT;
  const canSubmit = provider !== null && isAmountValid && !mutation.isPending;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!isAmountValid) {
      setError(`Enter an amount between ${formatCurrency(MIN_AMOUNT)} and ${formatCurrency(MAX_AMOUNT)}.`);
      return;
    }
    if (!provider) {
      setError("Select a payment method.");
      return;
    }

    mutation.mutate({ provider, amount: parsedAmount });
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">Add Money</h1>
        {wallet ? (
          <p className="mt-1 text-sm text-text-secondary">
            Current balance: <span className="tabular-nums">{formatCurrency(wallet.balance)}</span>
          </p>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-card border border-border-subtle bg-bg-surface p-6">
        <fieldset disabled={mutation.isPending} className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Payment method</p>
            <PaymentMethodCard value={provider} onChange={setProvider} />
          </div>

          <div className="space-y-3">
            <Input
              label="Amount (BDT)"
              type="number"
              inputMode="decimal"
              min={MIN_AMOUNT}
              max={MAX_AMOUNT}
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />

            <div className="flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((quickAmount) => (
                <button
                  key={quickAmount}
                  type="button"
                  onClick={() => setAmount(String(quickAmount))}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm tabular-nums transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-secondary",
                    Number(amount) === quickAmount
                      ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                      : "border-border-subtle bg-bg-elevated text-text-secondary hover:text-text-primary",
                  )}
                >
                  ৳{quickAmount}
                </button>
              ))}
            </div>
          </div>
        </fieldset>

        {error ? <p className="text-sm text-state-danger">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={!canSubmit} loading={mutation.isPending}>
          {mutation.isPending ? "Redirecting to payment gateway…" : "Proceed to Pay"}
        </Button>

        <p className="text-xs text-text-secondary">
          You&apos;ll complete this payment on your provider&apos;s secure checkout page.
        </p>
      </form>
    </div>
  );
}
