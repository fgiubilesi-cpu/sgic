
DO $$
DECLARE
  org_id uuid := '4ed14a8b-a5b5-4933-b83f-a940b4993707';
  admin_id uuid := 'c6cc8a13-6e0d-47fd-ab44-8c4093679bd2';
  client_mario uuid := '10000000-0000-4000-8000-000000000001';
  client_biotech uuid := '10000000-0000-4000-8000-000000000002';
  loc_cucina uuid := '20000000-0000-4000-8000-000000000001';
  loc_magazzino uuid := '20000000-0000-4000-8000-000000000002';
  loc_produzione uuid := '20000000-0000-4000-8000-000000000003';
  loc_distribuzione uuid := '20000000-0000-4000-8000-000000000004';
  tmpl_haccp_cucina uuid := 'a0000001-0000-4000-8000-000000000001';
  tmpl_haccp_prod uuid := 'a0000001-0000-4000-8000-000000000002';
  tmpl_magazzino uuid := 'a0000001-0000-4000-8000-000000000003';
  tmpl_distrib uuid := 'a0000001-0000-4000-8000-000000000004';
  audit1 uuid := '30000000-0000-4000-8000-000000000011';
  audit2 uuid := '30000000-0000-4000-8000-000000000012';
  audit3 uuid := '30000000-0000-4000-8000-000000000013';
  audit4 uuid := '30000000-0000-4000-8000-000000000014';
  audit5 uuid := '30000000-0000-4000-8000-000000000015';
  audit6 uuid := '30000000-0000-4000-8000-000000000016';
  cl1 uuid := '40000000-0000-4000-8000-000000000011';
  cl2 uuid := '40000000-0000-4000-8000-000000000012';
  cl3 uuid := '40000000-0000-4000-8000-000000000013';
  cl4 uuid := '40000000-0000-4000-8000-000000000014';
  cl5 uuid := '40000000-0000-4000-8000-000000000015';
  cl6 uuid := '40000000-0000-4000-8000-000000000016';
BEGIN

-- ===== AUDIT 1: Closed, score 85, Ristorante Da Mario — Cucina Centrale =====
INSERT INTO audits (id, organization_id, client_id, location_id, auditor_id, title, status, scheduled_date, score, template_id)
VALUES (audit1, org_id, client_mario, loc_cucina, admin_id, 'Audit HACCP Cucina — Feb 2026', 'Closed', '2026-02-15', 85, tmpl_haccp_cucina)
ON CONFLICT (id) DO NOTHING;

INSERT INTO checklists (id, audit_id, organization_id, title)
VALUES (cl1, audit1, org_id, 'HACCP Cucina — Controllo igienico-sanitario') ON CONFLICT (id) DO NOTHING;

INSERT INTO checklist_items (id, checklist_id, organization_id, question, outcome, notes, sort_order) VALUES
  (gen_random_uuid(), cl1, org_id, 'Le temperature di conservazione sono rispettate (frigoriferi a ≤4°C)?', 'compliant', 'Tutti i frigoriferi nella norma', 1),
  (gen_random_uuid(), cl1, org_id, 'I piani di lavoro sono puliti e sanificati prima dell''uso?', 'compliant', 'Procedure SSOP rispettate', 2),
  (gen_random_uuid(), cl1, org_id, 'Il personale indossa DPI adeguati (guanti, cuffia, grembiule)?', 'non_compliant', 'Operatore privo di cuffia durante preparazione', 3),
  (gen_random_uuid(), cl1, org_id, 'I prodotti sono correttamente etichettati con data apertura?', 'compliant', NULL, 4),
  (gen_random_uuid(), cl1, org_id, 'La scadenza dei prodotti è verificata prima dell''utilizzo?', 'compliant', NULL, 5),
  (gen_random_uuid(), cl1, org_id, 'Il registro delle temperature è aggiornato quotidianamente?', 'non_compliant', 'Ultime 3 giornate non registrate', 6),
  (gen_random_uuid(), cl1, org_id, 'I contenitori per i rifiuti sono chiusi e correttamente posizionati?', 'compliant', NULL, 7),
  (gen_random_uuid(), cl1, org_id, 'Sono presenti istruzioni operative visibili in cucina?', 'not_applicable', 'Cucina nuova — in fase di allestimento', 8)
ON CONFLICT DO NOTHING;

INSERT INTO non_conformities (id, audit_id, organization_id, title, description, severity, status) VALUES
  ('50000000-0000-4000-8000-000000000011', audit1, org_id, 'DPI non indossati correttamente', 'Operatore osservato privo di cuffia durante preparazione pasti.', 'minor', 'open'),
  ('50000000-0000-4000-8000-000000000012', audit1, org_id, 'Registro temperature non aggiornato', 'Mancata registrazione temperature frigorifero per 3 giorni (12-14 feb).', 'major', 'open')
