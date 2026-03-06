'use server'

import { createClient } from '@/lib/supabase/server'

export async function uploadEvidencePhoto(formData: FormData) {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return { error: "Non autenticato." }

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id) return { error: "Profilo non trovato." }

    const file = formData.get('file') as File
    const auditId = formData.get('auditId') as string
    const itemId = formData.get('itemId') as string

    if (!file || !auditId || !itemId) {
        return { error: 'Payload incompleto.' }
    }

    const organizationId = profile.organization_id;

    // Save file following RLS paths policies securely mapped internally
    const fileName = `${organizationId}/${auditId}/${itemId}-${Date.now()}.webp`

    const { error: uploadError } = await supabase.storage
        .from("audit-evidence")
        .upload(fileName, file)

    if (uploadError) {
        console.error('Storage Upload Error:', uploadError)
        return { error: 'Errore upload Storage.' }
    }

    // Retrieve public URL
    const { data: { publicUrl } } = supabase.storage
        .from("audit-evidence")
        .getPublicUrl(fileName)

    // Explicitly update the Checklist Item with the newly stored URL.
    // Note: the original `updateChecklistItem` Server Action could do this, 
    // but isolating uploads helps separate offline DB limits.
    const { error: dbUpdateError } = await supabase
        .from('checklist_items')
        .update({
            evidence_url: publicUrl,
            updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .eq('organization_id', organizationId) // RLS Double Check

    if (dbUpdateError) {
        console.error('Database Update Error:', dbUpdateError)
        return { error: 'Incoerenza database post-upload.' }
    }

    return { success: true, url: publicUrl }
}
