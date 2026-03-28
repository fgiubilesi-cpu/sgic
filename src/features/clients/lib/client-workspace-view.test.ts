import { describe, expect, it } from "vitest";

import {
  buildAggregatedDeadlines,
  buildAuditOptions,
  buildClientWorkspaceOverview,
  buildLocationNameMap,
  buildLocationOptions,
  buildServiceLineOptions,
  computeRiskLevel,
} from "@/features/clients/lib/client-workspace-view";
import type { DocumentListItem } from "@/features/documents/queries/get-documents";
import type {
  ClientContactRecord,
  ClientContractRecord,
  ClientDeadlineRecord,
  ClientManualDeadlineRecord,
  ClientServiceLineRecord,
  ClientTaskRecord,
} from "@/features/clients/queries/get-client-workspace";

function createTask(overrides: Partial<ClientTaskRecord> = {}): ClientTaskRecord {
  return {
    audit_id: null,
    client_id: "client-1",
    completed_at: null,
    created_at: "2026-03-01T09:00:00Z",
    description: null,
    due_date: null,
    id: "task-1",
    is_recurring: false,
    location_id: null,
    organization_id: "org-1",
    owner_name: null,
    owner_profile_id: null,
    priority: "medium",
    recurrence_label: null,
    service_line_id: null,
    status: "open",
    title: "Task operativo",
    updated_at: "2026-03-01T09:00:00Z",
    ...overrides,
  };
}

function createDeadline(
  overrides: Partial<ClientDeadlineRecord> = {}
): ClientDeadlineRecord {
  return {
    client_id: "client-1",
    created_at: "2026-03-01T09:00:00Z",
    created_by: null,
    description: null,
    due_date: "2026-04-01",
    id: "deadline-1",
    location_id: null,
    organization_id: "org-1",
    priority: "medium",
    service_line_id: null,
    source_id: null,
    source_type: "manual",
    status: "open",
    title: "Scadenza manuale",
    updated_at: "2026-03-01T09:00:00Z",
    ...overrides,
  };
}

function createDocument(overrides: Partial<DocumentListItem> = {}): DocumentListItem {
  return {
    access_url: null,
    category: null,
    client_id: "client-1",
    created_at: "2026-03-01T09:00:00Z",
    description: null,
    expiry_date: null,
    extracted_payload: null,
    file_name: "documento.pdf",
    file_url: null,
    id: "doc-1",
    ingestion_status: "processed",
    issue_date: null,
    last_reviewed_at: null,
    location_id: null,
    personnel_id: null,
    status: "valid",
    title: "Documento",
    updated_at: "2026-03-01T09:00:00Z",
    version_count: 1,
    ...overrides,
  } as DocumentListItem;
}

function createContact(
  overrides: Partial<ClientContactRecord> = {}
): ClientContactRecord {
  return {
    client_id: "client-1",
    created_at: "2026-03-01T09:00:00Z",
    department: null,
    email: null,
    full_name: "Mario Rossi",
    id: "contact-1",
    is_active: true,
    is_primary: false,
    location_id: null,
    notes: null,
    organization_id: "org-1",
    phone: null,
    role: null,
    updated_at: "2026-03-01T09:00:00Z",
    ...overrides,
  };
}

function createServiceLine(
  overrides: Partial<ClientServiceLineRecord> = {}
): ClientServiceLineRecord {
  return {
    active: true,
    billing_phase: null,
    client_id: "client-1",
    code: null,
    created_at: "2026-03-01T09:00:00Z",
    frequency_label: "mensile",
    id: "line-1",
    is_recurring: true,
    location_id: null,
    notes: null,
    organization_id: "org-1",
    quantity: 1,
    section: null,
    sort_order: 1,
    source_document_id: null,
    title: "Servizio audit",
    total_price: null,
    unit: null,
    unit_price: 100,
    updated_at: "2026-03-01T09:00:00Z",
    ...overrides,
  };
}

