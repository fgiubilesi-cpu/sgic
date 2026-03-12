import type { DocumentFormInput } from '@/features/documents/schemas/document-schema';

type SupportedDocumentCategory = DocumentFormInput['category'];
type ProposalConfidence = 'low' | 'medium' | 'high';

export interface DocumentProposalSource {
  category: SupportedDocumentCategory | null;
  description?: string | null;
  expiry_date?: string | null;
  extracted_text?: string | null;
  file_name?: string | null;
  issue_date?: string | null;
  title?: string | null;
}

export interface ContractProposal {
  activity_frequency?: string | null;
  contract_type?: string | null;
  end_date?: string | null;
  internal_owner?: string | null;
  notes?: string | null;
  renewal_date?: string | null;
  service_scope?: string | null;
  start_date?: string | null;
}

export interface ContactProposal {
  department?: string | null;
  email?: string | null;
  full_name?: string | null;
  is_primary?: boolean;
  location_hint?: string | null;
  phone?: string | null;
  role?: string | null;
}

export interface DeadlineProposal {
  description?: string | null;
  due_date?: string | null;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  title?: string | null;
}

export interface DocumentIntakeProposal {
  confidence: ProposalConfidence;
  contract?: ContractProposal;
  contacts?: ContactProposal[];
  deadline?: DeadlineProposal;
  manual?: {
    applicable_scope?: string | null;
    owner?: string | null;
    review_date?: string | null;
    revision?: string | null;
  };
  parser: string;
  summary: string;
}

const CATEGORY_KEYWORDS: Array<{ category: SupportedDocumentCategory; keywords: string[] }> = [
  { category: 'Contract', keywords: ['contratto', 'contract', 'accordo'] },
  { category: 'OrgChart', keywords: ['organigramma', 'orgchart', 'org chart'] },
  { category: 'Manual', keywords: ['manuale', 'manual'] },
  { category: 'Procedure', keywords: ['procedura', 'procedure', 'sop'] },
  { category: 'Certificate', keywords: ['certificato', 'certificate', 'iso'] },
  { category: 'Authorization', keywords: ['autorizzazione', 'authorization', 'permesso'] },
  { category: 'Registry', keywords: ['visura', 'registro', 'registry'] },
  { category: 'Report', keywords: ['verbale', 'report', 'relazione'] },
  { category: 'Form', keywords: ['modulo', 'form'] },
];

function cleanupFileName(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^/.]+$/, '');
  return withoutExtension
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function suggestDocumentCategoryFromName(
  fileName: string
): SupportedDocumentCategory | null {
  const lowerName = fileName.toLowerCase();
  for (const config of CATEGORY_KEYWORDS) {
    if (config.keywords.some((keyword) => lowerName.includes(keyword))) {
      return config.category;
    }
  }
  return null;
}

export function suggestDocumentTitleFromName(fileName: string) {
  const title = cleanupFileName(fileName);
  if (!title) return 'Documento';
  return title.charAt(0).toUpperCase() + title.slice(1);
}

export function buildInitialExtractionPayload(options: {
  category: SupportedDocumentCategory;
  file: File;
  originalFileName: string;
}) {
  const { category, file, originalFileName } = options;
  const nowIso = new Date().toISOString();
  const title = suggestDocumentTitleFromName(originalFileName);
  const proposal = buildIntakeProposalFromDocument({
    category,
    file_name: originalFileName,
    title,
  });

  return {
    category_suggested: category,
    source: 'filename_heuristics_v1',
    extracted_at: nowIso,
    proposal,
    file: {
      name: originalFileName,
      size: file.size,
      mime_type: file.type || null,
      last_modified: new Date(file.lastModified).toISOString(),
    },
    confidence: {
      category: category === 'Other' ? 'low' : 'medium',
      title: 'medium',
    },
  };
}

export function sanitizeFileName(fileName: string) {
  return fileName
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function firstRegexGroup(input: string, regex: RegExp) {
  const match = input.match(regex);
  return match?.[1]?.trim() ?? null;
}

function parseDateCandidate(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) {
    return direct.toISOString().slice(0, 10);
  }

  const ddmmyyyy = trimmed.match(/(\d{2})[\/.-](\d{2})[\/.-](\d{4})/);
  if (ddmmyyyy) {
    const [, dd, mm, yyyy] = ddmmyyyy;
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
}

function firstDateInText(input: string) {
  const isoLike = input.match(/\b\d{4}-\d{2}-\d{2}\b/);
  if (isoLike?.[0]) return parseDateCandidate(isoLike[0]);
  const itLike = input.match(/\b\d{2}[\/.-]\d{2}[\/.-]\d{4}\b/);
  if (itLike?.[0]) return parseDateCandidate(itLike[0]);
  return null;
}

function firstLabeledValue(input: string, labels: string[]) {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`${escaped}\\s*[:\\-]?\\s*([^\\n;|]+)`, 'i');
    const match = input.match(regex);
    if (match?.[1]?.trim()) {
      return match[1].trim();
    }
  }

  return null;
}

function firstLabeledDate(input: string, labels: string[]) {
  const value = firstLabeledValue(input, labels);
  return parseDateCandidate(value) ?? firstDateInText(value ?? '');
}

function excerptAroundKeyword(input: string, keywords: string[]) {
  const lower = input.toLowerCase();
  for (const keyword of keywords) {
    const index = lower.indexOf(keyword.toLowerCase());
    if (index >= 0) {
      const excerpt = input.slice(index, index + 240).trim();
      if (excerpt) return excerpt;
    }
  }
  return null;
}

function compact(input?: string | null) {
  return (input ?? '').trim();
}

