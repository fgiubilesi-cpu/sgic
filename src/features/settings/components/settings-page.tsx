"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Building2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { updateProfile } from "@/features/settings/actions/settings-actions";

interface SettingsPageProps {
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
  } | null;
  organization: {
    id: string;
    name: string;
    vat_number: string | null;
    logo_url: string | null;
  } | null;
}

function getRoleLabel(role?: string | null) {
  switch (role) {
    case "admin":
      return "Admin";
    case "inspector":
      return "Ispettore";
    case "client":
      return "Cliente";
    default:
      return "Utente";
  }
}

export function SettingsPage({ profile, organization }: SettingsPageProps) {
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [profileLoading, setProfileLoading] = useState(false);

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      toast.error("Il nome completo è obbligatorio");
      return;
    }

    setProfileLoading(true);
    try {
      const result = await updateProfile(fullName);
      if (result.success) {
        toast.success("Profilo aggiornato");
      } else {
        toast.error(result.error);
      }
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Account</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Gestisci i dati del tuo profilo e accedi rapidamente alle console amministrative.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-zinc-400" />
              <CardTitle>Profilo utente</CardTitle>
            </div>
            <CardDescription>Aggiorna i dati base del tuo account operativo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Nome completo</label>
              <Input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Es. Mario Rossi"
                autoComplete="name"
                className="h-10"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">Email</label>
                <Input value={profile?.email || ""} readOnly className="h-10 bg-zinc-50" />
                <p className="mt-1 text-xs text-zinc-500">
                  L&apos;email di accesso non è modificabile da questa schermata.
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">Ruolo</label>
                <Input value={getRoleLabel(profile?.role)} readOnly className="h-10 bg-zinc-50" />
                <p className="mt-1 text-xs text-zinc-500">
                  Il ruolo viene gestito dalla console Organizzazione.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleUpdateProfile} disabled={profileLoading}>
                {profileLoading ? "Salvataggio..." : "Salva profilo"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-zinc-400" />
                <CardTitle>Tenant e amministrazione</CardTitle>
              </div>
              <CardDescription>
                La configurazione dell&apos;organizzazione vive ora nella console dedicata.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm font-semibold text-zinc-900">
                  {organization?.name || "Organizzazione non disponibile"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Usa la console Organizzazione per anagrafica tenant, ruoli, regole operative, branding e notifiche.
                </p>
              </div>

              <Button asChild className="w-full justify-between">
                <Link href="/organization">
                  Apri console organizzazione
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-zinc-200 shadow-sm">
            <CardHeader>
              <CardTitle>Scorciatoie utili</CardTitle>
              <CardDescription>Accessi rapidi alle aree più usate dopo il login.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button asChild variant="outline" className="justify-between">
                <Link href="/dashboard">
                  Vai alla dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-between">
                <Link href="/clients">
                  Apri clienti
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-between">
                <Link href="/audits">
                  Apri audit
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
