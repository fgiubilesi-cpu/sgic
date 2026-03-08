"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { TrendPoint } from "@/features/dashboard/queries/get-dashboard-data";

interface AuditTrendChartProps {
  data: TrendPoint[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: TrendPoint }>;
  label?: string;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0];
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-md text-xs">
      <p className="font-semibold text-zinc-900">{point.payload.auditTitle}</p>
      {point.payload.clientName && (
        <p className="text-zinc-500">{point.payload.clientName}</p>
      )}
      <p className="mt-1 text-zinc-700">
        Score:{" "}
        <span className="font-bold text-zinc-900">{point.value}%</span>
      </p>
    </div>
  );
}

export function AuditTrendChart({ data }: AuditTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-zinc-400">
        Nessun audit con score disponibile per il periodo selezionato.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
        <XAxis
          dataKey="date"
          stroke="#a1a1aa"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          dy={8}
        />
        <YAxis
          domain={[0, 100]}
          stroke="#a1a1aa"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}%`}
          dx={-5}
        />
        <Tooltip content={<CustomTooltip />} />
        {/* Reference lines at 70% and 85% */}
        <ReferenceLine y={85} stroke="#10b981" strokeDasharray="4 4" strokeOpacity={0.6} />
        <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.6} />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#18181b"
          strokeWidth={2}
          dot={{ fill: "#18181b", r: 4, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: "#18181b" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
