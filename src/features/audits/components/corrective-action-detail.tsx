"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, Calendar, CheckCircle2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { CorrectiveAction } from "@/features/audits/queries/get-corrective-actions";
import {
  CA_STATUS_LABELS,
  CA_STATUS_COLORS,
} from "@/features/quality/constants";
import { updateCorrectiveAction } from "@/features/audits/actions/corrective-action-actions";
import {
  formatAuditDateLabel,
  getAuditCorrectiveActionDeadline,
  getCorrectiveActionOperationalFocus,
  isAuditCorrectiveActionOverdue,
} from "@/features/audits/lib/audit-process-view";
import { cn } from "@/lib/utils";

interface CorrectiveActionDetailProps {
  correctiveAction: CorrectiveAction;
  onBack: () => void;
  onUpdated: () => Promise<void>;
  onCompleted: () => void;
}

export function CorrectiveActionDetail({
  correctiveAction,
  onBack,
  onUpdated,
  onCompleted,
}: CorrectiveActionDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editData, setEditData] = useState({
    description: correctiveAction.description,
    dueDate: (
      correctiveAction.targetCompletionDate ??
      correctiveAction.dueDate ??
      ""
    ).split("T")[0],
    rootCause: correctiveAction.rootCause || "",
    actionPlan: correctiveAction.actionPlan || "",
    responsiblePersonEmail: correctiveAction.responsiblePersonEmail || "",
    responsiblePersonName: correctiveAction.responsiblePersonName || "",
  });
  const focus = getCorrectiveActionOperationalFocus(correctiveAction);
  const deadline = getAuditCorrectiveActionDeadline(correctiveAction);
  const isOverdue = isAuditCorrectiveActionOverdue(correctiveAction);

  const createdDate = formatAuditDateLabel(correctiveAction.createdAt, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const result = await updateCorrectiveAction({
        id: correctiveAction.id,
        actionPlan: editData.actionPlan.trim() || undefined,
        description: editData.description.trim(),
        dueDate: editData.dueDate || undefined,
        responsiblePersonEmail: editData.responsiblePersonEmail.trim() || undefined,
        responsiblePersonName: editData.responsiblePersonName.trim() || undefined,
        rootCause: editData.rootCause.trim() || undefined,
      });

      if (result.success) {
        toast.success("Corrective action updated");
        setIsEditing(false);
        await onUpdated();
      } else {
        toast.error(result.error);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Badge className={CA_STATUS_COLORS[correctiveAction.status]}>
          {CA_STATUS_LABELS[correctiveAction.status]}
        </Badge>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          {correctiveAction.description}
        </h1>
        <p className="text-sm text-zinc-500">Created {createdDate}</p>
      </div>

      {!isEditing ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-4 md:col-span-2">
              <h3 className="font-semibold text-sm text-zinc-900 mb-2">
                Stato operativo
              </h3>
              <p
                className={cn(
                  "text-sm font-medium",
                  focus.tone === "critical" && "text-red-700",
                  focus.tone === "success" && "text-emerald-700",
                  focus.tone === "warning" && "text-amber-700",
                  focus.tone === "neutral" && "text-zinc-800"
                )}
              >
                {focus.label}
              </p>
              {focus.detail ? (
                <p className="mt-1 text-sm text-zinc-600">{focus.detail}</p>
              ) : null}
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold text-sm text-zinc-900 mb-2">
                Presa in carico
              </h3>
              <div className="space-y-2 text-sm text-zinc-700">
                <p className="flex items-center gap-2">
                  <User className="h-4 w-4 text-zinc-500" />
                  {correctiveAction.responsiblePersonName || "Responsabile da assegnare"}
                </p>
                <p
                  className={cn(
                    "flex items-center gap-2",
                    isOverdue ? "text-red-700 font-medium" : ""
                  )}
                >
                  <Calendar className="h-4 w-4 text-zinc-500" />
                  {deadline ? formatAuditDateLabel(deadline) : "Scadenza da definire"}
                  {isOverdue ? <AlertTriangle className="h-4 w-4 text-red-600" /> : null}
                </p>
                {correctiveAction.completedAt ? (
                  <p className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Completata il {formatAuditDateLabel(correctiveAction.completedAt)}
                  </p>
                ) : null}
              </div>
            </Card>
          </div>

          <Card className="p-4">
            <h3 className="font-semibold text-sm text-zinc-900 mb-2">Azione</h3>
            <p className="text-sm text-zinc-700 whitespace-pre-wrap">
              {correctiveAction.description}
            </p>
          </Card>

          {(correctiveAction.rootCause ||
            correctiveAction.actionPlan ||
            correctiveAction.responsiblePersonEmail) && (
            <details className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold text-zinc-800">
                Dettagli estesi
              </summary>
              <div className="mt-4 space-y-4">
                {correctiveAction.rootCause ? (
                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Root Cause
                    </h4>
                    <p className="mt-1 text-sm text-zinc-700 whitespace-pre-wrap">
                      {correctiveAction.rootCause}
                    </p>
                  </div>
                ) : null}

                {correctiveAction.actionPlan ? (
                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Action Plan
                    </h4>
                    <p className="mt-1 text-sm text-zinc-700 whitespace-pre-wrap">
                      {correctiveAction.actionPlan}
                    </p>
                  </div>
                ) : null}

                {correctiveAction.responsiblePersonEmail ? (
                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Email responsabile
                    </h4>
                    <p className="mt-1 text-sm text-blue-600 break-all">
                      {correctiveAction.responsiblePersonEmail}
                    </p>
                  </div>
                ) : null}
              </div>
            </details>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
            {correctiveAction.status !== "completed" && (
                <Button onClick={onCompleted} className="bg-green-600 hover:bg-green-700">
                  Mark as Complete
                </Button>
              )}
          </div>
        </div>
      ) : (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={editData.description}
                onChange={(e) =>
                  setEditData({ ...editData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-zinc-300 rounded-md min-h-[80px]"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Responsible Person</label>
                <input
                  value={editData.responsiblePersonName}
                  onChange={(e) =>
                    setEditData({ ...editData, responsiblePersonName: e.target.value })
                  }
                  className="w-full rounded-md border border-zinc-300 px-3 py-2"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Target Date</label>
                <input
                  type="date"
                  value={editData.dueDate}
                  onChange={(e) =>
                    setEditData({ ...editData, dueDate: e.target.value })
                  }
                  className="w-full rounded-md border border-zinc-300 px-3 py-2"
                />
              </div>
            </div>

            <details className="rounded-lg border border-amber-200 bg-white px-3 py-2">
              <summary className="cursor-pointer text-sm font-medium text-zinc-700">
                Dettagli opzionali
              </summary>

              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Responsible Email</label>
                  <input
                    type="email"
                    value={editData.responsiblePersonEmail}
                    onChange={(e) =>
                      setEditData({ ...editData, responsiblePersonEmail: e.target.value })
                    }
                    className="w-full rounded-md border border-zinc-300 px-3 py-2"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Root Cause</label>
                  <textarea
                    value={editData.rootCause}
                    onChange={(e) =>
                      setEditData({ ...editData, rootCause: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Action Plan</label>
                  <textarea
                    value={editData.actionPlan}
                    onChange={(e) =>
                      setEditData({ ...editData, actionPlan: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md min-h-[100px] text-sm"
                  />
                </div>
              </div>
            </details>

            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
