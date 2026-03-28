'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { assertInternalOperator } from '@/lib/access-control'
import { getOrganizationContext } from '@/lib/supabase/get-org-context'
import { auditOutcomeSchema } from '@/features/audits/schemas/audit-schema'
import { getAuditSummary } from '@/features/audits/queries/get-audit-summary'

// --- 1. UPDATE CHECKLIST ITEM ---

const UpdateItemSchema = z.object({
  itemId: z.string().uuid(),
  outcome: auditOutcomeSchema.optional(),
  notes: z.string().optional(),
  evidenceUrl: z.string().url().optional().or(z.literal('')),
  path: z.string(),
})

export async function updateChecklistItem(formData: FormData) {
  const ctx = await getOrganizationContext()
  try {
    assertInternalOperator(ctx, 'audit checklist')
  } catch {
    return { error: 'Not authenticated.' }
  }

  const { supabase, organizationId } = ctx

  const rawData = {
    itemId: formData.get('itemId'),
    outcome: formData.get('outcome') || undefined,
    notes: formData.get('notes') || undefined,
    evidenceUrl: formData.get('evidenceUrl') || undefined,
    path: formData.get('path')
  }

  const result = UpdateItemSchema.safeParse(rawData)
  if (!result.success) {
    return { error: "Invalid data." }
  }

  const { itemId, outcome, notes, evidenceUrl, path } = result.data

  // Verify checklist item belongs to user's organization and get checklist_id + question
  const { data: item } = await supabase
    .from('checklist_items')
    .select('organization_id, checklist_id, question, outcome')
    .eq('id', itemId)
    .single()

  if (!item || item.organization_id !== organizationId) {
    return { error: "Unauthorized." }
  }

  // Get audit_id from checklists table (checklist_items only has checklist_id FK)
  const { data: checklist } = await supabase
    .from('checklists')
    .select('audit_id')
    .eq('id', item.checklist_id)
    .single()

  if (!checklist) {
    return { error: "Checklist not found." }
  }

  const auditId = checklist.audit_id

  const updateData: Record<string, string> = {
    updated_at: new Date().toISOString()
  }

  if (outcome) updateData.outcome = outcome
  if (notes !== undefined) updateData.notes = notes
  if (evidenceUrl !== undefined) updateData.evidence_url = evidenceUrl

  const { error } = await supabase
    .from('checklist_items')
    .update(updateData)
    .eq('id', itemId)

  if (error) {
    console.error("Supabase Update Error:", error)
    return { error: "Failed to save." }
  }

  // Handle Non-Conformities: create or cancel based on outcome change
  let ncCreated = false
  let ncCancelled = false

  if (outcome) {
    if (outcome === 'non_compliant') {
      // Check if NC already exists for this item (open or cancelled)
      const { data: existingNC } = await supabase
        .from('non_conformities')
        .select('id, status')
        .eq('checklist_item_id', itemId)
        .eq('status', 'open')
        .maybeSingle()

      // If no open NC exists, create one
      if (!existingNC) {
        const { error: ncError } = await supabase
          .from('non_conformities')
          .insert({
            audit_id: auditId,
            checklist_item_id: itemId,
            organization_id: organizationId,
            title: item.question || 'Non-Conformity',
            description: item.question || 'Item marked as non-compliant',
            severity: 'minor',
            status: 'open',
          })

        if (ncError) {
          return { success: false, error: `NC creation failed: ${ncError.message}` }
        } else {
          ncCreated = true
        }
      }
    } else if (outcome !== item.outcome) {
      // Outcome changed away from non_compliant — cancel any open NCs
      const { data: openNC } = await supabase
        .from('non_conformities')
        .select('id')
        .eq('checklist_item_id', itemId)
        .eq('status', 'open')
        .maybeSingle()

      if (openNC) {
        const { error: cancelError } = await supabase
          .from('non_conformities')
          .update({ status: 'closed', closed_at: new Date().toISOString() })
          .eq('checklist_item_id', itemId)
          .eq('status', 'open')

        if (cancelError) {
          console.error('Failed to cancel non-conformity:', cancelError)
        } else {
          ncCancelled = true
        }
      }
    }
  }

  // Recalculate and save audit score
  try {
    const summary = await getAuditSummary(auditId)
    await supabase
      .from('audits')
      .update({ score: summary.compliancePercentage })
      .eq('id', auditId)
  } catch (scoreError) {
    console.error("Failed to update audit score:", scoreError)
    // Don't fail the whole operation if score calculation fails
  }

  revalidatePath(path)
  return { success: true, ncCreated, ncCancelled }
}

