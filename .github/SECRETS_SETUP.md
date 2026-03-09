# GitHub Actions Secrets Setup

Per far funzionare la CI/CD pipeline, configura questi secrets in GitHub:

## Required Secrets

### 1. **NEXT_PUBLIC_SUPABASE_URL**
- Vai a: [GitHub Settings → Secrets](https://github.com/{owner}/{repo}/settings/secrets/actions)
- Click "New repository secret"
- Name: `NEXT_PUBLIC_SUPABASE_URL`
- Value: URL del tuo progetto Supabase (es: `https://xxxx.supabase.co`)
- Trova su: Supabase Dashboard → Project Settings → API

### 2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
- Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: Anon key (public key) da Supabase
- Trova su: Supabase Dashboard → Project Settings → API

### 3. **DATABASE_URL**
- Name: `DATABASE_URL`
- Value: PostgreSQL connection string per E2E tests
- Format: `postgresql://user:password@host:port/database`
- Nota: Usa una DB di test, non la production!

## Setup Steps

1. **Get Supabase Keys:**
   ```bash
   # From Supabase Dashboard
   # Project → Settings → API
   # Copy:
   # - Project URL
   # - anon public key
   ```

2. **GitHub Secrets:**
   ```bash
   # Per ogni secret:
   # - Vai a: github.com/{owner}/{repo}/settings/secrets/actions
   # - New repository secret
   # - Incolla nome e valore
   ```

3. **Test Secret Configuration:**
   - Fai un push a un branch
   - Vai a: GitHub → Actions
   - Verifica che il workflow parta
   - Se fallisce, controlla i logs

## Workflow Triggers

- **Push to main/develop**: Pipeline completa (lint → build → test)
- **Pull Request**: Stessa pipeline
- **Manual trigger**: Disponibile (usa `workflow_dispatch`)

## Pipeline Steps

```
1. Lint (ESLint, Prettier)
   ↓
2. TypeScript check (tsc --noEmit)
   ↓
3. Build (npm run build)
   ↓
4. E2E Tests (Playwright) — se lint/build passa
   ↓
5. Upload test report as artifact
```

## Artifacts

- **Test Reports**: Archiviati per 30 giorni
- **View**: GitHub → Actions → Run → Artifacts
- **Local**: `npx playwright show-report` after download

## Troubleshooting

### Build fails: "NEXT_PUBLIC_SUPABASE_URL not defined"
- Verifica che i secrets siano configurati
- Nomi deve essere ESATTI (case-sensitive)

### Playwright tests fail
- Controlla DATABASE_URL
- Verifica che Supabase project sia accessibile
- Guarda logs in GitHub → Actions

### Artifacts not uploaded
- Normale se tests falliscono
- Check "Upload test results" step in workflow

## Optional: Use Develop Branch

```yaml
# .github/workflows/test.yml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
```

Questo rende il workflow attivo sia su main che develop.
