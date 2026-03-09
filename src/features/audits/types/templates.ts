/**
 * Template-related types
 * This file contains only type definitions without server-only dependencies.
 */

export type TemplateWithDetails = {
  id: string;
  title: string;
  description: string | null;
  clientId: string | null;
  clientName: string | null;
  questionCount: number;
};