function deriveContractType(text: string) {
  if (text.includes('annuale')) return 'annuale';
  if (text.includes('biennale')) return 'biennale';
  if (text.includes('triennale')) return 'triennale';
  if (text.includes('fornitura')) return 'fornitura';
  return 'standard';
}

function deriveFrequency(text: string) {
  if (text.includes('mensile')) return 'mensile';
  if (text.includes('trimestrale')) return 'trimestrale';
  if (text.includes('semestrale')) return 'semestrale';
  if (text.includes('annuale')) return 'annuale';
  return null;
}

function derivePriorityByDate(dateIso: string | null | undefined): DeadlineProposal['priority'] {
  if (!dateIso) return 'medium';
  const due = new Date(dateIso);
  if (Number.isNaN(due.getTime())) return 'medium';
  const today = new Date();
  const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'critical';
  if (diffDays <= 14) return 'high';
  if (diffDays <= 45) return 'medium';
  return 'low';
}

export function buildIntakeProposalFromDocument(source: DocumentProposalSource): DocumentIntakeProposal {
  const title = compact(source.title) || suggestDocumentTitleFromName(source.file_name || 'Documento');
  const description = compact(source.description);
  const extractedText = compact(source.extracted_text);
  const fileName = compact(source.file_name);
  const category = source.category ?? 'Other';
  const fullText = `${title}\n${description}\n${fileName}\n${extractedText}`.trim();
  const issueDate =
    parseDateCandidate(source.issue_date) ??
    firstLabeledDate(fullText, ['data inizio', 'decorrenza', 'inizio servizio', 'data emissione']) ??
    firstDateInText(fullText);
  const expiryDate = parseDateCandidate(source.expiry_date);
  const lower = fullText.toLowerCase();
  const summaryBase =
    extractedText?.slice(0, 280) ??
    description ??
    `Documento classificato come ${category}`;

  const payload: DocumentIntakeProposal = {
    confidence: extractedText ? 'high' : category === 'Other' ? 'low' : 'medium',
    parser: 'heuristics_v2',
    summary: summaryBase,
  };

  if (category === 'Contract') {
    const startDate =
      firstLabeledDate(fullText, ['data inizio', 'decorrenza', 'inizio servizio']) ?? issueDate;
    const renewalDate =
      firstLabeledDate(fullText, ['data rinnovo', 'rinnovo', 'renewal']) ?? expiryDate;
    const endDate =
      firstLabeledDate(fullText, ['data scadenza', 'scadenza', 'termine contratto', 'fine contratto']) ??
      renewalDate ??
      expiryDate;
    const serviceScope =
      firstLabeledValue(fullText, ['oggetto', 'servizi inclusi', 'servizio', 'attivita', 'attività']) ??
      excerptAroundKeyword(fullText, ['oggetto', 'servizi', 'attività', 'attivita']) ??
      description ??
      null;

    payload.contract = {
      contract_type: deriveContractType(lower),
      start_date: startDate,
      renewal_date: renewalDate,
      end_date: endDate,
      activity_frequency:
        firstLabeledValue(fullText, ['frequenza', 'cadenza', 'periodicita', 'periodicità']) ??
        deriveFrequency(lower),
      service_scope: serviceScope,
      internal_owner:
        firstLabeledValue(fullText, ['referente interno', 'owner interno', 'owner']) ??
        firstRegexGroup(description, /owner[:\s]+([^,;\n]+)/i),
      notes: extractedText?.slice(0, 500) ?? description ?? null,
    };
  }

  if (category === 'OrgChart') {
    const email = firstRegexGroup(description, /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i);
    const phone = firstRegexGroup(description, /(\+?\d[\d\s().-]{6,}\d)/);
    payload.contacts = [
      {
        full_name: firstRegexGroup(title, /(?:organigramma|org\s*chart)\s*[-:–]?\s*(.+)$/i) || null,
        role: firstRegexGroup(description, /ruolo[:\s]+([^,;\n]+)/i),
        department: firstRegexGroup(description, /reparto[:\s]+([^,;\n]+)/i),
        email,
        phone,
        location_hint: firstRegexGroup(description, /sede[:\s]+([^,;\n]+)/i),
        is_primary: true,
      },
    ];
  }

  if (category === 'Manual' || category === 'Procedure' || category === 'Instruction' || category === 'Form') {
    payload.manual = {
      revision: firstRegexGroup(`${title} ${description}`, /\b(?:rev\.?|versione)\s*([A-Z0-9._-]+)/i),
      review_date: expiryDate,
      owner: firstRegexGroup(description, /owner[:\s]+([^,;\n]+)/i),
      applicable_scope: description || null,
    };
    if (expiryDate) {
      payload.deadline = {
        due_date: expiryDate,
        priority: derivePriorityByDate(expiryDate),
        title: `Revisione ${title}`,
        description: 'Scadenza revisione documento',
      };
    }
  }

  if (category === 'Certificate' || category === 'Authorization') {
    const dueDate = expiryDate ?? issueDate;
    payload.deadline = {
      due_date: dueDate,
      priority: derivePriorityByDate(dueDate),
      title: `Scadenza ${title}`,
      description:
        category === 'Certificate'
          ? 'Monitorare rinnovo certificato'
          : 'Monitorare rinnovo autorizzazione',
    };
  }

  if (category === 'Registry' || category === 'Report' || category === 'Other') {
    if (expiryDate) {
      payload.deadline = {
        due_date: expiryDate,
        priority: derivePriorityByDate(expiryDate),
        title: `Follow-up ${title}`,
        description: description || 'Verifica follow-up documento',
      };
    }
  }

  return payload;
}
