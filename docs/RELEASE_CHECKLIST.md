# Release Checklist

## Prima del merge

1. Verifica di essere su un branch `codex/...`
2. Controlla `git status`
3. Esegui:

```bash
npm run verify:release
```

4. Fai smoke test delle aree toccate

## Smoke test minimo

- `/dashboard`
- `/audits`
- `/audits/[id]`
- `/clients`
- `/clients/[id]`
- `/organization`
- `/search`
- login / logout

## Se il blocco tocca Supabase

1. individua la migration in `supabase/migrations`
2. applicala nel progetto Supabase corretto
3. riprova i flussi che leggono i nuovi campi

## Prima del push su main

1. push del branch di lavoro come backup
2. merge controllato su `main`
3. nuova build su `main`
4. push di `main`

## Baseline stabile

Quando chiudi un blocco importante:

```bash
git tag nome-tag-stabile
git push origin nome-tag-stabile
```
