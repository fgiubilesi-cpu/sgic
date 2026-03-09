# Fase 2: Client Read-Only Access — Setup & Documentation

**Status:** Foundation Complete (RLS Migration Pending)
**Date:** March 9, 2026
**Implementation:** Role-based access control with database-level security

---

## Overview

Fase 2 implements a client-facing dashboard that provides read-only access to audit results. Client users can view audits, checklists, and non-conformities relevant to their organization, but cannot modify data or access administrative features.

### Key Principles
- **Security:** Role-based access enforced at application and database level
- **Simplicity:** Client users see only what they need
- **Transparency:** Full audit results available without administrative barriers
- **Auditability:** All access logged via database RLS

---

## Architecture

### User Roles

```
┌─ Inspector/Admin
│  ├─ Full audit management (CRUD)
│  ├─ Template management
│  ├─ Non-conformity/AC management
│  ├─ Email draft generation
│  └─ Global dashboard (all audits)
│
└─ Client (NEW)
   ├─ View audits (read-only)
   ├─ View own checklists
   ├─ View own non-conformities
   ├─ Download Excel reports
   └─ Client dashboard (own audits only)
```

### Data Access Control

#### Database Level (RLS Policies)
- **Audits:** Client users filtered by `client_id`
- **Checklist Items:** Filtered through audit→client_id relationship
- **Non-Conformities:** Filtered through audit→client_id relationship
- **Inspectors:** See all audits in their organization_id

#### Application Level
- **Middleware:** Route client users to `/client-dashboard`
- **Navigation:** Show "Client Dashboard" link instead of admin menu
- **UI Components:** Hide Template tab and Email Draft modal
- **Server Actions:** `canManageTemplates()` guard prevents unauthorized edits

---

## Setup Instructions

### 1. Apply RLS Migration

The RLS policies are defined in:
```
supabase/migrations/20260309000001_rls_client_access.sql
```

Apply via Supabase dashboard or CLI:
```bash
# Via Supabase CLI
supabase migration up

# Or manually in Supabase SQL Editor:
# Run the entire migration file
```

**Migration includes:**
- Creates/replaces RLS policies on audits, checklist_items, non_conformities
- Enforces client_id filtering for client users
- Maintains full access for inspectors/admins
- Includes schema reload notification

### 2. Create Test Client User

```sql
-- Create a test client organization (if needed)
INSERT INTO clients (id, name, organization_id, is_active)
VALUES (
  'client-test-001',
  'Test Client Corp',
  'ORG_ID_HERE',
  true
);

-- Create a test client user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at
) VALUES (
  'user-client-001',
  'client@testcorp.example.com',
  crypt('SecurePassword123!', gen_salt('bf')),
  now(),
  now()
);

-- Add profile with client role
INSERT INTO profiles (
  id,
  email,
  organization_id,
  role,
  client_id
) VALUES (
  'user-client-001',
  'client@testcorp.example.com',
  'ORG_ID_HERE',
  'client',
  'client-test-001'
);
```

### 3. Verify Access

#### As Client User:
```
1. Login: client@testcorp.example.com / SecurePassword123!
2. You see: /client-dashboard
3. Navigation shows: "Client Dashboard" link only
4. Audit detail:
   - Checklist tab ✓
   - Non Conformità/AC tab ✓
   - Template tab ✗ (hidden)
   - Email Draft button ✗ (hidden)
5. RLS enforces: Can only see audits with matching client_id
```

#### As Inspector:
```
1. Login: inspector@giubilesi.it / password
2. You see: /dashboard
3. Navigation shows: Dashboard, Audit, etc.
4. Audit detail:
   - Checklist tab ✓
   - Non Conformità/AC tab ✓
   - Template tab ✓ (visible)
   - Email Draft button ✓ (visible)
5. RLS enforces: Can see all audits in organization
```

---

## Code Implementation

### Files Changed

#### New Files
- `src/lib/user-roles.ts` — Role checking utilities
- `src/app/(dashboard)/client-dashboard/page.tsx` — Client dashboard UI
- `src/features/audits/queries/get-client-audits.ts` — Client audit query
- `supabase/migrations/20260309000001_rls_client_access.sql` — RLS policies

#### Modified Files
- `src/lib/supabase/get-org-context.ts` — Added role, clientId to context
- `src/middleware.ts` — Role-based routing at root and client-dashboard
- `src/app/(dashboard)/layout.tsx` — Dynamic navigation based on role
- `src/app/(dashboard)/audits/[id]/page.tsx` — Role-based UI filtering

### Key Components

#### 1. OrgContext Extension
```typescript
interface OrgContext {
  supabase: SupabaseClient;
  userId: string;
  organizationId: string;
  role?: "inspector" | "client" | "admin";    // NEW
  clientId?: string;                           // NEW
}
```

