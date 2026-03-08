# TODO.md — SGIC

> Leggi sempre CLAUDE.md prima di iniziare.  
> Un task alla volta: esegui → testa → marca [x] → commit → fermati.

---

## CURRENT SPRINT: Sprint Media — Foto, Video, Audio su Checklist

**Obiettivo:** Permettere all'ispettore di allegare foto/video come evidence e registrare note audio direttamente su ogni checklist item durante un audit.

**Contesto DB:** `checklist_items` ha già `evidence_url` (foto/video) e `audio_url` (audio). Le colonne esistono — non crearle di nuovo.

---

### A — Infrastruttura Storage

- [x] **A1 — Crea bucket Supabase Storage**
  - Nome: `checklist-media`
  - Tipo: privato (non public)
  - Verifica che non esista già prima di crearlo
  - Path convention: `{organizationId}/{auditId}/{itemId}/evidence.{ext}` per foto/video
  - Path convention: `{organizationId}/{auditId}/{itemId}/audio.webm` per audio

- [x] **A2 — RLS policy su Storage**
  - Utenti autenticati possono upload/download solo su path che inizia con il loro organizationId
  - Policy nome: `checklist_media_org_isolation`

- [x] **A3 — Server action: uploadChecklistMedia**
  - File: `src/features/audits/actions/media-actions.ts`
  - Firma: `uploadChecklistMedia(itemId, file, type: 'evidence' | 'audio')`
  - Logica: upload su Storage → ottieni URL firmato (1h) → aggiorna checklist_items
  - Usa pattern getOrganizationContext()
  - Gestisci errori con { success, error, url }
  - Dopo upload: `NOTIFY pgrst, 'reload schema';` non necessario (non è DDL)

- [x] **A4 — Server action: deleteChecklistMedia**
  - Firma: `deleteChecklistMedia(itemId, type: 'evidence' | 'audio')`
  - Logica: elimina da Storage → setta colonna a null su checklist_items
  - Commit: `"feat(storage): checklist-media bucket, RLS, upload/delete actions"`

---

### B — UI Foto e Video

- [ ] **B1 — Componente MediaCapture**
  - File: `src/features/audits/components/media-capture.tsx`
  - Props: `itemId`, `auditId`, `currentUrl?: string`, `type: 'evidence'`
  - Comportamento mobile: apre camera nativa (`<input type="file" accept="image/*,video/*" capture="environment">`)
  - Comportamento desktop: file picker standard
  - Mostra preview inline dopo upload (img o video tag)
  - Bottone elimina se URL già presente
  - Stato loading durante upload con spinner

- [ ] **B2 — Integrazione in ChecklistManager**
  - Aggiungi `<MediaCapture>` su ogni checklist item row
  - Posizione: accanto al campo notes, icona camera
  - Non bloccare il salvataggio dell'item se upload fallisce
  - Commit: `"feat(ui): photo/video capture on checklist items"`

---

### C — UI Audio (in pipe con B)

- [ ] **C1 — Componente AudioRecorder**
  - File: `src/features/audits/components/audio-recorder.tsx`
  - Props: `itemId`, `auditId`, `currentUrl?: string`
  - Usa MediaRecorder API (webm/opus)
  - Stati: idle → recording → stopped → uploading → saved
  - UI: bottone microfono → registra → stop → preview playback → salva
  - Mostra durata registrazione in tempo reale
  - Playback inline con `<audio>` tag se URL già presente
  - Bottone elimina se registrazione già presente
  - Gestisci permesso microfono negato con messaggio utente

- [ ] **C2 — Integrazione in ChecklistManager**
  - Aggiungi `<AudioRecorder>` su ogni checklist item row
  - Posizione: accanto a MediaCapture, icona microfono
  - Commit: `"feat(ui): audio recording on checklist items"`

---

### D — Verifica finale

- [ ] **D1 — Test manuale flusso completo**
  - Apri un audit esistente
  - Su un item: carica una foto → verifica preview → verifica URL salvato su DB
  - Su un item: registra audio → verifica playback → verifica URL salvato su DB
  - Elimina entrambi → verifica che le colonne tornino null
  - Verifica che `tsc --noEmit` sia zero errori

- [ ] **D2 — Commit finale sprint**
  - `"feat(media): complete photo/video/audio capture on checklist items"`

---

## BACKLOG (prossimi sprint)

- [ ] **Sprint PDF** — Report audit completo scaricabile con NC, AC e allegati media
- [ ] **Sprint AC Scadenze** — due_date opzionale su corrective_actions con reminder visivo
- [ ] **Sprint Demo Data** — Seed dati realistici per demo (clienti, locations, audit completi)
- [ ] **Sprint Dashboard** — Overview NC aperte, AC scadute, trend audit per proprietario
- [ ] **Tecnico** — Rigenera database.types.ts dopo ogni migrazione DB significativa