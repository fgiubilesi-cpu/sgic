"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { CorrectiveAction } from "@/features/audits/queries/get-corrective-actions";
import {
  CA_STATUS_LABELS,
  CA_STATUS_COLORS,
} from "@/types/database.types";
import { updateCorrectiveAction } from "@/features/audits/actions/corrective-action-actions";

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
    rootCause: correctiveAction.rootCause || "",
    actionPlan: correctiveAction.actionPlan || "",
  });

  const createdDate = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(correctiveAction.createdAt));

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const result = await updateCorrectiveAction({
        id: correctiveAction.id,
        description: editData.description,
        rootCause: editData.rootCause,
        actionPlan: editData.actionPlan,
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
          {correctiveAction.rootCause && (
            <Card className="p-4">
              <h3 className="font-semibold text-sm text-zinc-900 mb-2">
                Root Cause
              </h3>
              <p className="text-sm text-zinc-700 whitespace-pre-wrap">
                {correctiveAction.rootCause}
              </p>
            </Card>
          )}

          {correctiveAction.actionPlan && (
            <Card className="p-4">
              <h3 className="font-semibold text-sm text-zinc-900 mb-2">
                Action Plan
              </h3>
              <p className="text-sm text-zinc-700 whitespace-pre-wrap font-mono">
                {correctiveAction.actionPlan}
              </p>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {correctiveAction.responsiblePersonName && (
              <Card className="p-4">
                <h3 className="font-semibold text-sm text-zinc-900 mb-2">
                  Responsible Person
                </h3>
                <p className="text-sm text-zinc-700">
                  {correctiveAction.responsiblePersonName}
                </p>
                {correctiveAction.responsiblePersonEmail && (
                  <p className="text-sm text-blue-600 break-all">
                    {correctiveAction.responsiblePersonEmail}
                  </p>
                )}
              </Card>
            )}

            {correctiveAction.targetCompletionDate && (
              <Card className="p-4">
                <h3 className="font-semibold text-sm text-zinc-900 mb-2">
                  Target Completion
                </h3>
                <p className="text-sm text-zinc-700">
                  {new Date(
                    correctiveAction.targetCompletionDate
                  ).toLocaleDateString("en-GB", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </Card>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
            {correctiveAction.status !== "completed" &&
              correctiveAction.status !== "cancelled" && (
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
                className="w-full px-3 py-2 border border-zinc-300 rounded-md min-h-[100px] font-mono text-sm"
              />
            </div>

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
