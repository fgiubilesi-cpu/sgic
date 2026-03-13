import { createClient } from '@/lib/supabase/server';
import type { ClientTaskPriority, ClientTaskStatus } from '@/features/clients/queries/get-client-workspace';

type TaskRow = {
  client_id: string;
  due_date: string | null;
  id: string;
  is_recurring: boolean;
  location_id: string | null;
  owner_name: string | null;
  priority: ClientTaskPriority;
  recurrence_label: string | null;
  service_line_id: string | null;
  status: ClientTaskStatus;
  title: string;
};

type DeadlineRow = {
  client_id: string;
  due_date: string;
  id: string;
  location_id: string | null;
  priority: ClientTaskPriority;
  service_line_id: string | null;
  source_type: 'manual' | 'contract' | 'task' | 'document' | 'audit';
  status: 'open' | 'completed' | 'cancelled';
  title: string;
};

type LocationRow = {
  id: string;
  name: string;
};

type ClientRow = {
  id: string;
  name: string;
};

export type DailyExecutionFocus =
  | 'blocked'
  | 'critical'
  | 'overdue'
  | 'recurring'
  | 'this_week'
  | 'today';

export interface DailyExecutionItem {
  client_id: string;
  client_name: string;
  critical_reasons: string[];
  critical_score: number;
  due_date: string | null;
  has_service_link: boolean;
  href: string;
  id: string;
  is_recurring: boolean;
  kind: 'deadline' | 'task';
  location_id: string | null;
  location_name: string | null;
  owner_name: string | null;
  priority: ClientTaskPriority;
  recurrence_label: string | null;
  source_label: string;
  status_label: string;
  title: string;
}

export interface DailyExecutionOverview {
  blockedItems: DailyExecutionItem[];
  criticalItems: DailyExecutionItem[];
  overdueItems: DailyExecutionItem[];
  recurringItems: DailyExecutionItem[];
  summary: {
    blocked: number;
    critical: number;
    overdue: number;
    recurring: number;
    this_week: number;
    today: number;
  };
  thisWeekItems: DailyExecutionItem[];
  todayItems: DailyExecutionItem[];
}

const MAX_ITEMS_PER_BUCKET = 100;

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfWeek(reference: Date) {
  const date = new Date(reference);
  const day = date.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  date.setDate(date.getDate() + daysUntilSunday);
  date.setHours(0, 0, 0, 0);
  return date;
}

function parseDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function priorityRank(priority: ClientTaskPriority) {
  if (priority === 'critical') return 0;
  if (priority === 'high') return 1;
  if (priority === 'medium') return 2;
  return 3;
}

