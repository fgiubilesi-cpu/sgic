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
  client_references?: string | null;
  contract_type?: string | null;
  duration_terms?: string | null;
  end_date?: string | null;
  exercised_activity?: string | null;
  internal_owner?: string | null;
  issue_date?: string | null;
  notes?: string | null;
  protocol_code?: string | null;
  renewal_date?: string | null;
  service_scope?: string | null;
  start_date?: string | null;
  supervisor_name?: string | null;
  validity_terms?: string | null;
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

export interface ServiceLineProposal {
  billing_phase?: string | null;
  code?: string | null;
  frequency_label?: string | null;
  is_recurring?: boolean;
  notes?: string | null;
  quantity?: string | null;
  section?: string | null;
  title?: string | null;
  total_price?: string | null;
  unit?: string | null;
  unit_price?: string | null;
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
  service_lines?: ServiceLineProposal[];
  summary: string;
}

const CATEGORY_KEYWORDS: Array<{ category: SupportedDocumentCategory; keywords: string[] }> = [
  { category: 'Contract', keywords: ['contratto', 'contract', 'accordo', 'offerta', 'progetto di consulenza', 'prospetto costi'] },
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

  const ddmmyy = trimmed.match(/(\d{2})[\/.-](\d{2})[\/.-](\d{2})\b/);
  if (ddmmyy) {
    const [, dd, mm, yy] = ddmmyy;
    const fullYear = Number.parseInt(yy, 10) >= 70 ? `19${yy}` : `20${yy}`;
    return `${fullYear}-${mm}-${dd}`;
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

function extractSectionAfterLabels(input: string, labels: string[]) {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(
      `${escaped}\\s*[:\\-]?\\s*([\\s\\S]{0,400}?)(?:\\n\\s*\\n|\\n[A-Z][^\\n]{0,60}:|$)`,
      'i'
    );
    const match = input.match(regex);
    const value = match?.[1]?.replace(/\s+/g, ' ').trim();
    if (value) return value;
  }

  return null;
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

function normalizeCompactSpaces(input: string) {
  return input.replace(/\s+/g, ' ').trim();
}

function extractLines(input: string) {
  return input
    .split(/\r?\n/)
    .map((line) => normalizeCompactSpaces(line))
    .filter(Boolean);
}

function lineAfterExactLabel(lines: string[], labels: string[]) {
  const normalizedLabels = labels.map((label) => label.toLowerCase());
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (normalizedLabels.includes(lines[index].toLowerCase())) {
      return lines[index + 1] ?? null;
    }
  }
  return null;
}

function lineMatching(lines: string[], matcher: RegExp) {
  return lines.find((line) => matcher.test(line)) ?? null;
}

function lineIndexMatching(lines: string[], matcher: RegExp) {
  return lines.findIndex((line) => matcher.test(line));
}

function exactLineValue(lines: string[], labels: string[]) {
  return lineAfterExactLabel(lines, labels);
}

function firstSentenceContaining(input: string, matcher: RegExp) {
  const sentences = input
    .split(/(?<=[.;])\s+|\n+/)
    .map((sentence) => normalizeCompactSpaces(sentence))
    .filter(Boolean);

  return sentences.find((sentence) => matcher.test(sentence)) ?? null;
}

function normalizeContractTypeValue(value: string | null | undefined) {
  const compacted = cleanQuotedLabelValue(value);
  if (!compacted) return null;
  return compacted
    .replace(/\s*-\s*tacito\s+rinnovo/i, '')
    .replace(/\s*-\s*\d+\s*gg$/i, '')
    .trim();
}

function extractDurationTermsFromType(typeValue: string | null | undefined) {
  const compacted = compact(typeValue);
  if (!compacted) return null;
  const durationMatch = compacted.match(/-\s*(DURATA\s+.+)$/i);
  return durationMatch?.[1]?.trim() ?? null;
}

function extractValidityTerms(value: string | null | undefined) {
  const compacted = compact(value);
  if (!compacted) return null;
  const tail = compacted.replace(/^\d{2}[\/.-]\d{2}[\/.-]\d{2,4}\s*[-–]?\s*/i, '').trim();
  return tail || null;
}

function extractFrequencyHint(text: string, serviceLines: ServiceLineProposal[]) {
  const explicitHours = text.match(/\b\d+\s*ore\s*\/\s*mese\b/i)?.[0] ?? null;
  const monthly = /corrispettivo\s+forfettario\s+mensile|fatturazione\s+mensile/i.test(text);
  const serviceFrequencies = Array.from(
    new Set(
      serviceLines
        .map((line) => compact(line.frequency_label))
        .filter((value): value is string => Boolean(value))
    )
  );

  if (explicitHours && monthly) return `${explicitHours} · fatturazione mensile`;
  if (explicitHours) return explicitHours;
  if (serviceFrequencies.length > 0) return serviceFrequencies.join(', ');
  if (monthly) return 'mensile';
  return null;
}

function extractTemplateFamily(lines: string[]) {
  if (lineIndexMatching(lines, /^Tipologia progetto$/i) >= 0) return 'ga_contract_v2';
  if (lineIndexMatching(lines, /^Tipologia offerta$/i) >= 0) return 'ga_contract_v1';
  return 'generic';
}

function deriveContractDates(options: {
  durationTerms: string | null;
  explicitEndDate: string | null;
  explicitRenewalDate: string | null;
  issueDate: string | null;
  startDate: string | null;
}) {
  const { durationTerms, explicitEndDate, explicitRenewalDate, issueDate, startDate } = options;
  const baseStartDate = startDate ?? issueDate ?? null;
  const inferredEndDate =
    explicitEndDate ??
    (baseStartDate && durationTerms ? deriveEndDateFromDuration(durationTerms, baseStartDate) : null);
  const tacitRenewal = /tacito\s+rinnovo|tacitamente\s+rinnovato/i.test(durationTerms ?? '');
  const inferredRenewalDate = explicitRenewalDate ?? (tacitRenewal ? inferredEndDate : null);

  return {
    endDate: inferredEndDate,
    renewalDate: inferredRenewalDate,
    startDate: baseStartDate,
  };
}

function cleanQuotedLabelValue(value: string | null | undefined) {
  const compacted = compact(value);
  if (!compacted) return null;
  return compacted
    .replace(/\s*-\s*durata\s+\d+\s+anni?/i, '')
    .replace(/[“”"]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function firstNonEmptyParagraph(input: string, minLength = 24) {
  const paragraphs = input
    .split(/\n\s*\n/)
    .map((paragraph) => normalizeCompactSpaces(paragraph))
    .filter(Boolean);

  return paragraphs.find((paragraph) => paragraph.length >= minLength) ?? null;
}

function bulletListBetweenHeadings(lines: string[], startMatchers: RegExp[], endMatchers: RegExp[]) {
  const startIndex = lines.findIndex((line) => startMatchers.some((matcher) => matcher.test(line)));
  if (startIndex < 0) return [];

  const collected: string[] = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (endMatchers.some((matcher) => matcher.test(line))) break;
    if (
      /^([a-zàèéìòù].{8,}|supporto|monitoraggio|revisione|consulenza|assistenza|formazione|redazione|gestione|verifica|audit)/i.test(
        line
      )
    ) {
      collected.push(line.replace(/^[•\-–]\s*/, '').trim());
    }
  }
  return collected;
}

function sectionBetweenHeadings(lines: string[], startMatchers: RegExp[], endMatchers: RegExp[]) {
  const startIndex = lines.findIndex((line) => startMatchers.some((matcher) => matcher.test(line)));
  if (startIndex < 0) return null;

  const collected: string[] = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (endMatchers.some((matcher) => matcher.test(line))) break;
    collected.push(line);
  }

  const value = collected.join(' ').trim();
  return value || null;
}

function lastSectionBetweenHeadings(lines: string[], startMatchers: RegExp[], endMatchers: RegExp[]) {
  let startIndex = -1;
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (startMatchers.some((matcher) => matcher.test(lines[index]))) {
      startIndex = index;
      break;
    }
  }
  if (startIndex < 0) return null;

  const collected: string[] = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (endMatchers.some((matcher) => matcher.test(line))) break;
    collected.push(line);
  }

  const value = collected.join(' ').trim();
  return value || null;
}

