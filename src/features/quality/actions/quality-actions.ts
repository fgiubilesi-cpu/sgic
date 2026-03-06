"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
    nonConformitySchema,
    correctiveActionSchema,
    NonConformity,
    CorrectiveAction
} from "../schemas/nc-ac.schema";

/**
 * Fetch all Non-Conformities for the current organization
 */
export async function getNCList() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

    if (!profile?.organization_id) throw new Error("Organization not found");

    const { data, error } = await supabase
        .from("non_conformities")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
}

/**
 * Fetch a single Non-Conformity by ID
 */
export async function getNCDetail(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

    if (!profile?.organization_id) throw new Error("Organization not found");

    const { data, error } = await supabase
        .from("non_conformities")
        .select("*, corrective_actions(*)")
        .eq("id", id)
        .eq("organization_id", profile.organization_id)
        .single();

    if (error) throw error;
    return data;
}

/**
 * Create a new Non-Conformity
 */
export async function createNC(formData: NonConformity) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

    if (!profile?.organization_id) throw new Error("Organization not found");

    const validated = nonConformitySchema.parse(formData);

    const { data, error } = await supabase
        .from("non_conformities")
        .insert({
            title: validated.title,
            description: validated.description,
            identified_date: validated.identified_date,
            severity: validated.severity,
            status: validated.status,
            organization_id: profile.organization_id,
        })
        .select()
        .single();

    if (error) throw error;
    revalidatePath("/non-conformities");
    return data;
}

/**
 * Update an existing Non-Conformity
 */
export async function updateNC(id: string, formData: Partial<NonConformity>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

    if (!profile?.organization_id) throw new Error("Organization not found");

    const { data, error } = await supabase
        .from("non_conformities")
        .update({
            ...formData,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("organization_id", profile.organization_id)
        .select()
        .single();

    if (error) throw error;
    revalidatePath("/non-conformities");
    revalidatePath(`/non-conformities/${id}`);
    return data;
}

/**
 * Create a new Corrective Action
 */
export async function createAC(formData: CorrectiveAction) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

    if (!profile?.organization_id) throw new Error("Organization not found");

    const validated = correctiveActionSchema.parse(formData);

    const { data, error } = await supabase
        .from("corrective_actions")
        .insert({
            nc_id: validated.nc_id,
            description: validated.description,
            due_date: validated.due_date,
            status: validated.status,
            organization_id: profile.organization_id,
        })
        .select()
        .single();

    if (error) throw error;
    revalidatePath(`/non-conformities/${validated.nc_id}`);
    return data;
}

/**
 * Update an existing Corrective Action
 */
export async function updateAC(id: string, ncId: string, formData: Partial<CorrectiveAction>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

    if (!profile?.organization_id) throw new Error("Organization not found");

    const { data, error } = await supabase
        .from("corrective_actions")
        .update({
            ...formData,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("organization_id", profile.organization_id)
        .select()
        .single();

    if (error) throw error;
    revalidatePath(`/non-conformities/${ncId}`);
    return data;
}
