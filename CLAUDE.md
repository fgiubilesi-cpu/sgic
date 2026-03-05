# SGIC — Claude Code Instructions

## Stack
- Next.js 16 (App Router), TypeScript 5.x, Supabase (SSR), Sonner, Zod, React Hook Form
- Dev server: `next dev --webpack` (Turbopack is default in Next.js 16 but incompatible with the webpack() callback in next.config.ts — always use `--webpack`)
- Build: `next build --webpack` for the same reason

## Architecture Rules (strict)

### Data flow
```
page.tsx (Server Component)
  → fetches data via queries/
  → passes as props to components/ (Client Components)
```
**Never the reverse.** Client components receive data as props — they do not fetch it themselves.

### Server-only modules
`next/headers`, `@/lib/supabase/server` — ONLY allowed in:
- `src/features/*/actions/*.ts` (must have `'use server'`)
- `src/features/*/queries/*.ts`
- `src/app/**/page.tsx` and `src/app/**/layout.tsx`

**Never import these from a `"use client"` component.** Doing so bundles `next/headers` into the client bundle and crashes at runtime with: *"You're importing a component that needs next/headers."*

### Client components (`components/`)
- No `useEffect` for data fetching
- No direct imports of query files
- No `@/lib/supabase/server` imports
- Receive all data as props from `page.tsx`
- Use `router.refresh()` after mutations to re-sync server state — do NOT re-call queries

### Mutations (`actions/`)
- Every action file must have `'use server'` as its **first line**
- Use Zod for input validation
- Call `revalidatePath(...)` after DB writes
- Return `{ success: true }` or `{ success: false, error: string }`
- Show feedback via Sonner toast in the calling component

### Barrel files (`src/features/*/actions/index.ts`)
**Do NOT add `'use server'` to barrel files.** Next.js only allows directly-defined `async function` exports in a `'use server'` file — `export { … } from '…'` re-exports cause the build error: *"Only async functions are allowed to be exported in a 'use server' file."*

Each leaf action file (`actions.ts`, `template-actions.ts`, etc.) carries its own `'use server'` directive. Webpack traverses to those files and creates RPC stubs correctly without the barrel needing the directive.

### Feature folder pattern
```
src/features/<name>/
  actions/        ← server mutations ('use server' per file, not barrel)
  queries/        ← server data fetching (no 'use server', called from page.tsx)
  components/     ← client components ("use client", receive props only)
  schemas/        ← Zod schemas shared between actions and components
```

## Supabase patterns

### Always use the server client in queries/actions
```ts
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();
```

### Browser client is only for Storage uploads
`@/lib/supabase/client` is acceptable in `checklist-item.tsx` for file uploads — this is intentional. File uploads must stay client-side.

### Avoid N+1 queries
Fetch related data in bulk from `page.tsx` with `Promise.all`, then filter client-side:
```ts
// page.tsx
const [nonConformities, correctiveActions] = await Promise.all([
  getNonConformitiesByAudit(id),
  getCorrectiveActionsByAudit(id),   // bulk, not per-NC
]);
```

### Organization security
Every query must verify `organization_id` matches the authenticated user's org before returning data. The pattern is:
1. `supabase.auth.getUser()` → get user
2. Query `profiles` for `organization_id`
3. Filter all data queries with `.eq("organization_id", profile.organization_id)`

## next.config.ts guards
```ts
serverExternalPackages: ['@supabase/ssr']
```
This forces `@supabase/ssr` to remain server-only and prevents accidental client bundling.

## Common mistakes to avoid
| Mistake | Correct approach |
|---------|-----------------|
| Calling a query function inside `useEffect` | Fetch in `page.tsx`, pass as prop |
| Calling a Server Action inside `useEffect` for data | Create a query file instead, fetch in `page.tsx` |
| Adding `'use server'` to a barrel with re-exports | Remove it; each leaf file has its own |
| Importing from `queries/` inside a `"use client"` component | Pass data as props from `page.tsx` |
| Re-fetching after mutation in a client component | Call `router.refresh()` instead |
