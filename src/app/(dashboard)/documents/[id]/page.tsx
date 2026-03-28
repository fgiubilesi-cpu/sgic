import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import Link from "next/link";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import { getClientOptions } from "@/features/clients/queries/get-client-options";
import { getPersonnelList } from "@/features/personnel/queries/get-personnel";
import { ManageDocumentSheet } from "@/features/documents/components/manage-document-sheet";
import { DocumentGovernanceDialog } from "@/features/documents/components/document-governance-dialog";
import { DocumentActionSuggestionsCard } from "@/features/documents/components/document-action-suggestions-card";
import {
  buildDocumentActionSuggestions,
  extractDocumentIntakeProposal,
} from "@/features/documents/lib/document-action-suggestions";
import {
  buildDocumentDetailListItem,
  formatDocumentEntityConfidence,
  formatDocumentReviewAction,
  getDocumentExpiryInfo,
  getDocumentIngestionLabel,
  getDocumentStatusLabel,
  getDocumentStatusTone,
} from "@/features/documents/lib/document-detail-view";
import type { DocumentListItem } from "@/features/documents/queries/get-documents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Calendar,
  Building2,
  MapPin,
  User,
  FileText,
  Download,
  Tag,
  Clock,
  History,
  Link2,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const ctx = await getOrganizationContext();
  if (!ctx) redirect("/login");

  const { data: document, error: docError } = await ctx.supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .eq("organization_id", ctx.organizationId)
    .single();

  if (docError || !document) notFound();

  const [
    { data: versions },
    { data: ingestions },
    { data: reviews },
    { data: entities },
    clientOptions,
    personnelOptions,
  ] = await Promise.all([
    ctx.supabase
      .from("document_versions")
      .select("id, created_at")
      .eq("organization_id", ctx.organizationId)
      .eq("document_id", id)
      .order("created_at", { ascending: false }),
    ctx.supabase
      .from("document_ingestions")
      .select(
        "id, parser_type, status, extracted_text, error_message, created_at"
      )
      .eq("organization_id", ctx.organizationId)
      .eq("document_id", id)
      .order("created_at", { ascending: false }),
    ctx.supabase
      .from("document_extraction_reviews")
      .select(
        "id, status, review_action, reviewed_payload, reviewer_notes, reviewed_at, created_at"
      )
      .eq("organization_id", ctx.organizationId)
      .eq("document_id", id)
      .order("created_at", { ascending: false }),
    ctx.supabase
      .from("document_entities")
      .select(
        "id, entity_type, linked_table, linked_record_id, confidence, created_at"
      )
      .eq("organization_id", ctx.organizationId)
      .eq("document_id", id)
      .order("created_at", { ascending: false }),
    getClientOptions(ctx.organizationId),
    getPersonnelList(ctx.organizationId),
  ]);

  // Resolve names
  const [clientName, locationName, personnelName] = await Promise.all([
    document.client_id
      ? ctx.supabase
          .from("clients")
          .select("name")
          .eq("id", document.client_id)
          .is("deleted_at", null)
          .single()
          .then((r) => r.data?.name ?? null)
      : null,
    document.location_id
      ? ctx.supabase
          .from("locations")
          .select("name")
          .eq("id", document.location_id)
          .single()
          .then((r) => r.data?.name ?? null)
      : null,
    document.personnel_id
      ? ctx.supabase
          .from("personnel")
          .select("first_name, last_name")
          .eq("id", document.personnel_id)
          .single()
          .then(
            (r) =>
              r.data
                ? `${r.data.first_name} ${r.data.last_name}`.trim()
                : null
          )
      : null,
  ]);

  const docListItem: DocumentListItem = buildDocumentDetailListItem({
    clientName,
    document,
    entitiesCount: (entities ?? []).length,
    locationName,
    personnelName,
    reviewsCount: (reviews ?? []).length,
    reviewsLastAction: (reviews ?? [])[0]?.review_action ?? null,
    reviewsLastAt: (reviews ?? [])[0]?.reviewed_at ?? null,
    versionsCount: (versions ?? []).length,
  });

  // Generate signed URL for download
  let downloadUrl: string | null = null;
  if (document.storage_path) {
    const { data: signedData } = await ctx.supabase.storage
      .from("documents")
      .createSignedUrl(document.storage_path, 60 * 60 * 6);
    downloadUrl = signedData?.signedUrl ?? null;
  }

  const latestIngestion = (ingestions ?? [])[0] ?? null;
  const extractedText = latestIngestion?.extracted_text ?? null;
  const latestReview = (reviews ?? [])[0] ?? null;
  const latestProposal =
    extractDocumentIntakeProposal(latestReview?.reviewed_payload) ??
    extractDocumentIntakeProposal(document.extracted_payload);
  const actionSuggestions = buildDocumentActionSuggestions({
    document: {
      category: document.category ?? null,
      client_id: document.client_id ?? null,
      expiry_date: document.expiry_date ?? null,
      ingestion_status: document.ingestion_status ?? null,
      linked_entity_count: (entities ?? []).length,
      title: document.title ?? null,
    },
    proposal: latestProposal,
  });

  const expiry = getDocumentExpiryInfo(document.expiry_date);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/documents">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {document.title || "Documento senza titolo"}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-muted-foreground">
              <Badge variant="outline" className={getDocumentStatusTone(document.status)}>
                {getDocumentStatusLabel(document.status)}
              </Badge>
              <Badge
                variant="outline"
                className="border-zinc-200 bg-zinc-50 text-zinc-600"
              >
                {document.category ?? "Non categorizzato"}
              </Badge>
              <Badge
                variant="outline"
                className="border-zinc-200 bg-zinc-50 text-zinc-600"
              >
                {getDocumentIngestionLabel(document.ingestion_status)}
              </Badge>
              {document.version && (
                <span className="text-xs text-zinc-400">
                  v{document.version}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {downloadUrl && (
            <Button asChild variant="outline" size="sm">
              <a href={downloadUrl} target="_blank" rel="noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Scarica
              </a>
            </Button>
          )}
          <DocumentGovernanceDialog document={docListItem} />
          <ManageDocumentSheet
            clientOptions={clientOptions}
            document={docListItem}
            personnelOptions={personnelOptions}
          />
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="border-zinc-200 bg-white/90 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Scadenza
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-lg font-semibold ${expiry.tone}`}>
              {document.expiry_date
                ? format(new Date(document.expiry_date), "dd MMM yyyy", {
                    locale: it,
                  })
                : "—"}
            </div>
            <div className={`text-xs ${expiry.tone}`}>{expiry.label}</div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200 bg-white/90 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Versioni
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {(versions ?? []).length || 1}
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200 bg-white/90 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {(reviews ?? []).length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200 bg-white/90 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Entità collegate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {(entities ?? []).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <DocumentActionSuggestionsCard
        document={docListItem}
        linkedEntityCount={(entities ?? []).length}
        suggestions={actionSuggestions}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Info Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Informazioni</CardTitle>
            <CardDescription>
              Metadati e collegamenti del documento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {document.description && (
              <div className="text-sm text-zinc-600">
                {document.description}
              </div>
            )}
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-zinc-400" />
              <div className="flex flex-col">
                <span className="text-xs text-zinc-500 uppercase font-semibold">
                  Categoria
                </span>
                <span>{document.category ?? "—"}</span>
              </div>
            </div>
            {clientName && (
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-zinc-400" />
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-500 uppercase font-semibold">
                    Cliente
                  </span>
                  <Link
                    href={`/clients/${document.client_id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {clientName}
                  </Link>
                </div>
              </div>
            )}
            {locationName && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-zinc-400" />
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-500 uppercase font-semibold">
                    Sede
                  </span>
                  <span>{locationName}</span>
                </div>
              </div>
            )}
            {personnelName && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-zinc-400" />
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-500 uppercase font-semibold">
                    Collaboratore
                  </span>
                  <Link
                    href={`/personnel/${document.personnel_id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {personnelName}
                  </Link>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-zinc-400" />
              <div className="flex flex-col">
                <span className="text-xs text-zinc-500 uppercase font-semibold">
                  Emissione
                </span>
                <span>
                  {document.issue_date
                    ? format(new Date(document.issue_date), "dd MMMM yyyy", {
                        locale: it,
                      })
                    : "—"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-zinc-400" />
              <div className="flex flex-col">
                <span className="text-xs text-zinc-500 uppercase font-semibold">
                  Scadenza
                </span>
                <span className={expiry.tone}>
                  {document.expiry_date
                    ? format(new Date(document.expiry_date), "dd MMMM yyyy", {
                        locale: it,
                      })
                    : "—"}
                </span>
              </div>
            </div>
            {document.file_name && (
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-zinc-400" />
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-500 uppercase font-semibold">
                    File
                  </span>
                  <span className="text-sm truncate max-w-[200px]">
                    {document.file_name}
                  </span>
                  {document.file_size_bytes && (
                    <span className="text-xs text-zinc-400">
                      {(document.file_size_bytes / 1024).toFixed(0)} KB
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Versions + Reviews */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5 text-zinc-400" />
              Storico Versioni e Review
            </CardTitle>
            <CardDescription>
              Cronologia delle revisioni e delle validazioni del documento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Versions */}
            {(versions ?? []).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-700 mb-2">
                  Versioni ({(versions ?? []).length})
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Data creazione</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(versions ?? []).map((v, i) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">
                          v{(versions ?? []).length - i}
                        </TableCell>
                        <TableCell>
                          {v.created_at
                            ? format(
                                new Date(v.created_at),
                                "dd MMM yyyy HH:mm",
                                { locale: it }
                              )
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Reviews */}
            {(reviews ?? []).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-700 mb-2">
                  Review ({(reviews ?? []).length})
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Azione</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(reviews ?? []).map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">
                          {formatDocumentReviewAction(r.review_action)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-zinc-500">
                          {r.reviewer_notes || "—"}
                        </TableCell>
                        <TableCell>
                          {r.reviewed_at
                            ? format(
                                new Date(r.reviewed_at),
                                "dd MMM yyyy HH:mm",
                                { locale: it }
                              )
                            : r.created_at
                              ? format(
                                  new Date(r.created_at),
                                  "dd MMM yyyy HH:mm",
                                  { locale: it }
                                )
                              : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {(versions ?? []).length === 0 && (reviews ?? []).length === 0 && (
              <p className="text-sm text-zinc-500 py-4 text-center">
                Nessuna versione o review registrata.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Linked Entities */}
      {(entities ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Link2 className="h-5 w-5 text-zinc-400" />
              Entità collegate
            </CardTitle>
            <CardDescription>
              Elementi del workspace creati o aggiornati a partire da questo
              documento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Tabella</TableHead>
                  <TableHead>Confidenza</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(entities ?? []).map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium capitalize">
                      {e.entity_type.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-500">
                      {e.linked_table?.replace(/_/g, " ") ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={formatDocumentEntityConfidence(e.confidence).className}
                      >
                        {formatDocumentEntityConfidence(e.confidence).label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {e.created_at
                        ? format(new Date(e.created_at), "dd MMM yyyy HH:mm", {
                            locale: it,
                          })
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Extracted Text Preview */}
      {extractedText && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-zinc-400" />
              Testo estratto
            </CardTitle>
            <CardDescription>
              Anteprima del testo estratto dal documento (parser:{" "}
              {latestIngestion?.parser_type ?? "—"}).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="max-h-96 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-700 whitespace-pre-wrap font-mono">
              {extractedText}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
