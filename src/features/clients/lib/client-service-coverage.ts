import type {
  ClientDeadlineRecord,
  ClientServiceLineRecord,
  ClientTaskRecord,
} from '@/features/clients/queries/get-client-workspace';

export interface ServiceCoverageAuditInput {
  id: string;
  location_id: string | null;
  scheduled_date: string | null;
  status: string;
  title: string | null;
}

export interface ServiceCoverageDocumentInput {
  category: string | null;
  client_id: string | null;
  created_at: string | null;
  description: string | null;
  file_name: string | null;
  id: string;
  issue_date: string | null;
  last_reviewed_at?: string | null;
  location_id: string | null;
  title: string | null;
  updated_at: string | null;
}

export interface ServiceCoverageLocationInput {
  id: string;
  is_active?: boolean | null;
  name: string;
}

export type ClientServiceCoverageStatus =
  | 'covered'
  | 'scheduled'
  | 'at_risk'
  | 'overdue'
  | 'missing';

export type ClientServiceLineKind =
  | 'audit'
  | 'document'
  | 'sampling'
  | 'training'
  | 'support';

export interface ClientServiceCoverageItem {
  cadenceDays: number | null;
  lineId: string;
  lineKind: ClientServiceLineKind;
  lineTitle: string;
  locationId: string | null;
  locationName: string | null;
  matchingSignals: {
    audits: number;
    deadlines: number;
    documents: number;
    tasks: number;
  };
  nextPlannedAt: string | null;
  operationalOwner: string | null;
  reasons: string[];
  status: ClientServiceCoverageStatus;
  value: number | null;
  lastEvidenceAt: string | null;
}

export interface ClientServiceCoverageSnapshot {
  attentionItems: ClientServiceCoverageItem[];
  items: ClientServiceCoverageItem[];
  summary: {
    atRisk: number;
    covered: number;
    coverageRate: number;
    guarded: number;
    missing: number;
    overdue: number;
    recurring: number;
    scheduled: number;
    total: number;
  };
}

const STOP_WORDS = new Set([
  'alla',
  'alle',
  'anche',
  'cliente',
  'con',
  'dei',
  'del',
  'della',
  'delle',
  'dello',
  'dopo',
  'gli',
  'il',
  'in',
  'la',
  'le',
  'mensile',
  'mensili',
  'nel',
  'nella',
  'per',
  'previsto',
  'prevista',
  'servizio',
  'servizi',
  'sul',
  'sulla',
  'the',
  'una',
  'uno',
]);

function normalizeText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value: string | null | undefined) {
  return normalizeText(value)
    .split(' ')
    .filter((token) => token.length >= 4 && !STOP_WORDS.has(token));
}

function overlapCount(left: string[], rightText: string) {
  if (left.length === 0) return 0;
  const right = new Set(tokenize(rightText));
  return left.reduce((count, token) => count + Number(right.has(token)), 0);
}

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function isoDate(value: string | null | undefined) {
  const parsed = parseDate(value);
  return parsed ? parsed.toISOString().slice(0, 10) : null;
}

