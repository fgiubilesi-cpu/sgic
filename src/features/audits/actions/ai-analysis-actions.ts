"use server";

import { NC_SEVERITY_LABELS } from "@/types/database.types";
import type { NCsSeverity } from "@/types/database.types";

interface NCAnalysisResponse {
  root_cause_analysis: string;
  suggested_action_plan: string;
}

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Call the AI Engine to analyze a non-conformity and generate:
 * - Root cause analysis
 * - Suggested action plan
 *
 * The AI Engine is a Python FastAPI service that uses OpenAI GPT-4o
 * to provide ISO 9001 expert analysis.
 */
export async function analyzeNonConformityWithAI(input: {
  title: string;
  description: string;
  severity: NCsSeverity;
}): Promise<ActionResult<NCAnalysisResponse>> {
  try {
    const aiEngineUrl = process.env.AI_ENGINE_URL || "http://localhost:8000";
    const apiKey = process.env.AI_ENGINE_API_KEY || "secret_internal_key_123";

    const response = await fetch(`${aiEngineUrl}/api/v1/analyze-nc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-API-Key": apiKey,
      },
      body: JSON.stringify({
        title: input.title,
        description: input.description,
        severity: NC_SEVERITY_LABELS[input.severity],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `AI Engine returned status ${response.status}`
      );
    }

    const data = (await response.json()) as NCAnalysisResponse;

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `AI analysis failed: ${message}`,
    };
  }
}
