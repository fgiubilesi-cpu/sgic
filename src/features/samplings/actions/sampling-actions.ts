"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { samplingSchema } from "../schemas/samplings.schema";
import { labResultSchema } from "../schemas/lab-results.schema";
import type { Sampling } from "../schemas/samplings.schema";
import type { LabResult } from "../schemas/lab-results.schema";

type ActionResult<T> = {
    success: boolean;
    data?: T;
    error?: string;
};

type SamplingRecord = Sampling & {
    id: string;
};

type LabResultRecord = LabResult & {
    id: string;
};

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }

    return "Errore sconosciuto";
}

/**
 * Helper to get the current user's organization_id
 */
async function getOrgId() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Utente non autenticato");

    const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

    if (!profile?.organization_id) throw new Error("Organizzazione non trovata");
    return profile.organization_id;
}

export async function createSampling(values: Sampling | unknown): Promise<ActionResult<SamplingRecord>> {
    try {
        const validated = samplingSchema.parse(values);
        const orgId = await getOrgId();
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("samplings")
            .insert({
                title: validated.title,
                matrix: validated.matrix,
                sampling_date: validated.sampling_date,
                client_id: validated.client_id ?? null,
                location_id: validated.location_id ?? null,
                operator_name: validated.operator_name,
                status: validated.status,
                organization_id: orgId,
            })
            .select()
            .single();

        if (error) throw error;

        revalidatePath("/samplings");
        return { success: true, data };
    } catch (error: unknown) {
        console.error("createSampling Error:", error);
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateSampling(id: string, values: Sampling | unknown): Promise<ActionResult<SamplingRecord>> {
    try {
        const validated = samplingSchema.parse(values);
        const orgId = await getOrgId();
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("samplings")
            .update({
                title: validated.title,
                matrix: validated.matrix,
                sampling_date: validated.sampling_date,
                client_id: validated.client_id ?? null,
                location_id: validated.location_id ?? null,
                operator_name: validated.operator_name,
                status: validated.status,
                organization_id: orgId,
            })
            .eq("id", id)
            .eq("organization_id", orgId)
            .select()
            .single();

        if (error) throw error;

        revalidatePath("/samplings");
        revalidatePath(`/samplings/${id}`);
        return { success: true, data };
    } catch (error: unknown) {
        console.error("updateSampling Error:", error);
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createLabResult(values: LabResult | unknown): Promise<ActionResult<LabResultRecord>> {
    try {
        const validated = labResultSchema.parse(values);
        const orgId = await getOrgId();
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("lab_results")
            .insert({
                sampling_id: validated.sampling_id,
                parameter: validated.parameter,
                uom: validated.uom,
                result_value: validated.result_value,
                limit_value: validated.limit_value,
                outcome: validated.outcome,
                organization_id: orgId,
            })
            .select()
            .single();

        if (error) throw error;

        revalidatePath(`/samplings/${validated.sampling_id}`);
        return { success: true, data };
    } catch (error: unknown) {
        console.error("createLabResult Error:", error);
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateLabResult(id: string, values: LabResult | unknown): Promise<ActionResult<LabResultRecord>> {
    try {
        const validated = labResultSchema.parse(values);
        const orgId = await getOrgId();
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("lab_results")
            .update({
                sampling_id: validated.sampling_id,
                parameter: validated.parameter,
                uom: validated.uom,
                result_value: validated.result_value,
                limit_value: validated.limit_value,
                outcome: validated.outcome,
                organization_id: orgId,
            })
            .eq("id", id)
            .eq("organization_id", orgId)
            .select()
            .single();

        if (error) throw error;

        revalidatePath(`/samplings/${validated.sampling_id}`);
        return { success: true, data };
    } catch (error: unknown) {
        console.error("updateLabResult Error:", error);
        return { success: false, error: getErrorMessage(error) };
    }
}
