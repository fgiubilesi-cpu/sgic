import type { PersonnelFormInput } from "@/features/personnel/schemas/personnel-schema";

export function buildPersonnelMutationPayload(input: {
  locationId: string | null;
  organizationId: string;
  validated: PersonnelFormInput;
}) {
  return {
    client_id: input.validated.client_id,
    email: input.validated.email.trim(),
    first_name: input.validated.first_name,
    hire_date: input.validated.hire_date.trim() || null,
    is_active: input.validated.is_active,
    last_name: input.validated.last_name,
    location_id: input.locationId,
    organization_id: input.organizationId,
    role: input.validated.role,
    tax_code: input.validated.tax_code.trim() || null,
  };
}
