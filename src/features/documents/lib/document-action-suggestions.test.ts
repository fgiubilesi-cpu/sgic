import { describe, expect, it } from "vitest";

import {
  buildDocumentActionSuggestions,
  extractDocumentIntakeProposal,
} from "@/features/documents/lib/document-action-suggestions";

describe("document-action-suggestions", () => {
  it("extracts a valid proposal from payload objects", () => {
    const proposal = extractDocumentIntakeProposal({
      proposal: {
        confidence: "high",
        parser: "test",
        summary: "Serve follow-up",
        deadline: {
          due_date: "2026-04-15",
          title: "Rinnovo contratto",
        },
      },
    });

    expect(proposal).toMatchObject({
      confidence: "high",
      parser: "test",
      summary: "Serve follow-up",
    });
  });

  it("builds review-first suggestions and warns when client context is missing", () => {
    const suggestions = buildDocumentActionSuggestions({
      document: {
        category: "Contract",
        client_id: null,
        expiry_date: "2026-05-01",
        ingestion_status: "review_required",
        linked_entity_count: 0,
        title: "Contratto quadro",
      },
      proposal: {
        confidence: "high",
        contract: {
          contract_type: "Consulenza HACCP",
          renewal_date: "2026-05-01",
        },
        deadline: {
          due_date: "2026-04-15",
          title: "Rinnovo",
        },
        parser: "manual",
        service_lines: [{ title: "Audit trimestrale" }],
        summary: "Serve un follow-up commerciale e operativo.",
      },
    });

    expect(suggestions.map((suggestion) => suggestion.id)).toEqual([
      "contract",
      "service-lines",
      "deadline",
      "followup",
    ]);
    expect(suggestions.every((suggestion) => suggestion.status === "needs_context")).toBe(true);
    expect(suggestions[0].description).toContain("Collega prima un cliente");
  });
});