function addMonths(dateIso: string, months: number) {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return null;
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

function deriveEndDateFromDuration(input: string, startDate: string | null | undefined) {
  if (!startDate) return null;

  const durationLine = firstLabeledValue(input, ['durata', 'durata contratto']);
  const source = durationLine ?? excerptAroundKeyword(input, ['durata']) ?? input;
  if (!source) return null;

  const monthsMatch = source.match(/(\d{1,2})\s*mes/i);
  if (monthsMatch) {
    return addMonths(startDate, Number.parseInt(monthsMatch[1], 10));
  }

  const yearsMatch = source.match(/(\d{1,2})\s*ann/i);
  if (yearsMatch) {
    return addMonths(startDate, Number.parseInt(yearsMatch[1], 10) * 12);
  }

  if (source.toLowerCase().includes('annuale')) return addMonths(startDate, 12);
  if (source.toLowerCase().includes('biennale')) return addMonths(startDate, 24);
  if (source.toLowerCase().includes('triennale')) return addMonths(startDate, 36);

  return null;
}

function extractValidityTermsFromCriteria(lines: string[]) {
  const criteriaSection =
    lastSectionBetweenHeadings(
      lines,
      [/^CRITERI GENERALI$/i, /^2\.03\s+CRITERI GENERALI$/i],
      [/^ALLEGATI$/i, /^2\.04\s+ALLEGATI$/i]
    ) ?? null;

  if (!criteriaSection) return null;

  const sentence = firstSentenceContaining(
    criteriaSection,
    /\b(valida|validità)\b.+\b(\d+\s*giorni|\d+\s*gg)\b/i
  );
  if (!sentence) return null;

  const compacted = normalizeCompactSpaces(sentence);
  const shortMatch = compacted.match(/(\d+\s*giorni|\d+\s*gg)/i);
  return shortMatch?.[1]?.trim() ?? compacted;
}

function deriveContractType(text: string) {
  if (text.includes('offerta')) return 'offerta';
  if (text.includes('consulenza')) return 'consulenza';
  if (text.includes('abbonamento')) return 'abbonamento';
  if (text.includes('incarico')) return 'incarico';
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

function normalizeEuroNumber(input: string | null | undefined) {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\s+/g, '').replace(/\./g, '').replace(',', '.').replace(/€/g, '');
}

function deriveLineFrequency(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes('mensile')) return 'mensile';
  if (lower.includes('trimestrale')) return 'trimestrale';
  if (lower.includes('semestrale')) return 'semestrale';
  if (lower.includes('annuale')) return 'annuale';
  if (lower.includes('settiman')) return 'settimanale';
  if (lower.includes('giornal')) return 'giornaliera';
  return null;
}

