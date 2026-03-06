# SGIC — Sistema di Gestione Ispezioni e Conformità
## Documento di contesto per agenti di sviluppo
> Leggi questo file per intero prima di toccare qualsiasi file del progetto.

---

## 1. Cos'è SGIC

Piattaforma SaaS multi-tenant per **Giubilesi Associati** — società di consulenza food safety.
Giubilesi usa SGIC internamente per gestire audit, non conformità, campionamenti, formazione e documentazione per i propri clienti (ristoranti, GDO, aziende food).

**Fase attuale: Fase 1 — uso interno Giubilesi, nessun accesso cliente ancora attivo.**

---

## 2. Stack Tecnico

| Layer | Tecnologia | Versione |
|---|---|---|
| Framework | Next.js App Router | latest |
| Language | TypeScript | 5.x strict |
| UI | Tailwind CSS + shadcn/ui | latest |
| Validazione | Zod | schema-first ovunque |
| Backend | Supabase (PostgreSQL + Auth + Storage) | latest |
| Toast | Sonner | unico sistema toast |
| Offline | Service Worker + IndexedDB | lib/offline/ |
| Speech | Web Speech API | hooks/use-speech-recognition.ts |

---

## 3. Modello Multi-Tenant — REGOLA FONDAMENTALE

### Gerarchia
```
organizations          ← Giubilesi (is_platform_owner = true) — vede tutto
    └── clients        ← I clienti di Giubilesi (ristoranti, GDO, ecc.)
          └── locations ← Sedi fisiche del cliente
                └── audits, NC, AC, samplings, ecc.
```

### Ruoli utente
- `admin` → team Giubilesi, accesso totale a tutto
- `auditor` → team Giubilesi, accesso operativo (compila audit, gestisce NC/AC)
- `client` → referente cliente (Fase 2), vede solo i dati della propria `client_id`

### Regole RLS
- Ogni tabella ha `organization_id uuid` che punta all'organization Giubilesi
- Tabelle legate ai clienti hanno anche `client_id uuid`
- Gli utenti admin/auditor passano sempre: `auth.uid() IN (SELECT user_id FROM profiles WHERE organization_id = <giubilesi_org_id> AND role IN ('admin','auditor'))`
- Gli utenti client vedono solo righe dove `client_id = profiles.client_id`
- **UUID sempre castato esplicitamente**: `= auth.uid()::uuid` — mai senza cast
- **Mai policy permissive senza WHERE clause**

---

## 4. Struttura Cartelle — REGOLA FONDAMENTALE

```
src/
├── app/
│   └── (dashboard)/
│       ├── audits/
│       ├── clients/          ← da creare
│       ├── non-conformities/
│       ├── samplings/
│       ├── templates/
│       └── ...
├── features/
│   ├── audits/
│   │   ├── actions/          ← Server Actions mutazioni
│   │   ├── queries/          ← query Supabase (read)
│   │   ├── schemas/          ← Zod schemas
│   │   └── components/       ← React components feature-specific
│   ├── clients/              ← da creare
│   ├── locations/            ← da creare
│   ├── quality/              ← NC e AC
│   ├── samplings/
│   ├── training/
│   └── organization/
├── components/
│   └── ui/                   ← solo shadcn/ui, non toccare
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   ├── middleware.ts
│   │   └── get-org-context.ts
│   ├── offline/
│   │   ├── db.ts
│   │   ├── sync-provider.tsx
│   │   └── use-offline-mutation.ts
│   └── utils/
├── hooks/
├── middleware.ts
└── types/
    └── database.types.ts     ← generato da Supabase CLI, non editare a mano
```

### Regola per ogni nuova feature:
Ogni feature DEVE avere questa struttura interna:
```
features/{nome}/
├── actions/     → Server Actions ('use server'), mutazioni DB
├── queries/     → funzioni async che leggono da Supabase (no 'use server')
├── schemas/     → Zod schemas condivisi tra client e server
└── components/  → React components, 'use client' solo se necessario
```

