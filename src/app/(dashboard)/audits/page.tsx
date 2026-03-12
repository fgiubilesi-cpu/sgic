import { getAudits } from "@/features/audits/queries/get-audits";
import { CreateAuditSheet } from "@/features/audits/components/create-audit-sheet";
import { AuditsKpiStrip } from "@/features/audits/components/audits-kpi-strip";
import { AuditsWorkweekPanel } from "@/features/audits/components/audits-workweek-panel";
import { AuditsToolbar } from "@/features/audits/components/audits-toolbar";
import { AuditsResults } from "@/features/audits/components/audits-results";
import {
  buildAuditsSections,
  filterAndSortAudits,
  getAuditsListKpis,
  getAuditsListOptions,
  parseAuditsListState,
} from "@/features/audits/lib/audits-list";
import { getOrganization } from "@/features/organization/queries/get-organization";

export const dynamic = "force-dynamic";

export default async function AuditsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [audits, organization, params] = await Promise.all([
    getAudits(),
    getOrganization(),
    searchParams,
  ]);
  const state = parseAuditsListState(params, organization?.config.rules
    ? {
        groupBy: organization.config.rules.defaultAuditGroupBy,
        sort: organization.config.rules.defaultAuditSort,
        viewMode: organization.config.rules.defaultAuditView,
      }
    : undefined);
  const options = getAuditsListOptions(audits);
  const filteredAudits = filterAndSortAudits(audits, state);
  const kpis = getAuditsListKpis(filteredAudits);
  const sections = buildAuditsSections(filteredAudits, state.groupBy);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Audit Operations
          </h1>
          <p className="max-w-2xl text-sm text-zinc-500">
            Filter, group and inspect your full audit pipeline from one place. Use the
            explorer to switch perspective by client, site, status or time window.
          </p>
        </div>
        <CreateAuditSheet />
      </div>

      <AuditsKpiStrip kpis={kpis} />
      <AuditsWorkweekPanel audits={filteredAudits} />
      <AuditsToolbar
        state={state}
        options={options}
        totalCount={audits.length}
        filteredCount={filteredAudits.length}
        audits={filteredAudits}
      />
      <AuditsResults sections={sections} viewMode={state.viewMode} groupBy={state.groupBy} />
    </section>
  );
}
