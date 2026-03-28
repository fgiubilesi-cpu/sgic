export type RegulatoryModule =
  | "audits"
  | "clients"
  | "deadlines"
  | "documents"
  | "quality"
  | "training";

export type RegulatoryAssetStatus = "draft" | "none" | "published" | "ready";

export interface RegulatoryRepoRef {
  path: string;
  repo: "ga-content" | "gea-kb" | "sgic";
}

export interface RegulatoryThemeSnapshot {
  content_streams: string[];
  id: string;
  match_keywords?: string[];
  pillar?: string;
  recommended_actions?: string[];
  related_deadline_ids?: string[];
  sgic_modules?: string[];
  sources?: RegulatoryRepoRef[];
  status: "archived" | "draft" | "idea" | "published" | "ready";
  title: string;
}

export interface RegulatoryDeadlineSnapshot {
  effective_date: string;
  id: string;
  jurisdiction: string;
  match_keywords?: string[];
  obligation_type?: string;
  recommended_actions?: string[];
  related_theme_ids?: string[];
  sgic_modules?: string[];
  sources?: RegulatoryRepoRef[];
  status: "active" | "deprecated" | "upcoming";
  title: string;
}

export interface RegulatoryContentAssetSnapshot {
  channel: string;
  published_at?: string;
  source: RegulatoryRepoRef;
  status: "draft" | "published" | "ready";
  theme_id: string;
}

export interface RegulatorySnapshot {
  content_assets: RegulatoryContentAssetSnapshot[];
  deadlines: RegulatoryDeadlineSnapshot[];
  generated_at: string;
  themes: RegulatoryThemeSnapshot[];
  version: string;
}

export interface RegulatoryClientSignalSource {
  clientId: string;
  clientName: string;
  contractTexts: string[];
  deadlineTexts: string[];
  noteTexts: string[];
  serviceLineTexts: string[];
}

export interface RegulatoryImpactedClient {
  clientId: string;
  clientName: string;
  reasons: string[];
  score: number;
}

export interface RegulatoryBridgeItem {
  assetCount: number;
  assetStatus: RegulatoryAssetStatus;
  contentStreams: string[];
  effectiveDate: string | null;
  id: string;
  impactedClients: RegulatoryImpactedClient[];
  jurisdiction: string | null;
  kind: "deadline" | "theme";
  matchKeywords: string[];
  modules: RegulatoryModule[];
  primaryHref: string;
  recommendedActions: string[];
  relatedThemeIds: string[];
  sourceRefs: RegulatoryRepoRef[];
  status: string;
  title: string;
}

export interface RegulatoryBridgeModel {
  items: RegulatoryBridgeItem[];
  snapshotMeta: {
    generatedAt: string;
    publishedAssets: number;
    totalDeadlines: number;
    totalThemes: number;
    version: string;
  };
}