---

## 5. Regole Architetturali — NON DEROGABILI

### Server vs Client Components
- **Default: Server Component** — nessun 'use client' se non strettamente necessario
- **'use client' SOLO per**: event handlers interattivi, hooks React (useState/useEffect), browser API (microfono, camera, IndexedDB), animazioni
- **Mai**: fetch dirette al DB in Client Components — usare Server Actions o passare dati come props

### Server Actions
- Tutte le mutazioni passano per Server Actions (`'use server'`)
- Ogni action valida input con Zod prima di toccare il DB
- Ogni action restituisce `{ success: true, data }` oppure `{ success: false, error: string }`
- Nessuna chiamata REST custom — solo Supabase client + Server Actions

### Query Supabase
- **Zero N+1**: join lato Supabase, mai loop di chiamate sequenziali
- Esempio corretto: `supabase.from('audits').select('*, client:clients(*), location:locations(*)')`
- Esempio sbagliato: `audits.forEach(a => supabase.from('clients').select().eq('id', a.client_id))`
- Ogni query in `features/{nome}/queries/` come funzione esportata

### Zod
- Schema definito in `features/{nome}/schemas/` — unica source of truth
- Stesso schema usato per validazione form (client) e Server Action (server)
- Tipi TypeScript inferiti da Zod: `type AuditForm = z.infer<typeof auditSchema>`

### TypeScript
- `strict: true` — nessun `any` implicito
- Nessun cast non giustificato con commento
- Tipi DB generati da Supabase CLI in `types/database.types.ts` — non editare a mano

### Toast / Feedback
- **Solo Sonner** — nessun `alert()`, nessun altro sistema di notifica
- Pattern: `toast.success('...')` / `toast.error('...')` dopo ogni action
- Errori mostrati sempre all'utente — mai silenti

### Offline
- Logica offline in `lib/offline/`
- Mutazioni offline tramite `use-offline-mutation.ts`
- Sync automatica al ritorno della connessione
- `network-status.tsx` per indicatore visivo

---

## 6. Schema DB Attuale (tabelle esistenti)

```
organizations       — Giubilesi (is_platform_owner = true)
profiles            — utenti con ruolo e org
clients             — ⚠️ DA CREARE — clienti di Giubilesi
locations           — ⚠️ DA CREARE — sedi dei clienti
audits              — audit/ispezioni (aggiungere client_id, location_id)
checklists          — checklist collegata a un audit
checklist_items     — singola risposta/domanda della checklist
checklist_templates — template riutilizzabili
template_questions  — domande del template
non_conformities    — NC generate da risposta NC/NNC
corrective_actions  — AC collegata a una NC
action_evidence     — prove allegate a un'AC
audit_trail         — storico stati di un audit
audit_logs          — log generico di tutte le modifiche
documents           — manuali e procedure
document_versions   — versioning documenti
samplings           — campionamenti
lab_results         — risultati analitici
personnel           — personale del cliente
training_courses    — corsi di formazione
training_records    — partecipazioni ai corsi
risks               — gestione rischi
```

### Colonne di sistema presenti su ogni tabella
- `id uuid DEFAULT gen_random_uuid()`
- `organization_id uuid NOT NULL` — FK a organizations
- `created_at timestamptz DEFAULT now()`
- `updated_at timestamptz` — dove applicabile

---

## 7. Stato Sviluppo — Modulo Audit

### ✅ Fatto
- Auth (login/logout) funzionante
- Struttura feature-based implementata
- Schema DB audit/checklist/NC/AC/evidence presente
- Hook speech recognition
- Offline layer (struttura base)
- UI components (shadcn/ui configurato)
- RLS uuid cast fix applicato (migration 20260305000001)

