---
type: status
date: 2026-03-21
status: active
tags: [dashboard, stato, sgic]
author: claude-strategy
---

# STATUS.md — Dashboard stato SGIC

> Aggiornato da: ogni agente che completa uno sprint o milestone
> Ultimo aggiornamento: 2026-03-21

## Stato progetto

| Area | Stato | Prossimo passo | Ultimo update |
|---|---|---|---|
| Core app | 🟢 stabile | Sprint 19 | 2026-03-21 |
| Client Filter | 🟢 stabile | Componente attivo in header | 2026-03-21 |
| Documenti | 🟢 stabile | Pagina /documents attiva | 2026-03-21 |
| Personale + Visite | 🟢 stabile | Pagina lista + visite mediche | 2026-03-21 |
| Formazione | 🟢 stabile | Dettaglio corso /training/[id] + widget scadenze dashboard | 2026-03-21 |
| Scadenze unificata | 🟢 stabile | Pagina /deadlines con KPI strip + filtri tipo/urgenza | 2026-03-21 |
| Email notifiche | 🟡 ready | Infrastruttura Resend pronta — manca RESEND_API_KEY reale | 2026-03-21 |
| FileMaker sync | 🟡 ready | Scaffold completo — manca configurazione FM_HOST/credentials | 2026-03-21 |
| Campionamenti | 🟢 stabile | Export XLS attivo | 2026-03-21 |
| Portale cliente | ✅ done | — | Sprint 7 |
| Test manuali e2e | 🟢 stabile | V1-V6 codice verificato (browser test da eseguire dal vivo) | 2026-03-21 |
| CI/CD | ⚪ parked | — | 2026-03-20 |

## Legenda

| Emoji | Stato | Significato |
|---|---|---|
| 🟢 | `stabile` | Funzionante, in produzione/dev |
| 🟡 | `ready` | Pronto per prossimo sprint |
| 🔴 | `blocked` | Serve input esterno |
| ⚪ | `parked` | Non prioritario |
| ✅ | `done` | Completato |

## Info rapide

- **Tag stabile:** v1.2-sprint18
- **Sprint corrente:** 18
- **Stack:** Next.js 16 + TypeScript + Supabase + Tailwind + shadcn/ui
- **Porta:** 3000
- **Percorso:** `~/sgic`
- **Task dettagliati:** vedi `TODO.md`
