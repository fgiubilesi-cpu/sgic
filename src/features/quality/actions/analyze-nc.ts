'use server';

import { createClient } from "@/lib/supabase/server";
import { z } from 'zod';

const analysisRequestSchema = z.object({
    title: z.string(),
    description: z.string(),
    severity: z.string(),
});

export type AIAnalysisResult = {
    success: true;
    data: {
        root_cause_analysis: string;
        suggested_action_plan: string;
    };
} | {
    success: false;
    error: string;
};

// Core function that calls the AI Engine
export async function generateAIAnalysis(data: z.infer<typeof analysisRequestSchema>): Promise<AIAnalysisResult> {
    try {
        const validatedData = analysisRequestSchema.parse(data);

        // In a real application, the URL and API key should be environment variables.
        const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';
        const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'secret_internal_key_123';

        const response = await fetch(`${AI_ENGINE_URL}/api/v1/analyze-nc`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-API-Key': INTERNAL_API_KEY,
            },
            body: JSON.stringify(validatedData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('AI Engine Error:', errorText);
            return { success: false, error: `Errore dal motore AI: ${response.status}` };
        }

        const json = await response.json();
        return { success: true, data: json };
    } catch (error) {
        console.error('Failed to generate AI analysis:', error);
        return { success: false, error: "Errore durante la generazione dell'analisi AI." };
    }
}

// Function for AC form (existing NCs)
export async function generateAIAnalysisForNC(ncId: string): Promise<AIAnalysisResult> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Unauthorized access to AI Engine" };
    }

    const { data: nc, error: ncError } = await supabase
        .from("non_conformities")
        .select("title, description, severity")
        .eq("id", ncId)
        .is("deleted_at", null)
        .single();

    if (ncError || !nc) {
        return { success: false, error: "Non-conformity not found" };
    }

    return generateAIAnalysis({
        title: nc.title,
        description: nc.description || "",
        severity: nc.severity || "minor"
    });
}
