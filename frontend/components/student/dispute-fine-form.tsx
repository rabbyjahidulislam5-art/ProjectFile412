"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { ApiClientError } from "@/lib/api-client";
import { disputeAdminFine, queryKeys } from "@/lib/api/student";
import { formatCurrency } from "@/lib/format";
import type { DueItem } from "@/types/student";

const MIN_REASON_LENGTH = 10;

interface DisputeFineFormProps {
  fine: DueItem | null;
  onClose: () => void;
}

/**
 * Contests an Admin fine (Module 1 §5.7). Success flips the fine to
 * "Under Review" and feeds Admin Office's Fine Waiver queue.
 */
export function DisputeFineForm({ fine, onClose }: DisputeFineFormProps) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (variables: { fineId: string; reason: string }) =>
      disputeAdminFine(variables.fineId, variables.reason),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.dues });
      toast({ title: "Appeal submitted", description: result.message });
      handleClose();
    },
    onError: (mutationError) => {
      setError(
        mutationError instanceof ApiClientError
          ? mutationError.message
          : "Couldn't submit your appeal — try again.",
      );
    },
  });

  function handleClose() {
    setReason("");
    setError(null);
    onClose();
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = reason.trim();

    if (trimmed.length < MIN_REASON_LENGTH) {
      setError(`Please describe your reason in at least ${MIN_REASON_LENGTH} characters.`);
      return;
    }
    if (!fine) return;

    setError(null);
    mutation.mutate({ fineId: fine.id, reason: trimmed });
  }

  return (
    <Modal open={fine !== null} onOpenChange={(open) => !open && handleClose()}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Dispute this fine</ModalTitle>
          <ModalDescription>
            {fine
              ? `Explain why the ${formatCurrency(fine.amount)} fine should be reconsidered. Admin Office will review your appeal.`
              : null}
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <Textarea
            label="Reason for dispute"
            rows={5}
            value={reason}
            maxLength={1000}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Describe what happened and why this fine should be reviewed."
            error={error ?? undefined}
          />

          <ModalFooter>
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Submit Appeal
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
