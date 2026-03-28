import { describe, expect, it } from "vitest";

import {
  buildRegulatoryBridge,
  type RegulatoryClientSignalSource,
  type RegulatorySnapshot,
} from "@/features/regulatory/lib/regulatory-bridge";

const snapshot: RegulatorySnapshot = {
  content_assets: [
    {
      channel: "Pagina G&A",
      source: {
        path: "ga-content/published/2026-03-20-T11-moca-plastiche.md",
        repo: "ga-content",
      },
      status: "published",
      theme_id: "T11",
    },
  ],
  deadlines: [
    {
      effective_date: "2026-09-16",
      id: "D01",
      jurisdiction: "EU / Italy",
      match_keywords: ["packaging", "moca"],
      recommended_actions: ["Aprire task"],
      related_theme_ids: ["T11"],
      sgic_modules: ["documents", "deadlines"],
      status: "upcoming",
      title: "MOCA plastiche",
    },
  ],
  generated_at: "2026-03-28T02:00:00+01:00",
  themes: [
    {
      content_streams: ["alert"],
      id: "T11",
      match_keywords: ["imballaggi", "packaging"],
      recommended_actions: ["Controllare clienti packaging"],
      sgic_modules: ["documents", "clients"],
      status: "published",
      title: "MOCA plastiche",
    },
    {
      content_streams: ["educativo"],
      id: "T02",
      match_keywords: ["haccp", "checklist"],
      recommended_actions: ["Rivedere checklist"],
      sgic_modules: ["audits", "documents"],
      status: "published",
      title: "HACCP cartaceo vs digitale",
    },
  ],
  version: "0.3.0",
};

const clientSignals: RegulatoryClientSignalSource[] = [
  {
    clientId: "c1",
    clientName: "Food Packaging Spa",
    contractTexts: ["servizio packaging e revisione imballaggi"],
    deadlineTexts: ["rinnovo documentazione moca"],
    noteTexts: ["cliente con focus etichettatura"],
    serviceLineTexts: ["Audit packaging", "Supporto MOCA"],
  },
  {
    clientId: "c2",
    clientName: "Ristorante Demo",
    contractTexts: ["manuale haccp e checklist operative"],
    deadlineTexts: [],
    noteTexts: [],
    serviceLineTexts: ["Audit HACCP"],
  },
];

describe("regulatory-bridge", () => {
  it("aggregates deadlines with linked themes and related published assets", () => {
    const model = buildRegulatoryBridge({ clientSignals, snapshot });
    const deadlineItem = model.items.find((item) => item.id === "D01");

    expect(deadlineItem).toBeDefined();
    expect(deadlineItem?.kind).toBe("deadline");
    expect(deadlineItem?.assetStatus).toBe("published");
    expect(deadlineItem?.modules).toContain("documents");
    expect(deadlineItem?.recommendedActions).toContain("Aprire task");
  });

  it("matches impacted clients using contract, service line and deadline signals", () => {
    const model = buildRegulatoryBridge({ clientSignals, snapshot });
    const deadlineItem = model.items.find((item) => item.id === "D01");
    const standaloneTheme = model.items.find((item) => item.id === "T02");

    expect(deadlineItem?.impactedClients[0]?.clientName).toBe("Food Packaging Spa");
    expect(deadlineItem?.impactedClients[0]?.reasons[0]).toContain("Contratto");
    expect(standaloneTheme?.impactedClients[0]?.clientName).toBe("Ristorante Demo");
  });
});
