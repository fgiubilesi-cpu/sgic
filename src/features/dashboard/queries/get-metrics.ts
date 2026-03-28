import { createClient } from '@/lib/supabase/server';

export async function getDashboardMetrics(orgId: string) {
  const supabase = await createClient();

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

  const [openNCsRes, criticalNCsRes, overdueACsRes, monthlyAuditsRes, ncBySeverityRes] =
    await Promise.all([
      supabase
        .from("non_conformities")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .neq("status", "closed"),
      supabase
        .from("non_conformities")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .eq("severity", "critical")
        .is("deleted_at", null)
        .neq("status", "closed"),
      supabase
        .from("corrective_actions")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .neq("status", "completed")
        .lt("due_date", now.toISOString()),
      supabase
        .from("audits")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .gte("scheduled_date", firstDayOfMonth)
        .lt("scheduled_date", firstDayOfNextMonth),
      supabase
        .from("non_conformities")
        .select("severity")
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .neq("status", "closed"),
    ]);

  const severities = ncBySeverityRes.data || [];
  const severityCounts = {
    critical: 0,
    major: 0,
    minor: 0,
    observation: 0,
  };

  severities.forEach((nc) => {
    if (nc.severity && nc.severity in severityCounts) {
      severityCounts[nc.severity as keyof typeof severityCounts]++;
    } else if (nc.severity) {
      // Safe fallback for unexpected severities in older datasets.
      (severityCounts as Record<string, number>)[nc.severity] =
        ((severityCounts as Record<string, number>)[nc.severity] || 0) + 1;
    }
  });

  const chartData = [
    { name: "Critica", value: severityCounts.critical, fill: "#ef4444" },
    { name: "Maggiore", value: severityCounts.major, fill: "#f97316" },
    { name: "Minore", value: severityCounts.minor, fill: "#eab308" },
    ...(severityCounts.observation
      ? [{ name: "Osservazione", value: severityCounts.observation, fill: "#3b82f6" }]
      : []),
  ];

  return {
    openNCsCount: openNCsRes.count || 0,
    criticalNCsCount: criticalNCsRes.count || 0,
    overdueACsCount: overdueACsRes.count || 0,
    monthlyAuditsCount: monthlyAuditsRes.count || 0,
    chartData,
  };
}
