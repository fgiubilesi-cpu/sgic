import { NextRequest, NextResponse } from "next/server";
import { searchKnowledgeBase } from "@/features/knowledge/lib/knowledge-search";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get("q") ?? "";
  const clientId = searchParams.get("clientId");
  const locationId = searchParams.get("locationId");
  const scope = searchParams.get("scope") === "normative" ? "normative" : "all";
  const rawLimit = Number(searchParams.get("limit") ?? "5");
  const limit = Number.isFinite(rawLimit) ? rawLimit : 5;

  if (query.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchKnowledgeBase(query, {
    clientId,
    limit,
    locationId,
    scope,
  });

  return NextResponse.json({ results });
}
