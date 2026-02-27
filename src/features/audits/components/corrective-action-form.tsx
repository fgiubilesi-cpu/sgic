"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { analyzeNonConformityWithAI } from "@/features/audits/actions/ai-analysis-actions";
import type { NCsSeverity } from "@/types/database.types";

interface CorrectiveActionFormProps {
  onSubmit: (data: {
    description: string;
    rootCause: string;
    actionPlan: string;
    responsiblePersonName: string;
    responsiblePersonEmail: string;
    targetCompletionDate: string;
  }) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  ncTitle?: string;
  ncDescription?: string;
  ncSeverity?: NCsSeverity;
}

export function CorrectiveActionForm({
  onSubmit,
  onCancel,
  isLoading,
  ncTitle,
  ncDescription,
  ncSeverity,
}: CorrectiveActionFormProps) {
  const [formData, setFormData] = useState({
    description: "",
    rootCause: "",
    actionPlan: "",
    responsiblePersonName: "",
    responsiblePersonEmail: "",
    targetCompletionDate: "",
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.rootCause || !formData.actionPlan) {
      return;
    }
    await onSubmit(formData);
    setFormData({
      description: "",
      rootCause: "",
      actionPlan: "",
      responsiblePersonName: "",
      responsiblePersonEmail: "",
      targetCompletionDate: "",
    });
  };

  const handleGenerateAIAnalysis = async () => {
    if (!ncTitle || !ncDescription || !ncSeverity) {
      toast.error("Missing non-conformity information");
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeNonConformityWithAI({
        title: ncTitle,
        description: ncDescription,
        severity: ncSeverity,
      });

      if (result.success) {
        setFormData({
          ...formData,
          rootCause: result.data.root_cause_analysis,
          actionPlan: result.data.suggested_action_plan,
        });
        toast.success("AI analysis generated successfully");
      } else {
        toast.error(result.error);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="p-4 bg-blue-50 border-blue-200">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="description">Action Description</Label>
          <Textarea
            id="description"
            placeholder="What action will be taken to correct this non-conformity?"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            required
            className="min-h-[80px]"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="rootCause">Root Cause Analysis</Label>
            {ncTitle && ncSeverity && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleGenerateAIAnalysis}
                disabled={isAnalyzing || isLoading}
                className="text-xs gap-1"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3 h-3" />
                    Generate with AI
                  </>
                )}
              </Button>
            )}
          </div>
          <Textarea
            id="rootCause"
            placeholder="Why did this non-conformity occur?"
            value={formData.rootCause}
            onChange={(e) =>
              setFormData({ ...formData, rootCause: e.target.value })
            }
            required
            className="min-h-[80px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="actionPlan">Action Plan (Step-by-step)</Label>
          <Textarea
            id="actionPlan"
            placeholder="1. Step one
2. Step two
3. Step three"
            value={formData.actionPlan}
            onChange={(e) =>
              setFormData({ ...formData, actionPlan: e.target.value })
            }
            required
            className="min-h-[100px] font-mono text-sm"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="personName">Responsible Person (Optional)</Label>
            <Input
              id="personName"
              placeholder="Name"
              value={formData.responsiblePersonName}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  responsiblePersonName: e.target.value,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="personEmail">Person Email (Optional)</Label>
            <Input
              id="personEmail"
              type="email"
              placeholder="email@company.com"
              value={formData.responsiblePersonEmail}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  responsiblePersonEmail: e.target.value,
                })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dueDate">Target Completion Date (Optional)</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.targetCompletionDate}
            onChange={(e) =>
              setFormData({
                ...formData,
                targetCompletionDate: e.target.value,
              })
            }
          />
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading || isAnalyzing}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              isLoading ||
              isAnalyzing ||
              !formData.description ||
              !formData.rootCause ||
              !formData.actionPlan
            }
          >
            Create Action
          </Button>
        </div>
      </form>
    </Card>
  );
}
