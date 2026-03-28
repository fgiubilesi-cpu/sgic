import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildRegulatoryBridge,
  type RegulatoryBridgeModel,
  type RegulatoryClientSignalSource,
  type RegulatorySnapshot,
} from "@/features/regulatory/lib/regulatory-bridge";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";

export async function getRegulatoryBridge(): Promise<RegulatoryBridgeModel | null> {
  const ctx = await getOrganizationContext();
  if (!ctx || ctx.role === "client") {
    return null;
  }

  const snapshotPath = join(
    process.cwd(),
    "..",
    "gea-kb",
    "contracts",
    "gea-ecosystem.snapshot.json"
  );

  if (!existsSync(snapshotPath)) {
    return null;
  }

  const snapshot = JSON.parse(
    readFileSync(snapshotPath, "utf8")
  ) as RegulatorySnapshot;

  const [
    { data: clients },
    { data: contracts },
    { data: serviceLines },
    { data: deadlines },
  ] = await Promise.all([
    ctx.supabase
      .from("clients")
      .select("id, name, notes")
      .eq("organization_id", ctx.organizationId)
      .eq("is_active", true)
      .order("name"),
    ctx.supabase
      .from("client_contracts")
      .select("client_id, exercised_activity, service_scope, notes")
      .eq("organization_id", ctx.organizationId),
    ctx.supabase
      .from("client_service_lines")
      .select("client_id, title, notes, section, code")
      .eq("organization_id", ctx.organizationId)
      .eq("active", true),
    ctx.supabase
      .from("client_deadlines")
      .select("client_id, title, description, status")
      .eq("organization_id", ctx.organizationId)
      .neq("status", "completed"),
  ]);

  const contractByClientId = new Map<string, string[]>();
  for (const contract of contracts ?? []) {
    const current = contractByClientId.get(contract.client_id) ?? [];
    current.push(
      [
        contract.service_scope ?? "",
        contract.exercised_activity ?? "",
        contract.notes ?? "",
      ]
        .filter(Boolean)
        .join(" - ")
    );
    contractByClientId.set(contract.client_id, current.filter(Boolean));
  }

  const serviceLinesByClientId = new Map<string, string[]>();
  for (const line of serviceLines ?? []) {
    const current = serviceLinesByClientId.get(line.client_id) ?? [];
    current.push(
      [line.title, line.section ?? "", line.code ?? "", line.notes ?? ""]
        .filter(Boolean)
        .join(" - ")
    );
    serviceLinesByClientId.set(line.client_id, current.filter(Boolean));
  }

  const deadlinesByClientId = new Map<string, string[]>();
  for (const deadline of deadlines ?? []) {
    const current = deadlinesByClientId.get(deadline.client_id) ?? [];
    current.push(
      [deadline.title, deadline.description ?? "", deadline.status]
        .filter(Boolean)
        .join(" - ")
    );
    deadlinesByClientId.set(deadline.client_id, current.filter(Boolean));
  }

  const clientSignals: RegulatoryClientSignalSource[] = (clients ?? []).map(
    (client) => ({
      clientId: client.id,
      clientName: client.name,
      contractTexts: contractByClientId.get(client.id) ?? [],
      deadlineTexts: deadlinesByClientId.get(client.id) ?? [],
      noteTexts: [client.notes ?? ""].filter(Boolean),
      serviceLineTexts: serviceLinesByClientId.get(client.id) ?? [],
    })
  );

  return buildRegulatoryBridge({
    clientSignals,
    snapshot,
  });
}
