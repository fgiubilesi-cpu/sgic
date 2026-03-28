import type { PersonnelDetail } from "@/features/personnel/actions/personnel-actions";

export function buildPersonnelSeed(person: PersonnelDetail) {
  return [
    {
      client_id: person.client_id,
      created_at: null,
      email: person.email,
      first_name: person.first_name,
      fm_record_id: null,
      hire_date: person.hire_date,
      id: person.id,
      is_active: person.is_active,
      last_name: person.last_name,
      location_id: person.location_id,
      organization_id: person.organization_id,
      role: person.role,
      tax_code: person.tax_code,
    },
  ];
}

export function getPersonnelNextExpiryLabel(nextExpiryDate: string | null) {
  return nextExpiryDate ?? null;
}
