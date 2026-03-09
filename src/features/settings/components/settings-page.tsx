'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  updateProfile,
  updateOrganization,
  updateOrganizationLogo,
} from '@/features/settings/actions/settings-actions'

interface SettingsPageProps {
  profile: {
    id: string
    email: string
    full_name: string | null
    role: string
  } | null
  organization: {
    id: string
    name: string
    vat_number: string | null
    logo_url: string | null
  } | null
}

export function SettingsPage({ profile, organization }: SettingsPageProps) {
  // Profile state
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [profileLoading, setProfileLoading] = useState(false)

  // Organization state
  const [orgName, setOrgName] = useState(organization?.name || '')
  const [vatNumber, setVatNumber] = useState(organization?.vat_number || '')
  const [logoUrl, setLogoUrl] = useState(organization?.logo_url || '')
  const [orgLoading, setOrgLoading] = useState(false)

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      toast.error('Il nome completo è obbligatorio')
      return
    }

    setProfileLoading(true)
    try {
      const result = await updateProfile(fullName)
      if (result.success) {
        toast.success('Profilo aggiornato')
      } else {
        toast.error(result.error)
      }
    } finally {
      setProfileLoading(false)
    }
  }

  const handleUpdateOrganization = async () => {
    if (!orgName.trim()) {
      toast.error('Il nome dell\'organizzazione è obbligatorio')
      return
    }

    setOrgLoading(true)
    try {
      const result = await updateOrganization({
        name: orgName,
        vat_number: vatNumber || undefined,
      })
      if (result.success) {
        toast.success('Organizzazione aggiornata')
      } else {
        toast.error(result.error)
      }
    } finally {
      setOrgLoading(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setOrgLoading(true)
    try {
      // TODO: Implement Supabase Storage upload
      // For now, we'll just show a placeholder message
      toast.info('Upload logo: implementazione in corso')
      setOrgLoading(false)
    } catch (err) {
      console.error('Error uploading logo:', err)
      toast.error('Errore durante l\'upload del logo')
      setOrgLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Impostazioni</h1>
        <p className="text-sm text-gray-600 mt-1">
          Gestisci il tuo profilo e le impostazioni dell'organizzazione
        </p>
      </div>

      <div className="grid gap-6">
        {/* PROFILO CARD */}
        <Card>
          <CardHeader>
            <CardTitle>Profilo</CardTitle>
            <CardDescription>Informazioni del tuo account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-700 block mb-1.5">
                Nome Completo
              </label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Es. Mario Rossi"
                className="h-9"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-700 block mb-1.5">
                Email
              </label>
              <Input
                value={profile?.email || ''}
                readOnly
                className="h-9 bg-zinc-100"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Non modificabile per motivi di sicurezza
              </p>
            </div>

            <Button
              onClick={handleUpdateProfile}
              disabled={profileLoading}
              className="w-full sm:w-auto"
            >
              {profileLoading ? 'Salvataggio...' : 'Salva profilo'}
            </Button>
          </CardContent>
        </Card>

        {/* ORGANIZZAZIONE CARD */}
        <Card>
          <CardHeader>
            <CardTitle>Organizzazione</CardTitle>
            <CardDescription>Dettagli dell'organizzazione</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo */}
            <div>
              <label className="text-sm font-medium text-zinc-700 block mb-1.5">
                Logo
              </label>
              {logoUrl && (
                <div className="mb-3">
                  <img
                    src={logoUrl}
                    alt="Logo organizzazione"
                    className="h-20 w-20 rounded-lg object-contain border border-zinc-200"
                  />
                </div>
              )}
              <label className="inline-flex items-center gap-2 px-3 py-2 border border-zinc-200 rounded-lg hover:bg-zinc-50 cursor-pointer text-sm font-medium">
                <Upload className="w-4 h-4" />
                Carica logo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={orgLoading}
                  className="hidden"
                />
              </label>
            </div>

            {/* Organization Name */}
            <div>
              <label className="text-sm font-medium text-zinc-700 block mb-1.5">
                Nome Organizzazione
              </label>
              <Input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Es. Giubilesi Associati"
                className="h-9"
              />
            </div>

            {/* VAT Number */}
            <div>
              <label className="text-sm font-medium text-zinc-700 block mb-1.5">
                Partita IVA
              </label>
              <Input
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                placeholder="Es. 12345678901"
                className="h-9"
              />
            </div>

            <Button
              onClick={handleUpdateOrganization}
              disabled={orgLoading}
              className="w-full sm:w-auto"
            >
              {orgLoading ? 'Salvataggio...' : 'Salva organizzazione'}
            </Button>
          </CardContent>
        </Card>

        {/* NOTIFICHE CARD */}
        <Card>
          <CardHeader>
            <CardTitle>Notifiche</CardTitle>
            <CardDescription>Impostazioni notifiche</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-zinc-200 rounded-lg bg-zinc-50">
              <div>
                <p className="text-sm font-medium text-zinc-700">
                  Email NC Scadute
                </p>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Ricevi notifiche per non conformità in scadenza
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  disabled
                  className="w-4 h-4 cursor-not-allowed"
                />
                <Badge variant="secondary" className="text-xs">
                  Prossimamente
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
