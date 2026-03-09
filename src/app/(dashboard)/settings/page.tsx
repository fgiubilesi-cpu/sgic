import { redirect } from 'next/navigation';
import { getOrganizationContext } from '@/lib/supabase/get-org-context';
import { createClient } from '@/lib/supabase/server';
import { SettingsPage } from '@/features/settings/components/settings-page';

export const metadata = {
  title: 'Impostazioni - SGIC',
  description: 'Impostazioni account e organizzazione',
};

export default async function SettingsRoute() {
  const orgContext = await getOrganizationContext();

  if (!orgContext) {
    redirect('/login');
  }

  const { supabase } = orgContext;

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', orgContext.userId)
    .single();

  // Fetch organization
  const { data: organization } = await supabase
    .from('organizations')
    .select('id, name, vat_number, logo_url')
    .eq('id', orgContext.organizationId)
    .single();

  return (
    <SettingsPage
      profile={profile}
      organization={organization}
    />
  );
}
