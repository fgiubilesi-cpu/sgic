
-- Inserisci i 4 template reali con UUID validi
INSERT INTO checklist_templates (id, title, description, organization_id, client_id)
VALUES 
  ('a0000001-0000-4000-8000-000000000001', 'HACCP Cucina — Controllo igienico-sanitario', 'Template standard per ispezioni HACCP in cucina.', '4ed14a8b-a5b5-4933-b83f-a940b4993707', NULL),
  ('a0000001-0000-4000-8000-000000000002', 'HACCP Produzione — Controllo igienico-sanitario', 'Template per ispezioni HACCP in area produzione.', '4ed14a8b-a5b5-4933-b83f-a940b4993707', NULL),
  ('a0000001-0000-4000-8000-000000000003', 'Magazzino — Controllo conservazione', 'Template per ispezioni magazzino. Copre stoccaggio, FIFO, condizioni ambientali.', '4ed14a8b-a5b5-4933-b83f-a940b4993707', NULL),
  ('a0000001-0000-4000-8000-000000000004', 'Distribuzione — Controllo igienico', 'Template per ispezioni area distribuzione. Copre temperature, DPI, sanificazione e allergeni.', '4ed14a8b-a5b5-4933-b83f-a940b4993707', NULL);

-- Domande HACCP Cucina
INSERT INTO template_questions (template_id, question, sort_order) VALUES
  ('a0000001-0000-4000-8000-000000000001', 'Le temperature di conservazione degli alimenti refrigerati sono mantenute tra 0°C e +4°C?', 1),
  ('a0000001-0000-4000-8000-000000000001', 'Le superfici di lavoro e le attrezzature sono pulite e sanificate prima dell''uso?', 2),
  ('a0000001-0000-4000-8000-000000000001', 'E'' garantita la separazione tra alimenti crudi e cotti per evitare contaminazioni crociate?', 3),
  ('a0000001-0000-4000-8000-000000000001', 'Il personale rispetta le norme igieniche (divisa, guanti, copricapo)?', 4),
  ('a0000001-0000-4000-8000-000000000001', 'I prodotti in scadenza o scaduti vengono rimossi e smaltiti correttamente?', 5),
  ('a0000001-0000-4000-8000-000000000001', 'Il piano di disinfestazione (pest control) e'' aggiornato e documentato?', 6),
  ('a0000001-0000-4000-8000-000000000001', 'La tracciabilita'' dei fornitori e delle materie prime e'' documentata?', 7),
  ('a0000001-0000-4000-8000-000000000001', 'I registri di controllo temperatura sono aggiornati quotidianamente?', 8);

-- Domande HACCP Produzione
INSERT INTO template_questions (template_id, question, sort_order) VALUES
  ('a0000001-0000-4000-8000-000000000002', 'Le temperature di conservazione degli alimenti refrigerati sono mantenute tra 0°C e +4°C?', 1),
  ('a0000001-0000-4000-8000-000000000002', 'Le superfici di lavoro e le attrezzature sono pulite e sanificate prima dell''uso?', 2),
  ('a0000001-0000-4000-8000-000000000002', 'E'' garantita la separazione tra alimenti crudi e cotti per evitare contaminazioni crociate?', 3),
  ('a0000001-0000-4000-8000-000000000002', 'Il personale rispetta le norme igieniche (divisa, guanti, copricapo)?', 4),
  ('a0000001-0000-4000-8000-000000000002', 'I prodotti in scadenza o scaduti vengono rimossi e smaltiti correttamente?', 5),
  ('a0000001-0000-4000-8000-000000000002', 'Il piano di disinfestazione (pest control) e'' aggiornato e documentato?', 6),
  ('a0000001-0000-4000-8000-000000000002', 'La tracciabilita'' dei fornitori e delle materie prime e'' documentata?', 7),
  ('a0000001-0000-4000-8000-000000000002', 'I registri di controllo temperatura sono aggiornati quotidianamente?', 8);

-- Domande Magazzino
INSERT INTO template_questions (template_id, question, sort_order) VALUES
  ('a0000001-0000-4000-8000-000000000003', 'Gli alimenti stoccati sono conservati nelle corrette condizioni di temperatura e umidita''?', 1),
  ('a0000001-0000-4000-8000-000000000003', 'I prodotti alimentari sono separati da prodotti non alimentari (detersivi, etc.)?', 2),
  ('a0000001-0000-4000-8000-000000000003', 'La rotazione delle scorte (FIFO) e'' applicata correttamente?', 3),
  ('a0000001-0000-4000-8000-000000000003', 'Gli imballaggi sono integri e privi di danni?', 4),
  ('a0000001-0000-4000-8000-000000000003', 'La pulizia del magazzino e'' effettuata regolarmente secondo le procedure?', 5),
  ('a0000001-0000-4000-8000-000000000003', 'Il magazzino e'' protetto dall''ingresso di insetti e roditori?', 6),
  ('a0000001-0000-4000-8000-000000000003', 'La documentazione di ricevimento merci e'' presente e aggiornata?', 7),
  ('a0000001-0000-4000-8000-000000000003', 'I prodotti allergeni sono conservati separatamente e identificati?', 8);

-- Domande Distribuzione
INSERT INTO template_questions (template_id, question, sort_order) VALUES
  ('a0000001-0000-4000-8000-000000000004', 'Le temperature della linea di distribuzione sono monitorate e conformi?', 1),
  ('a0000001-0000-4000-8000-000000000004', 'Il personale addetto alla distribuzione indossa DPI idonei (guanti, copricapo)?', 2),
  ('a0000001-0000-4000-8000-000000000004', 'L''area di distribuzione e'' mantenuta in ordine e pulita durante il servizio?', 3),
  ('a0000001-0000-4000-8000-000000000004', 'Le attrezzature di distribuzione sono sanificate dopo ogni turno?', 4),
  ('a0000001-0000-4000-8000-000000000004', 'I residui alimentari vengono smaltiti correttamente e in tempi adeguati?', 5),
  ('a0000001-0000-4000-8000-000000000004', 'Il registro delle temperature di distribuzione e'' compilato regolarmente?', 6),
  ('a0000001-0000-4000-8000-000000000004', 'Sono presenti e visibili cartelli informativi per gli allergeni?', 7),
  ('a0000001-0000-4000-8000-000000000004', 'Il tempo massimo di permanenza degli alimenti in distribuzione e'' rispettato?', 8);

-- Collega gli audit ai template corretti via JOIN su titolo checklist
UPDATE audits a SET template_id = 'a0000001-0000-4000-8000-000000000001'
FROM checklists cl WHERE cl.audit_id = a.id AND cl.title LIKE 'HACCP — Controllo%';

UPDATE audits a SET template_id = 'a0000001-0000-4000-8000-000000000002'
FROM checklists cl WHERE cl.audit_id = a.id AND cl.title LIKE 'HACCP Produzione%';

UPDATE audits a SET template_id = 'a0000001-0000-4000-8000-000000000003'
FROM checklists cl WHERE cl.audit_id = a.id AND cl.title LIKE 'Magazzino%';

UPDATE audits a SET template_id = 'a0000001-0000-4000-8000-000000000004'
FROM checklists cl WHERE cl.audit_id = a.id AND cl.title LIKE 'Distribuzione%';

NOTIFY pgrst, 'reload schema';
;
