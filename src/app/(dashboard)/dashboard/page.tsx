import { getOrganizationContext } from "@/lib/organization-context";
import { getAudits } from "@/features/audits/queries/get-audits";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const context = await getOrganizationContext();

  // Se il contesto è nullo o manca l'ID, mostriamo un errore sicuro
  if (!context || !context.organizationId) {
    return (
      <div className="p-10 text-red-600">
        Errore: Sessione o Organizzazione non valida. Per favore effettua di nuovo il login.
      </div>
    );
  }

  // Ora context.organizationId è sicuramente una stringa
  const audits = await getAudits();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Dashboard SGIC</h1>
      <p className="text-zinc-500">Audit attivi: {audits?.length || 0}</p>
    </div>
  );
}