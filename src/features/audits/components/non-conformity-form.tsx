"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import type { AuditOutcome } from "@/types/database.types";

interface ChecklistItem {
  id: string;
  question: string;
  outcome: AuditOutcome;
  notes: string | null;
}

interface NonConformityFormProps {
  auditId: string;
  nonCompliantItems: ChecklistItem[];
  onSubmit: (data: {
    checklistItemId: string;
    title: string;
    description: string;
    severity: "minor" | "major" | "critical";
  }) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function NonConformityForm({
  nonCompliantItems,
  onSubmit,
  onCancel,
  isLoading,
}: NonConformityFormProps) {
  const [formData, setFormData] = useState({
    checklistItemId: "",
    title: "",
    description: "",
    severity: "major" as "minor" | "major" | "critical",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.checklistItemId || !formData.title) return;
    await onSubmit(formData);
    setFormData({
      checklistItemId: "",
      title: "",
      description: "",
      severity: "major",
    });
  };

  return (
    <Card className="p-4 bg-orange-50 border-orange-200">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="checklist-item">Non-Compliant Item</Label>
          <Select
            value={formData.checklistItemId}
            onValueChange={(value) =>
              setFormData({ ...formData, checklistItemId: value })
            }
          >
            <SelectTrigger id="checklist-item">
              <SelectValue placeholder="Select a non-compliant checklist item" />
            </SelectTrigger>
            <SelectContent>
              {nonCompliantItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.question}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Brief title of the non-conformity"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Detailed description of the issue"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="min-h-[80px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="severity">Severity</Label>
          <Select
            value={formData.severity}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                severity: value as "minor" | "major" | "critical",
              })
            }
          >
            <SelectTrigger id="severity">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minor">Minor (Observation)</SelectItem>
              <SelectItem value="major">Major (Must Fix)</SelectItem>
              <SelectItem value="critical">Critical (Blocks Audit)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              isLoading || !formData.checklistItemId || !formData.title
            }
          >
            Create Non-Conformity
          </Button>
        </div>
      </form>
    </Card>
  );
}
