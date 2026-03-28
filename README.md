# SGIC

SGIC e una piattaforma interna per la gestione di audit, clienti, collaboratori, documenti e non conformita.

## Stack

- Next.js 16 App Router
- React 19
- Supabase per auth e database
- Vitest per test di logica
- Playwright per E2E
- Tailwind CSS 4

## Moduli principali

- `Dashboard`: KPI, inbox operativa, to-do e ricerca globale
- `Audit`: pianificazione, checklist, NC/AC, template
- `Clienti`: hub unico con sedi, collaboratori, audit e documenti
- `Collaboratori`: dettaglio operativo e scadenze formazione/documenti
- `Organization`: dati organizzazione, accessi e ruoli

## Avvio locale

```bash
npm install
npm run dev:3000
```

App locale:

- [http://127.0.0.1:3000](http://127.0.0.1:3000)

Build di verifica:

```bash
npm run verify:release
```

Verifiche di quality consigliate:

```bash
npm run lint
npx tsc --noEmit
npm run test:unit
```

## Variabili ambiente

Il progetto usa `.env.local`.

Minimo richiesto:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Per il bridge FileMaker -> staging management:

- `SUPABASE_SERVICE_ROLE_KEY`
- `MANAGEMENT_SYNC_API_KEY` oppure `INTERNAL_API_KEY`

Per gli script demo:

- `DATABASE_URL`

## Migrazioni Supabase

Le migrazioni vivono in:

- [/Users/filippo/Desktop/sgic/supabase/migrations](/Users/filippo/Desktop/sgic/supabase/migrations)

Quando una fase introduce modifiche schema, applicale nel progetto Supabase prima di testare la UI che dipende da quei campi.

## Workflow Git consigliato

1. Parti sempre da `main` aggiornato.
2. Crea un branch `codex/...` per ogni blocco.
3. Sviluppa e verifica nel branch.
4. Esegui `npm run verify:release`.
5. Solo dopo fai merge su `main`.

Esempio:

```bash
git switch main
git pull
git switch -c codex/nome-fase
```

## Rilascio

Checklist sintetica:

1. `npm run verify:release`
2. smoke test di `dashboard`, `audits`, `clients`, `organization`
3. verifica migrazioni Supabase richieste
4. merge su `main`
5. tag della baseline stabile, se necessario

Checklist estesa:

- [docs/RELEASE_CHECKLIST.md](/Users/filippo/Desktop/sgic/docs/RELEASE_CHECKLIST.md)
