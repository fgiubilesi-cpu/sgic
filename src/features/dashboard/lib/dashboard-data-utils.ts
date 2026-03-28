export type Relation<T> = T | T[] | null;

export type NamedRelation = Relation<{ name: string | null }>;
export type TitledRelation = Relation<{ title: string | null }>;

export function getRelationValue<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

export function getRelationName(relation: NamedRelation): string {
  return getRelationValue(relation)?.name ?? "";
}

export function getRelationTitle(relation: TitledRelation): string {
  return getRelationValue(relation)?.title ?? "";
}

export function getFullName(person: {
  first_name: string | null;
  last_name: string | null;
} | null): string {
  if (!person) {
    return "Collaboratore";
  }

  return `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim() || "Collaboratore";
}

export function getStartOfToday(referenceDate = new Date()) {
  return new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function formatDateLabel(dateString: string | null) {
  if (!dateString) return "Senza data";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}
