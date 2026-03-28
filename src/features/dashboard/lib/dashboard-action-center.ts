import {
  addDays,
  formatDateLabel,
  getFullName,
  getRelationName,
  getRelationTitle,
  type NamedRelation,
  type TitledRelation,
} from "@/features/dashboard/lib/dashboard-data-utils";

export interface DashboardNotification {
  id: string;
  title: string;
  description: string;
  href: string;
  tone: "default" | "warning" | "danger";
}

export interface DashboardTodoItem {
  id: string;
  title: string;
  description: string;
  href: string;
  badge?: string;
  priority: "normal" | "high" | "urgent";
}

export interface DashboardActionCenter {
  notifications: DashboardNotification[];
  todos: DashboardTodoItem[];
}

export interface DashboardActionCenterConfig {
  notifications: {
    sendAuditUpcoming: boolean;
    sendDocumentExpiry: boolean;
    sendOpenNonConformities: boolean;
    sendOverdueActions: boolean;
    sendTrainingExpiry: boolean;
  };
  rules: {
    auditAlertDays: number;
    documentAlertDays: number;
    trainingAlertDays: number;
  };
}

export type ActionCenterAuditRow = {
  id: string;
  title: string | null;
  scheduled_date: string | null;
  status: string | null;
  client_id: string | null;
  location_id: string | null;
  client: NamedRelation;
  location: NamedRelation;
};

export type ActionCenterNcRow = {
  id: string;
  title: string | null;
  severity: string | null;
  status: string | null;
  audit_id: string;
};

export type CorrectiveActionRow = {
  id: string;
  non_conformity_id: string;
  status: string | null;
  target_completion_date: string | null;
  responsible_person_name: string | null;
};

export type DocumentRow = {
  id: string;
  title: string | null;
  expiry_date: string | null;
  status: string | null;
  client_id: string | null;
  location_id: string | null;
  personnel_id: string | null;
};

export type ActionCenterPersonnelRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean | null;
  client_id: string | null;
  location_id: string | null;
};

export type ActionCenterTrainingRecordRow = {
  id: string;
  personnel_id: string;
  expiry_date: string;
  completion_date: string | null;
  course: TitledRelation;
};

