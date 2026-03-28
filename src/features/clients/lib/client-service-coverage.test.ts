import { describe, expect, it } from "vitest";

import {
  buildClientServiceCoverage,
  getServiceCoverageStatusClassName,
  getServiceCoverageStatusLabel,
  type ServiceCoverageAuditInput,
  type ServiceCoverageDocumentInput,
  type ServiceCoverageLocationInput,
} from "@/features/clients/lib/client-service-coverage";
import type {
  ClientDeadlineRecord,
  ClientServiceLineRecord,
  ClientTaskRecord,
} from "@/features/clients/queries/get-client-workspace";

const ORGANIZATION_ID = "org-1";
const CLIENT_ID = "client-1";
const LOCATION_ID = "loc-1";

function createServiceLine(
  overrides: Partial<ClientServiceLineRecord> = {}
): ClientServiceLineRecord {
  return {
    active: true,
    billing_phase: null,
    client_id: CLIENT_ID,
    code: null,
    created_at: "2026-01-01T09:00:00Z",
    frequency_label: "mensile",
    id: "line-1",
    is_recurring: true,
    location_id: LOCATION_ID,
    notes: null,
    organization_id: ORGANIZATION_ID,
    quantity: 1,
    section: null,
    sort_order: 1,
    source_document_id: null,
    title: "Linea servizio",
    total_price: null,
    unit: null,
    unit_price: 100,
    updated_at: "2026-01-01T09:00:00Z",
    ...overrides,
  };
}

function createTask(overrides: Partial<ClientTaskRecord> = {}): ClientTaskRecord {
  return {
    audit_id: null,
    client_id: CLIENT_ID,
    completed_at: null,
    created_at: "2026-03-01T09:00:00Z",
    description: null,
    due_date: null,
    id: "task-1",
    is_recurring: false,
    location_id: LOCATION_ID,
    organization_id: ORGANIZATION_ID,
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
    client_id: CLIENT_ID,
    created_at: "2026-03-01T09:00:00Z",
    created_by: null,
    description: null,
    due_date: "2026-04-01",
    id: "deadline-1",
    location_id: LOCATION_ID,
    organization_id: ORGANIZATION_ID,
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

function createAudit(
  overrides: Partial<ServiceCoverageAuditInput> = {}
): ServiceCoverageAuditInput {
  return {
    id: "audit-1",
    location_id: LOCATION_ID,
    scheduled_date: "2026-03-10",
    status: "Scheduled",
    title: "Audit cucina marzo",
    ...overrides,
  };
}

function createDocument(
  overrides: Partial<ServiceCoverageDocumentInput> = {}
): ServiceCoverageDocumentInput {
  return {
    category: null,
    client_id: CLIENT_ID,
    created_at: "2026-03-20T09:00:00Z",
    description: null,
    file_name: "manuale-haccp.pdf",
    id: "doc-1",
    issue_date: "2026-03-20",
    last_reviewed_at: null,
    location_id: LOCATION_ID,
    title: "Manuale HACCP revisione",
    updated_at: "2026-03-20T09:00:00Z",
    ...overrides,
  };
}

describe("client-service-coverage", () => {
  it("computes coverage statuses, reasons, and summary totals", () => {
    const auditLine = createServiceLine({
      id: "line-audit",
      title: "Audit mensile cucina",
    });
    const documentLine = createServiceLine({
      id: "line-document",
      title: "Manuale HACCP",
      frequency_label: "trimestrale",
      sort_order: 2,
    });
    const trainingLine = createServiceLine({
      id: "line-training",
      title: "Formazione HACCP",
      frequency_label: "annuale",
      sort_order: 3,
    });

    const snapshot = buildClientServiceCoverage({
      audits: [createAudit()],
      deadlines: [createDeadline({ status: "completed", service_line_id: "line-document" })],
      documents: [createDocument()],
      locations: [{ id: LOCATION_ID, name: "Cucina centrale" } satisfies ServiceCoverageLocationInput],
      serviceLines: [auditLine, documentLine, trainingLine],
      tasks: [
        createTask({
          due_date: "2026-04-05",
          owner_name: "Giulia",
          service_line_id: "line-training",
          title: "Formazione HACCP aprile",
        }),
      ],
      today: new Date("2026-03-26T12:00:00Z"),
    });

    expect(snapshot.items.map((item) => [item.lineId, item.status])).toEqual([
      ["line-audit", "overdue"],
      ["line-training", "scheduled"],
      ["line-document", "covered"],
    ]);
    expect(snapshot.items[0]?.reasons[0]).toContain("2026-03-10");
    expect(snapshot.items[0]?.locationName).toBe("Cucina centrale");
    expect(snapshot.summary).toEqual({
      atRisk: 0,
      covered: 1,
      coverageRate: 67,
      guarded: 2,
      missing: 0,
      overdue: 1,
      recurring: 3,
      scheduled: 1,
      total: 3,
    });
    expect(snapshot.attentionItems.map((item) => item.lineId)).toEqual(["line-audit"]);
  });

  it("maps visual labels and classes for coverage statuses", () => {
    expect(getServiceCoverageStatusLabel("missing")).toBe("Scoperta");
    expect(getServiceCoverageStatusClassName("scheduled")).toContain("sky");
  });
});