describe("client-workspace-view", () => {
  it("aggregates deadlines from contract, tasks, documents and audits in date order", () => {
    const deadlines = buildAggregatedDeadlines({
      audits: [
        {
          id: "audit-1",
          location_id: null,
          location_name: null,
          nc_count: 0,
          scheduled_date: "2026-03-26",
          score: null,
          status: "Scheduled",
          title: "Audit primavera",
        },
      ],
      clientId: "client-1",
      contract: {
        activity_frequency: null,
        attachment_url: null,
        client_id: "client-1",
        client_references: null,
        contract_type: "standard",
        created_at: "2026-03-01T09:00:00Z",
        duration_terms: null,
        end_date: "2026-04-30",
        exercised_activity: null,
        id: "contract-1",
        internal_owner: null,
        issue_date: null,
        notes: null,
        organization_id: "org-1",
        protocol_code: null,
        renewal_date: "2026-04-15",
        service_scope: null,
        start_date: null,
        status: "active",
        supervisor_name: null,
        updated_at: "2026-03-01T09:00:00Z",
        validity_terms: null,
      } satisfies ClientContractRecord,
      deadlines: [createDeadline({ due_date: "2026-03-20", title: "Checklist manuale" })],
      documents: [createDocument({ expiry_date: "2026-03-28", title: "DVR" })],
      tasks: [createTask({ due_date: "2026-03-24", title: "Aggiornare procedura" })],
      today: new Date("2026-03-18T12:00:00Z"),
    });

    expect(deadlines.map((item) => item.title)).toEqual([
      "Checklist manuale",
      "Aggiornare procedura",
      "Audit primavera",
      "DVR",
      "Rinnovo contratto",
      "Scadenza contratto",
    ]);
  });

  it("builds overview signals from tasks, deadlines, documents and service lines", () => {
    const aggregatedDeadlines = [
      {
        description: null,
        due_date: "2026-03-19",
        href: null,
        id: "deadline-overdue",
        location_id: null,
        priority: "high",
        service_line_id: null,
        source_type: "manual",
        status: "open",
        title: "Scadenza critica",
      },
    ] as const;

    const overview = buildClientWorkspaceOverview({
      aggregatedDeadlines: aggregatedDeadlines as unknown as ReturnType<typeof buildAggregatedDeadlines>,
      contacts: [createContact({ is_primary: true }), createContact({ id: "contact-2" })],
      contract: null,
      contractAttentionLimit: new Date("2026-05-01T00:00:00Z"),
      documents: [
        createDocument({ expiry_date: "2026-03-18", id: "expired-doc" }),
        createDocument({ id: "review-doc", ingestion_status: "review_required" }),
      ],
      manualDeadlines: [
        createDeadline({ id: "manual-1", service_line_id: null }),
      ] as ClientManualDeadlineRecord[],
      openNcCount: 2,
      serviceLines: [createServiceLine()],
      tasks: [
        createTask({ due_date: "2026-03-18", id: "task-overdue" }),
        createTask({ id: "task-done", status: "done" }),
      ],
      today: new Date("2026-03-20T09:00:00Z"),
    });

    expect(overview.riskLevel).toEqual(computeRiskLevel({
      openNcCount: 2,
      overdueDeadlines: 1,
      overdueTasks: 1,
    }));
    expect(overview.overviewStats).toEqual([
      { label: "Task aperte", value: 1 },
      { label: "Scadenze urgenti", value: 1 },
      { label: "NC aperte", value: 2 },
      { label: "Documenti da presidiare", value: 2 },
    ]);
    expect(overview.unlinkedOpenTasksCount).toBe(1);
    expect(overview.unlinkedOpenManualDeadlinesCount).toBe(1);
  });

  it("builds reusable workspace option sets", () => {
    const locations = [
      { id: "loc-1", name: "Stabilimento", city: "Parma", type: "Plant" },
      { id: "loc-2", name: "Deposito", city: "Modena", type: "Warehouse" },
    ] as const;

    expect(buildLocationOptions(locations)).toEqual([
      { id: "loc-1", name: "Stabilimento" },
      { id: "loc-2", name: "Deposito" },
    ]);
    expect(buildLocationNameMap(locations).get("loc-2")).toBe("Deposito");

    expect(
      buildAuditOptions([
        {
          id: "audit-1",
          title: "Audit QA",
        },
      ])
    ).toEqual([{ id: "audit-1", title: "Audit QA" }]);

    expect(buildServiceLineOptions([createServiceLine({ id: "line-99", title: "HACCP" })])).toEqual([
      { id: "line-99", location_id: null, title: "HACCP" },
    ]);
  });
});
