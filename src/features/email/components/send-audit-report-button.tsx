"use client";

import { useTransition, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendAuditReportAction } from "@/features/email/actions/send-audit-report";
import { toast } from "sonner";

interface SendAuditReportButtonProps {
  auditId: string;
  defaultEmail?: string;
}

export function SendAuditReportButton({
  auditId,
  defaultEmail = "",
}: SendAuditReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  const [isPending, startTransition] = useTransition();

  function handleSend() {
    if (!email) return;
    startTransition(async () => {
      const result = await sendAuditReportAction(auditId, email);
      if (result.success) {
        toast.success(`Report inviato a ${result.to}`);
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Send className="h-4 w-4" />
        Invia report al cliente
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invia report audit al cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-zinc-500">
              Il report includerà: compliance score, elenco NC, conteggio AC in
              corso.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="report-email">Indirizzo email destinatario</Label>
              <Input
                id="report-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@esempio.it"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSend} disabled={isPending || !email}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {isPending ? "Invio..." : "Invia report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
