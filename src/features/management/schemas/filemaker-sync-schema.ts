import { z } from "zod";

const jsonRecordSchema = z.record(z.string(), z.unknown());

const syncEntityBaseSchema = z.object({
  payload: jsonRecordSchema.optional(),
  source_record_id: z.string().trim().min(1, "source_record_id is required"),
});

export const managementClientSyncSchema = syncEntityBaseSchema.extend({
  account_owner: z.string().trim().optional(),
  active_locations_count: z.number().int().nonnegative().optional(),
  client_code: z.string().trim().optional(),
  client_id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "name is required"),
  service_model: z.string().trim().optional(),
  status: z.string().trim().optional(),
  vat_number: z.string().trim().optional(),
});

export const managementServiceLineSyncSchema = syncEntityBaseSchema.extend({
  annual_value: z.number().nonnegative().optional(),
  cadence: z.string().trim().optional(),
  client_id: z.string().uuid().optional(),
  client_source_record_id: z.string().trim().optional(),
  end_date: z.string().trim().optional(),
  location_id: z.string().uuid().optional(),
  location_source_record_id: z.string().trim().optional(),
  owner_name: z.string().trim().optional(),
  quantity: z.number().nonnegative().optional(),
  service_area: z.string().trim().optional(),
  service_code: z.string().trim().optional(),
  service_name: z.string().trim().min(1, "service_name is required"),
  start_date: z.string().trim().optional(),
  status: z.string().trim().optional(),
});

export const managementContractSyncSchema = syncEntityBaseSchema.extend({
  annual_value: z.number().nonnegative().optional(),
  client_id: z.string().uuid().optional(),
  client_source_record_id: z.string().trim().optional(),
  contract_code: z.string().trim().optional(),
  contract_type: z.string().trim().optional(),
  end_date: z.string().trim().optional(),
  issue_date: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  owner_name: z.string().trim().optional(),
  renewal_date: z.string().trim().optional(),
  start_date: z.string().trim().optional(),
  status: z.string().trim().optional(),
});

export const managementDeadlineSyncSchema = syncEntityBaseSchema.extend({
  client_id: z.string().uuid().optional(),
  client_source_record_id: z.string().trim().optional(),
  deadline_type: z.string().trim().optional(),
  due_date: z.string().trim().min(1, "due_date is required"),
  location_id: z.string().uuid().optional(),
  location_source_record_id: z.string().trim().optional(),
  owner_name: z.string().trim().optional(),
  priority: z.string().trim().optional(),
  status: z.string().trim().optional(),
  title: z.string().trim().min(1, "title is required"),
});

export const managementCapacitySyncSchema = syncEntityBaseSchema.extend({
  client_id: z.string().uuid().optional(),
  client_source_record_id: z.string().trim().optional(),
  location_id: z.string().uuid().optional(),
  location_source_record_id: z.string().trim().optional(),
  owner_name: z.string().trim().optional(),
  period_end: z.string().trim().optional(),
  period_start: z.string().trim().optional(),
  personnel_id: z.string().uuid().optional(),
  planned_fte: z.number().nonnegative().optional(),
  planned_hours: z.number().nonnegative().optional(),
  service_line_source_record_id: z.string().trim().optional(),
  status: z.string().trim().optional(),
});

export const fileMakerManagementSyncSchema = z
  .object({
    capacity: z.array(managementCapacitySyncSchema).default([]),
    clients: z.array(managementClientSyncSchema).default([]),
    contracts: z.array(managementContractSyncSchema).default([]),
    deadlines: z.array(managementDeadlineSyncSchema).default([]),
    dry_run: z.boolean().default(false),
    organization_id: z.string().uuid().optional(),
    organization_slug: z.string().trim().min(1).optional(),
    service_lines: z.array(managementServiceLineSyncSchema).default([]),
    source_system: z.string().trim().min(1).default("filemaker"),
    sync_mode: z.enum(["full", "incremental", "manual"]).default("incremental"),
    sync_scope: z.string().trim().min(1).default("direction"),
  })
  .superRefine((value, ctx) => {
    if (!value.organization_id && !value.organization_slug) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "organization_id or organization_slug is required",
        path: ["organization_id"],
      });
    }
  });

export type FileMakerManagementSyncInput = z.output<typeof fileMakerManagementSyncSchema>;
