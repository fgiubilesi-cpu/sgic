import { readdirSync } from "node:fs";
import { join } from "node:path";
import packageJson from "../../../../package.json";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";

export type OrganizationSystemSnapshot = {
  environment: string;
  latestLocalMigration: string | null;
  localMigrationsCount: number;
  releaseCommand: string;
  supabaseConfigured: boolean;
  version: string;
};

export async function getOrganizationSystemSnapshot(): Promise<OrganizationSystemSnapshot | null> {
  const ctx = await getOrganizationContext();
  if (!ctx) return null;

  const migrationsDir = join(process.cwd(), "supabase", "migrations");
  const localMigrations = readdirSync(migrationsDir).filter((file) => file.endsWith(".sql")).sort();

  return {
    environment: process.env.NODE_ENV ?? "development",
    latestLocalMigration: localMigrations.at(-1) ?? null,
    localMigrationsCount: localMigrations.length,
    releaseCommand: "npm run verify:release",
    supabaseConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    version: packageJson.version,
  };
}
