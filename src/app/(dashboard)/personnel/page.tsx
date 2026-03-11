import { redirect } from 'next/navigation';
import { getOrganizationContext } from '@/lib/supabase/get-org-context';

export const metadata = {
  title: 'Collaboratori - SGIC',
  description: 'Gestione collaboratori collegati ai clienti',
};

export default async function PersonnelPage() {
  const orgContext = await getOrganizationContext();

  if (!orgContext) {
    redirect('/login');
  }

  redirect('/clients');
}
