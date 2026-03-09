import { Calendar, AlertTriangle, TrendingUp } from "lucide-react";
import type { MonthlyKPIs } from "@/features/dashboard/queries/get-dashboard-data";

interface MonthlyKPIsProps {
  kpis: MonthlyKPIs;
}

function MetricCard({
  label,
  value,
  unit,
  icon,
  variant = "default",
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  variant?: "default" | "warning" | "danger";
}) {
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
    <div className={`rounded-lg border ${variantClass} p-4 flex items-start gap-3`}>
      <div className="mt-1 text-zinc-400">{icon}</div>
      <div className="flex-1">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
          {label}
        </p>
        <div className="flex items-baseline gap-1 mt-1">
          <p className={`text-3xl font-bold ${valueClass}`}>{value}</p>
          {unit && <p className="text-sm text-zinc-500">{unit}</p>}
        </div>
      </div>
    </div>
  );
}

export function MonthlyKPIs({ kpis }: MonthlyKPIsProps) {
  const complianceVariant =
    kpis.complianceAvg === null
      ? "default"
      : kpis.complianceAvg >= 85
        ? "default"
        : kpis.complianceAvg >= 70
          ? "warning"
          : "danger";

  const ncVariant = kpis.openNCsTotal > 0 ? "warning" : "default";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        label="Audit questo mese"
        value={kpis.auditsThisMonth}
        unit="audit"
        icon={<Calendar className="w-5 h-5" />}
      />
      <MetricCard
        label="NC aperte (globale)"
        value={kpis.openNCsTotal}
        unit={kpis.openNCsTotal === 1 ? "aperta" : "aperte"}
        icon={<AlertTriangle className="w-5 h-5" />}
        variant={ncVariant}
      />
      <MetricCard
        label="Compliance (ultimi 30gg)"
        value={
          kpis.complianceAvg !== null
            ? kpis.complianceAvg.toFixed(1)
            : "N/D"
        }
        unit={kpis.complianceAvg !== null ? "%" : ""}
        icon={<TrendingUp className="w-5 h-5" />}
        variant={complianceVariant}
      />
    </div>
  );
}