### 🔴 Prossima priorità (da fare ora)
1. **Migration**: aggiungere `clients`, `locations`, aggiornare `audits` con `client_id`/`location_id`, aggiungere `is_platform_owner` a `organizations`
2. **Feature clients**: CRUD clienti e sedi
3. **Collegare audit a cliente/sede**: aggiornare form creazione audit

### ⏳ Backlog ordinato
- Scoring automatico audit (colonna `score` su `audits`)
- Dashboard confronto audit precedente
- Generazione report PDF
- Invio email report
- Portale cliente (Fase 2)

---

## 8. Convenzioni di Naming

| Cosa | Convenzione | Esempio |
|---|---|---|
| Tabelle DB | snake_case plurale | `corrective_actions` |
| Colonne DB | snake_case | `client_id`, `organization_id` |
| Componenti React | PascalCase | `AuditTable.tsx` |
| Server Actions | kebab-case file, camelCase funzione | `audit-actions.ts` → `createAudit()` |
| Queries | `get-{cosa}.ts` | `get-audit.ts` → `getAudit()` |
| Zod schemas | `{nome}-schema.ts` | `audit-schema.ts` → `auditSchema` |
| RLS policies | `{tabella}_{ruolo}_{operazione}` | `audits_admin_select` |

---

## 9. Errori Noti e Soluzioni

### UUID casting in RLS
**Problema**: `operator does not exist: uuid = text`
**Soluzione**: sempre `auth.uid()::uuid` nelle policy RLS, mai `auth.uid()` nudo

### Supabase client in Server Component
**Problema**: usare il client browser in un Server Component
**Soluzione**: importare sempre da `lib/supabase/server.ts` nei Server Components e Server Actions; `lib/supabase/client.ts` solo in Client Components

### getOrganizationContext — destructuring corretto
**Problema**: ritorna `{ organizationId, userId }` (camelCase), NON `organization_id`
**Soluzione**: `const { organizationId } = await getOrganizationContext()`
**Attenzione**: ritorna `null` se utente non autenticato — gestire sempre il caso null

### Conflitto nome createClient in actions
**Problema**: se il file action importa `createClient` da supabase/server.ts 
e la funzione si chiama anche `createClient`, si crea un loop ricorsivo
**Soluzione**: rinominare l'import — es. `import { createClient as createSupabaseClient }`

### Middleware — routes protette
**Problema**: ogni nuova route dashboard va aggiunta manualmente a isDashboardRoute in middleware.ts
**Soluzione**: cambiare il check con `pathname.startsWith('/') && !pathname.startsWith('/login') && !pathname.startsWith('/api')`
oppure aggiungere la route all'elenco ogni volta

### Colonna ID in profiles
**Problema**: la tabella `profiles` usa `id` come chiave utente, NON `user_id`
**Soluzione**: nelle RLS usare `SELECT id FROM profiles WHERE id = auth.uid()::uuid`

### organization_id context
**Soluzione**: usare `lib/supabase/get-org-context.ts` per recuperare l'org dell'utente corrente in ogni Server Action — non passarlo mai dal client come parametro fidato

---

## 10. Come lavorare con questo progetto

### Prima di ogni sessione
1. Leggi questo file
2. Leggi `ERRORS.md` se esiste
3. Controlla `ROADMAP.md` per il task corrente

### Per ogni task
1. Identifica i file coinvolti dalla struttura in §4
2. Scrivi/aggiorna lo Zod schema per prima cosa
3. Scrivi la query o la migration
4. Scrivi la Server Action
5. Scrivi il componente UI per ultimo
6. Testa il flusso end-to-end

### Mai fare
- Modificare `types/database.types.ts` a mano
- Scrivere SQL inline nelle Server Actions (usare Supabase client)
- Aggiungere dipendenze npm senza verificare che non siano già disponibili
- Creare componenti UI custom se esiste già in shadcn/ui
- Fare `console.log` in produzione — usare error handling strutturato