function sortByUrgency(left: DailyExecutionItem, right: DailyExecutionItem) {
  const leftDate = parseDate(left.due_date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const rightDate = parseDate(right.due_date)?.getTime() ?? Number.MAX_SAFE_INTEGER;

  return (
    leftDate - rightDate ||
    priorityRank(left.priority) - priorityRank(right.priority) ||
    left.client_name.localeCompare(right.client_name, 'it')
  );
}

function sortBlocked(left: DailyExecutionItem, right: DailyExecutionItem) {
  return (
    priorityRank(left.priority) - priorityRank(right.priority) ||
    sortByUrgency(left, right)
  );
}

function sortCritical(left: DailyExecutionItem, right: DailyExecutionItem) {
  return (
    right.critical_score - left.critical_score ||
    sortByUrgency(left, right)
  );
}

function deadlineSourceLabel(sourceType: DeadlineRow['source_type']) {
  if (sourceType === 'manual') return 'Scadenza manuale';
  if (sourceType === 'document') return 'Scadenza documento';
  if (sourceType === 'audit') return 'Scadenza audit';
  if (sourceType === 'contract') return 'Scadenza contratto';
  return 'Scadenza task';
}

function annotateCriticalState(
  item: Omit<DailyExecutionItem, 'critical_reasons' | 'critical_score'>,
  today: Date,
  weekEnd: Date
): DailyExecutionItem {
  const dueDate = parseDate(item.due_date);
  const isBlocked = item.status_label === 'Bloccata';
  const isOverdue = Boolean(dueDate && dueDate < today);
  const isToday = Boolean(dueDate && dueDate.getTime() === today.getTime());
  const isThisWeek = Boolean(dueDate && dueDate >= today && dueDate <= weekEnd);
  const reasons: string[] = [];
  let score = 0;

  if (isBlocked) {
    score += 5;
    reasons.push('Attività bloccata');
  }

  if (isOverdue) {
    score += 4;
    reasons.push('Oltre termine');
  } else if (isToday) {
    score += 3;
    reasons.push('Scade oggi');
  } else if (isThisWeek) {
    score += 1;
    reasons.push('Scade questa settimana');
  }

  if (item.priority === 'critical') {
    score += 4;
    reasons.push('Priorità critica');
  } else if (item.priority === 'high') {
    score += 2;
    reasons.push('Priorità alta');
  }

  if (!item.has_service_link) {
    score += 2;
    reasons.push('Senza linea servizio');
  }

  if (item.kind === 'task' && !item.owner_name) {
    score += 1;
    reasons.push('Senza owner');
  }

  if (item.is_recurring && (!dueDate || dueDate < today || isBlocked)) {
    score += 2;
    reasons.push('Ricorrente da riallineare');
  }

  return {
    ...item,
    critical_reasons: reasons.slice(0, 3),
    critical_score: score,
  };
}

export async function getDailyExecutionOverview(
  organizationId: string
): Promise<DailyExecutionOverview> {
  const supabase = await createClient();
  const today = startOfToday();
  const weekEnd = endOfWeek(today);

  const [clientsResult, locationsResult, tasksResult, deadlinesResult] = await Promise.all([
    supabase
      .from('clients')
      .select('id, name')
      .eq('organization_id', organizationId),
    supabase
      .from('locations')
      .select('id, name')
      .eq('organization_id', organizationId),
    supabase
      .from('client_tasks')
      .select(
        'id, client_id, title, status, priority, due_date, owner_name, service_line_id, location_id, is_recurring, recurrence_label'
      )
      .eq('organization_id', organizationId)
      .neq('status', 'done'),
    supabase
      .from('client_deadlines')
      .select(
        'id, client_id, title, due_date, priority, status, source_type, service_line_id, location_id'
      )
      .eq('organization_id', organizationId)
      .eq('status', 'open')
      .neq('source_type', 'task'),
  ]);

  if (clientsResult.error) throw clientsResult.error;
  if (locationsResult.error) throw locationsResult.error;
  if (tasksResult.error) throw tasksResult.error;
  if (deadlinesResult.error) throw deadlinesResult.error;

  const clientMap = new Map(
    ((clientsResult.data ?? []) as ClientRow[]).map((client) => [client.id, client.name])
  );
  const locationMap = new Map(
    ((locationsResult.data ?? []) as LocationRow[]).map((location) => [location.id, location.name])
  );

  const tasks = ((tasksResult.data ?? []) as TaskRow[]).map((task) =>
    annotateCriticalState(
      {
        client_id: task.client_id,
        client_name: clientMap.get(task.client_id) ?? 'Cliente sconosciuto',
        due_date: task.due_date,
        has_service_link: Boolean(task.service_line_id),
        href: `/clients/${task.client_id}`,
        id: task.id,
        is_recurring: task.is_recurring,
        kind: 'task' as const,
        location_id: task.location_id,
        location_name: task.location_id ? locationMap.get(task.location_id) ?? 'Sede rimossa' : null,
        owner_name: task.owner_name,
        priority: task.priority,
        recurrence_label: task.recurrence_label,
        source_label: 'Task',
        status_label:
          task.status === 'blocked'
            ? 'Bloccata'
            : task.status === 'in_progress'
              ? 'In lavorazione'
              : 'Aperta',
        title: task.title,
      },
      today,
      weekEnd
    )
  );

  const deadlines = ((deadlinesResult.data ?? []) as DeadlineRow[]).map((deadline) =>
    annotateCriticalState(
      {
        client_id: deadline.client_id,
        client_name: clientMap.get(deadline.client_id) ?? 'Cliente sconosciuto',
        due_date: deadline.due_date,
        has_service_link: Boolean(deadline.service_line_id),
        href: `/clients/${deadline.client_id}`,
        id: deadline.id,
        is_recurring: false,
        kind: 'deadline' as const,
        location_id: deadline.location_id,
        location_name: deadline.location_id
          ? locationMap.get(deadline.location_id) ?? 'Sede rimossa'
          : null,
        owner_name: null,
        priority: deadline.priority,
        recurrence_label: null,
        source_label: deadlineSourceLabel(deadline.source_type),
        status_label: 'Aperta',
        title: deadline.title,
      },
      today,
      weekEnd
    )
  );

  const todayItems = [...tasks, ...deadlines]
    .filter((item) => {
      const dueDate = parseDate(item.due_date);
      return Boolean(dueDate && dueDate.getTime() === today.getTime());
    })
    .sort(sortByUrgency);

  const thisWeekItems = [...tasks, ...deadlines]
    .filter((item) => {
      const dueDate = parseDate(item.due_date);
      return Boolean(dueDate && dueDate >= today && dueDate <= weekEnd);
    })
    .sort(sortByUrgency);

  const overdueItems = [...tasks, ...deadlines]
    .filter((item) => {
      const dueDate = parseDate(item.due_date);
      return Boolean(dueDate && dueDate < today);
    })
    .sort(sortByUrgency);

  const blockedItems = tasks
    .filter((task) => task.status_label === 'Bloccata')
    .sort(sortBlocked);
  const criticalItems = [...tasks, ...deadlines]
    .filter((item) => item.critical_score >= 5)
    .sort(sortCritical);
  const recurringItems = tasks
    .filter((task) => {
      if (!task.is_recurring) return false;
      const dueDate = parseDate(task.due_date);
      return !dueDate || dueDate < today || task.status_label === 'Bloccata';
    })
    .sort(sortBlocked);

  return {
    blockedItems: blockedItems.slice(0, MAX_ITEMS_PER_BUCKET),
    criticalItems: criticalItems.slice(0, MAX_ITEMS_PER_BUCKET),
    overdueItems: overdueItems.slice(0, MAX_ITEMS_PER_BUCKET),
    recurringItems: recurringItems.slice(0, MAX_ITEMS_PER_BUCKET),
    summary: {
      blocked: blockedItems.length,
      critical: criticalItems.length,
      overdue: overdueItems.length,
      recurring: recurringItems.length,
      this_week: thisWeekItems.length,
      today: todayItems.length,
    },
    thisWeekItems: thisWeekItems.slice(0, MAX_ITEMS_PER_BUCKET),
    todayItems: todayItems.slice(0, MAX_ITEMS_PER_BUCKET),
  };
}
