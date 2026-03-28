"use server";

import { revalidatePath } from "next/cache";
import { assertInternalOperator } from "@/lib/access-control";
import { recordAppEvent } from "@/lib/app-event-log";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import {
    nonConformitySchema,
    correctiveActionSchema,
    NonConformity,
    CorrectiveAction
} from "../schemas/nc-ac.schema";
import { syncNonConformityStatusFromCorrectiveActions } from "../lib/nc-ac-status-sync";
import {
    buildCorrectiveActionInsertPayload,
    buildCorrectiveActionUpdatePayload,
    buildNonConformityInsertPayload,
    buildNonConformityUpdatePayload,
} from "../lib/quality-action-payloads";

async function getQualityContext() {
    const ctx = await getOrganizationContext();
    assertInternalOperator(ctx, "area quality");
    return ctx;
}

/**
 * Fetch all Non-Conformities for the current organization with audit and corrective action info
 */
export async function getNCList() {
    const { supabase, organizationId } = await getQualityContext();

    const { data, error } = await supabase
        .from("non_conformities")
        .select("*, audit:audit_id(id, client_id, location_id, client:client_id(name), location:location_id(name)), corrective_actions(id, target_completion_date, status)")
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
}

/**
 * N6: Fetch only OPEN Non-Conformities for the dashboard (filterable by client)
 */
export async function getOpenNCList(clientId?: string) {
    const { supabase, organizationId } = await getQualityContext();

    let query = supabase
        .from("non_conformities")
        .select("*, audit:audit_id(id, client_id, location_id, client:client_id(name), location:location_id(name)), corrective_actions(id, due_date, target_completion_date, status)")
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .eq("status", "open");

    // N6: Filter by client if specified
    if (clientId) {
        query = query.eq("audit.client_id", clientId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    return data;
}

/**
 * N6: Fetch all clients for the organization (for NC dashboard filtering)
 */
export async function getClientsList() {
    const { supabase, organizationId } = await getQualityContext();

    const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .eq("is_active", true)
        .order("name");

    if (error) throw error;
    return data || [];
}

/**
 * Fetch a single Non-Conformity by ID
 */
export async function getNCDetail(id: string) {
    const { supabase, organizationId } = await getQualityContext();

    const { data, error } = await supabase
        .from("non_conformities")
        .select("*, corrective_actions(*)")
        .eq("id", id)
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .single();

    if (error) throw error;
    return data;
}

/**
 * Create a new Non-Conformity
 */
export async function createNC(formData: NonConformity) {
    const ctx = await getQualityContext();
    const { supabase, organizationId } = ctx;
    const validated = nonConformitySchema.parse(formData);

    const { data, error } = await supabase
        .from("non_conformities")
        .insert(buildNonConformityInsertPayload(validated, organizationId))
        .select()
        .single();

    if (error) throw error;
    await recordAppEvent(ctx, {
        action: "INSERT",
        details: `${data.title ?? "NC"} · ${data.status ?? "open"}`,
        payload: {
            entity: "non_conformity",
            severity: data.severity ?? null,
            status: data.status ?? null,
        },
        recordId: data.id,
        tableName: "quality_events",
        title: "NC creata",
    });
    revalidatePath("/non-conformities");
    return data;
}

/**
 * Update an existing Non-Conformity
 */
export async function updateNC(id: string, formData: Partial<NonConformity>) {
    const ctx = await getQualityContext();
    const { supabase, organizationId } = ctx;
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from("non_conformities")
        .update(buildNonConformityUpdatePayload(formData, now))
        .eq("id", id)
        .eq("organization_id", organizationId)
        .select()
        .single();

    if (error) throw error;
    await recordAppEvent(ctx, {
        action: "UPDATE",
        details: `${data.title ?? "NC"} · ${data.status ?? "open"}`,
        payload: {
            entity: "non_conformity",
            closed_at: data.closed_at ?? null,
            status: data.status ?? null,
        },
        recordId: data.id,
        tableName: "quality_events",
        title: "NC aggiornata",
    });
    revalidatePath("/non-conformities");
    revalidatePath(`/non-conformities/${id}`);
    return data;
}

/**
 * Create a new Corrective Action
 */
export async function createAC(formData: CorrectiveAction) {
    const ctx = await getQualityContext();
    const { supabase, organizationId } = ctx;
    const validated = correctiveActionSchema.parse(formData);

    const { data, error } = await supabase
        .from("corrective_actions")
        .insert(buildCorrectiveActionInsertPayload(validated, organizationId))
        .select()
        .single();

    if (error) throw error;
    await syncNonConformityStatusFromCorrectiveActions({
        nonConformityId: validated.non_conformity_id,
        supabase,
    });
    await recordAppEvent(ctx, {
        action: "INSERT",
        details: `${data.description ?? "AC"} · ${data.status ?? "pending"}`,
        payload: {
            due_date: data.due_date ?? null,
            entity: "corrective_action",
            non_conformity_id: data.non_conformity_id ?? null,
            status: data.status ?? null,
        },
        recordId: data.id,
        tableName: "quality_events",
        title: "AC creata",
    });
    revalidatePath("/non-conformities");
    revalidatePath(`/non-conformities/${validated.non_conformity_id}`);
    return data;
}

/**
 * Update an existing Corrective Action
 */
export async function updateAC(id: string, ncId: string, formData: Partial<CorrectiveAction>) {
    const ctx = await getQualityContext();
    const { supabase, organizationId } = ctx;
    const { data, error } = await supabase
        .from("corrective_actions")
        .update(buildCorrectiveActionUpdatePayload(formData, new Date().toISOString()))
        .eq("id", id)
        .eq("organization_id", organizationId)
        .select()
        .single();

    if (error) throw error;
    await syncNonConformityStatusFromCorrectiveActions({
        nonConformityId: ncId,
        supabase,
    });
    await recordAppEvent(ctx, {
        action: "UPDATE",
        details: `${data.description ?? "AC"} · ${data.status ?? "pending"}`,
        payload: {
            due_date: data.due_date ?? null,
            entity: "corrective_action",
            status: data.status ?? null,
        },
        recordId: data.id,
        tableName: "quality_events",
        title: "AC aggiornata",
    });
    revalidatePath("/non-conformities");
    revalidatePath(`/non-conformities/${ncId}`);
    return data;
}