ON CONFLICT (id) DO NOTHING;

INSERT INTO corrective_actions (id, non_conformity_id, organization_id, description, action_plan, responsible_person_name, responsible_person_email, due_date, status) VALUES
  ('60000000-0000-4000-8000-000000000011', '50000000-0000-4000-8000-000000000011', org_id, 'Formazione DPI per tutto il personale di cucina', '1. Briefing con responsabile cucina
2. Affissione cartello DPI obbligatori
3. Verifica settimanale per 4 settimane', 'Marco Bianchi', 'marco.bianchi@dariomario.it', '2026-03-20', 'in_progress'),
  ('60000000-0000-4000-8000-000000000012', '50000000-0000-4000-8000-000000000012', org_id, 'Ripristino procedura registrazione temperature', '1. Nomina responsabile registrazione
2. Alert digitale giornaliero
3. Audit interno settimanale', 'Laura Conti', 'laura.conti@dariomario.it', '2026-03-15', 'pending')
ON CONFLICT (id) DO NOTHING;

-- ===== AUDIT 2: In Progress, Ristorante Da Mario — Magazzino =====
INSERT INTO audits (id, organization_id, client_id, location_id, auditor_id, title, status, scheduled_date, template_id)
VALUES (audit2, org_id, client_mario, loc_magazzino, admin_id, 'Audit Magazzino Alimenti — Mar 2026', 'In Progress', '2026-03-10', tmpl_magazzino)
ON CONFLICT (id) DO NOTHING;

INSERT INTO checklists (id, audit_id, organization_id, title)
VALUES (cl2, audit2, org_id, 'Magazzino — Controllo conservazione') ON CONFLICT (id) DO NOTHING;

INSERT INTO checklist_items (id, checklist_id, organization_id, question, outcome, notes, sort_order) VALUES
  (gen_random_uuid(), cl2, org_id, 'I prodotti secchi sono conservati su scaffali rialzati dal pavimento?', 'compliant', NULL, 1),
  (gen_random_uuid(), cl2, org_id, 'Le condizioni igieniche del magazzino sono adeguate?', 'compliant', 'Nessuna traccia di infestatori', 2),
  (gen_random_uuid(), cl2, org_id, 'I prodotti sono organizzati FIFO (First In First Out)?', 'non_compliant', 'Prodotti più vecchi in fondo agli scaffali', 3),
  (gen_random_uuid(), cl2, org_id, 'Le temperature del magazzino refrigerato sono nei limiti?', 'pending', NULL, 4),
  (gen_random_uuid(), cl2, org_id, 'I cartoni danneggiati sono stati rimossi?', 'pending', NULL, 5),
  (gen_random_uuid(), cl2, org_id, 'È presente documentazione di ricevimento merce aggiornata?', 'pending', NULL, 6),
  (gen_random_uuid(), cl2, org_id, 'I prodotti allergenici sono stoccati separatamente?', 'compliant', 'Area allergenici delimitata', 7),
  (gen_random_uuid(), cl2, org_id, 'Il registro non conformità fornitori è aggiornato?', 'pending', NULL, 8)
ON CONFLICT DO NOTHING;

INSERT INTO non_conformities (id, audit_id, organization_id, title, description, severity, status) VALUES
  ('50000000-0000-4000-8000-000000000013', audit2, org_id, 'Gestione FIFO non rispettata', 'Prodotti con scadenza più vecchia posizionati in fondo. Rischio utilizzo scaduti.', 'major', 'open')
ON CONFLICT (id) DO NOTHING;

-- ===== AUDIT 3: Scheduled Apr 2026, BioTech Produzione =====
INSERT INTO audits (id, organization_id, client_id, location_id, auditor_id, title, status, scheduled_date, template_id)
VALUES (audit3, org_id, client_biotech, loc_produzione, admin_id, 'Audit HACCP Produzione — Apr 2026', 'Scheduled', '2026-04-08', tmpl_haccp_prod)
ON CONFLICT (id) DO NOTHING;

INSERT INTO checklists (id, audit_id, organization_id, title)
VALUES (cl3, audit3, org_id, 'HACCP Produzione — Controllo igienico-sanitario') ON CONFLICT (id) DO NOTHING;

INSERT INTO checklist_items (id, checklist_id, organization_id, question, outcome, notes, sort_order) VALUES
  (gen_random_uuid(), cl3, org_id, 'Il piano HACCP è aggiornato e disponibile in produzione?', 'pending', NULL, 1),
  (gen_random_uuid(), cl3, org_id, 'I CCP sono monitorati e documentati?', 'pending', NULL, 2),
  (gen_random_uuid(), cl3, org_id, 'Le attrezzature sono calibrate e verificate periodicamente?', 'pending', NULL, 3),
  (gen_random_uuid(), cl3, org_id, 'Le procedure di pulizia impianti sono documentate?', 'pending', NULL, 4),
  (gen_random_uuid(), cl3, org_id, 'Le analisi microbiologiche periodiche sono in regola?', 'pending', NULL, 5),
  (gen_random_uuid(), cl3, org_id, 'La tracciabilità lotto è garantita in ogni fase?', 'pending', NULL, 6),
  (gen_random_uuid(), cl3, org_id, 'Il personale è formato sulle procedure HACCP?', 'pending', NULL, 7),
  (gen_random_uuid(), cl3, org_id, 'I registri di controllo produzione sono completi?', 'pending', NULL, 8)
ON CONFLICT DO NOTHING;

-- ===== AUDIT 4: Closed score 92, BioTech Distribuzione =====
INSERT INTO audits (id, organization_id, client_id, location_id, auditor_id, title, status, scheduled_date, score, template_id)
VALUES (audit4, org_id, client_biotech, loc_distribuzione, admin_id, 'Audit Distribuzione — Gen 2026', 'Closed', '2026-01-20', 92, tmpl_distrib)
ON CONFLICT (id) DO NOTHING;

INSERT INTO checklists (id, audit_id, organization_id, title)
VALUES (cl4, audit4, org_id, 'Distribuzione — Controllo igienico') ON CONFLICT (id) DO NOTHING;

INSERT INTO checklist_items (id, checklist_id, organization_id, question, outcome, notes, sort_order) VALUES
  (gen_random_uuid(), cl4, org_id, 'I mezzi di trasporto sono puliti e sanificati?', 'compliant', 'Certificato sanificazione del 18/01', 1),
  (gen_random_uuid(), cl4, org_id, 'Le temperature di trasporto sono monitorate con data logger?', 'compliant', 'Range rispettato', 2),
  (gen_random_uuid(), cl4, org_id, 'I documenti di trasporto accompagnano ogni consegna?', 'compliant', NULL, 3),
  (gen_random_uuid(), cl4, org_id, 'Le condizioni di imballaggio sono integre alla consegna?', 'compliant', NULL, 4),
  (gen_random_uuid(), cl4, org_id, 'I prodotti respinti al ricevimento sono gestiti correttamente?', 'not_applicable', 'Nessun prodotto respinto nel periodo', 5),
  (gen_random_uuid(), cl4, org_id, 'I tempi di consegna rispettano i limiti di sicurezza?', 'compliant', NULL, 6),
  (gen_random_uuid(), cl4, org_id, 'Il personale addetto ha attestato HACCP valido?', 'non_compliant', 'Attestato scaduto per 1 autista', 7),
  (gen_random_uuid(), cl4, org_id, 'I resi sono gestiti e tracciati correttamente?', 'compliant', NULL, 8)
ON CONFLICT DO NOTHING;

INSERT INTO non_conformities (id, audit_id, organization_id, title, description, severity, status) VALUES
  ('50000000-0000-4000-8000-000000000014', audit4, org_id, 'Attestato HACCP scaduto — distribuzione', 'Autista con attestato HACCP scaduto da 3 mesi.', 'minor', 'closed')
ON CONFLICT (id) DO NOTHING;

INSERT INTO corrective_actions (id, non_conformity_id, organization_id, description, action_plan, responsible_person_name, responsible_person_email, due_date, status, completed_at) VALUES
  ('60000000-0000-4000-8000-000000000013', '50000000-0000-4000-8000-000000000014', org_id, 'Rinnovo attestato HACCP autista', 'Iscrizione corso HACCP online — completato il 28/01/2026', 'Giuseppe Verdi', 'g.verdi@biotechsrl.it', '2026-02-01', 'completed', '2026-01-28')
ON CONFLICT (id) DO NOTHING;

-- ===== AUDIT 5: Scheduled Mar 2026, BioTech Produzione =====
INSERT INTO audits (id, organization_id, client_id, location_id, auditor_id, title, status, scheduled_date, template_id)
VALUES (audit5, org_id, client_biotech, loc_produzione, admin_id, 'Verifica Straordinaria Produzione — Mar 2026', 'Scheduled', '2026-03-18', tmpl_haccp_prod)
ON CONFLICT (id) DO NOTHING;

INSERT INTO checklists (id, audit_id, organization_id, title)
VALUES (cl5, audit5, org_id, 'HACCP Produzione — Controllo igienico-sanitario') ON CONFLICT (id) DO NOTHING;

INSERT INTO checklist_items (id, checklist_id, organization_id, question, outcome, notes, sort_order) VALUES
  (gen_random_uuid(), cl5, org_id, 'Il piano HACCP è aggiornato e disponibile in produzione?', 'pending', NULL, 1),
  (gen_random_uuid(), cl5, org_id, 'I CCP sono monitorati e documentati?', 'pending', NULL, 2),
  (gen_random_uuid(), cl5, org_id, 'Le attrezzature sono calibrate e verificate periodicamente?', 'pending', NULL, 3),
  (gen_random_uuid(), cl5, org_id, 'Le procedure di pulizia impianti sono documentate?', 'pending', NULL, 4),
  (gen_random_uuid(), cl5, org_id, 'Le analisi microbiologiche periodiche sono in regola?', 'pending', NULL, 5),
  (gen_random_uuid(), cl5, org_id, 'La tracciabilità lotto è garantita in ogni fase?', 'pending', NULL, 6),
  (gen_random_uuid(), cl5, org_id, 'Il personale è formato sulle procedure HACCP?', 'pending', NULL, 7),
  (gen_random_uuid(), cl5, org_id, 'I registri di controllo produzione sono completi?', 'pending', NULL, 8)
ON CONFLICT DO NOTHING;

-- ===== AUDIT 6: Closed score 60, Ristorante Da Mario, Dic 2025 =====
INSERT INTO audits (id, organization_id, client_id, location_id, auditor_id, title, status, scheduled_date, score, template_id)
VALUES (audit6, org_id, client_mario, loc_cucina, admin_id, 'Audit HACCP Cucina — Dic 2025', 'Closed', '2025-12-10', 60, tmpl_haccp_cucina)
ON CONFLICT (id) DO NOTHING;

INSERT INTO checklists (id, audit_id, organization_id, title)
VALUES (cl6, audit6, org_id, 'HACCP Cucina — Controllo igienico-sanitario') ON CONFLICT (id) DO NOTHING;

INSERT INTO checklist_items (id, checklist_id, organization_id, question, outcome, notes, sort_order) VALUES
  (gen_random_uuid(), cl6, org_id, 'Le temperature di conservazione sono rispettate (frigoriferi a ≤4°C)?', 'non_compliant', 'Frigorifero n.2 a 8°C — guasto rilevato', 1),
  (gen_random_uuid(), cl6, org_id, 'I piani di lavoro sono puliti e sanificati prima dell''uso?', 'compliant', NULL, 2),
  (gen_random_uuid(), cl6, org_id, 'Il personale indossa DPI adeguati (guanti, cuffia, grembiule)?', 'non_compliant', 'Nessun DPI indossato da 2 operatori', 3),
  (gen_random_uuid(), cl6, org_id, 'I prodotti sono correttamente etichettati con data apertura?', 'non_compliant', '5 prodotti senza etichetta data apertura', 4),
  (gen_random_uuid(), cl6, org_id, 'La scadenza dei prodotti è verificata prima dell''utilizzo?', 'compliant', NULL, 5),
  (gen_random_uuid(), cl6, org_id, 'Il registro delle temperature è aggiornato quotidianamente?', 'non_compliant', 'Registro non compilato da 2 settimane', 6),
  (gen_random_uuid(), cl6, org_id, 'I contenitori per i rifiuti sono chiusi e correttamente posizionati?', 'compliant', NULL, 7),
  (gen_random_uuid(), cl6, org_id, 'Sono presenti istruzioni operative visibili in cucina?', 'compliant', NULL, 8)
ON CONFLICT DO NOTHING;

INSERT INTO non_conformities (id, audit_id, organization_id, title, description, severity, status) VALUES
  ('50000000-0000-4000-8000-000000000015', audit6, org_id, 'Frigorifero fuori temperatura', 'Frigorifero n.2 rilevato a 8°C (limite: ≤4°C). Prodotti a rischio contaminazione.', 'critical', 'open'),
  ('50000000-0000-4000-8000-000000000016', audit6, org_id, 'Assenza DPI multipli operatori', '2 operatori privi di qualsiasi DPI. Grave rischio igienico.', 'major', 'open'),
  ('50000000-0000-4000-8000-000000000017', audit6, org_id, 'Prodotti non etichettati', '5 prodotti aperti senza etichetta data apertura.', 'minor', 'open')
ON CONFLICT (id) DO NOTHING;

END $$;
;
