type TrainingRecordLike = {
  completion_date: string;
  expiry_date: string | null;
};

export type OperationalStatus = 'active' | 'suspended' | 'archived';

export interface TrainingWindowSummary {
  expiredCount: number;
  expiringSoonCount: number;
  nextExpiryDate: string | null;
  totalCount: number;
  validCount: number;
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function getTrainingWindowSummary(
  records: TrainingRecordLike[],
  windowDays = 30
): TrainingWindowSummary {
  const today = startOfToday();
  const windowEnd = new Date(today);
  windowEnd.setDate(windowEnd.getDate() + windowDays);

  let expiredCount = 0;
  let expiringSoonCount = 0;
  let validCount = 0;
  let nextExpiryDate: string | null = null;

  for (const record of records) {
    if (!record.expiry_date) {
      validCount += 1;
      continue;
    }

    const expiryDate = new Date(record.expiry_date);

    if (expiryDate < today) {
      expiredCount += 1;
    } else if (expiryDate <= windowEnd) {
      expiringSoonCount += 1;
      validCount += 1;
    } else {
      validCount += 1;
    }

    if (!nextExpiryDate || expiryDate < new Date(nextExpiryDate)) {
      nextExpiryDate = record.expiry_date;
    }
  }

  return {
    expiredCount,
    expiringSoonCount,
    nextExpiryDate,
    totalCount: records.length,
    validCount,
  };
}

export function getPersonnelOperationalStatus(input: {
  isActive: boolean;
  trainingSummary: TrainingWindowSummary;
}): OperationalStatus {
  if (!input.isActive) {
    return 'archived';
  }

  if (input.trainingSummary.expiredCount > 0) {
    return 'suspended';
  }

  return 'active';
}

export function getOperationalStatusMeta(status: OperationalStatus) {
  if (status === 'archived') {
    return {
      badgeClassName: 'border-zinc-200 bg-zinc-50 text-zinc-600',
      label: 'Archiviato',
    };
  }

  if (status === 'suspended') {
    return {
      badgeClassName: 'border-rose-200 bg-rose-50 text-rose-700',
      label: 'Sospeso',
    };
  }

  return {
    badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    label: 'Attivo',
  };
}

export type PersonnelTimelineEvent = {
  date: string;
  description: string;
  tone: 'default' | 'warning' | 'danger';
  title: string;
};

export function buildPersonnelTimeline(input: {
  firstName: string;
  hireDate: string | null;
  trainingSummary: TrainingWindowSummary;
  trainingRecords: TrainingRecordLike[];
}) {
  const events: PersonnelTimelineEvent[] = [];

  if (input.hireDate) {
    events.push({
      date: input.hireDate,
      description: `${input.firstName} e stato inserito come collaboratore attivo nel sistema.`,
      title: 'Ingresso in organico',
      tone: 'default',
    });
  }

  for (const record of input.trainingRecords) {
    events.push({
      date: record.completion_date,
      description: 'Corso completato con registrazione nello storico formazione.',
      title: 'Formazione completata',
      tone: 'default',
    });

    if (record.expiry_date) {
      const expiry = new Date(record.expiry_date);
      const today = startOfToday();

      events.push({
        date: record.expiry_date,
        description:
          expiry < today
            ? 'La validita del corso e scaduta e richiede rinnovo.'
            : 'Scadenza futura della certificazione o del corso.',
        title: expiry < today ? 'Formazione scaduta' : 'Scadenza formazione',
        tone: expiry < today ? 'danger' : 'warning',
      });
    }
  }

  if (events.length === 0) {
    return [];
  }

  return events.sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
}
