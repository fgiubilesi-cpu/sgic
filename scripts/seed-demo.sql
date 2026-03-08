-- =============================================================================
-- SGIC — Demo Seed Data
-- Org: Giubilesi Associati (4ed14a8b-a5b5-4933-b83f-a940b4993707)
-- Run: psql $DATABASE_URL -f scripts/seed-demo.sql
--   or: npm run seed:demo
-- Idempotent: uses ON CONFLICT DO NOTHING with fixed UUIDs
-- Reset:      npm run reset:demo  (runs reset-demo.sql first, then this file)
-- =============================================================================

-- ─── PART 1 — Clients, Locations, Audits, Checklists ─────────────────────────

DO $$
DECLARE
  org_id uuid := '4ed14a8b-a5b5-4933-b83f-a940b4993707';
  c1  uuid := '10000000-0000-4000-8000-000000000001';
  c2  uuid := '10000000-0000-4000-8000-000000000002';
  l1  uuid := '20000000-0000-4000-8000-000000000001';
  l2  uuid := '20000000-0000-4000-8000-000000000002';
  l3  uuid := '20000000-0000-4000-8000-000000000003';
  l4  uuid := '20000000-0000-4000-8000-000000000004';
  a01 uuid := '30000000-0000-4000-8000-000000000001';
  a02 uuid := '30000000-0000-4000-8000-000000000002';
  a03 uuid := '30000000-0000-4000-8000-000000000003';
  a04 uuid := '30000000-0000-4000-8000-000000000004';
  a05 uuid := '30000000-0000-4000-8000-000000000005';
  a06 uuid := '30000000-0000-4000-8000-000000000006';
  a07 uuid := '30000000-0000-4000-8000-000000000007';
  a08 uuid := '30000000-0000-4000-8000-000000000008';
  a09 uuid := '30000000-0000-4000-8000-000000000009';
  a10 uuid := '30000000-0000-4000-8000-000000000010';
  a11 uuid := '30000000-0000-4000-8000-000000000011';
  a12 uuid := '30000000-0000-4000-8000-000000000012';
  ch01 uuid := '40000000-0000-4000-8000-000000000001';
  ch02 uuid := '40000000-0000-4000-8000-000000000002';
  ch03 uuid := '40000000-0000-4000-8000-000000000003';
  ch04 uuid := '40000000-0000-4000-8000-000000000004';
  ch05 uuid := '40000000-0000-4000-8000-000000000005';
  ch06 uuid := '40000000-0000-4000-8000-000000000006';
  ch07 uuid := '40000000-0000-4000-8000-000000000007';
  ch08 uuid := '40000000-0000-4000-8000-000000000008';
  ch09 uuid := '40000000-0000-4000-8000-000000000009';
  ch10 uuid := '40000000-0000-4000-8000-000000000010';
  ch11 uuid := '40000000-0000-4000-8000-000000000011';
  ch12 uuid := '40000000-0000-4000-8000-000000000012';
BEGIN
  -- Clients
  INSERT INTO clients (id, organization_id, name) VALUES
    (c1, org_id, 'Ristorante Da Mario Srl'),
    (c2, org_id, 'Mensa Aziendale BioTech Srl')
  ON CONFLICT (id) DO NOTHING;

  -- Locations (2 per client)
  INSERT INTO locations (id, organization_id, client_id, name) VALUES
    (l1, org_id, c1, 'Cucina Centrale'),
    (l2, org_id, c1, 'Magazzino Alimenti'),
    (l3, org_id, c2, 'Cucina di Produzione'),
    (l4, org_id, c2, 'Area Distribuzione')
  ON CONFLICT (id) DO NOTHING;

  -- Audits: 3 per location, scores show upward trend over 6 months
  -- Valid statuses: 'Scheduled','In Progress','Review','Closed'
  INSERT INTO audits (id, organization_id, client_id, location_id, title, status, scheduled_date, score) VALUES
    -- Cucina Centrale (client1): 72 → 80 → 88
    (a01, org_id, c1, l1, 'Ispezione HACCP Cucina — Set 2025', 'Closed', '2025-09-10 09:00:00+00', 72),
    (a02, org_id, c1, l1, 'Ispezione HACCP Cucina — Dic 2025', 'Closed', '2025-12-05 09:00:00+00', 80),
    (a03, org_id, c1, l1, 'Ispezione HACCP Cucina — Feb 2026', 'Closed', '2026-02-10 09:00:00+00', 88),
    -- Magazzino Alimenti (client1): 65 → 74 → 83
    (a04, org_id, c1, l2, 'Ispezione Magazzino — Ott 2025',   'Closed', '2025-10-15 09:00:00+00', 65),
    (a05, org_id, c1, l2, 'Ispezione Magazzino — Gen 2026',   'Closed', '2026-01-10 09:00:00+00', 74),
    (a06, org_id, c1, l2, 'Ispezione Magazzino — Feb 2026',   'Closed', '2026-02-20 09:00:00+00', 83),
    -- Cucina di Produzione (client2): 78 → 82 → 91
    (a07, org_id, c2, l3, 'Audit HACCP Produzione — Set 2025','Closed', '2025-09-20 09:00:00+00', 78),
    (a08, org_id, c2, l3, 'Audit HACCP Produzione — Nov 2025','Closed', '2025-11-15 09:00:00+00', 82),
    (a09, org_id, c2, l3, 'Audit HACCP Produzione — Gen 2026','Closed', '2026-01-25 09:00:00+00', 91),
    -- Area Distribuzione (client2): 69 → 75 → 85
    (a10, org_id, c2, l4, 'Audit Distribuzione — Ott 2025',   'Closed', '2025-10-05 09:00:00+00', 69),
    (a11, org_id, c2, l4, 'Audit Distribuzione — Dic 2025',   'Closed', '2025-12-18 09:00:00+00', 75),
    (a12, org_id, c2, l4, 'Audit Distribuzione — Feb 2026',   'Closed', '2026-02-28 09:00:00+00', 85)
  ON CONFLICT (id) DO NOTHING;

  -- Checklists (1 per audit; organization_id NOT NULL)
  INSERT INTO checklists (id, organization_id, audit_id, title) VALUES
    (ch01, org_id, a01, 'HACCP — Controllo igienico-sanitario Set 2025'),
    (ch02, org_id, a02, 'HACCP — Controllo igienico-sanitario Dic 2025'),
    (ch03, org_id, a03, 'HACCP — Controllo igienico-sanitario Feb 2026'),
    (ch04, org_id, a04, 'Magazzino — Controllo conservazione Ott 2025'),
    (ch05, org_id, a05, 'Magazzino — Controllo conservazione Gen 2026'),
    (ch06, org_id, a06, 'Magazzino — Controllo conservazione Feb 2026'),
    (ch07, org_id, a07, 'HACCP Produzione — Controllo Set 2025'),
    (ch08, org_id, a08, 'HACCP Produzione — Controllo Nov 2025'),
    (ch09, org_id, a09, 'HACCP Produzione — Controllo Gen 2026'),
    (ch10, org_id, a10, 'Distribuzione — Controllo igienico Ott 2025'),
    (ch11, org_id, a11, 'Distribuzione — Controllo igienico Dic 2025'),
    (ch12, org_id, a12, 'Distribuzione — Controllo igienico Feb 2026')
  ON CONFLICT (id) DO NOTHING;