// --- 2. UPDATE AUDIT STATUS ---

const UpdateAuditStatusSchema = z.object({
  auditId: z.string().uuid(),
  status: z.enum(['Scheduled', 'In Progress', 'Review', 'Closed']),
})

export async function updateAuditStatus(auditId: string, status: string) {
  const ctx = await getOrganizationContext()
  try {
    assertInternalOperator(ctx, 'stato audit')
  } catch {
    return { error: 'Not authenticated.' }
  }

  const { supabase, userId, organizationId } = ctx

  const result = UpdateAuditStatusSchema.safeParse({ auditId, status })
  if (!result.success) {
    return { error: "Invalid data." }
  }

  // Verify audit belongs to user's organization
  const { data: audit } = await supabase
    .from('audits')
    .select('organization_id, status')
    .eq('id', result.data.auditId)
    .single()

  if (!audit || audit.organization_id !== organizationId) {
    return { error: "Unauthorized." }
  }

  const updatedAt = new Date().toISOString()
  const { error } = await supabase
    .from('audits')
    .update({ status: result.data.status, updated_at: updatedAt })
    .eq('id', result.data.auditId)

  if (error) {
    console.error("Supabase Update Audit Status Error:", error)
    return { error: "Failed to update audit status." }
  }

  // Log status change to audit trail
  const { error: trailError } = await supabase
    .from('audit_trail')
    .insert({
      audit_id: result.data.auditId,
      organization_id: organizationId,
      old_status: audit.status || null,
      new_status: result.data.status,
      changed_by: userId,
      changed_at: updatedAt,
    })

  if (trailError) {
    console.error("Failed to log audit trail:", trailError)
    // Don't fail the operation if trail logging fails
  }

  revalidatePath(`/audits/${auditId}`)
  revalidatePath('/audits')
  return { success: true }
}

// --- 3. CREATE AUDIT FROM TEMPLATE ---

const CreateAuditFromTemplateSchema = z.object({
  title: z.string().min(3),
  scheduled_date: z.string().optional(),
  templateId: z.string().uuid(),
  client_id: z.string().uuid(),
  location_id: z.string().uuid(),
})

