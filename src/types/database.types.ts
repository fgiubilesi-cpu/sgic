export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      action_evidence: {
        Row: {
          corrective_action_id: string
          created_at: string | null
          file_name: string | null
          file_type: string | null
          file_url: string
          id: string
          notes: string | null
          organization_id: string
        }
        Insert: {
          corrective_action_id: string
          created_at?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          notes?: string | null
          organization_id: string
        }
        Update: {
          corrective_action_id?: string
          created_at?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          notes?: string | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_evidence_corrective_action_id_fkey"
            columns: ["corrective_action_id"]
            isOneToOne: false
            referencedRelation: "corrective_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_evidence_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          organization_id: string
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          organization_id: string
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      audit_trail: {
        Row: {
          audit_id: string
          changed_at: string | null
          changed_by: string
          created_at: string | null
          id: string
          new_status: string
          old_status: string | null
          organization_id: string
        }
        Insert: {
          audit_id: string
          changed_at?: string | null
          changed_by: string
          created_at?: string | null
          id?: string
          new_status: string
          old_status?: string | null
          organization_id: string
        }
        Update: {
          audit_id?: string
          changed_at?: string | null
          changed_by?: string
          created_at?: string | null
          id?: string
          new_status?: string
          old_status?: string | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_trail_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_trail_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audits: {
        Row: {
          auditor_id: string | null
          client_id: string | null
          created_at: string | null
          description: string | null
          id: string
          location_id: string | null
          organization_id: string
          scheduled_date: string
          score: number | null
          status: string | null
          template_id: string | null
          title: string
        }
        Insert: {
          auditor_id?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          location_id?: string | null
          organization_id: string
          scheduled_date: string
          score?: number | null
          status?: string | null
          template_id?: string | null
          title: string
        }
        Update: {
          auditor_id?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          location_id?: string | null
          organization_id?: string
          scheduled_date?: string
          score?: number | null
          status?: string | null
          template_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "audits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audits_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audits_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_item_media: {
        Row: {
          audit_id: string
          checklist_item_id: string
          created_at: string
          id: string
          media_kind: string
          mime_type: string | null
          organization_id: string
          original_name: string | null
          storage_path: string
          updated_at: string
        }
        Insert: {
          audit_id: string
          checklist_item_id: string
          created_at?: string
          id?: string
          media_kind?: string
          mime_type?: string | null
          organization_id: string
          original_name?: string | null
          storage_path: string
          updated_at?: string
        }
        Update: {
          audit_id?: string
          checklist_item_id?: string
          created_at?: string
          id?: string
          media_kind?: string
          mime_type?: string | null
          organization_id?: string
          original_name?: string | null
          storage_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_item_media_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_item_media_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_item_media_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          audio_url: string | null
          audit_id: string | null
          checklist_id: string
          created_at: string | null
          evidence_url: string | null
          id: string
          notes: string | null
          organization_id: string | null
          outcome: Database["public"]["Enums"]["audit_outcome_type"] | null
          question: string
          sort_order: number | null
          source_question_id: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          audio_url?: string | null
          audit_id?: string | null
          checklist_id: string
          created_at?: string | null
          evidence_url?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          outcome?: Database["public"]["Enums"]["audit_outcome_type"] | null
          question: string
          sort_order?: number | null
          source_question_id?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          audio_url?: string | null
          audit_id?: string | null
          checklist_id?: string
          created_at?: string | null
          evidence_url?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          outcome?: Database["public"]["Enums"]["audit_outcome_type"] | null
          question?: string
          sort_order?: number | null
          source_question_id?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_items_source_question_id_fkey"
            columns: ["source_question_id"]
            isOneToOne: false
            referencedRelation: "template_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          client_id: string | null
          created_at: string
          description: string | null
          id: string
          organization_id: string | null
          title: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          organization_id?: string | null
          title: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          organization_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_templates_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      checklists: {
        Row: {
          audit_id: string
          created_at: string | null
          id: string
          organization_id: string
          template_id: string | null
          title: string
        }
        Insert: {
          audit_id: string
          created_at?: string | null
          id?: string
          organization_id: string
          template_id?: string | null
          title: string
        }
        Update: {
          audit_id?: string
          created_at?: string | null
          id?: string
          organization_id?: string
          template_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklists_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklists_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklists_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      client_contacts: {
        Row: {
          client_id: string
          created_at: string | null
          department: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          is_primary: boolean | null
          location_id: string | null
          notes: string | null
          organization_id: string
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          department?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          is_primary?: boolean | null
          location_id?: string | null
          notes?: string | null
          organization_id: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          department?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          is_primary?: boolean | null
          location_id?: string | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_contacts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_contracts: {
        Row: {
          activity_frequency: string | null
          attachment_url: string | null
          client_id: string
          client_references: string | null
          contract_type: string
          created_at: string
          duration_terms: string | null
          end_date: string | null
          exercised_activity: string | null
          id: string
          internal_owner: string | null
          issue_date: string | null
          notes: string | null
          organization_id: string
          protocol_code: string | null
          renewal_date: string | null
          service_scope: string | null
          start_date: string | null
          status: string
          supervisor_name: string | null
          updated_at: string
          validity_terms: string | null
        }
        Insert: {
          activity_frequency?: string | null
          attachment_url?: string | null
          client_id: string
          client_references?: string | null
          contract_type?: string
          created_at?: string
          duration_terms?: string | null
          end_date?: string | null
          exercised_activity?: string | null
          id?: string
          internal_owner?: string | null
          issue_date?: string | null
          notes?: string | null
          organization_id: string
          protocol_code?: string | null
          renewal_date?: string | null
          service_scope?: string | null
          start_date?: string | null
          status?: string
          supervisor_name?: string | null
          updated_at?: string
          validity_terms?: string | null
        }
        Update: {
          activity_frequency?: string | null
          attachment_url?: string | null
          client_id?: string
          client_references?: string | null
          contract_type?: string
          created_at?: string
          duration_terms?: string | null
          end_date?: string | null
          exercised_activity?: string | null
          id?: string
          internal_owner?: string | null
          issue_date?: string | null
          notes?: string | null
          organization_id?: string
          protocol_code?: string | null
          renewal_date?: string | null
          service_scope?: string | null
          start_date?: string | null
          status?: string
          supervisor_name?: string | null
          updated_at?: string
          validity_terms?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_deadlines: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string
          id: string
          location_id: string | null
          organization_id: string
          priority: string
          service_line_id: string | null
          source_id: string | null
          source_type: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date: string
          id?: string
          location_id?: string | null
          organization_id: string
          priority?: string
          service_line_id?: string | null
          source_id?: string | null
          source_type?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string
          id?: string
          location_id?: string | null
          organization_id?: string
          priority?: string
          service_line_id?: string | null
          source_id?: string | null
          source_type?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_deadlines_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_deadlines_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_deadlines_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_deadlines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_deadlines_service_line_id_fkey"
            columns: ["service_line_id"]
            isOneToOne: false
            referencedRelation: "client_service_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      client_notes: {
        Row: {
          body: string
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          location_id: string | null
          note_type: string
          organization_id: string
          pinned: boolean
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          location_id?: string | null
          note_type?: string
          organization_id: string
          pinned?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          location_id?: string | null
          note_type?: string
          organization_id?: string
          pinned?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_notes_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_service_lines: {
        Row: {
          active: boolean
          billing_phase: string | null
          client_id: string
          code: string | null
          created_at: string
          frequency_label: string | null
          id: string
          is_recurring: boolean
          location_id: string | null
          notes: string | null
          organization_id: string
          quantity: number | null
          section: string | null
          sort_order: number
          source_document_id: string | null
          title: string
          total_price: number | null
          unit: string | null
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          billing_phase?: string | null
          client_id: string
          code?: string | null
          created_at?: string
          frequency_label?: string | null
          id?: string
          is_recurring?: boolean
          location_id?: string | null
          notes?: string | null
          organization_id: string
          quantity?: number | null
          section?: string | null
          sort_order?: number
          source_document_id?: string | null
          title: string
          total_price?: number | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          billing_phase?: string | null
          client_id?: string
          code?: string | null
          created_at?: string
          frequency_label?: string | null
          id?: string
          is_recurring?: boolean
          location_id?: string | null
          notes?: string | null
          organization_id?: string
          quantity?: number | null
          section?: string | null
          sort_order?: number
          source_document_id?: string | null
          title?: string
          total_price?: number | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_service_lines_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_service_lines_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_service_lines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_service_lines_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      client_tasks: {
        Row: {
          audit_id: string | null
          client_id: string
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_recurring: boolean
          location_id: string | null
          organization_id: string
          owner_name: string | null
          owner_profile_id: string | null
          priority: string
          recurrence_label: string | null
          service_line_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          audit_id?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_recurring?: boolean
          location_id?: string | null
          organization_id: string
          owner_name?: string | null
          owner_profile_id?: string | null
          priority?: string
          recurrence_label?: string | null
          service_line_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          audit_id?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_recurring?: boolean
          location_id?: string | null
          organization_id?: string
          owner_name?: string | null
          owner_profile_id?: string | null
          priority?: string
          recurrence_label?: string | null
          service_line_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_tasks_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_tasks_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_tasks_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_tasks_service_line_id_fkey"
            columns: ["service_line_id"]
            isOneToOne: false
            referencedRelation: "client_service_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string | null
          email: string | null
          fm_record_id: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          updated_at: string | null
          vat_number: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          fm_record_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          updated_at?: string | null
          vat_number?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          fm_record_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          updated_at?: string | null
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      corrective_actions: {
        Row: {
          action_plan: string | null
          closed_at: string | null
          completed_at: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          due_date: string | null
          id: string
          non_conformity_id: string
          organization_id: string
          owner_id: string | null
          responsible_person_email: string | null
          responsible_person_name: string | null
          root_cause: string | null
          status: string | null
          target_completion_date: string | null
          updated_at: string | null
        }
        Insert: {
          action_plan?: string | null
          closed_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          non_conformity_id: string
          organization_id: string
          owner_id?: string | null
          responsible_person_email?: string | null
          responsible_person_name?: string | null
          root_cause?: string | null
          status?: string | null
          target_completion_date?: string | null
          updated_at?: string | null
        }
        Update: {
          action_plan?: string | null
          closed_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          non_conformity_id?: string
          organization_id?: string
          owner_id?: string | null
          responsible_person_email?: string | null
          responsible_person_name?: string | null
          root_cause?: string | null
          status?: string | null
          target_completion_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "corrective_actions_non_conformity_id_fkey"
            columns: ["non_conformity_id"]
            isOneToOne: false
            referencedRelation: "non_conformities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corrective_actions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_entities: {
        Row: {
          confidence: string
          created_at: string
          created_by: string | null
          document_id: string
          entity_payload: Json
          entity_type: string
          extraction_review_id: string | null
          id: string
          linked_record_id: string | null
          linked_table: string | null
          organization_id: string
          updated_at: string
        }
        Insert: {
          confidence?: string
          created_at?: string
          created_by?: string | null
          document_id: string
          entity_payload?: Json
          entity_type: string
          extraction_review_id?: string | null
          id?: string
          linked_record_id?: string | null
          linked_table?: string | null
          organization_id: string
          updated_at?: string
        }
        Update: {
          confidence?: string
          created_at?: string
          created_by?: string | null
          document_id?: string
          entity_payload?: Json
          entity_type?: string
          extraction_review_id?: string | null
          id?: string
          linked_record_id?: string | null
          linked_table?: string | null
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_entities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_entities_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_entities_extraction_review_id_fkey"
            columns: ["extraction_review_id"]
            isOneToOne: false
            referencedRelation: "document_extraction_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_entities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_extraction_reviews: {
        Row: {
          created_at: string
          created_by: string | null
          document_id: string
          id: string
          ingestion_id: string | null
          organization_id: string
          review_action: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewed_payload: Json
          reviewer_notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_id: string
          id?: string
          ingestion_id?: string | null
          organization_id: string
          review_action?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewed_payload?: Json
          reviewer_notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_id?: string
          id?: string
          ingestion_id?: string | null
          organization_id?: string
          review_action?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewed_payload?: Json
          reviewer_notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_extraction_reviews_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_extraction_reviews_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_extraction_reviews_ingestion_id_fkey"
            columns: ["ingestion_id"]
            isOneToOne: false
            referencedRelation: "document_ingestions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_extraction_reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_extraction_reviews_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_ingestions: {
        Row: {
          created_at: string
          created_by: string | null
          document_id: string
          error_message: string | null
          extracted_payload: Json | null
          extracted_text: string | null
          id: string
          organization_id: string
          parser_type: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_id: string
          error_message?: string | null
          extracted_payload?: Json | null
          extracted_text?: string | null
          id?: string
          organization_id: string
          parser_type?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_id?: string
          error_message?: string | null
          extracted_payload?: Json | null
          extracted_text?: string | null
          id?: string
          organization_id?: string
          parser_type?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_ingestions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_ingestions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_ingestions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_ingestions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          created_at: string | null
          document_id: string
          id: string
          organization_id: string
        }
        Insert: {
          created_at?: string | null
          document_id: string
          id?: string
          organization_id: string
        }
        Update: {
          created_at?: string | null
          document_id?: string
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_versions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: Database["public"]["Enums"]["document_category"] | null
          client_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          expiry_date: string | null
          extracted_payload: Json | null
          file_name: string | null
          file_size_bytes: number | null
          file_url: string | null
          id: string
          ingestion_status: string
          issue_date: string | null
          location_id: string | null
          mime_type: string | null
          organization_id: string
          personnel_id: string | null
          status: Database["public"]["Enums"]["document_status"] | null
          storage_path: string | null
          title: string | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["document_category"] | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expiry_date?: string | null
          extracted_payload?: Json | null
          file_name?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          ingestion_status?: string
          issue_date?: string | null
          location_id?: string | null
          mime_type?: string | null
          organization_id: string
          personnel_id?: string | null
          status?: Database["public"]["Enums"]["document_status"] | null
          storage_path?: string | null
          title?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"] | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expiry_date?: string | null
          extracted_payload?: Json | null
          file_name?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          ingestion_status?: string
          issue_date?: string | null
          location_id?: string | null
          mime_type?: string | null
          organization_id?: string
          personnel_id?: string | null
          status?: Database["public"]["Enums"]["document_status"] | null
          storage_path?: string | null
          title?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_personnel_id_fkey"
            columns: ["personnel_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_results: {
        Row: {
          created_at: string | null
          id: string
          limit_value: string | null
          organization_id: string
          outcome: Database["public"]["Enums"]["lab_outcome"]
          parameter: string
          result_value: string | null
          sampling_id: string
          uom: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          limit_value?: string | null
          organization_id: string
          outcome: Database["public"]["Enums"]["lab_outcome"]
          parameter: string
          result_value?: string | null
          sampling_id: string
          uom?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          limit_value?: string | null
          organization_id?: string
          outcome?: Database["public"]["Enums"]["lab_outcome"]
          parameter?: string
          result_value?: string | null
          sampling_id?: string
          uom?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_results_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_results_sampling_id_fkey"
            columns: ["sampling_id"]
            isOneToOne: false
            referencedRelation: "samplings"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          city: string | null
          client_id: string
          created_at: string | null
          fm_record_id: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          organization_id: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          client_id: string
          created_at?: string | null
          fm_record_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          organization_id: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          client_id?: string
          created_at?: string | null
          fm_record_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          organization_id?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      management_capacity_staging: {
        Row: {
          client_id: string | null
          client_source_record_id: string | null
          created_at: string
          id: string
          location_id: string | null
          location_source_record_id: string | null
          organization_id: string
          owner_name: string | null
          payload: Json
          period_end: string | null
          period_start: string | null
          personnel_id: string | null
          planned_fte: number | null
          planned_hours: number | null
          service_line_source_record_id: string | null
          source_record_id: string
          source_system: string
          status: string | null
          sync_run_id: string | null
          synced_at: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          client_source_record_id?: string | null
          created_at?: string
          id?: string
          location_id?: string | null
          location_source_record_id?: string | null
          organization_id: string
          owner_name?: string | null
          payload?: Json
          period_end?: string | null
          period_start?: string | null
          personnel_id?: string | null
          planned_fte?: number | null
          planned_hours?: number | null
          service_line_source_record_id?: string | null
          source_record_id: string
          source_system?: string
          status?: string | null
          sync_run_id?: string | null
          synced_at?: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          client_source_record_id?: string | null
          created_at?: string
          id?: string
          location_id?: string | null
          location_source_record_id?: string | null
          organization_id?: string
          owner_name?: string | null
          payload?: Json
          period_end?: string | null
          period_start?: string | null
          personnel_id?: string | null
          planned_fte?: number | null
          planned_hours?: number | null
          service_line_source_record_id?: string | null
          source_record_id?: string
          source_system?: string
          status?: string | null
          sync_run_id?: string | null
          synced_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "management_capacity_staging_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_capacity_staging_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_capacity_staging_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_capacity_staging_personnel_id_fkey"
            columns: ["personnel_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_capacity_staging_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "management_sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      management_clients_staging: {
        Row: {
          account_owner: string | null
          active_locations_count: number | null
          client_code: string | null
          client_id: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
          payload: Json
          service_model: string | null
          source_record_id: string
          source_system: string
          status: string | null
          sync_run_id: string | null
          synced_at: string
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          account_owner?: string | null
          active_locations_count?: number | null
          client_code?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
          payload?: Json
          service_model?: string | null
          source_record_id: string
          source_system?: string
          status?: string | null
          sync_run_id?: string | null
          synced_at?: string
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          account_owner?: string | null
          active_locations_count?: number | null
          client_code?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          payload?: Json
          service_model?: string | null
          source_record_id?: string
          source_system?: string
          status?: string | null
          sync_run_id?: string | null
          synced_at?: string
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "management_clients_staging_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_clients_staging_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_clients_staging_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "management_sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      management_contracts_staging: {
        Row: {
          annual_value: number | null
          client_id: string | null
          client_source_record_id: string | null
          contract_code: string | null
          contract_type: string | null
          created_at: string
          end_date: string | null
          id: string
          issue_date: string | null
          notes: string | null
          organization_id: string
          owner_name: string | null
          payload: Json
          renewal_date: string | null
          source_record_id: string
          source_system: string
          start_date: string | null
          status: string | null
          sync_run_id: string | null
          synced_at: string
          updated_at: string
        }
        Insert: {
          annual_value?: number | null
          client_id?: string | null
          client_source_record_id?: string | null
          contract_code?: string | null
          contract_type?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          organization_id: string
          owner_name?: string | null
          payload?: Json
          renewal_date?: string | null
          source_record_id: string
          source_system?: string
          start_date?: string | null
          status?: string | null
          sync_run_id?: string | null
          synced_at?: string
          updated_at?: string
        }
        Update: {
          annual_value?: number | null
          client_id?: string | null
          client_source_record_id?: string | null
          contract_code?: string | null
          contract_type?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          organization_id?: string
          owner_name?: string | null
          payload?: Json
          renewal_date?: string | null
          source_record_id?: string
          source_system?: string
          start_date?: string | null
          status?: string | null
          sync_run_id?: string | null
          synced_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "management_contracts_staging_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_contracts_staging_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_contracts_staging_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "management_sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      management_deadlines_staging: {
        Row: {
          client_id: string | null
          client_source_record_id: string | null
          created_at: string
          deadline_type: string | null
          due_date: string
          id: string
          location_id: string | null
          location_source_record_id: string | null
          organization_id: string
          owner_name: string | null
          payload: Json
          priority: string | null
          source_record_id: string
          source_system: string
          status: string | null
          sync_run_id: string | null
          synced_at: string
          title: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          client_source_record_id?: string | null
          created_at?: string
          deadline_type?: string | null
          due_date: string
          id?: string
          location_id?: string | null
          location_source_record_id?: string | null
          organization_id: string
          owner_name?: string | null
          payload?: Json
          priority?: string | null
          source_record_id: string
          source_system?: string
          status?: string | null
          sync_run_id?: string | null
          synced_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          client_source_record_id?: string | null
          created_at?: string
          deadline_type?: string | null
          due_date?: string
          id?: string
          location_id?: string | null
          location_source_record_id?: string | null
          organization_id?: string
          owner_name?: string | null
          payload?: Json
          priority?: string | null
          source_record_id?: string
          source_system?: string
          status?: string | null
          sync_run_id?: string | null
          synced_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "management_deadlines_staging_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_deadlines_staging_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_deadlines_staging_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_deadlines_staging_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "management_sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      management_service_lines_staging: {
        Row: {
          annual_value: number | null
          cadence: string | null
          client_id: string | null
          client_source_record_id: string | null
          created_at: string
          end_date: string | null
          id: string
          location_id: string | null
          location_source_record_id: string | null
          organization_id: string
          owner_name: string | null
          payload: Json
          quantity: number | null
          service_area: string | null
          service_code: string | null
          service_name: string
          source_record_id: string
          source_system: string
          start_date: string | null
          status: string | null
          sync_run_id: string | null
          synced_at: string
          updated_at: string
        }
        Insert: {
          annual_value?: number | null
          cadence?: string | null
          client_id?: string | null
          client_source_record_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          location_id?: string | null
          location_source_record_id?: string | null
          organization_id: string
          owner_name?: string | null
          payload?: Json
          quantity?: number | null
          service_area?: string | null
          service_code?: string | null
          service_name: string
          source_record_id: string
          source_system?: string
          start_date?: string | null
          status?: string | null
          sync_run_id?: string | null
          synced_at?: string
          updated_at?: string
        }
        Update: {
          annual_value?: number | null
          cadence?: string | null
          client_id?: string | null
          client_source_record_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          location_id?: string | null
          location_source_record_id?: string | null
          organization_id?: string
          owner_name?: string | null
          payload?: Json
          quantity?: number | null
          service_area?: string | null
          service_code?: string | null
          service_name?: string
          source_record_id?: string
          source_system?: string
          start_date?: string | null
          status?: string | null
          sync_run_id?: string | null
          synced_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "management_service_lines_staging_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_service_lines_staging_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_service_lines_staging_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_service_lines_staging_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "management_sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      management_sync_runs: {
        Row: {
          created_at: string
          error_summary: string | null
          finished_at: string | null
          id: string
          organization_id: string
          payload: Json
          records_read: number
          records_skipped: number
          records_written: number
          source_system: string
          started_at: string
          status: string
          sync_mode: string
          sync_scope: string
        }
        Insert: {
          created_at?: string
          error_summary?: string | null
          finished_at?: string | null
          id?: string
          organization_id: string
          payload?: Json
          records_read?: number
          records_skipped?: number
          records_written?: number
          source_system?: string
          started_at?: string
          status?: string
          sync_mode?: string
          sync_scope?: string
        }
        Update: {
          created_at?: string
          error_summary?: string | null
          finished_at?: string | null
          id?: string
          organization_id?: string
          payload?: Json
          records_read?: number
          records_skipped?: number
          records_written?: number
          source_system?: string
          started_at?: string
          status?: string
          sync_mode?: string
          sync_scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "management_sync_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_visits: {
        Row: {
          created_at: string
          doctor_name: string | null
          expiry_date: string | null
          fitness_status: string
          id: string
          limitations: string | null
          notes: string | null
          organization_id: string
          personnel_id: string
          protocol: string | null
          updated_at: string
          visit_date: string
        }
        Insert: {
          created_at?: string
          doctor_name?: string | null
          expiry_date?: string | null
          fitness_status?: string
          id?: string
          limitations?: string | null
          notes?: string | null
          organization_id: string
          personnel_id: string
          protocol?: string | null
          updated_at?: string
          visit_date: string
        }
        Update: {
          created_at?: string
          doctor_name?: string | null
          expiry_date?: string | null
          fitness_status?: string
          id?: string
          limitations?: string | null
          notes?: string | null
          organization_id?: string
          personnel_id?: string
          protocol?: string | null
          updated_at?: string
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_visits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_visits_personnel_id_fkey"
            columns: ["personnel_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      nc_documents: {
        Row: {
          created_at: string
          document_id: string
          id: string
          non_conformity_id: string
          note: string | null
          organization_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          non_conformity_id: string
          note?: string | null
          organization_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          non_conformity_id?: string
          note?: string | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nc_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nc_documents_non_conformity_id_fkey"
            columns: ["non_conformity_id"]
            isOneToOne: false
            referencedRelation: "non_conformities"
            referencedColumns: ["id"]
          },
        ]
      }
      non_conformities: {
        Row: {
          audit_id: string | null
          checklist_item_id: string | null
          closed_at: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          evidence_url: string | null
          id: string
          organization_id: string
          severity: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          audit_id?: string | null
          checklist_item_id?: string | null
          closed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          evidence_url?: string | null
          id?: string
          organization_id: string
          severity?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          audit_id?: string | null
          checklist_item_id?: string | null
          closed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          evidence_url?: string | null
          id?: string
          organization_id?: string
          severity?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "non_conformities_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "non_conformities_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "non_conformities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          is_platform_owner: boolean | null
          logo_url: string | null
          name: string
          settings: Json
          slug: string
          updated_at: string | null
          vat_number: string | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_platform_owner?: boolean | null
          logo_url?: string | null
          name: string
          settings?: Json
          slug: string
          updated_at?: string | null
          vat_number?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_platform_owner?: boolean | null
          logo_url?: string | null
          name?: string
          settings?: Json
          slug?: string
          updated_at?: string | null
          vat_number?: string | null
          version?: number | null
        }
        Relationships: []
      }
      personnel: {
        Row: {
          client_id: string | null
          created_at: string | null
          email: string | null
          first_name: string
          fm_record_id: string | null
          hire_date: string | null
          id: string
          is_active: boolean
          last_name: string
          location_id: string | null
          organization_id: string
          role: string | null
          tax_code: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          fm_record_id?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean
          last_name?: string
          location_id?: string | null
          organization_id: string
          role?: string | null
          tax_code?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          fm_record_id?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean
          last_name?: string
          location_id?: string | null
          organization_id?: string
          role?: string | null
          tax_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personnel_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personnel_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personnel_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          client_id: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          organization_id: string | null
          role: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          avatar_url?: string | null
          client_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          organization_id?: string | null
          role?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          avatar_url?: string | null
          client_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          organization_id?: string | null
          role?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      risks: {
        Row: {
          category: Database["public"]["Enums"]["risk_category"]
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          impact: number
          mitigation_plan: string | null
          organization_id: string
          owner_email: string | null
          owner_name: string | null
          probability: number
          review_date: string | null
          risk_score: number | null
          status: Database["public"]["Enums"]["risk_status"]
          title: string
          updated_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["risk_category"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          impact: number
          mitigation_plan?: string | null
          organization_id: string
          owner_email?: string | null
          owner_name?: string | null
          probability: number
          review_date?: string | null
          risk_score?: number | null
          status?: Database["public"]["Enums"]["risk_status"]
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["risk_category"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          impact?: number
          mitigation_plan?: string | null
          organization_id?: string
          owner_email?: string | null
          owner_name?: string | null
          probability?: number
          review_date?: string | null
          risk_score?: number | null
          status?: Database["public"]["Enums"]["risk_status"]
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      samplings: {
        Row: {
          client_id: string | null
          created_at: string | null
          id: string
          location_id: string | null
          matrix: string | null
          operator_name: string | null
          organization_id: string
          sampling_date: string | null
          status: string | null
          title: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          location_id?: string | null
          matrix?: string | null
          operator_name?: string | null
          organization_id: string
          sampling_date?: string | null
          status?: string | null
          title?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          location_id?: string | null
          matrix?: string | null
          operator_name?: string | null
          organization_id?: string
          sampling_date?: string | null
          status?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "samplings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "samplings_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "samplings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      template_questions: {
        Row: {
          deleted_at: string | null
          id: string
          question: string
          sort_order: number | null
          template_id: string | null
          weight: number | null
        }
        Insert: {
          deleted_at?: string | null
          id?: string
          question: string
          sort_order?: number | null
          template_id?: string | null
          weight?: number | null
        }
        Update: {
          deleted_at?: string | null
          id?: string
          question?: string
          sort_order?: number | null
          template_id?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "template_questions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      training_courses: {
        Row: {
          category: string
          client_id: string | null
          created_at: string | null
          duration_hours: number
          id: string
          location_id: string | null
          organization_id: string
          title: string
          validity_months: number | null
        }
        Insert: {
          category?: string
          client_id?: string | null
          created_at?: string | null
          duration_hours?: number
          id?: string
          location_id?: string | null
          organization_id: string
          title?: string
          validity_months?: number | null
        }
        Update: {
          category?: string
          client_id?: string | null
          created_at?: string | null
          duration_hours?: number
          id?: string
          location_id?: string | null
          organization_id?: string
          title?: string
          validity_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "training_courses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_courses_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_courses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      training_records: {
        Row: {
          certificate_url: string | null
          completion_date: string
          course_id: string
          created_at: string | null
          expiry_date: string | null
          id: string
          organization_id: string
          personnel_id: string
        }
        Insert: {
          certificate_url?: string | null
          completion_date?: string
          course_id: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          organization_id: string
          personnel_id: string
        }
        Update: {
          certificate_url?: string | null
          completion_date?: string
          course_id?: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          organization_id?: string
          personnel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_records_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_records_personnel_id_fkey"
            columns: ["personnel_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_organization_id: { Args: never; Returns: string }
      get_user_role: { Args: never; Returns: string }
    }
    Enums: {
      audit_outcome_type:
        | "compliant"
        | "non_compliant"
        | "not_applicable"
        | "pending"
      document_category:
        | "Procedure"
        | "Manual"
        | "Instruction"
        | "Form"
        | "Contract"
        | "Certificate"
        | "Other"
        | "OrgChart"
        | "Authorization"
        | "Registry"
        | "Report"
      document_status: "draft" | "published" | "archived"
      lab_outcome: "compliant" | "non_compliant" | "warning"
      risk_category: "Strategic" | "Operational" | "Financial" | "Compliance"
      risk_status: "identified" | "assessed" | "treated" | "monitored"
      sampling_status: "planned" | "sampled" | "sent_to_lab" | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      audit_outcome_type: [
        "compliant",
        "non_compliant",
        "not_applicable",
        "pending",
      ],
      document_category: [
        "Procedure",
        "Manual",
        "Instruction",
        "Form",
        "Contract",
        "Certificate",
        "Other",
        "OrgChart",
        "Authorization",
        "Registry",
        "Report",
      ],
      document_status: ["draft", "published", "archived"],
      lab_outcome: ["compliant", "non_compliant", "warning"],
      risk_category: ["Strategic", "Operational", "Financial", "Compliance"],
      risk_status: ["identified", "assessed", "treated", "monitored"],
      sampling_status: ["planned", "sampled", "sent_to_lab", "completed"],
    },
  },
} as const
