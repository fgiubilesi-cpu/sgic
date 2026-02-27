"use client";

import { Card, CardContent } from "@/components/ui/card";

type AuditStatsProps = {
  audit: {
    checklists: {
      items: {
        outcome?: string | null;
      }[];
    }[];
  };
};

export function AuditStats({ audit }: AuditStatsProps) {
  const allItems = audit.checklists.flatMap((c) => c.items);
  const totalItems = allItems.length;

  if (totalItems === 0) return null;

  const completedItems = allItems.filter(
    (i) => i.outcome && i.outcome !== "pending"
  ).length;
  const compliantItems = allItems.filter((i) => i.outcome === "compliant").length;
  const nonCompliantItems = allItems.filter((i) => i.outcome === "non_compliant").length;

  const progressPercentage = Math.round((completedItems / totalItems) * 100);
  const complianceScore =
    completedItems > 0
      ? Math.round((compliantItems / completedItems) * 100)
      : 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Audit Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm font-medium text-muted-foreground mb-2">Audit Progress</div>
          <div className="flex items-end justify-between mb-2">
            <span className="text-2xl font-bold">{progressPercentage}%</span>
            <span className="text-sm text-muted-foreground">
              {completedItems}/{totalItems} items
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Compliance Score */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm font-medium text-muted-foreground mb-2">Compliance Score</div>
          <div className="flex items-end justify-between">
            <span className={`text-2xl font-bold ${getScoreColor(complianceScore)}`}>
              {complianceScore}%
            </span>
            <span className="text-sm text-muted-foreground">of answered</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Based on responses provided so far.
          </p>
        </CardContent>
      </Card>

      {/* Quick Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm font-medium text-muted-foreground mb-4">Summary</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Compliant
              </span>
              <span className="font-medium">{compliantItems}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" /> Non-Compliant
              </span>
              <span className="font-medium">{nonCompliantItems}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
