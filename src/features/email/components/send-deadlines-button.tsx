"use client";

import { useState, useTransition } from "react";
import { Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendDeadlinesSummaryAction } from "@/features/email/actions/send-deadlines-summary";
import { toast } from "sonner";

interface SendDeadlinesButtonProps {
  clientId?: string;
}

export function SendDeadlinesButton({ clientId }: SendDeadlinesButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await sendDeadlinesSummaryAction(clientId);
      if (result.success) {
        toast.success(`Riepilogo inviato a ${result.to} (${result.sent} scadenze)`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className="gap-2"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Mail className="h-4 w-4" />
      )}
      {isPending ? "Invio..." : "Invia riepilogo scadenze"}
    </Button>
  );
}