function diffInDays(from: Date, toIso: string | null) {
  if (!toIso) return null;
  const target = parseDate(toIso);
  if (!target) return null;
  const diffMs = from.getTime() - target.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function sameScope(expectedLocationId: string | null, actualLocationId: string | null) {
  if (!expectedLocationId) return true;
  return actualLocationId === expectedLocationId || actualLocationId === null;
}

function textIncludesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function inferServiceLineKind(line: ClientServiceLineRecord): ClientServiceLineKind {
  const text = normalizeText([line.title, line.section, line.notes].filter(Boolean).join(' '));

  if (textIncludesAny(text, ['audit', 'verifica', 'ispezione', 'check up'])) return 'audit';
  if (textIncludesAny(text, ['manuale', 'procedura', 'registro', 'certificat', 'autorizz', 'document'])) {
    return 'document';
  }
  if (textIncludesAny(text, ['campion', 'analisi', 'prelievo', 'tampon', 'laboratorio'])) {
    return 'sampling';
  }
  if (textIncludesAny(text, ['formazione', 'training', 'addestramento', 'corso'])) {
    return 'training';
  }
  return 'support';
}

function frequencyToCadenceDays(frequencyLabel: string | null, isRecurring: boolean) {
  const normalized = normalizeText(frequencyLabel);
  if (!normalized) return isRecurring ? 30 : null;

  const explicitDays = normalized.match(/(\d{1,3})\s*(giorn|day)/);
  if (explicitDays) return Number.parseInt(explicitDays[1], 10);

  if (normalized.includes('settiman')) return 7;
  if (normalized.includes('quindic')) return 15;
  if (normalized.includes('mens')) return 30;
  if (normalized.includes('bimes')) return 60;
  if (normalized.includes('trimes')) return 90;
  if (normalized.includes('quadrimes')) return 120;
  if (normalized.includes('semes')) return 180;
  if (normalized.includes('ann')) return 365;
  if (normalized.includes('quarter')) return 90;

  return isRecurring ? 30 : null;
}

function pickLatest(dates: Array<string | null>) {
  return dates
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ?? null;
}

function pickEarliestFuture(referenceDate: Date, dates: Array<string | null>) {
  return dates
    .filter((value): value is string => Boolean(value))
    .filter((value) => {
      const parsed = parseDate(value);
      return Boolean(parsed && parsed >= referenceDate);
    })
    .sort((left, right) => new Date(left).getTime() - new Date(right).getTime())[0] ?? null;
}

function statusRank(status: ClientServiceCoverageStatus) {
  if (status === 'overdue') return 0;
  if (status === 'missing') return 1;
  if (status === 'at_risk') return 2;
  if (status === 'scheduled') return 3;
  return 4;
}

function getDocumentEvidenceDate(document: ServiceCoverageDocumentInput) {
  return (
    isoDate(document.issue_date) ??
    isoDate(document.last_reviewed_at) ??
    isoDate(document.updated_at) ??
    isoDate(document.created_at)
  );
}

function getTaskEvidenceDate(task: ClientTaskRecord) {
  return isoDate(task.completed_at) ?? isoDate(task.updated_at) ?? isoDate(task.due_date);
}

function isTaskRelevant(
  line: ClientServiceLineRecord,
  lineKind: ClientServiceLineKind,
  task: ClientTaskRecord
) {
  if (task.service_line_id) {
    return task.service_line_id === line.id;
  }

  if (!sameScope(line.location_id, task.location_id)) return false;

  const lineText = [line.title, line.code, line.section, line.notes].filter(Boolean).join(' ');
  const taskText = [task.title, task.description, task.owner_name].filter(Boolean).join(' ');
  const lineTokens = tokenize(lineText);
  const taskNormalized = normalizeText(taskText);

  if (line.code && taskNormalized.includes(normalizeText(line.code))) return true;
  if (overlapCount(lineTokens, taskText) >= 2) return true;

  if (lineKind === 'audit') {
    return Boolean(task.audit_id) || textIncludesAny(taskNormalized, ['audit', 'verifica', 'ispezione']);
  }
  if (lineKind === 'document') {
    return textIncludesAny(taskNormalized, ['document', 'manuale', 'procedura', 'certificat', 'registro']);
  }
  if (lineKind === 'sampling') {
    return textIncludesAny(taskNormalized, ['campion', 'analisi', 'prelievo', 'tampon']);
  }
  if (lineKind === 'training') {
    return textIncludesAny(taskNormalized, ['formazione', 'training', 'corso', 'addestramento']);
  }

  return false;
}

function isDocumentRelevant(
  line: ClientServiceLineRecord,
  lineKind: ClientServiceLineKind,
  document: ServiceCoverageDocumentInput
) {
  if (!sameScope(line.location_id, document.location_id)) return false;

  const lineText = [line.title, line.code, line.section, line.notes].filter(Boolean).join(' ');
  const documentText = [
    document.title,
    document.description,
    document.file_name,
    document.category,
  ]
    .filter(Boolean)
    .join(' ');
  const lineTokens = tokenize(lineText);
  const documentNormalized = normalizeText(documentText);

  if (line.code && documentNormalized.includes(normalizeText(line.code))) return true;
  if (overlapCount(lineTokens, documentText) >= 2) return true;

  if (lineKind === 'audit') {
    return textIncludesAny(documentNormalized, ['audit', 'verifica', 'verbale', 'report']);
  }
  if (lineKind === 'document') {
    return textIncludesAny(documentNormalized, [
      'manuale',
      'procedura',
      'registro',
      'certificat',
      'autorizz',
      'document',
    ]);
  }
  if (lineKind === 'sampling') {
    return textIncludesAny(documentNormalized, ['campion', 'analisi', 'laboratorio', 'rapporto prova']);
  }
  if (lineKind === 'training') {
    return textIncludesAny(documentNormalized, ['formazione', 'training', 'corso', 'attestato']);
  }

  return false;
}

function isAuditRelevant(line: ClientServiceLineRecord, lineKind: ClientServiceLineKind, audit: ServiceCoverageAuditInput) {
  if (!sameScope(line.location_id, audit.location_id)) return false;

  const lineText = [line.title, line.code, line.section, line.notes].filter(Boolean).join(' ');
  const auditText = [audit.title, audit.status].filter(Boolean).join(' ');
  const lineTokens = tokenize(lineText);

  if (lineKind === 'audit') return true;
  if (line.code && normalizeText(auditText).includes(normalizeText(line.code))) return true;
  return overlapCount(lineTokens, auditText) >= 2;
}

function isDeadlineRelevant(
  line: ClientServiceLineRecord,
  lineKind: ClientServiceLineKind,
  deadline: ClientDeadlineRecord
) {
  if (deadline.service_line_id) {
    return deadline.service_line_id === line.id;
  }

  if (!sameScope(line.location_id, deadline.location_id)) return false;

  const lineText = [line.title, line.code, line.section, line.notes].filter(Boolean).join(' ');
  const deadlineText = [deadline.title, deadline.description].filter(Boolean).join(' ');
  const lineTokens = tokenize(lineText);
  const deadlineNormalized = normalizeText(deadlineText);

  if (line.code && deadlineNormalized.includes(normalizeText(line.code))) return true;
  if (overlapCount(lineTokens, deadlineText) >= 2) return true;

  if (lineKind === 'audit') return deadline.source_type === 'audit';
  if (lineKind === 'document') return deadline.source_type === 'document';

  return false;
}

function buildReasons(options: {
  cadenceDays: number | null;
  lineKind: ClientServiceLineKind;
  nextPlannedAt: string | null;
  operationalOwner: string | null;
  overdueSignal: string | null;
  relevantDocumentsCount: number;
  status: ClientServiceCoverageStatus;
  lastEvidenceAt: string | null;
}) {
  const reasons: string[] = [];

  if (options.overdueSignal) {
    reasons.push(options.overdueSignal);
  } else if (options.nextPlannedAt) {
    reasons.push(`Prossimo presidio previsto il ${options.nextPlannedAt}.`);
  } else if (options.lastEvidenceAt) {
    reasons.push(`Ultima evidenza registrata il ${options.lastEvidenceAt}.`);
  } else {
    reasons.push('Nessuna evidenza o pianificazione collegata alla linea servizio.');
  }

  if (!options.operationalOwner) {
    reasons.push('Nessun assegnatario operativo rilevato.');
  }

  if (options.lineKind === 'document' && options.relevantDocumentsCount === 0) {
    reasons.push('Nessun documento coerente collegato alla linea.');
  }

  if (options.status === 'at_risk' && options.cadenceDays) {
    reasons.push(`Cadenza attesa circa ogni ${options.cadenceDays} giorni.`);
  }

  return reasons.slice(0, 3);
}

export function getServiceCoverageStatusLabel(status: ClientServiceCoverageStatus) {
  if (status === 'covered') return 'Presidiata';
  if (status === 'scheduled') return 'Pianificata';
  if (status === 'at_risk') return 'A rischio';
  if (status === 'overdue') return 'In ritardo';
  return 'Scoperta';
}

export function getServiceCoverageStatusClassName(status: ClientServiceCoverageStatus) {
  if (status === 'covered') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'scheduled') return 'border-sky-200 bg-sky-50 text-sky-700';
  if (status === 'at_risk') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (status === 'overdue') return 'border-rose-200 bg-rose-50 text-rose-700';
  return 'border-zinc-200 bg-zinc-50 text-zinc-700';
}