export async function createAuditFromTemplate(input: {
  title: string
  scheduled_date?: string
  templateId: string
  client_id: string
  location_id: string
}): Promise<{ success: true; auditId: string } | { success: false; error: string }> {
  try {
    const ctx = await getOrganizationContext()
    if (!ctx) return { success: false, error: 'Not authenticated.' }

    const { supabase, organizationId } = ctx

    const result = CreateAuditFromTemplateSchema.safeParse(input)
    if (!result.success) {
      console.error('ZOD VALIDATION ERROR:', JSON.stringify(result.error.flatten(), null, 2))
      return { success: false, error: JSON.stringify(result.error.flatten()) }
    }

    const { title, scheduled_date, templateId, client_id, location_id } = result.data

    const { data: template, error: templateError } = await supabase
      .from('checklist_templates')
      .select('id, title')
      .eq('id', templateId)
      .eq('organization_id', organizationId)
      .single()

    if (templateError || !template) {
      return { success: false, error: 'Template non trovato.' }
    }

    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .insert({
        title,
        status: 'Scheduled',
        scheduled_date: scheduled_date || null,
        organization_id: organizationId,
        template_id: templateId,
        client_id,
        location_id,
      })
      .select()
      .single()

    if (auditError || !audit) {
      console.error("Error creating audit:", auditError)
      return { success: false, error: "Unable to create audit." }
    }

    // Step 2: Create checklists record (intermediate table: audits → checklists → checklist_items)
    const { data: checklist, error: checklistError } = await supabase
      .from('checklists')
      .insert({
        audit_id: audit.id,
        title: template.title || title,
        organization_id: organizationId,
        template_id: templateId,
      })
      .select()
      .single()

    if (checklistError || !checklist) {
      console.error('CHECKLIST ERROR:', JSON.stringify(checklistError, null, 2))
      console.error('Checklist data:', checklist)
      throw checklistError || new Error('No checklist data returned')
    }

    // Step 3: Copy template questions to checklist items (critical for ISO 9001)
    // Only copy active (non-soft-deleted) questions
    // Each checklist item gets BOTH a snapshot of the question text AND a reference to the source
    const { data: questions } = await supabase
      .from('template_questions')
      .select('*')
      .eq('template_id', templateId)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true })

    if (questions && questions.length > 0) {
      const checklistItems = questions.map(q => ({
        checklist_id: checklist.id,  // FK to checklists (not audit_id)
        
        source_question_id: q.id,    // Reference to original template question (audit trail)
        question: q.question,        // Snapshot of question text (what was actually audited)
        organization_id: organizationId,
        outcome: 'pending',
        sort_order: q.sort_order,
      }))

      const { error: itemsError } = await supabase
        .from('checklist_items')
        .insert(checklistItems)

      if (itemsError) {
        console.error("Error copying questions:", itemsError)
      }
    }

    revalidatePath('/audits')
    revalidatePath(`/audits/${audit.id}`)
    return { success: true, auditId: audit.id }
  } catch (error) {
    console.error('CREATE AUDIT ERROR:', JSON.stringify(error, null, 2))
    console.error('[createAuditFromTemplate] Unexpected error:', error)
    console.error('[createAuditFromTemplate] Error stack:', error instanceof Error ? error.stack : 'N/A')
    return {
      success: false,
      error: error instanceof Error ? error.message : JSON.stringify(error)
    }
  }
}

// --- 4. CLONE TEMPLATE FOR CLIENT ---

const CloneTemplateForClientSchema = z.object({
  templateId: z.string().uuid(),
  clientId: z.string().uuid(),
})

export async function cloneTemplateForClient(input: {
  templateId: string
  clientId: string
}): Promise<{ success: true; templateId: string } | { success: false; error: string }> {
  const ctx = await getOrganizationContext()
  if (!ctx) return { success: false, error: 'Not authenticated.' }

  const { supabase, organizationId } = ctx

  const result = CloneTemplateForClientSchema.safeParse(input)
  if (!result.success) {
    return { success: false, error: 'Invalid input data.' }
  }

  const { templateId, clientId } = result.data

  // Verify template and client belong to user's organization
  const { data: template } = await supabase
    .from('checklist_templates')
    .select('id, title, description')
    .eq('id', templateId)
    .eq('organization_id', organizationId)
    .single()

  if (!template) {
    return { success: false, error: 'Template not found.' }
  }

  const { data: client } = await supabase
    .from('clients')
    .select('id, name')
    .eq('id', clientId)
    .eq('organization_id', organizationId)
    .single()

  if (!client) {
    return { success: false, error: 'Client not found.' }
  }

  // Create new cloned template
  const newTitle = `${template.title} (${client.name})`
  const { data: newTemplate, error: templateError } = await supabase
    .from('checklist_templates')
    .insert({
      organization_id: organizationId,
      client_id: clientId,
      title: newTitle,
      description: template.description,
    })
    .select()
    .single()

  if (templateError || !newTemplate) {
    console.error('Error cloning template:', templateError)
    return { success: false, error: 'Failed to clone template.' }
  }

  // Copy all questions from original template
    const { data: sourceQuestions } = await supabase
      .from('template_questions')
      .select('question, sort_order')
    .eq('template_id', templateId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })

  if (sourceQuestions && sourceQuestions.length > 0) {
    const newQuestions = sourceQuestions.map((q) => ({
      template_id: newTemplate.id,
      question: q.question,
      sort_order: q.sort_order,
    }))

    const { error: questionsError } = await supabase
      .from('template_questions')
      .insert(newQuestions)

    if (questionsError) {
      console.error('Error copying questions:', questionsError)
    }
  }

  revalidatePath('/templates')
  return { success: true, templateId: newTemplate.id }
}
