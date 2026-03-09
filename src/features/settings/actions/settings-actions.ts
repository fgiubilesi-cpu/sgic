'use server'

import { revalidatePath } from 'next/cache'
import { getOrganizationContext } from '@/lib/supabase/get-org-context'

type ActionResult = { success: true } | { success: false; error: string }

/**
 * Update user profile full_name
 */
export async function updateProfile(fullName: string): Promise<ActionResult> {
  const ctx = await getOrganizationContext()
  if (!ctx) return { success: false, error: 'Not authenticated.' }

  const { supabase, userId } = ctx

  if (!fullName.trim()) {
    return { success: false, error: 'Full name cannot be empty.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName.trim() })
    .eq('id', userId)

  if (error) {
    console.error('Error updating profile:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/settings')
  return { success: true }
}

/**
 * Update organization details
 */
export async function updateOrganization(data: {
  name: string
  vat_number?: string
}): Promise<ActionResult> {
  const ctx = await getOrganizationContext()
  if (!ctx) return { success: false, error: 'Not authenticated.' }

  const { supabase, organizationId } = ctx

  if (!data.name.trim()) {
    return { success: false, error: 'Organization name cannot be empty.' }
  }

  const updateData: Record<string, unknown> = {
    name: data.name.trim(),
  }

  if (data.vat_number !== undefined) {
    updateData.vat_number = data.vat_number.trim() || null
  }

  const { error } = await supabase
    .from('organizations')
    .update(updateData)
    .eq('id', organizationId)

  if (error) {
    console.error('Error updating organization:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/settings')
  return { success: true }
}

/**
 * Update organization logo URL
 */
export async function updateOrganizationLogo(logoUrl: string): Promise<ActionResult> {
  const ctx = await getOrganizationContext()
  if (!ctx) return { success: false, error: 'Not authenticated.' }

  const { supabase, organizationId } = ctx

  const { error } = await supabase
    .from('organizations')
    .update({ logo_url: logoUrl })
    .eq('id', organizationId)

  if (error) {
    console.error('Error updating logo:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/settings')
  return { success: true }
}