function normalizeBillingPhase(section: string | null | undefined) {
  const lower = compact(section).toLowerCase();
  if (!lower) return null;
  if (lower.includes('primo anno')) return 'Primo anno';
  if (lower.includes('anni successivi')) return 'Anni successivi';
  if (lower.includes('firma')) return 'Alla firma del contratto';
  if (lower.includes('fatturazione')) return 'Fatturazione';
  if (lower.includes('costi accessori')) return 'Costi accessori';
  return compact(section) || null;
}

function codeDepth(code: string | null | undefined) {
  const compacted = compact(code);
  if (!compacted) return 0;
  return compacted.split('.').length;
}

function isAllCapsHeading(input: string | null | undefined) {
  const compacted = compact(input);
  if (!compacted) return false;
  const lettersOnly = compacted.replace(/[^A-Za-zÀ-ÿ]/g, '');
  if (lettersOnly.length < 6) return false;
  return lettersOnly === lettersOnly.toUpperCase();
}

function isLikelySectionHeading(code: string | null | undefined, title: string | null | undefined) {
  const compactedTitle = normalizeCompactSpaces(title ?? '');
  if (!compactedTitle) return false;

  const depth = codeDepth(code);
  const headingLike =
    isAllCapsHeading(compactedTitle) ||
    /^(consulenza specialistica|consulenza per|servizi integrati|gestione del sistema|attività preliminari)$/i.test(
      compactedTitle
    );
  const looksLikeDetailedActivity =
    /^(attività|check-?up|registrazione|riqualificazione|nomina|formazione|redazione|audit|verifica|dichiarazione|assistenza|monitoraggio|predisposizione|supporto)/i.test(
      compactedTitle
    );

  if (depth <= 2 && headingLike && !looksLikeDetailedActivity) return true;
  if (depth <= 2 && compactedTitle.split(' ').length <= 4 && !looksLikeDetailedActivity) return true;

  return false;
}

function buildServiceLineKey(line: ServiceLineProposal) {
  return [
    compact(line.code),
    compact(line.title),
    compact(line.section),
    compact(line.billing_phase),
    compact(line.quantity),
    compact(line.total_price),
  ].join('|');
}

