import { describe, expect, it } from "vitest";

import {
  buildDocumentDetailListItem,
  formatDocumentEntityConfidence,
  formatDocumentReviewAction,
  getDocumentExpiryInfo,
  getDocumentIngestionLabel,
  getDocumentStatusLabel,
} from "@/features/documents/lib/document-detail-view";

describe("document-detail-view", () => {
  it("formats labels and expiry state coherently", () => {
    expect(getDocumentStatusLabel("published")).toBe("Pubblicato");
    expect(getDocumentIngestionLabel("review_required")).toBe("Da validare");
    expect(formatDocumentReviewAction("apply_to_workspace")).toBe("Applicato al workspace");
    expect(
      getDocumentExpiryInfo("2026-03-10", new Date("2026-03-28T10:00:00.000Z")).label
    ).toBe("Scaduto");
    expect(formatDocumentEntityConfidence("medium").label).toBe("Media");
  });

  it("builds a DocumentListItem-compatible view model", () => {
    const view = buildDocumentDetailListItem({
      clientName: "Cliente Demo",
      document: {
        category: "policy",
        client_id: "client-1",
        expiry_date: null,
        ingestion_status: null,
        location_id: null,
        personnel_id: null,
        status: "draft",
        storage_path: "/documents/demo.pdf",
        title: "Documento demo",
      },
      entitiesCount: 2,
      locationName: null,
      personnelName: null,
      reviewsCount: 1,
      reviewsLastAction: "save_review",
      reviewsLastAt: "2026-03-28T10:00:00.000Z",
      versionsCount: 0,
    });

    expect(view.client_name).toBe("Cliente Demo");
    expect(view.version_count).toBe(1);
    expect(view.linked_entity_count).toBe(2);
    expect(view.last_review_action).toBe("save_review");
  });
});