#### 2. Role Checking Utilities
```typescript
// src/lib/user-roles.ts
export async function isInspector(): Promise<boolean>
export async function isClient(): Promise<boolean>
export async function canManageTemplates(): Promise<boolean>
```

#### 3. Client-Specific Query
```typescript
// src/features/audits/queries/get-client-audits.ts
export async function getClientAudits(): Promise<ClientAudit[]> {
  const ctx = await getOrganizationContext();
  if (!ctx || ctx.role !== "client" || !ctx.clientId) return [];

  // Returns audits WHERE client_id = ctx.clientId
}
```

#### 4. RLS Policies (Database)
```sql
-- Clients see only their own audits
CREATE POLICY "clients_see_own_audits" ON audits FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM profiles
      WHERE id = (select auth.uid()::uuid)
      AND role = 'client'
    )
  );

-- Inspectors see all organization audits
CREATE POLICY "inspectors_see_org_audits" ON audits FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = (select auth.uid()::uuid)
      AND role IN ('inspector', 'admin')
    )
  );
```

---

## Security Considerations

### Protection Mechanisms

1. **Database-Level RLS**
   - Enforced by PostgreSQL for all queries
   - Cannot be bypassed by application code
   - Applies to all clients (API, web, mobile)

2. **Application-Level Checks**
   - Role verified in middleware
   - UI elements conditionally rendered
   - Server actions guarded with `canManageTemplates()`

3. **Routing Restrictions**
   - Client users redirected to `/client-dashboard`
   - Cannot access `/templates`, `/organization`
   - Middleware validates all protected routes

### Audit Trail

- All data access logged via database RLS
- PostgreSQL audit_logs table tracks modifications
- Client read-only access immutable by user action

### What Client Users CANNOT Do

- ✗ Modify audit data
- ✗ Create/edit templates
- ✗ Generate email drafts
- ✗ Access other clients' data
- ✗ View organization-level metrics
- ✗ Manage non-conformities/actions (read-only)

### What Client Users CAN Do

- ✓ View their organization's audits
- ✓ Download Excel reports
- ✓ View checklist responses
- ✓ View non-conformities (own audit)
- ✓ Read corrective actions (own audit)
- ✓ Export audit data

---

## Testing Checklist

- [ ] Create test client user with role='client'
- [ ] Assign test client user to test client organization
- [ ] Login as client user
- [ ] Verify redirected to /client-dashboard
- [ ] Verify only own audits visible
- [ ] Verify Template tab hidden in audit detail
- [ ] Verify Email Draft modal hidden
- [ ] Attempt to access /templates (should fail/redirect)
- [ ] Verify RLS blocks unauthorized data access
- [ ] Login as inspector
- [ ] Verify full access maintained
- [ ] Verify inspector can see all audits
- [ ] Test Excel export works for both roles
- [ ] Check audit_logs table for access records

---

## Known Limitations

### Current Implementation
- Client users cannot see NC/AC history before implementation
- Client dashboard shows only audit list (no metrics)
- No email notifications to client users yet
- No timeline/history view for audits

### Future Enhancements (Backlog)
- [ ] Storico audit per cliente: vista timeline
- [ ] NC notification emails to client users
- [ ] Advanced audit filtering by location/date
- [ ] Customizable client dashboard
- [ ] Multi-location metrics for large clients

---

## Troubleshooting

### Client User Cannot Login
- ✓ Verify email in profiles table exists
- ✓ Check role is exactly 'client' (case-sensitive)
- ✓ Confirm client_id is not NULL
- ✓ Verify organization_id matches

### Client Sees No Audits
- ✓ Check RLS policies applied: `SELECT * FROM pg_policies WHERE tablename = 'audits'`
- ✓ Verify audit records have correct client_id
- ✓ Verify profiles.client_id matches audits.client_id
- ✓ Check auth.uid() returns correct user UUID

### Client Sees Other Clients' Data
- ✓ RLS policy may be incomplete
- ✓ Run migration: `20260309000001_rls_client_access.sql`
- ✓ Reload schema: `NOTIFY pgrst, 'reload schema';`
- ✓ Verify `WITH CHECK` clause on INSERT/UPDATE policies

### Template Tab Still Visible
- ✓ Verify `canManageTemplates()` works: check if user.role = 'inspector'
- ✓ Clear browser cache
- ✓ Verify page component imported correctly
- ✓ Check server compilation for errors

---

## References

- **RLS Policies:** `supabase/migrations/20260309000001_rls_client_access.sql`
- **Client Dashboard:** `src/app/(dashboard)/client-dashboard/page.tsx`
- **Role Helpers:** `src/lib/user-roles.ts`
- **OrgContext:** `src/lib/supabase/get-org-context.ts`
- **Middleware:** `src/middleware.ts`

---

## Support

For questions about Fase 2 implementation:
1. Check this documentation
2. Review migration SQL
3. Check test checklist
4. Review client dashboard code
5. Verify RLS policies in PostgreSQL
