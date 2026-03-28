import { describe, expect, it } from "vitest";

import {
  buildManagementCoverageRows,
  buildNativePortfolioRow,
  buildStagingPortfolioRow,
  classifyDueDate,
  dedupeAndSortDueItems,
  isClosedLikeStatus,
  isRecurringCadence,
} from "@/features/management/lib/management-dashboard-derivations";

describe("management-dashboard-derivations", () => {
  it("normalizes status-like helpers and due date classification", () => {
    expect(isClosedLikeStatus("Completed")).toBe(true);
    expect(isClosedLikeStatus("open")).toBe(false);
    expect(isRecurringCadence("mensile")).toBe(true);
    expect(isRecurringCadence("una tantum")).toBe(false);
    expect(classifyDueDate("2026-03-10", "2026-03-27", "2026-04-26")).toBe("overdue");
    expect(classifyDueDate("2026-04-01", "2026-03-27", "2026-04-26")).toBe("due_soon");
    expect(classifyDueDate("2026-05-10", "2026-03-27", "2026-04-26")).toBe("planned");
  });

  it("builds coverage rows and keeps blended/native/staging source semantics", () => {
    const rows = buildManagementCoverageRows(
      new Map([
        [
          "Audit",
          {
            annualValue: 1000,
            nativeClients: new Set(["c1"]),
            recurringCount: 1,
            serviceLineCount: 2,
            stagingClients: new Set(["s1"]),
          },
        ],
        [
          "Formazione",
          {
            annualValue: 500,
            nativeClients: new Set(["c1", "c2"]),
            recurringCount: 2,
            serviceLineCount: 2,
            stagingClients: new Set<string>(),
          },
        ],
      ])
    );

    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Formazione",
          clientCount: 2,
          source: "native",
        }),
        expect.objectContaining({
          label: "Audit",
          clientCount: 2,
          source: "blended",
        }),
      ])
    );
  });

  it("builds native and staging portfolio rows with consistent risk signals", () => {
    const nativeRow = buildNativePortfolioRow({
      client: { id: "c1", name: "Hotel Aurora" },
      criticalNcByClient: new Map([["c1", 1]]),
      expiringDocumentsByClient: new Map([["c1", 2]]),
      fallbackPresidioByClient: new Map([["c1", 1]]),
      fallbackServiceAreasByClient: new Map([["c1", new Set(["Food"])] ]),
      fallbackServicesByClient: new Map([["c1", 2]]),
      lastAuditDateByClient: new Map([["c1", "2026-03-01"]]),
      locationsByClient: new Map([["c1", 3]]),
      nativeActivePersonnelByClient: new Map(),
      nativeServiceAreasByClient: new Map(),
      nativeServicesByClient: new Map(),
      openNcByClient: new Map([["c1", 2]]),
      overdueActionsByClient: new Map([["c1", 1]]),
      overdueItemsByClient: new Map([["c1", 1]]),
      stagingSignalsByClient: new Set(["c1"]),
    });

    expect(nativeRow).toMatchObject({
      clientId: "c1",
      coverageStatus: "partial",
      source: "merged",
      activePersonnel: 1,
      serviceLines: 2,
    });
    expect(nativeRow.attentionReasons).toEqual(
      expect.arrayContaining([
        "copertura servizi letta da staging FileMaker",
        "presidio interno letto da staging FileMaker",
        "1 NC critiche",
      ])
    );

    const stagingRow = buildStagingPortfolioRow({
      activeLocations: 1,
      annualValue: 1200,
      clientCode: null,
      clientName: "Cliente FileMaker",
      contractDueCount: 1,
      deadlineDueCount: 2,
      key: "fm-1",
      overdueItems: 1,
      plannedAssignments: 0,
      plannedHours: 0,
      serviceAreas: new Set(["Audit"]),
      serviceLines: 1,
    });

    expect(stagingRow).toMatchObject({
      clientId: null,
      coverageStatus: "partial",
      source: "staging",
      overdueItems: 1,
    });
    expect(stagingRow.attentionReasons[0]).toBe("1 scadenze oltre termine");
  });

  it("deduplicates and sorts due items by date", () => {
    const items = dedupeAndSortDueItems([
      {
        clientId: "c1",
        clientName: "Hotel Aurora",
        dueDate: "2026-04-10",
        href: "/clients/c1",
        label: "DVR",
        priority: null,
        source: "sgic" as const,
        status: "due_soon" as const,
        type: "document" as const,
      },
      {
        clientId: "c1",
        clientName: "Hotel Aurora",
        dueDate: "2026-04-10",
        href: "/clients/c1",
        label: "DVR",
        priority: null,
        source: "sgic" as const,
        status: "due_soon" as const,
        type: "document" as const,
      },
      {
        clientId: "c2",
        clientName: "Ristorante Sole",
        dueDate: "2026-03-29",
        href: "/clients/c2",
        label: "Audit pianificato",
        priority: null,
        source: "sgic" as const,
        status: "due_soon" as const,
        type: "audit" as const,
      },
    ]);

    expect(items).toHaveLength(2);
    expect(items[0]?.clientId).toBe("c2");
    expect(items[1]?.clientId).toBe("c1");
  });
});