const moduleHref: Record<RegulatoryModule, string> = {
  audits: "/audits",
  clients: "/clients",
  deadlines: "/deadlines",
  documents: "/documents",
  quality: "/non-conformities",
  training: "/training",
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function toModules(values: string[] | undefined): RegulatoryModule[] {
  return uniqueStrings(
    (values ?? []).filter((value): value is RegulatoryModule =>
      ["audits", "clients", "deadlines", "documents", "quality", "training"].includes(
        value
      )
    )
  ) as RegulatoryModule[];
}

function getAssetStatus(
  assets: RegulatoryContentAssetSnapshot[]
): RegulatoryAssetStatus {
  if (assets.some((asset) => asset.status === "published")) {
    return "published";
  }

  if (assets.some((asset) => asset.status === "ready")) {
    return "ready";
  }

  if (assets.some((asset) => asset.status === "draft")) {
    return "draft";
  }

  return "none";
}

function getPrimaryHref(modules: RegulatoryModule[]) {
  return moduleHref[modules[0] ?? "clients"];
}

function buildImpactedClients(
  clients: RegulatoryClientSignalSource[],
  keywords: string[]
): RegulatoryImpactedClient[] {
  const normalizedKeywords = uniqueStrings(keywords.map(normalizeText)).filter(
    (keyword) => keyword.length >= 3
  );

  if (normalizedKeywords.length === 0) {
    return [];
  }

  const impacted = clients
    .map((client) => {
      const reasons: string[] = [];
      let score = 0;

      for (const keyword of normalizedKeywords) {
        const contractHit = client.contractTexts.find((text) =>
          normalizeText(text).includes(keyword)
        );
        if (contractHit) {
          score += 3;
          reasons.push(`Contratto: ${contractHit}`);
        }

        const serviceLineHit = client.serviceLineTexts.find((text) =>
          normalizeText(text).includes(keyword)
        );
        if (serviceLineHit) {
          score += 4;
          reasons.push(`Service line: ${serviceLineHit}`);
        }

        const deadlineHit = client.deadlineTexts.find((text) =>
          normalizeText(text).includes(keyword)
        );
        if (deadlineHit) {
          score += 5;
          reasons.push(`Scadenza: ${deadlineHit}`);
        }

        const noteHit = client.noteTexts.find((text) =>
          normalizeText(text).includes(keyword)
        );
        if (noteHit) {
          score += 1;
          reasons.push(`Contesto cliente: ${noteHit}`);
        }
      }

      if (score === 0) {
        return null;
      }

      return {
        clientId: client.clientId,
        clientName: client.clientName,
        reasons: uniqueStrings(reasons).slice(0, 3),
        score,
      };
    })
    .filter(
      (client): client is RegulatoryImpactedClient => client !== null
    )
    .sort((left, right) => right.score - left.score || left.clientName.localeCompare(right.clientName, "it"));

  return impacted.slice(0, 6);
}

export function buildRegulatoryBridge(input: {
  clientSignals: RegulatoryClientSignalSource[];
  snapshot: RegulatorySnapshot;
}): RegulatoryBridgeModel {
  const themeById = new Map(
    input.snapshot.themes.map((theme) => [theme.id, theme])
  );
  const assetsByThemeId = new Map<string, RegulatoryContentAssetSnapshot[]>();

  for (const asset of input.snapshot.content_assets) {
    const current = assetsByThemeId.get(asset.theme_id) ?? [];
    current.push(asset);
    assetsByThemeId.set(asset.theme_id, current);
  }

  const linkedThemeIds = new Set(
    input.snapshot.deadlines.flatMap((deadline) => deadline.related_theme_ids ?? [])
  );
  for (const theme of input.snapshot.themes) {
    for (const deadlineId of theme.related_deadline_ids ?? []) {
      const deadline = input.snapshot.deadlines.find((item) => item.id === deadlineId);
      for (const relatedThemeId of deadline?.related_theme_ids ?? []) {
        linkedThemeIds.add(relatedThemeId);
      }
    }
  }

  const items: RegulatoryBridgeItem[] = [];

  for (const deadline of input.snapshot.deadlines) {
    const relatedThemes = (deadline.related_theme_ids ?? [])
      .map((themeId) => themeById.get(themeId))
      .filter((theme): theme is RegulatoryThemeSnapshot => Boolean(theme));
    const relatedAssets = relatedThemes.flatMap(
      (theme) => assetsByThemeId.get(theme.id) ?? []
    );
    const modules = uniqueStrings([
      ...toModules(deadline.sgic_modules),
      ...relatedThemes.flatMap((theme) => toModules(theme.sgic_modules)),
    ]) as RegulatoryModule[];
    const matchKeywords = uniqueStrings([
      ...(deadline.match_keywords ?? []),
      ...relatedThemes.flatMap((theme) => theme.match_keywords ?? []),
    ]);
    const recommendedActions = uniqueStrings([
      ...(deadline.recommended_actions ?? []),
      ...relatedThemes.flatMap((theme) => theme.recommended_actions ?? []),
    ]);
    const sourceRefs = uniqueStrings([
      ...(deadline.sources ?? []).map((source) => `${source.repo}:${source.path}`),
      ...relatedThemes.flatMap((theme) =>
        (theme.sources ?? []).map((source) => `${source.repo}:${source.path}`)
      ),
      ...relatedAssets.map((asset) => `${asset.source.repo}:${asset.source.path}`),
    ]).map((ref) => {
      const [repo, ...pathParts] = ref.split(":");
      return {
        path: pathParts.join(":"),
        repo: repo as RegulatoryRepoRef["repo"],
      };
    });

    items.push({
      assetCount: relatedAssets.length,
      assetStatus: getAssetStatus(relatedAssets),
      contentStreams: uniqueStrings(
        relatedThemes.flatMap((theme) => theme.content_streams)
      ),
      effectiveDate: deadline.effective_date,
      id: deadline.id,
      impactedClients: buildImpactedClients(input.clientSignals, matchKeywords),
      jurisdiction: deadline.jurisdiction,
      kind: "deadline",
      matchKeywords,
      modules: modules.length > 0 ? modules : ["clients"],
      primaryHref: getPrimaryHref(modules.length > 0 ? modules : ["clients"]),
      recommendedActions,
      relatedThemeIds: relatedThemes.map((theme) => theme.id),
      sourceRefs,
      status: deadline.status,
      title: deadline.title,
    });
  }

  for (const theme of input.snapshot.themes) {
    if (linkedThemeIds.has(theme.id) || (theme.related_deadline_ids?.length ?? 0) > 0) {
      continue;
    }

    const assets = assetsByThemeId.get(theme.id) ?? [];
    const modules = toModules(theme.sgic_modules);
    const matchKeywords = uniqueStrings(theme.match_keywords ?? []);

    items.push({
      assetCount: assets.length,
      assetStatus: getAssetStatus(assets),
      contentStreams: theme.content_streams,
      effectiveDate: null,
      id: theme.id,
      impactedClients: buildImpactedClients(input.clientSignals, matchKeywords),
      jurisdiction: null,
      kind: "theme",
      matchKeywords,
      modules: modules.length > 0 ? modules : ["clients"],
      primaryHref: getPrimaryHref(modules.length > 0 ? modules : ["clients"]),
      recommendedActions: uniqueStrings(theme.recommended_actions ?? []),
      relatedThemeIds: [theme.id],
      sourceRefs: uniqueStrings(
        [
          ...(theme.sources ?? []).map((source) => `${source.repo}:${source.path}`),
          ...assets.map((asset) => `${asset.source.repo}:${asset.source.path}`),
        ]
      ).map((ref) => {
        const [repo, ...pathParts] = ref.split(":");
        return {
          path: pathParts.join(":"),
          repo: repo as RegulatoryRepoRef["repo"],
        };
      }),
      status: theme.status,
      title: theme.title,
    });
  }

  items.sort((left, right) => {
    if (left.kind !== right.kind) {
      return left.kind === "deadline" ? -1 : 1;
    }

    if (left.effectiveDate && right.effectiveDate) {
      return (
        new Date(left.effectiveDate).getTime() - new Date(right.effectiveDate).getTime()
      );
    }

    return left.title.localeCompare(right.title, "it");
  });

  return {
    items,
    snapshotMeta: {
      generatedAt: input.snapshot.generated_at,
      publishedAssets: input.snapshot.content_assets.filter(
        (asset) => asset.status === "published"
      ).length,
      totalDeadlines: input.snapshot.deadlines.length,
      totalThemes: input.snapshot.themes.length,
      version: input.snapshot.version,
    },
  };
}