END $$;

-- ─── PART 2a — Checklist Items (Audits 1–6) ──────────────────────────────────

DO $$
DECLARE
  org_id uuid := '4ed14a8b-a5b5-4933-b83f-a940b4993707';
  ch01 uuid := '40000000-0000-4000-8000-000000000001';
  ch02 uuid := '40000000-0000-4000-8000-000000000002';
  ch03 uuid := '40000000-0000-4000-8000-000000000003';
  ch04 uuid := '40000000-0000-4000-8000-000000000004';
  ch05 uuid := '40000000-0000-4000-8000-000000000005';
  ch06 uuid := '40000000-0000-4000-8000-000000000006';
  a01 uuid := '30000000-0000-4000-8000-000000000001';
  a02 uuid := '30000000-0000-4000-8000-000000000002';
  a03 uuid := '30000000-0000-4000-8000-000000000003';
  a04 uuid := '30000000-0000-4000-8000-000000000004';
  a05 uuid := '30000000-0000-4000-8000-000000000005';
  a06 uuid := '30000000-0000-4000-8000-000000000006';
BEGIN
  -- AUDIT 1 (score 72) — 2 non_compliant
  INSERT INTO checklist_items (id, checklist_id, organization_id, audit_id, question, outcome, notes, sort_order) VALUES
    ('50010001-0000-4000-8000-000000000000', ch01, org_id, a01, 'Le temperature di conservazione degli alimenti refrigerati sono mantenute tra 0°C e +4°C?', 'non_compliant', 'Rilevati +7°C nel banco frigo laterale. Termometro non calibrato.', 1),
    ('50010002-0000-4000-8000-000000000000', ch01, org_id, a01, 'Le superfici di lavoro e le attrezzature sono pulite e sanificate prima dell''uso?', 'non_compliant', 'Piano cottura con residui di lavorazione precedente. Scheda sanificazione non compilata.', 2),
    ('50010003-0000-4000-8000-000000000000', ch01, org_id, a01, 'E'' garantita la separazione tra alimenti crudi e cotti per evitare contaminazioni crociate?', 'compliant', NULL, 3),
    ('50010004-0000-4000-8000-000000000000', ch01, org_id, a01, 'Il personale rispetta le norme igieniche (divisa, guanti, copricapo)?', 'compliant', 'Tutto il personale in divisa pulita.', 4),
    ('50010005-0000-4000-8000-000000000000', ch01, org_id, a01, 'I prodotti in scadenza o scaduti vengono rimossi e smaltiti correttamente?', 'compliant', NULL, 5),
    ('50010006-0000-4000-8000-000000000000', ch01, org_id, a01, 'Il piano di disinfestazione (pest control) e'' aggiornato e documentato?', 'compliant', NULL, 6),
    ('50010007-0000-4000-8000-000000000000', ch01, org_id, a01, 'La tracciabilita'' dei fornitori e delle materie prime e'' documentata?', 'compliant', NULL, 7),
    ('50010008-0000-4000-8000-000000000000', ch01, org_id, a01, 'I registri di controllo temperatura sono aggiornati quotidianamente?', 'not_applicable', 'Sistema di monitoraggio automatico installato di recente.', 8)
  ON CONFLICT (id) DO NOTHING;

  -- AUDIT 2 (score 80) — 1 non_compliant
  INSERT INTO checklist_items (id, checklist_id, organization_id, audit_id, question, outcome, notes, sort_order) VALUES
    ('50020001-0000-4000-8000-000000000000', ch02, org_id, a02, 'Le temperature di conservazione degli alimenti refrigerati sono mantenute tra 0°C e +4°C?', 'compliant', 'Tutti i banchi frigo nella norma (+2/+3 gradi C).', 1),
    ('50020002-0000-4000-8000-000000000000', ch02, org_id, a02, 'Le superfici di lavoro e le attrezzature sono pulite e sanificate prima dell''uso?', 'compliant', NULL, 2),
    ('50020003-0000-4000-8000-000000000000', ch02, org_id, a02, 'E'' garantita la separazione tra alimenti crudi e cotti per evitare contaminazioni crociate?', 'compliant', NULL, 3),
    ('50020004-0000-4000-8000-000000000000', ch02, org_id, a02, 'Il personale rispetta le norme igieniche (divisa, guanti, copricapo)?', 'non_compliant', 'Un operatore privo di copricapo durante la lavorazione in area pasticceria.', 4),
    ('50020005-0000-4000-8000-000000000000', ch02, org_id, a02, 'I prodotti in scadenza o scaduti vengono rimossi e smaltiti correttamente?', 'compliant', NULL, 5),
    ('50020006-0000-4000-8000-000000000000', ch02, org_id, a02, 'Il piano di disinfestazione (pest control) e'' aggiornato e documentato?', 'compliant', NULL, 6),
    ('50020007-0000-4000-8000-000000000000', ch02, org_id, a02, 'La tracciabilita'' dei fornitori e delle materie prime e'' documentata?', 'compliant', NULL, 7),
    ('50020008-0000-4000-8000-000000000000', ch02, org_id, a02, 'I registri di controllo temperatura sono aggiornati quotidianamente?', 'compliant', 'Registri aggiornati e firmati dal responsabile.', 8)
  ON CONFLICT (id) DO NOTHING;

  -- AUDIT 3 (score 88) — all compliant / not_applicable
  INSERT INTO checklist_items (id, checklist_id, organization_id, audit_id, question, outcome, notes, sort_order) VALUES
    ('50030001-0000-4000-8000-000000000000', ch03, org_id, a03, 'Le temperature di conservazione degli alimenti refrigerati sono mantenute tra 0°C e +4°C?', 'compliant', 'Temperatura media rilevata: +2 gradi C.', 1),
    ('50030002-0000-4000-8000-000000000000', ch03, org_id, a03, 'Le superfici di lavoro e le attrezzature sono pulite e sanificate prima dell''uso?', 'compliant', NULL, 2),
    ('50030003-0000-4000-8000-000000000000', ch03, org_id, a03, 'E'' garantita la separazione tra alimenti crudi e cotti per evitare contaminazioni crociate?', 'compliant', NULL, 3),
    ('50030004-0000-4000-8000-000000000000', ch03, org_id, a03, 'Il personale rispetta le norme igieniche (divisa, guanti, copricapo)?', 'compliant', NULL, 4),
    ('50030005-0000-4000-8000-000000000000', ch03, org_id, a03, 'I prodotti in scadenza o scaduti vengono rimossi e smaltiti correttamente?', 'compliant', NULL, 5),
    ('50030006-0000-4000-8000-000000000000', ch03, org_id, a03, 'Il piano di disinfestazione (pest control) e'' aggiornato e documentato?', 'compliant', NULL, 6),
    ('50030007-0000-4000-8000-000000000000', ch03, org_id, a03, 'La tracciabilita'' dei fornitori e delle materie prime e'' documentata?', 'compliant', 'Documentazione completa e aggiornata.', 7),
    ('50030008-0000-4000-8000-000000000000', ch03, org_id, a03, 'I registri di controllo temperatura sono aggiornati quotidianamente?', 'not_applicable', NULL, 8)
  ON CONFLICT (id) DO NOTHING;

  -- AUDIT 4 (score 65) — 3 non_compliant
  INSERT INTO checklist_items (id, checklist_id, organization_id, audit_id, question, outcome, notes, sort_order) VALUES
    ('50040001-0000-4000-8000-000000000000', ch04, org_id, a04, 'Gli alimenti stoccati sono conservati nelle corrette condizioni di temperatura e umidita''?', 'non_compliant', 'Umidita'' magazzino al 78% (limite max 60%). Condizionamento non funzionante.', 1),
    ('50040002-0000-4000-8000-000000000000', ch04, org_id, a04, 'I prodotti alimentari sono separati da prodotti non alimentari (detersivi, etc.)?', 'non_compliant', 'Detergenti trovati sullo stesso scaffale di farine e cereali. Rischio contaminazione chimica.', 2),
    ('50040003-0000-4000-8000-000000000000', ch04, org_id, a04, 'La rotazione delle scorte (FIFO) e'' applicata correttamente?', 'non_compliant', 'Prodotti con data piu'' recente stoccati davanti a quelli piu'' vecchi.', 3),
    ('50040004-0000-4000-8000-000000000000', ch04, org_id, a04, 'Gli imballaggi sono integri e privi di danni?', 'compliant', NULL, 4),
    ('50040005-0000-4000-8000-000000000000', ch04, org_id, a04, 'La pulizia del magazzino e'' effettuata regolarmente secondo le procedure?', 'compliant', 'Scheda pulizia compilata.', 5),
    ('50040006-0000-4000-8000-000000000000', ch04, org_id, a04, 'Il magazzino e'' protetto dall''ingresso di insetti e roditori?', 'compliant', NULL, 6),
    ('50040007-0000-4000-8000-000000000000', ch04, org_id, a04, 'La documentazione di ricevimento merci e'' presente e aggiornata?', 'compliant', NULL, 7),
    ('50040008-0000-4000-8000-000000000000', ch04, org_id, a04, 'I prodotti allergeni sono conservati separatamente e identificati?', 'not_applicable', NULL, 8)
  ON CONFLICT (id) DO NOTHING;

  -- AUDIT 5 (score 74) — 2 non_compliant
  INSERT INTO checklist_items (id, checklist_id, organization_id, audit_id, question, outcome, notes, sort_order) VALUES
    ('50050001-0000-4000-8000-000000000000', ch05, org_id, a05, 'Gli alimenti stoccati sono conservati nelle corrette condizioni di temperatura e umidita''?', 'compliant', 'Condizionamento riparato. Umidita'' al 55%.', 1),
    ('50050002-0000-4000-8000-000000000000', ch05, org_id, a05, 'I prodotti alimentari sono separati da prodotti non alimentari (detersivi, etc.)?', 'compliant', NULL, 2),
    ('50050003-0000-4000-8000-000000000000', ch05, org_id, a05, 'La rotazione delle scorte (FIFO) e'' applicata correttamente?', 'non_compliant', 'Ancora presente prodotto scaduto non rimosso. FIFO parzialmente applicato.', 3),
    ('50050004-0000-4000-8000-000000000000', ch05, org_id, a05, 'Gli imballaggi sono integri e privi di danni?', 'compliant', NULL, 4),
    ('50050005-0000-4000-8000-000000000000', ch05, org_id, a05, 'La pulizia del magazzino e'' effettuata regolarmente secondo le procedure?', 'non_compliant', 'Aree angolari con accumulo di polvere. Scheda pulizia incompleta.', 5),
    ('50050006-0000-4000-8000-000000000000', ch05, org_id, a05, 'Il magazzino e'' protetto dall''ingresso di insetti e roditori?', 'compliant', NULL, 6),
    ('50050007-0000-4000-8000-000000000000', ch05, org_id, a05, 'La documentazione di ricevimento merci e'' presente e aggiornata?', 'compliant', NULL, 7),
    ('50050008-0000-4000-8000-000000000000', ch05, org_id, a05, 'I prodotti allergeni sono conservati separatamente e identificati?', 'compliant', NULL, 8)
  ON CONFLICT (id) DO NOTHING;

  -- AUDIT 6 (score 83) — 1 non_compliant
  INSERT INTO checklist_items (id, checklist_id, organization_id, audit_id, question, outcome, notes, sort_order) VALUES
    ('50060001-0000-4000-8000-000000000000', ch06, org_id, a06, 'Gli alimenti stoccati sono conservati nelle corrette condizioni di temperatura e umidita''?', 'compliant', NULL, 1),
    ('50060002-0000-4000-8000-000000000000', ch06, org_id, a06, 'I prodotti alimentari sono separati da prodotti non alimentari (detersivi, etc.)?', 'compliant', NULL, 2),
    ('50060003-0000-4000-8000-000000000000', ch06, org_id, a06, 'La rotazione delle scorte (FIFO) e'' applicata correttamente?', 'compliant', NULL, 3),
    ('50060004-0000-4000-8000-000000000000', ch06, org_id, a06, 'Gli imballaggi sono integri e privi di danni?', 'compliant', NULL, 4),
    ('50060005-0000-4000-8000-000000000000', ch06, org_id, a06, 'La pulizia del magazzino e'' effettuata regolarmente secondo le procedure?', 'compliant', 'Scheda pulizia aggiornata e completa.', 5),
    ('50060006-0000-4000-8000-000000000000', ch06, org_id, a06, 'Il magazzino e'' protetto dall''ingresso di insetti e roditori?', 'non_compliant', 'Rilevate tracce di roditori in angolo nord-est. Intervento urgente necessario.', 6),
    ('50060007-0000-4000-8000-000000000000', ch06, org_id, a06, 'La documentazione di ricevimento merci e'' presente e aggiornata?', 'compliant', NULL, 7),
    ('50060008-0000-4000-8000-000000000000', ch06, org_id, a06, 'I prodotti allergeni sono conservati separatamente e identificati?', 'compliant', NULL, 8)
  ON CONFLICT (id) DO NOTHING;

