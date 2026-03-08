import { ClipboardCheck, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import type { DashboardMetrics } from "@/features/dashboard/queries/get-dashboard-data";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  sublabel?: string;
  variant?: "default" | "warning" | "danger";
}

function MetricCard({ label, value, icon, sublabel, variant = "default" }: MetricCardProps) {
  const variantClass =
    variant === "danger"
      ? "border-red-200 bg-red-50"
      : variant === "warning"
        ? "border-amber-200 bg-amber-50"
        : "border-zinc-200 bg-white";

  const valueClass =
    variant === "danger"
      ? "text-red-700"
      : variant === "warning"
        ? "text-amber-700"
        : "text-zinc-900";

  return (
    <div
      className={`rounded-xl border ${variantClass} p-4 flex items-start gap-3 shadow-sm`}
    >
      <div className="mt-0.5 text-zinc-400">{icon}</div>
      <div>
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
          {label}
        </p>
        <p className={`text-2xl font-bold mt-0.5 ${valueClass}`}>{value}</p>
        {sublabel && <p className="text-xs text-zinc-400 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
}

interface DashboardMetricsProps {
  metrics: DashboardMetrics;
}

export function DashboardMetricsGrid({ metrics }: DashboardMetricsProps) {
  const avgScoreDisplay =
    metrics.avgScore !== null
      ? `${metrics.avgScore.toFixed(1)}%`
      : "N/D";

  const scoreVariant =
    metrics.avgScore === null
      ? "default"
      : metrics.avgScore >= 85
        ? "default"
        : metrics.avgScore >= 70
          ? "warning"
          : "danger";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Audit nel periodo"
        value={metrics.totalAudits}
        icon={<ClipboardCheck className="w-5 h-5" />}
        sublabel="Totale filtrato"
      />
      <MetricCard
        label="NC aperte"
        value={metrics.openNCs}
        icon={<AlertTriangle className="w-5 h-5" />}
        sublabel="Stato: open"
        variant={metrics.openNCs > 0 ? "warning" : "default"}
      />
      <MetricCard
        label="AC scadute"
        value={metrics.overdueACs}
        icon={<Clock className="w-5 h-5" />}
        sublabel="Da completare"
        variant={metrics.overdueACs > 0 ? "danger" : "default"}
      />
      <MetricCard
        label="Score medio"
        value={avgScoreDisplay}
        icon={<TrendingUp className="w-5 h-5" />}
        sublabel="Media audit con score"
        variant={scoreVariant}
      />
    </div>
  );
}