function extractServiceLinesFromText(input: string) {
  const lines = extractLines(input);

  const serviceLines: ServiceLineProposal[] = [];
  let currentSection: string | null = null;
  let currentBillingPhase: string | null = null;

  for (const rawLine of lines) {
    const line = normalizeCompactSpaces(rawLine);
    const lower = line.toLowerCase();

    if (
      /^(azioni|fatturazione|primo anno|anni successivi|costi accessori|alla firma del contratto)$/i.test(
        line
      )
    ) {
      currentSection = line;
      const nextBillingPhase = normalizeBillingPhase(line);
      if (nextBillingPhase) currentBillingPhase = nextBillingPhase;
      continue;
    }

    if (/^(offerta|n\.|uni\.|netto|modalita['’]?\s+di\s+pagamento)$/i.test(lower)) {
      continue;
    }

    const reverseRowMatch = line.match(
      /^(\d+)\s+(\d{1,3}(?:\.\d{3})*,\d{2})€?\s+(\d{1,3}(?:\.\d{3})*,\d{2})€?\s+([A-Z]{1,4})\s+(.+?)\s+([A-Z]-?\d+)\s+(\d+(?:\.\d+)+)$/i
    );

    if (reverseRowMatch) {
      const [, quantity, totalPrice, unitPrice, unit, title, serviceCode, lineCode] = reverseRowMatch;
      const cleanedTitle = normalizeCompactSpaces(title);
      serviceLines.push({
        billing_phase: currentBillingPhase,
        code: `${lineCode} ${serviceCode}`.trim(),
        frequency_label: deriveLineFrequency(cleanedTitle),
        is_recurring: Boolean(deriveLineFrequency(cleanedTitle)),
        notes: currentSection,
        quantity,
        section: currentSection,
        title: cleanedTitle,
        total_price: normalizeEuroNumber(totalPrice),
        unit,
        unit_price: normalizeEuroNumber(unitPrice),
      });
      continue;
    }

    const fullRowMatch = line.match(
      /^(\d+(?:\.\d+)+)\s+([A-Z]-?\d+)\s+(.+?)\s+(\d+)\s+([A-Z]{1,4})\s+(\d{1,3}(?:\.\d{3})*,\d{2})€?\s+(\d{1,3}(?:\.\d{3})*,\d{2})€?$/i
    );

    if (fullRowMatch) {
      const [, lineCode, serviceCode, title, quantity, unit, unitPrice, totalPrice] = fullRowMatch;
      const cleanedTitle = normalizeCompactSpaces(title);
      serviceLines.push({
        billing_phase: currentBillingPhase,
        code: `${lineCode} ${serviceCode}`.trim(),
        frequency_label: deriveLineFrequency(cleanedTitle),
        is_recurring: Boolean(deriveLineFrequency(cleanedTitle)),
        notes: currentSection,
        quantity,
        section: currentSection,
        title: cleanedTitle,
        total_price: normalizeEuroNumber(totalPrice),
        unit,
        unit_price: normalizeEuroNumber(unitPrice),
      });
      continue;
    }

    const partialRowMatch = line.match(
      /^(\d+(?:\.\d+)+)\s+([A-Z]-?\d+)\s+(.+?)(?:\s+(\d+)\s+([A-Z]{1,4}))?$/i
    );

    if (partialRowMatch && line.length > 28) {
      const [, lineCode, serviceCode, title, quantity, unit] = partialRowMatch;
      const cleanedTitle = normalizeCompactSpaces(title);
      if (isLikelySectionHeading(lineCode, cleanedTitle)) {
        currentSection = cleanedTitle;
        continue;
      }
      serviceLines.push({
        billing_phase: currentBillingPhase,
        code: `${lineCode} ${serviceCode}`.trim(),
        frequency_label: deriveLineFrequency(cleanedTitle),
        is_recurring: Boolean(deriveLineFrequency(cleanedTitle)),
        notes: currentSection,
        quantity: quantity ?? null,
        section: currentSection,
        title: cleanedTitle,
        unit: unit ?? null,
      });
    }
  }

  if (serviceLines.length === 0) {
    let numberedSectionActive = false;
    for (const line of lines) {
      if (/^Prestazioni$/i.test(line) || /^OBIETTIVI DEL PROGETTO$/i.test(line) || /^CAP\.\s*1/i.test(line)) {
        numberedSectionActive = true;
        continue;
      }
      if (/^\d+\.\d+\s+DURATA$/i.test(line) || /^DURATA$/i.test(line) || /^CAP\.\s*2/i.test(line)) {
        numberedSectionActive = false;
      }

      const numberedActivity = line.match(/^(\d+(?:\.\d+)+)\)?\s+(.+)$/);
      if (!numberedActivity) continue;
      const [, code, title] = numberedActivity;
      const cleanedTitle = normalizeCompactSpaces(title);
      if (isLikelySectionHeading(code, cleanedTitle)) {
        currentSection = cleanedTitle;
        continue;
      }
      if (
        !numberedSectionActive &&
        !/attività|consulenza|supporto|forfetaria|giornate|check-up|registrazione|riqualificazione|nomina|formazione|redazione|audit|verifica|dichiarazione/i.test(
          cleanedTitle
        )
      ) {
        continue;
      }
      serviceLines.push({
        billing_phase: currentBillingPhase,
        code,
        frequency_label: deriveLineFrequency(cleanedTitle),
        is_recurring: Boolean(deriveLineFrequency(cleanedTitle)),
        notes: currentSection,
        section: currentSection,
        title: cleanedTitle,
      });
    }
  }

  const dedupedLines = Array.from(
    new Map(
      serviceLines
        .filter((line) => compact(line.title))
        .filter((line) => !isLikelySectionHeading(line.code, line.title))
        .map((line) => [buildServiceLineKey(line), line])
    ).values()
  );

  return dedupedLines;
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
  const lines = extractLines(fullText);
  const issueDateFromLines =
    lineAfterExactLabel(lines, ['Data prima emissione', 'Data ultima revisione', 'Data emissione']) ??
    lineMatching(lines, /\b\d{2}[\/.-]\d{2}[\/.-]\d{2,4}\b/);
  const issueDate =
    parseDateCandidate(source.issue_date) ??
    parseDateCandidate(issueDateFromLines) ??
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

  const serviceLines = extractedText ? extractServiceLinesFromText(extractedText) : [];
  if (serviceLines.length > 0) {
    payload.service_lines = serviceLines;
    const serviceLineSummary = `Rilevate ${serviceLines.length} attività / righe economiche dal documento.`;
    payload.summary = summaryBase
      ? `${serviceLineSummary}\n\n${summaryBase}`
      : serviceLineSummary;
  }

  const shouldBuildContractProposal =
    category === 'Contract' ||
    lower.includes('contratt') ||
    lower.includes('offerta') ||
    lower.includes('progetto di consulenza') ||
    lower.includes('corrispettivo') ||
    lower.includes('condizioni economiche');

  if (shouldBuildContractProposal) {
    const templateFamily = extractTemplateFamily(lines);
    const rawTypeValue =
      exactLineValue(lines, ['Tipologia progetto', 'Tipologia offerta']) ??
      firstLabeledValue(fullText, ['tipologia progetto', 'tipologia contratto', 'tipologia offerta']);
    const projectType = normalizeContractTypeValue(rawTypeValue);
    const protocolCode =
      exactLineValue(lines, ['Protocollo', 'Codice cliente e offerta']) ??
      firstLabeledValue(fullText, ['protocollo', 'codice cliente e offerta']);
    const issueDateLabelValue =
      exactLineValue(lines, ['Data prima emissione', 'Data e validità offerta']) ??
      firstLabeledValue(fullText, ['data prima emissione', 'data e validità offerta', 'data emissione']);
    const issueDateNormalized = parseDateCandidate(issueDateLabelValue) ?? issueDate;
    const validityTerms = extractValidityTerms(issueDateLabelValue) ?? extractValidityTermsFromCriteria(lines);
    const durationTerms =
      exactLineValue(lines, ['Durata del Progetto']) ??
      extractDurationTermsFromType(rawTypeValue) ??
      firstLabeledValue(fullText, ['durata del progetto', 'durata contratto']);
    const serviceScope =
      exactLineValue(lines, ['Progetto di Consulenza']) ??
      lineMatching(lines, /^Contratto di consulenza/i) ??
      firstNonEmptyParagraph(
        sectionBetweenHeadings(lines, [/^OBIETTIVI DEL PROGETTO$/i], [/^CONSULENZA SPECIALISTICA$/i, /^CAP\.\s*\d+/i]) ?? ''
      ) ??
      description ??
      null;
    const exercisedActivity =
      exactLineValue(lines, ['Attività esercitata']) ??
      firstLabeledValue(fullText, ['attività esercitata']);
    const customerReferences =
      exactLineValue(lines, ['Referenti Cliente']) ??
      firstLabeledValue(fullText, ['referenti cliente']);
    const teamLeaderLine = lineMatching(lines, /^Team Leader:/i);
    const supervisorLine = lineMatching(lines, /^Supervisore:/i);
    const internalOwner = firstRegexGroup(teamLeaderLine ?? '', /^Team Leader:\s*(.+)$/i);
    const supervisorName = firstRegexGroup(supervisorLine ?? '', /^Supervisore:\s*(.+)$/i);
    const explicitStartDate =
      firstLabeledDate(fullText, ['data inizio', 'decorrenza', 'inizio servizio', 'validita dal', 'validità dal']) ??
      firstDateInText(firstSentenceContaining(fullText, /\ba partire dal\s+\d{2}[\/.-]\d{2}[\/.-]\d{2,4}\b/i) ?? '');
    const explicitRenewalDate =
      firstLabeledDate(fullText, ['data rinnovo', 'renewal']) ??
      firstDateInText(firstSentenceContaining(fullText, /\brinnovo\b.+\d{2}[\/.-]\d{2}[\/.-]\d{2,4}\b/i) ?? '');
    const explicitEndDate =
      firstLabeledDate(fullText, ['data scadenza', 'scadenza', 'termine contratto', 'fine contratto', 'valido fino al']) ??
      null;
    const { startDate, renewalDate, endDate } = deriveContractDates({
      durationTerms,
      explicitEndDate,
      explicitRenewalDate,
      issueDate: issueDateNormalized,
      startDate: explicitStartDate,
    });
    const frequencyHint = extractFrequencyHint(fullText, serviceLines);
    const listedDeliverables = bulletListBetweenHeadings(
      lines,
      [/^Attività di consulenza specialistica/i, /^Attività di consulenza forfetaria permanente/i],
      [/^NB:/i, /^CAP\.\s*\d+/i, /^DURATA$/i, /^ESCLUSIONI$/i]
    );
    const conciseNotes = [
      durationTerms ? `Durata: ${durationTerms}` : null,
      validityTerms ? `Validità offerta: ${validityTerms}` : null,
      supervisorName ? `Supervisore: ${supervisorName}` : null,
      customerReferences ? `Referenti cliente: ${customerReferences}` : null,
    ]
      .filter((value): value is string => Boolean(compact(value)))
      .join('\n');

    payload.parser = templateFamily === 'generic' ? payload.parser : `${templateFamily}_v1`;
    payload.summary = [
      `Contratto ${projectType ?? deriveContractType(lower)}`,
      protocolCode ? `Protocollo ${protocolCode}` : null,
      issueDateNormalized ? `Emissione ${issueDateNormalized}` : null,
      serviceLines.length > 0 ? `Rilevate ${serviceLines.length} attività / righe economiche` : null,
      serviceScope,
    ]
      .filter((value): value is string => Boolean(compact(value)))
      .join('\n');
    payload.contract = {
      activity_frequency: frequencyHint,
      client_references: customerReferences,
      contract_type: projectType ?? deriveContractType(lower),
      duration_terms: durationTerms,
      end_date: endDate,
      exercised_activity: exercisedActivity,
      internal_owner: internalOwner,
      issue_date: issueDateNormalized,
      notes:
        conciseNotes ||
        (listedDeliverables.length > 0 ? listedDeliverables.slice(0, 3).join('\n') : null) ||
        null,
      protocol_code: protocolCode,
      renewal_date: renewalDate,
      service_scope: serviceScope,
      start_date: startDate,
      supervisor_name: supervisorName,
      validity_terms: validityTerms,
    };

    if ((!payload.contract.service_scope || payload.contract.service_scope === '') && serviceLines.length > 0) {
      payload.contract.service_scope = serviceLines
        .slice(0, 4)
        .map((line) => line.title)
        .filter((value): value is string => Boolean(value))
        .join('; ');
    }

    if (!payload.deadline && (renewalDate || endDate)) {
      payload.deadline = {
        due_date: renewalDate ?? endDate,
        priority: derivePriorityByDate(renewalDate ?? endDate),
        title: `Rinnovo ${title}`,
        description: 'Scadenza estratta dal contratto',
      };
    }
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