export function buildClientServiceCoverage(input: {
  audits: ServiceCoverageAuditInput[];
  deadlines: ClientDeadlineRecord[];
  documents: ServiceCoverageDocumentInput[];
  locations: ServiceCoverageLocationInput[];
  serviceLines: ClientServiceLineRecord[];
  tasks: ClientTaskRecord[];
  today?: Date;
}): ClientServiceCoverageSnapshot {
  const today = input.today ? new Date(input.today) : new Date();
  today.setHours(0, 0, 0, 0);

  const locationMap = new Map(input.locations.map((location) => [location.id, location.name]));

  const items = input.serviceLines
    .filter((line) => line.active)
    .map((line) => {
      const lineKind = inferServiceLineKind(line);
      const cadenceDays = frequencyToCadenceDays(line.frequency_label, line.is_recurring);
      const relevantTasks = input.tasks.filter((task) => isTaskRelevant(line, lineKind, task));
      const relevantDocuments = input.documents.filter((document) =>
        isDocumentRelevant(line, lineKind, document)
      );
      const relevantAudits = input.audits.filter((audit) => isAuditRelevant(line, lineKind, audit));
      const relevantDeadlines = input.deadlines.filter((deadline) =>
        isDeadlineRelevant(line, lineKind, deadline)
      );

      const openTasks = relevantTasks.filter((task) => task.status !== 'done');
      const completedTasks = relevantTasks.filter((task) => task.status === 'done');
      const closedAudits = relevantAudits.filter((audit) => audit.status === 'Closed');
      const openAudits = relevantAudits.filter((audit) => audit.status !== 'Closed');
      const openDeadlines = relevantDeadlines.filter((deadline) => deadline.status === 'open');

      const overdueTask = openTasks.find((task) => {
        const dueDate = parseDate(task.due_date);
        return Boolean(dueDate && dueDate < today);
      });
      const overdueDeadline = openDeadlines.find((deadline) => {
        const dueDate = parseDate(deadline.due_date);
        return Boolean(dueDate && dueDate < today);
      });
      const overdueAudit = openAudits.find((audit) => {
        const dueDate = parseDate(audit.scheduled_date);
        return Boolean(dueDate && dueDate < today);
      });

      const nextPlannedAt = pickEarliestFuture(today, [
        ...openTasks.map((task) => isoDate(task.due_date)),
        ...openDeadlines.map((deadline) => isoDate(deadline.due_date)),
        ...openAudits.map((audit) => isoDate(audit.scheduled_date)),
      ]);

      const lastEvidenceAt = pickLatest([
        ...completedTasks.map((task) => getTaskEvidenceDate(task)),
        ...closedAudits.map((audit) => isoDate(audit.scheduled_date)),
        ...relevantDocuments.map((document) => getDocumentEvidenceDate(document)),
      ]);

      const evidenceAgeDays = diffInDays(today, lastEvidenceAt);
      const planningWindowDays = cadenceDays ?? 45;
      const nextPlannedLagDays =
        nextPlannedAt && parseDate(nextPlannedAt)
          ? Math.floor((parseDate(nextPlannedAt)!.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          : null;

      const overdueSignal =
        overdueTask?.due_date
          ? `Task in ritardo dal ${isoDate(overdueTask.due_date)}.`
          : overdueDeadline?.due_date
            ? `Scadenza aperta oltre termine dal ${isoDate(overdueDeadline.due_date)}.`
            : overdueAudit?.scheduled_date
              ? `Audit pianificato oltre data prevista dal ${isoDate(overdueAudit.scheduled_date)}.`
              : null;

      let status: ClientServiceCoverageStatus;
      if (overdueSignal) {
        status = 'overdue';
      } else if (
        nextPlannedAt &&
        (nextPlannedLagDays === null || nextPlannedLagDays <= planningWindowDays * 1.5)
      ) {
        status = 'scheduled';
      } else if (evidenceAgeDays !== null && evidenceAgeDays <= (cadenceDays ?? 60)) {
        status = 'covered';
      } else if (!lastEvidenceAt && !nextPlannedAt) {
        status = line.is_recurring || cadenceDays !== null ? 'missing' : 'at_risk';
      } else if (
        evidenceAgeDays !== null &&
        cadenceDays !== null &&
        evidenceAgeDays > Math.round(cadenceDays * 1.5)
      ) {
        status = line.is_recurring ? 'overdue' : 'at_risk';
      } else {
        status = 'at_risk';
      }

      const operationalOwner =
        openTasks.find((task) => task.owner_name)?.owner_name ??
        completedTasks.find((task) => task.owner_name)?.owner_name ??
        null;

      const reasons = buildReasons({
        cadenceDays,
        lineKind,
        nextPlannedAt,
        operationalOwner,
        overdueSignal,
        relevantDocumentsCount: relevantDocuments.length,
        status,
        lastEvidenceAt,
      });

      return {
        cadenceDays,
        lineId: line.id,
        lineKind,
        lineTitle: line.title,
        locationId: line.location_id,
        locationName: line.location_id ? locationMap.get(line.location_id) ?? null : null,
        matchingSignals: {
          audits: relevantAudits.length,
          deadlines: relevantDeadlines.length,
          documents: relevantDocuments.length,
          tasks: relevantTasks.length,
        },
        nextPlannedAt,
        operationalOwner,
        reasons,
        status,
        value: line.total_price ?? line.unit_price ?? null,
        lastEvidenceAt,
      } satisfies ClientServiceCoverageItem;
    })
    .sort((left, right) => {
      return (
        statusRank(left.status) - statusRank(right.status) ||
        left.lineTitle.localeCompare(right.lineTitle, 'it')
      );
    });

  const summary = items.reduce(
    (acc, item) => {
      acc.total += 1;
      if (item.status === 'covered') acc.covered += 1;
      if (item.status === 'scheduled') acc.scheduled += 1;
      if (item.status === 'at_risk') acc.atRisk += 1;
      if (item.status === 'overdue') acc.overdue += 1;
      if (item.status === 'missing') acc.missing += 1;
      if (item.cadenceDays !== null) acc.recurring += 1;
      return acc;
    },
    {
      atRisk: 0,
      covered: 0,
      coverageRate: 0,
      guarded: 0,
      missing: 0,
      overdue: 0,
      recurring: 0,
      scheduled: 0,
      total: 0,
    }
  );

  summary.guarded = summary.covered + summary.scheduled;
  summary.coverageRate = summary.total > 0 ? Math.round((summary.guarded / summary.total) * 100) : 0;

  return {
    attentionItems: items.filter((item) => statusRank(item.status) <= statusRank('at_risk')),
    items,
    summary,
  };
}
