"use client";

import { useTransition } from "react";
import { BellRing, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendOverdueACNotificationsAction } from "@/features/email/actions/send-overdue-ac-notifications";
import { toast } from "sonner";

interface SendOverdueACButtonProps {
  clientId?: string;
}

export function SendOverdueACButton({ clientId }: SendOverdueACButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await sendOverdueACNotificationsAction(clientId);
      if (result.success) {
        toast.success(
          `Notifiche inviate: ${result.sent} email${result.skipped > 0 ? ` (${result.skipped} saltate — email mancante)` : ""}`
        );
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
        <BellRing className="h-4 w-4" />
      )}
      {isPending ? "Invio..." : "Notifica AC scadute"}
    </Button>
  );
}
