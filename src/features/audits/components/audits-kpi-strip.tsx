import { Activity, CheckCircle2, ClipboardCheck, Clock3, ShieldAlert, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuditsListKpis } from "@/features/audits/lib/audits-list";

type AuditsKpiStripProps = {
  kpis: AuditsListKpis;
};

const KPI_ITEMS = [
  {
    key: "total",
    label: "Total audits",
    icon: ClipboardCheck,
    tone: "text-zinc-700",
  },
  {
    key: "scheduled",
    label: "Scheduled",
    icon: Clock3,
    tone: "text-sky-700",
  },
  {
    key: "inProgress",
    label: "In progress",
    icon: Activity,
    tone: "text-amber-700",
  },
  {
    key: "closed",
    label: "Closed",
    icon: CheckCircle2,
    tone: "text-emerald-700",
  },
  {
    key: "openNc",
    label: "Open NC",
    icon: ShieldAlert,
    tone: "text-rose-700",
  },
  {
    key: "averageScore",
    label: "Avg. score",
    icon: TrendingUp,
    tone: "text-violet-700",
  },
] as const;

export function AuditsKpiStrip({ kpis }: AuditsKpiStripProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
      {KPI_ITEMS.map((item) => {
        const Icon = item.icon;
        const rawValue = kpis[item.key];
        const value =
          item.key === "averageScore"
            ? rawValue !== null
              ? `${rawValue}%`
              : "—"
            : rawValue;

        return (
          <Card key={item.key} className="gap-3 rounded-2xl bg-white py-4 shadow-sm">
            <CardHeader className="px-4 pb-0">
              <CardTitle className="flex items-center justify-between text-sm font-medium text-zinc-500">
                <span>{item.label}</span>
                <Icon className={`h-4 w-4 ${item.tone}`} />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className={`text-3xl font-semibold tracking-tight ${item.tone}`}>{value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