END $$;

-- ─── PART 2b — Checklist Items (Audits 7–12) ─────────────────────────────────

DO $$
DECLARE
  org_id uuid := '4ed14a8b-a5b5-4933-b83f-a940b4993707';
  ch07 uuid := '40000000-0000-4000-8000-000000000007';
  ch08 uuid := '40000000-0000-4000-8000-000000000008';
  ch09 uuid := '40000000-0000-4000-8000-000000000009';
  ch10 uuid := '40000000-0000-4000-8000-000000000010';
  ch11 uuid := '40000000-0000-4000-8000-000000000011';
  ch12 uuid := '40000000-0000-4000-8000-000000000012';
  a07 uuid := '30000000-0000-4000-8000-000000000007';
  a08 uuid := '30000000-0000-4000-8000-000000000008';
  a09 uuid := '30000000-0000-4000-8000-000000000009';
  a10 uuid := '30000000-0000-4000-8000-000000000010';
  a11 uuid := '30000000-0000-4000-8000-000000000011';
  a12 uuid := '30000000-0000-4000-8000-000000000012';
BEGIN
  -- AUDIT 7 (score 78) — 2 non_compliant
  INSERT INTO checklist_items (id, checklist_id, organization_id, audit_id, question, outcome, notes, sort_order) VALUES
    ('50070001-0000-4000-8000-000000000000', ch07, org_id, a07, 'Le temperature di conservazione degli alimenti refrigerati sono mantenute tra 0°C e +4°C?', 'compliant', NULL, 1),
    ('50070002-0000-4000-8000-000000000000', ch07, org_id, a07, 'Le superfici di lavoro e le attrezzature sono pulite e sanificate prima dell''uso?', 'non_compliant', 'Affettatrice con residui proteici tra le lame. Piano di sanificazione non rispettato nel turno.', 2),
    ('50070003-0000-4000-8000-000000000000', ch07, org_id, a07, 'E'' garantita la separazione tra alimenti crudi e cotti per evitare contaminazioni crociate?', 'compliant', NULL, 3),
    ('50070004-0000-4000-8000-000000000000', ch07, org_id, a07, 'Il personale rispetta le norme igieniche (divisa, guanti, copricapo)?', 'compliant', NULL, 4),
    ('50070005-0000-4000-8000-000000000000', ch07, org_id, a07, 'I prodotti in scadenza o scaduti vengono rimossi e smaltiti correttamente?', 'non_compliant', 'Trovato yogurt scaduto ancora presente in frigorifero. Etichetta TMC 15/09/2025.', 5),
    ('50070006-0000-4000-8000-000000000000', ch07, org_id, a07, 'Il piano di disinfestazione (pest control) e'' aggiornato e documentato?', 'compliant', NULL, 6),
    ('50070007-0000-4000-8000-000000000000', ch07, org_id, a07, 'La tracciabilita'' dei fornitori e delle materie prime e'' documentata?', 'compliant', NULL, 7),
    ('50070008-0000-4000-8000-000000000000', ch07, org_id, a07, 'I registri di controllo temperatura sono aggiornati quotidianamente?', 'compliant', NULL, 8)
  ON CONFLICT (id) DO NOTHING;

  -- AUDIT 8 (score 82) — 1 non_compliant
  INSERT INTO checklist_items (id, checklist_id, organization_id, audit_id, question, outcome, notes, sort_order) VALUES
    ('50080001-0000-4000-8000-000000000000', ch08, org_id, a08, 'Le temperature di conservazione degli alimenti refrigerati sono mantenute tra 0°C e +4°C?', 'compliant', NULL, 1),
    ('50080002-0000-4000-8000-000000000000', ch08, org_id, a08, 'Le superfici di lavoro e le attrezzature sono pulite e sanificate prima dell''uso?', 'compliant', NULL, 2),
    ('50080003-0000-4000-8000-000000000000', ch08, org_id, a08, 'E'' garantita la separazione tra alimenti crudi e cotti per evitare contaminazioni crociate?', 'compliant', NULL, 3),
    ('50080004-0000-4000-8000-000000000000', ch08, org_id, a08, 'Il personale rispetta le norme igieniche (divisa, guanti, copricapo)?', 'non_compliant', 'Operatore con orecchini visibili durante la manipolazione alimenti. Violazione regolamento igienico.', 4),
    ('50080005-0000-4000-8000-000000000000', ch08, org_id, a08, 'I prodotti in scadenza o scaduti vengono rimossi e smaltiti correttamente?', 'compliant', NULL, 5),
    ('50080006-0000-4000-8000-000000000000', ch08, org_id, a08, 'Il piano di disinfestazione (pest control) e'' aggiornato e documentato?', 'compliant', NULL, 6),
    ('50080007-0000-4000-8000-000000000000', ch08, org_id, a08, 'La tracciabilita'' dei fornitori e delle materie prime e'' documentata?', 'compliant', NULL, 7),
    ('50080008-0000-4000-8000-000000000000', ch08, org_id, a08, 'I registri di controllo temperatura sono aggiornati quotidianamente?', 'compliant', NULL, 8)
  ON CONFLICT (id) DO NOTHING;

  -- AUDIT 9 (score 91) — all compliant
  INSERT INTO checklist_items (id, checklist_id, organization_id, audit_id, question, outcome, notes, sort_order) VALUES
    ('50090001-0000-4000-8000-000000000000', ch09, org_id, a09, 'Le temperature di conservazione degli alimenti refrigerati sono mantenute tra 0°C e +4°C?', 'compliant', 'Temperatura media rilevata: +1.5 gradi C. Eccellente.', 1),
    ('50090002-0000-4000-8000-000000000000', ch09, org_id, a09, 'Le superfici di lavoro e le attrezzature sono pulite e sanificate prima dell''uso?', 'compliant', NULL, 2),
    ('50090003-0000-4000-8000-000000000000', ch09, org_id, a09, 'E'' garantita la separazione tra alimenti crudi e cotti per evitare contaminazioni crociate?', 'compliant', NULL, 3),
    ('50090004-0000-4000-8000-000000000000', ch09, org_id, a09, 'Il personale rispetta le norme igieniche (divisa, guanti, copricapo)?', 'compliant', NULL, 4),
    ('50090005-0000-4000-8000-000000000000', ch09, org_id, a09, 'I prodotti in scadenza o scaduti vengono rimossi e smaltiti correttamente?', 'compliant', NULL, 5),
    ('50090006-0000-4000-8000-000000000000', ch09, org_id, a09, 'Il piano di disinfestazione (pest control) e'' aggiornato e documentato?', 'compliant', NULL, 6),
    ('50090007-0000-4000-8000-000000000000', ch09, org_id, a09, 'La tracciabilita'' dei fornitori e delle materie prime e'' documentata?', 'compliant', 'Documentazione completa con certificati di analisi aggiornati.', 7),
    ('50090008-0000-4000-8000-000000000000', ch09, org_id, a09, 'I registri di controllo temperatura sono aggiornati quotidianamente?', 'compliant', NULL, 8)
  ON CONFLICT (id) DO NOTHING;

  -- AUDIT 10 (score 69) — 3 non_compliant
  INSERT INTO checklist_items (id, checklist_id, organization_id, audit_id, question, outcome, notes, sort_order) VALUES
    ('50100001-0000-4000-8000-000000000000', ch10, org_id, a10, 'Le temperature della linea di distribuzione sono monitorate e conformi?', 'non_compliant', 'Rilevati +12 gradi C nella vassoiera antipasti. Limite +8 gradi C superato.', 1),
    ('50100002-0000-4000-8000-000000000000', ch10, org_id, a10, 'Il personale addetto alla distribuzione indossa DPI idonei (guanti, copricapo)?', 'non_compliant', 'Operatori senza guanti monouso durante la distribuzione. Rischio contaminazione.', 2),
    ('50100003-0000-4000-8000-000000000000', ch10, org_id, a10, 'L''area di distribuzione e'' mantenuta in ordine e pulita durante il servizio?', 'non_compliant', 'Vassoio sporco a contatto diretto con il piano del banco distribuzione.', 3),
    ('50100004-0000-4000-8000-000000000000', ch10, org_id, a10, 'Le attrezzature di distribuzione sono sanificate dopo ogni turno?', 'compliant', NULL, 4),
    ('50100005-0000-4000-8000-000000000000', ch10, org_id, a10, 'I residui alimentari vengono smaltiti correttamente e in tempi adeguati?', 'compliant', NULL, 5),
    ('50100006-0000-4000-8000-000000000000', ch10, org_id, a10, 'Il registro delle temperature di distribuzione e'' compilato regolarmente?', 'compliant', NULL, 6),
    ('50100007-0000-4000-8000-000000000000', ch10, org_id, a10, 'Sono presenti e visibili cartelli informativi per gli allergeni?', 'compliant', NULL, 7),
    ('50100008-0000-4000-8000-000000000000', ch10, org_id, a10, 'Il tempo massimo di permanenza degli alimenti in distribuzione e'' rispettato?', 'not_applicable', NULL, 8)
  ON CONFLICT (id) DO NOTHING;

  -- AUDIT 11 (score 75) — 2 non_compliant
  INSERT INTO checklist_items (id, checklist_id, organization_id, audit_id, question, outcome, notes, sort_order) VALUES
    ('50110001-0000-4000-8000-000000000000', ch11, org_id, a11, 'Le temperature della linea di distribuzione sono monitorate e conformi?', 'compliant', 'Vassoiera a temperatura corretta: +6 gradi C.', 1),
    ('50110002-0000-4000-8000-000000000000', ch11, org_id, a11, 'Il personale addetto alla distribuzione indossa DPI idonei (guanti, copricapo)?', 'compliant', NULL, 2),
    ('50110003-0000-4000-8000-000000000000', ch11, org_id, a11, 'L''area di distribuzione e'' mantenuta in ordine e pulita durante il servizio?', 'non_compliant', 'Condensa sul soffitto sopra il banco. Rischio caduta gocce sugli alimenti. Manutenzione HVAC necessaria.', 3),
    ('50110004-0000-4000-8000-000000000000', ch11, org_id, a11, 'Le attrezzature di distribuzione sono sanificate dopo ogni turno?', 'compliant', NULL, 4),
    ('50110005-0000-4000-8000-000000000000', ch11, org_id, a11, 'I residui alimentari vengono smaltiti correttamente e in tempi adeguati?', 'compliant', NULL, 5),
    ('50110006-0000-4000-8000-000000000000', ch11, org_id, a11, 'Il registro delle temperature di distribuzione e'' compilato regolarmente?', 'non_compliant', 'Registro non compilato per 3 giorni su 5 della settimana precedente al sopralluogo.', 6),
    ('50110007-0000-4000-8000-000000000000', ch11, org_id, a11, 'Sono presenti e visibili cartelli informativi per gli allergeni?', 'compliant', NULL, 7),
    ('50110008-0000-4000-8000-000000000000', ch11, org_id, a11, 'Il tempo massimo di permanenza degli alimenti in distribuzione e'' rispettato?', 'compliant', NULL, 8)
  ON CONFLICT (id) DO NOTHING;

  -- AUDIT 12 (score 85) — 1 non_compliant
  INSERT INTO checklist_items (id, checklist_id, organization_id, audit_id, question, outcome, notes, sort_order) VALUES
    ('50120001-0000-4000-8000-000000000000', ch12, org_id, a12, 'Le temperature della linea di distribuzione sono monitorate e conformi?', 'compliant', NULL, 1),
    ('50120002-0000-4000-8000-000000000000', ch12, org_id, a12, 'Il personale addetto alla distribuzione indossa DPI idonei (guanti, copricapo)?', 'compliant', NULL, 2),
    ('50120003-0000-4000-8000-000000000000', ch12, org_id, a12, 'L''area di distribuzione e'' mantenuta in ordine e pulita durante il servizio?', 'compliant', NULL, 3),
    ('50120004-0000-4000-8000-000000000000', ch12, org_id, a12, 'Le attrezzature di distribuzione sono sanificate dopo ogni turno?', 'compliant', NULL, 4),
    ('50120005-0000-4000-8000-000000000000', ch12, org_id, a12, 'I residui alimentari vengono smaltiti correttamente e in tempi adeguati?', 'compliant', NULL, 5),
    ('50120006-0000-4000-8000-000000000000', ch12, org_id, a12, 'Il registro delle temperature di distribuzione e'' compilato regolarmente?', 'compliant', 'Registro completo e aggiornato. Ottimo.', 6),
    ('50120007-0000-4000-8000-000000000000', ch12, org_id, a12, 'Sono presenti e visibili cartelli informativi per gli allergeni?', 'compliant', NULL, 7),
    ('50120008-0000-4000-8000-000000000000', ch12, org_id, a12, 'Il tempo massimo di permanenza degli alimenti in distribuzione e'' rispettato?', 'non_compliant', 'Soup station attiva da oltre 4 ore. Procedura interna prevede sostituzione ogni 2 ore.', 8)
  ON CONFLICT (id) DO NOTHING;

