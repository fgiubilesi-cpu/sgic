-- ============================================================
-- SGIC — Reset Demo Data
-- Removes all demo seed data in reverse FK order.
-- Safe to run multiple times (idempotent).
-- ============================================================

-- 1. Corrective Actions (child of non_conformities)
DELETE FROM corrective_actions
WHERE id::text LIKE '70000%';

-- 2. Non Conformities (child of checklist_items / audits)
DELETE FROM non_conformities
WHERE id::text LIKE '60000%';

-- 3. Checklist Items (child of checklists)
--    Audit IDs 01-09 produce item IDs starting with '500X000Y'
--    Audit IDs 10-12 produce item IDs starting with '5010', '5011', '5012'
DELETE FROM checklist_items
WHERE id::text LIKE '500%'
   OR id::text LIKE '5010%'
   OR id::text LIKE '5011%'
   OR id::text LIKE '5012%';

-- 4. Checklists (child of audits)
DELETE FROM checklists
WHERE id::text LIKE '40000000%';

-- 5. Audits (child of clients / locations)
DELETE FROM audits
WHERE id::text LIKE '30000000%';

-- 6. Locations (child of clients)
DELETE FROM locations
WHERE id::text LIKE '20000000%';

-- 7. Clients (root demo entities)
DELETE FROM clients
WHERE id::text LIKE '10000000%';