export function buildDashboardActionCenter(input: {
  auditRows: ActionCenterAuditRow[];
  config: DashboardActionCenterConfig;
  correctiveActionRows: CorrectiveActionRow[];
  documentRows: DocumentRow[];
  openNcRows: ActionCenterNcRow[];
  personnelRows: ActionCenterPersonnelRow[];
  today: Date;
  trainingRecordRows: ActionCenterTrainingRecordRow[];
}): DashboardActionCenter {
  const upcomingAuditCutoff = addDays(input.today, input.config.rules.auditAlertDays);
  const documentExpiryCutoff = addDays(input.today, input.config.rules.documentAlertDays);
  const trainingExpiryCutoff = addDays(input.today, input.config.rules.trainingAlertDays);

  const overdueAudits = input.auditRows.filter(
    (audit): audit is ActionCenterAuditRow & { scheduled_date: string } => {
      if (!audit.scheduled_date) return false;
      const status = (audit.status ?? "").toLowerCase();
      if (["closed", "completed", "cancelled"].includes(status)) return false;
      return new Date(audit.scheduled_date) < input.today;
    }
  );

  const upcomingAudits = input.auditRows.filter(
    (audit): audit is ActionCenterAuditRow & { scheduled_date: string } => {
      if (!audit.scheduled_date) return false;
      const status = (audit.status ?? "").toLowerCase();
      if (["closed", "completed", "cancelled"].includes(status)) return false;
      const scheduledDate = new Date(audit.scheduled_date);
      return scheduledDate >= input.today && scheduledDate <= upcomingAuditCutoff;
    }
  );

  const criticalNCs = input.openNcRows.filter((nc) =>
    ["critical", "major"].includes((nc.severity ?? "").toLowerCase())
  );

  const overdueCorrectiveActions = input.correctiveActionRows.filter((action) => {
    const status = (action.status ?? "").toLowerCase();
    if (["completed", "closed"].includes(status)) return false;
    if (!action.target_completion_date) return false;
    return new Date(action.target_completion_date) < input.today;
  });

  const overdueDocuments = input.documentRows.filter(
    (document): document is DocumentRow & { expiry_date: string } => {
      if (!document.expiry_date) return false;
      return new Date(document.expiry_date) < input.today;
    }
  );

  const expiringDocuments = input.documentRows.filter(
    (document): document is DocumentRow & { expiry_date: string } => {
      if (!document.expiry_date) return false;
      const expiryDate = new Date(document.expiry_date);
      return expiryDate >= input.today && expiryDate <= documentExpiryCutoff;
    }
  );

  const personNameById = new Map<string, string>(
    input.personnelRows.map((person) => [person.id, getFullName(person)])
  );

  const expiredTraining = input.trainingRecordRows.filter((record) => {
    if (!record.expiry_date) return false;
    return new Date(record.expiry_date) < input.today;
  });

  const expiringTraining = input.trainingRecordRows.filter((record) => {
    if (!record.expiry_date) return false;
    const expiryDate = new Date(record.expiry_date);
    return expiryDate >= input.today && expiryDate <= trainingExpiryCutoff;
  });

  const notifications: DashboardNotification[] = [];

  if (input.config.notifications.sendOverdueActions && overdueCorrectiveActions.length > 0) {
    notifications.push({
      id: "overdue-corrective-actions",
      title: `${overdueCorrectiveActions.length} azioni correttive scadute`,
      description: "Richiedono follow-up immediato e riallineamento con il responsabile.",
      href: "/non-conformities",
      tone: "danger",
    });
  }

  if (input.config.notifications.sendOpenNonConformities && criticalNCs.length > 0) {
    notifications.push({
      id: "critical-ncs",
      title: `${criticalNCs.length} non conformita prioritarie`,
      description: "Sono presenti NC critiche o maggiori ancora aperte nel perimetro filtrato.",
      href: "/non-conformities",
      tone: "warning",
    });
  }

  if (
    input.config.notifications.sendDocumentExpiry &&
    (overdueDocuments.length > 0 || expiringDocuments.length > 0)
  ) {
    notifications.push({
      id: "document-deadlines",
      title:
        overdueDocuments.length > 0
          ? `${overdueDocuments.length} documenti scaduti`
          : `${expiringDocuments.length} documenti in scadenza`,
      description:
        overdueDocuments.length > 0
          ? "Aggiornare o archiviare i documenti scaduti collegati a clienti, sedi o collaboratori."
          : "Verificare i documenti in scadenza nei prossimi 30 giorni.",
      href: "/clients",
      tone: overdueDocuments.length > 0 ? "danger" : "warning",
    });
  }

  if (
    input.config.notifications.sendTrainingExpiry &&
    (expiredTraining.length > 0 || expiringTraining.length > 0)
  ) {
    notifications.push({
      id: "training-deadlines",
      title:
        expiredTraining.length > 0
          ? `${expiredTraining.length} corsi formazione scaduti`
          : `${expiringTraining.length} corsi in scadenza`,
      description:
        expiredTraining.length > 0
          ? "Alcuni collaboratori hanno formazione non piu valida."
          : "Ci sono rinnovi formativi da pianificare entro 30 giorni.",
      href: "/clients",
      tone: expiredTraining.length > 0 ? "danger" : "warning",
    });
  }

  if (input.config.notifications.sendAuditUpcoming && upcomingAudits.length > 0) {
    notifications.push({
      id: "upcoming-audits",
      title: `${upcomingAudits.length} audit nei prossimi 7 giorni`,
      description:
        "Conviene confermare disponibilita, sede e checklist operative prima della settimana.",
      href: "/audits",
      tone: "default",
    });
  }

  const todos: DashboardTodoItem[] = [];

  for (const audit of overdueAudits.slice(0, 3)) {
    todos.push({
      id: `audit-${audit.id}`,
      title: audit.title ?? "Audit da riallineare",
      description: `Audit pianificato per ${formatDateLabel(audit.scheduled_date)} presso ${getRelationName(audit.client) || "cliente"}.`,
      href: `/audits/${audit.id}`,
      badge: "Audit scaduto",
      priority: "urgent",
    });
  }

  for (const action of overdueCorrectiveActions.slice(0, 3)) {
    todos.push({
      id: `ac-${action.id}`,
      title: action.responsible_person_name
        ? `Riallinea AC con ${action.responsible_person_name}`
        : "Aggiorna azione correttiva scaduta",
      description: `Target ${formatDateLabel(action.target_completion_date)}. Serve un avanzamento o una nuova data.`,
      href: `/non-conformities/${action.non_conformity_id}`,
      badge: "AC scaduta",
      priority: "urgent",
    });
  }

  for (const document of [...overdueDocuments, ...expiringDocuments].slice(0, 3)) {
    const href = document.personnel_id
      ? `/personnel/${document.personnel_id}`
      : document.client_id
        ? `/clients/${document.client_id}`
        : "/clients";

    const isExpired = new Date(document.expiry_date).getTime() < input.today.getTime();
    todos.push({
      id: `document-${document.id}`,
      title: document.title ?? "Documento da aggiornare",
      description: `Scadenza ${formatDateLabel(document.expiry_date)}. Verificare validita e versioning.`,
      href,
      badge: isExpired ? "Documento scaduto" : "Documento in scadenza",
      priority: isExpired ? "high" : "normal",
    });
  }

  for (const record of [...expiredTraining, ...expiringTraining].slice(0, 3)) {
    const isExpired = new Date(record.expiry_date).getTime() < input.today.getTime();
    todos.push({
      id: `training-${record.id}`,
      title: personNameById.get(record.personnel_id) ?? "Collaboratore da riallineare",
      description: `${getRelationTitle(record.course) || "Formazione"} con scadenza ${formatDateLabel(record.expiry_date)}.`,
      href: `/personnel/${record.personnel_id}`,
      badge: isExpired ? "Formazione scaduta" : "Formazione in scadenza",
      priority: isExpired ? "high" : "normal",
    });
  }

  if (todos.length === 0) {
    for (const audit of upcomingAudits.slice(0, 3)) {
      todos.push({
        id: `upcoming-audit-${audit.id}`,
        title: `Conferma audit: ${audit.title}`,
        description: `Previsto per ${formatDateLabel(audit.scheduled_date)} presso ${getRelationName(audit.client) || "cliente"}.`,
        href: `/audits/${audit.id}`,
        badge: "Prossimo audit",
        priority: "normal",
      });
    }
  }

  const priorityRank: Record<DashboardTodoItem["priority"], number> = {
    urgent: 0,
    high: 1,
    normal: 2,
  };

  return {
    notifications: notifications.slice(0, 4),
    todos: todos
      .sort((left, right) => priorityRank[left.priority] - priorityRank[right.priority])
      .slice(0, 8),
  };
}