END $$;

-- ─── PART 3 — Non-Conformities and Corrective Actions ────────────────────────

DO $$
DECLARE
  org_id uuid := '4ed14a8b-a5b5-4933-b83f-a940b4993707';
  a01 uuid := '30000000-0000-4000-8000-000000000001';
  a02 uuid := '30000000-0000-4000-8000-000000000002';
  a04 uuid := '30000000-0000-4000-8000-000000000004';
  a05 uuid := '30000000-0000-4000-8000-000000000005';
  a06 uuid := '30000000-0000-4000-8000-000000000006';
  a07 uuid := '30000000-0000-4000-8000-000000000007';
  a08 uuid := '30000000-0000-4000-8000-000000000008';
  a10 uuid := '30000000-0000-4000-8000-000000000010';
  a11 uuid := '30000000-0000-4000-8000-000000000011';
  a12 uuid := '30000000-0000-4000-8000-000000000012';
BEGIN
  -- Non-Conformities (severity: minor|major|critical; status: open|in_progress|closed|on_hold)
  INSERT INTO non_conformities (id, organization_id, audit_id, checklist_item_id, title, description, severity, status) VALUES
    ('60000001-0000-4000-8000-000000000000', org_id, a01, '50010001-0000-4000-8000-000000000000', 'Temperatura refrigerazione fuori norma', 'Il banco frigo laterale presenta +7°C, superiore al limite di +4°C. Termometro non calibrato da oltre 6 mesi.', 'major', 'open'),
    ('60000002-0000-4000-8000-000000000000', org_id, a01, '50010002-0000-4000-8000-000000000000', 'Superfici di lavoro non sanificate a inizio turno', 'Piano cottura con residui visibili di lavorazione precedente. Scheda sanificazione non compilata per il turno mattutino.', 'minor', 'open'),
    ('60000003-0000-4000-8000-000000000000', org_id, a02, '50020004-0000-4000-8000-000000000000', 'Mancato utilizzo copricapo da parte dell''operatore', 'Un operatore rilevato senza copricapo durante la lavorazione in area pasticceria, violando le norme igieniche aziendali.', 'minor', 'closed'),
    ('60000004-0000-4000-8000-000000000000', org_id, a04, '50040001-0000-4000-8000-000000000000', 'Umidita'' magazzino fuori norma — condizionamento guasto', 'Umidita'' al 78%, ben oltre il limite del 60%. L''impianto di condizionamento e'' non funzionante.', 'major', 'open'),
    ('60000005-0000-4000-8000-000000000000', org_id, a04, '50040002-0000-4000-8000-000000000000', 'Prodotti chimici a contatto con alimenti', 'Detergenti e disinfettanti sullo stesso scaffale di farine e cereali. Rischio contaminazione chimica elevato.', 'critical', 'open'),
    ('60000006-0000-4000-8000-000000000000', org_id, a04, '50040003-0000-4000-8000-000000000000', 'Mancata applicazione metodo FIFO', 'Prodotti con data di scadenza piu'' recente stoccati davanti a quelli piu'' vecchi. Rotazione scorte non applicata.', 'minor', 'open'),
    ('60000007-0000-4000-8000-000000000000', org_id, a05, '50050003-0000-4000-8000-000000000000', 'FIFO ancora non rispettato — NC ricorrente', 'Nonostante la segnalazione precedente, si rileva ancora prodotto scaduto non rimosso. FIFO non applicato sistematicamente.', 'minor', 'open'),
    ('60000008-0000-4000-8000-000000000000', org_id, a05, '50050005-0000-4000-8000-000000000000', 'Pulizia magazzino carente nelle aree angolari', 'Accumulo di polvere negli angoli del magazzino. Scheda di pulizia non completamente compilata per gennaio 2026.', 'minor', 'open'),
    ('60000009-0000-4000-8000-000000000000', org_id, a06, '50060006-0000-4000-8000-000000000000', 'Presenza di roditori nel magazzino alimenti', 'Rilevate tracce di roditori (feci e rosicchiature imballaggi) nell''angolo nord-est. Intervento di disinfestazione urgente.', 'critical', 'open'),
    ('60000010-0000-4000-8000-000000000000', org_id, a07, '50070002-0000-4000-8000-000000000000', 'Affettatrice non sanificata correttamente', 'Affettatrice con residui proteici visibili tra le lame. Piano di sanificazione non rispettato nel turno di produzione.', 'major', 'open'),
    ('60000011-0000-4000-8000-000000000000', org_id, a07, '50070005-0000-4000-8000-000000000000', 'Prodotto scaduto non rimosso dal frigorifero', 'Trovato vasetto di yogurt scaduto ancora presente in frigorifero. Procedura di verifica scadenze non applicata.', 'minor', 'open'),
    ('60000012-0000-4000-8000-000000000000', org_id, a08, '50080004-0000-4000-8000-000000000000', 'Utilizzo di gioielli durante la manipolazione alimenti', 'Un operatore addetto alla preparazione rilevato con orecchini visibili. Violazione del regolamento igienico aziendale.', 'minor', 'open'),
    ('60000013-0000-4000-8000-000000000000', org_id, a10, '50100001-0000-4000-8000-000000000000', 'Temperatura distribuzione antipasti oltre il limite', 'Temperatura vassoiera antipasti a +12°C. Limite previsto per alimenti freddi da distribuzione: +8°C.', 'major', 'open'),
    ('60000014-0000-4000-8000-000000000000', org_id, a10, '50100002-0000-4000-8000-000000000000', 'Mancato utilizzo guanti durante la distribuzione', 'Operatori addetti alla distribuzione senza guanti monouso durante il contatto con gli alimenti.', 'minor', 'open'),
    ('60000015-0000-4000-8000-000000000000', org_id, a10, '50100003-0000-4000-8000-000000000000', 'Banco distribuzione non igienizzato durante il servizio', 'Vassoio sporco a contatto diretto con il piano del banco. Assenza di separazione tra sporco e pulito.', 'minor', 'open'),
    ('60000016-0000-4000-8000-000000000000', org_id, a11, '50110003-0000-4000-8000-000000000000', 'Condensa sul soffitto sopra il banco distribuzione', 'Condensa sul soffitto in corrispondenza del banco distribuzione. Rischio caduta gocce sugli alimenti. Necessario intervento HVAC.', 'major', 'open'),
    ('60000017-0000-4000-8000-000000000000', org_id, a11, '50110006-0000-4000-8000-000000000000', 'Registro temperature distribuzione non compilato', 'Registro temperature non compilato per 3 giorni su 5 della settimana precedente. Responsabile non designato.', 'minor', 'open'),
    ('60000018-0000-4000-8000-000000000000', org_id, a12, '50120008-0000-4000-8000-000000000000', 'Soup station attiva oltre il tempo massimo consentito', 'La soup station risulta attiva da oltre 4 ore. La procedura interna prevede sostituzione ogni 2 ore per alimenti caldi.', 'minor', 'open')
  ON CONFLICT (id) DO NOTHING;

  -- Corrective Actions (status: pending|in_progress|completed|overdue|cancelled)
  -- CAs with past target_completion_date + status pending/in_progress appear as overdue in dashboard
  INSERT INTO corrective_actions (id, organization_id, non_conformity_id, description, responsible_person_name, target_completion_date, status) VALUES
    ('70000001-0000-4000-8000-000000000000', org_id, '60000001-0000-4000-8000-000000000000', 'Calibrare il termometro e verificare impianto di refrigerazione. Contattare tecnico manutentore entro 48h per intervento urgente. Rilevazione temperatura ogni 2h fino alla riparazione.', 'Marco Bianchi', '2025-10-15', 'in_progress'),
    ('70000002-0000-4000-8000-000000000000', org_id, '60000002-0000-4000-8000-000000000000', 'Ripristino immediato delle procedure di sanificazione. Formazione specifica del personale sul corretto utilizzo delle schede di sanificazione.', 'Carla Verdi', '2025-10-01', 'in_progress'),
    ('70000003-0000-4000-8000-000000000000', org_id, '60000003-0000-4000-8000-000000000000', 'Richiamo verbale e scritto all''operatore. Affissione cartello promemoria DPI in area pasticceria. Aggiornamento regolamento interno igiene personale.', 'Luigi Rossi', '2025-12-20', 'completed'),
    ('70000004-0000-4000-8000-000000000000', org_id, '60000004-0000-4000-8000-000000000000', 'Riparazione urgente impianto di condizionamento. Attivazione deumidificatore portatile nel frattempo. Monitoraggio umidita'' ogni 2 ore con registrazione su apposito modulo.', 'Roberto Neri', '2025-11-30', 'in_progress'),
    ('70000005-0000-4000-8000-000000000000', org_id, '60000005-0000-4000-8000-000000000000', 'Trasferimento immediato di tutti i prodotti chimici in armadietto dedicato con lucchetto. Revisione planimetria magazzino. Aggiornamento procedura di stoccaggio con verifica mensile.', 'Roberto Neri', '2025-11-01', 'pending'),
    ('70000006-0000-4000-8000-000000000000', org_id, '60000006-0000-4000-8000-000000000000', 'Formazione del personale sul metodo FIFO. Implementazione sistema etichettatura con data di arrivo. Verifica scorte e rimozione immediata prodotti scaduti.', 'Carla Verdi', '2025-11-15', 'pending'),
    ('70000007-0000-4000-8000-000000000000', org_id, '60000007-0000-4000-8000-000000000000', 'Introduzione checklist giornaliera FIFO compilata dal magazziniere. Audit interno settimanale sulle scorte. Rimozione immediata del prodotto scaduto rilevato.', 'Marco Bianchi', '2026-02-15', 'pending'),
    ('70000008-0000-4000-8000-000000000000', org_id, '60000008-0000-4000-8000-000000000000', 'Pulizia straordinaria del magazzino con attenzione agli angoli. Aggiornamento scheda pulizia con check-point specifici per aree angolari e sotto-scaffali.', 'Carla Verdi', '2026-02-28', 'pending'),
    ('70000009-0000-4000-8000-000000000000', org_id, '60000009-0000-4000-8000-000000000000', 'Intervento urgente ditta specializzata disinfestazione (entro 24h). Identificazione e sigillatura punti di accesso. Intensificazione piano di monitoraggio roditori con sopralluogo quindicinale.', 'Roberto Neri', '2026-03-01', 'in_progress'),
    ('70000010-0000-4000-8000-000000000000', org_id, '60000010-0000-4000-8000-000000000000', 'Sanificazione immediata dell''affettatrice con procedura completa (smontaggio, lavaggio, disinfezione). Formazione del responsabile turno sulle procedure di sanificazione attrezzature taglio.', 'Luigi Rossi', '2025-10-31', 'completed'),
    ('70000011-0000-4000-8000-000000000000', org_id, '60000011-0000-4000-8000-000000000000', 'Eliminazione immediata del prodotto scaduto. Aggiunta di verifica quotidiana scadenze alla checklist HACCP del turno mattino. Responsabile: cuoco di turno.', 'Maria Russo', '2025-10-31', 'completed'),
    ('70000012-0000-4000-8000-000000000000', org_id, '60000012-0000-4000-8000-000000000000', 'Richiamo formale scritto all''operatore. Rinnovo formazione HACCP per tutto il personale di cucina entro il mese. Verifica rispetto norme igieniche nei successivi 30 giorni.', 'Luigi Rossi', '2026-01-31', 'in_progress'),
    ('70000013-0000-4000-8000-000000000000', org_id, '60000013-0000-4000-8000-000000000000', 'Abbassamento immediato temperatura vassoiera. Verifica e manutenzione impianto refrigerazione banco distribuzione. Controllo temperature ogni 30 minuti durante il servizio con registrazione.', 'Paola Ferrari', '2025-11-15', 'pending'),
    ('70000014-0000-4000-8000-000000000000', org_id, '60000014-0000-4000-8000-000000000000', 'Immediato utilizzo guanti monouso da parte di tutto il personale. Acquisto scorta guanti e posizionamento dispenser in area distribuzione. Briefing urgente al personale di turno.', 'Paola Ferrari', '2025-11-01', 'pending'),
    ('70000015-0000-4000-8000-000000000000', org_id, '60000015-0000-4000-8000-000000000000', 'Implementazione procedura di pulizia continua durante il servizio. Designazione responsabile igiene banco per ogni turno. Affissione procedura visibile in area distribuzione.', 'Paola Ferrari', '2025-11-30', 'in_progress'),
    ('70000016-0000-4000-8000-000000000000', org_id, '60000016-0000-4000-8000-000000000000', 'Richiesta intervento tecnico urgente sull''impianto HVAC. Posizionamento protezione fisica sopra il banco distribuzione nel frattempo. Monitoraggio giornaliero della situazione.', 'Andrea Conti', '2026-02-28', 'in_progress'),
    ('70000017-0000-4000-8000-000000000000', org_id, '60000017-0000-4000-8000-000000000000', 'Ripristino compilazione quotidiana del registro temperature. Designazione responsabile specifico per la compilazione. Verifica settimanale da parte del responsabile area distribuzione.', 'Andrea Conti', '2026-02-15', 'pending'),
    ('70000018-0000-4000-8000-000000000000', org_id, '60000018-0000-4000-8000-000000000000', 'Implementazione sistema timer per la soup station con allarme a 2 ore. Formazione del personale sulla procedura di sostituzione. Aggiornamento delle procedure operative standard.', 'Andrea Conti', '2026-03-31', 'pending')
  ON CONFLICT (id) DO NOTHING;

END $$;
