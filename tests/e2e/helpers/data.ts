import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { E2E_EMAIL, E2E_PASSWORD } from './auth';

function readEnvValue(name: string) {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return '';

  const envFile = fs.readFileSync(envPath, 'utf8');
  const match = envFile.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match?.[1]?.trim() ?? '';
}

export async function getFirstAuditId() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? readEnvValue('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? readEnvValue('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey || !E2E_EMAIL || !E2E_PASSWORD) {
    throw new Error('Missing Supabase or E2E credentials.');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: E2E_EMAIL,
    password: E2E_PASSWORD,
  });

  if (authError) {
    throw new Error(`Unable to authenticate E2E user: ${authError.message}`);
  }

  const { data, error } = await supabase
    .from('audits')
    .select('id')
    .order('scheduled_date', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`Unable to load audit fixtures: ${error.message}`);
  }

  const auditId = data?.[0]?.id;
  if (!auditId) {
    throw new Error('No audits available for template smoke test.');
  }

  return String(auditId);
}
