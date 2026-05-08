-- Corrige a migration 20260507120000 que tinha erro de sintaxe SQL.
-- WHERE NOT EXISTS deve ser parte do WHERE principal, antes do LIMIT.

INSERT INTO "clients" (id, name, company, phone, email, status, activated_at, owner_id, created_at, updated_at)
SELECT gen_random_uuid(), 'Rafael Margoti', 'Emagrecentro', '4899857375', 'rafa.margotti@gmail.com', 'ACTIVE'::"ClientStatus", '2025-10-11'::timestamp, u.id, NOW(), NOW()
FROM "users" u
WHERE u.role = 'ADMIN'
AND NOT EXISTS (SELECT 1 FROM "clients" WHERE LOWER(email) = LOWER('rafa.margotti@gmail.com'))
LIMIT 1;

INSERT INTO "clients" (id, name, company, phone, email, status, activated_at, owner_id, created_at, updated_at)
SELECT gen_random_uuid(), 'Juliana Gelesky', 'Clínica SQIN', '11932615778', 'jugele01@gmail.com', 'ACTIVE'::"ClientStatus", '2025-11-14'::timestamp, u.id, NOW(), NOW()
FROM "users" u
WHERE u.role = 'ADMIN'
AND NOT EXISTS (SELECT 1 FROM "clients" WHERE LOWER(email) = LOWER('jugele01@gmail.com'))
LIMIT 1;

INSERT INTO "clients" (id, name, company, phone, email, status, activated_at, owner_id, created_at, updated_at)
SELECT gen_random_uuid(), 'Ana Paula Senna', 'AKTKD', '71 9230-0080', 'anapaulasenna@gmail.com', 'ACTIVE'::"ClientStatus", '2025-11-24'::timestamp, u.id, NOW(), NOW()
FROM "users" u
WHERE u.role = 'ADMIN'
AND NOT EXISTS (SELECT 1 FROM "clients" WHERE LOWER(email) = LOWER('anapaulasenna@gmail.com'))
LIMIT 1;

INSERT INTO "clients" (id, name, company, phone, email, status, activated_at, owner_id, created_at, updated_at)
SELECT gen_random_uuid(), 'Ricardo Buhrer', 'Projeto Broadway', '4191072855', 'ricardotenorbrazil@gmail.com', 'ACTIVE'::"ClientStatus", '2025-12-03'::timestamp, u.id, NOW(), NOW()
FROM "users" u
WHERE u.role = 'ADMIN'
AND NOT EXISTS (SELECT 1 FROM "clients" WHERE LOWER(email) = LOWER('ricardotenorbrazil@gmail.com'))
LIMIT 1;

INSERT INTO "clients" (id, name, company, phone, email, status, activated_at, owner_id, created_at, updated_at)
SELECT gen_random_uuid(), 'Marcos Lupato', 'Top Training', '54 9922-4793', 'maninho330@hotmail.com', 'ACTIVE'::"ClientStatus", '2026-01-05'::timestamp, u.id, NOW(), NOW()
FROM "users" u
WHERE u.role = 'ADMIN'
AND NOT EXISTS (SELECT 1 FROM "clients" WHERE LOWER(email) = LOWER('maninho330@hotmail.com'))
LIMIT 1;

INSERT INTO "clients" (id, name, company, phone, email, status, activated_at, owner_id, created_at, updated_at)
SELECT gen_random_uuid(), 'Graziela', 'Guarajuba Beach & Country', '55 71 9303-5863', 'marianametaplan@gmail.com', 'ACTIVE'::"ClientStatus", '2026-01-20'::timestamp, u.id, NOW(), NOW()
FROM "users" u
WHERE u.role = 'ADMIN'
AND NOT EXISTS (SELECT 1 FROM "clients" WHERE LOWER(email) = LOWER('marianametaplan@gmail.com'))
LIMIT 1;

INSERT INTO "clients" (id, name, company, phone, email, status, activated_at, owner_id, created_at, updated_at)
SELECT gen_random_uuid(), 'Neide Aparecida Gaudio', 'Village Centro de Estética', '77 99998-5051', 'nevesgaudio@gmail.com', 'ACTIVE'::"ClientStatus", '2026-02-23'::timestamp, u.id, NOW(), NOW()
FROM "users" u
WHERE u.role = 'ADMIN'
AND NOT EXISTS (SELECT 1 FROM "clients" WHERE LOWER(email) = LOWER('nevesgaudio@gmail.com'))
LIMIT 1;

INSERT INTO "clients" (id, name, company, phone, email, status, activated_at, owner_id, created_at, updated_at)
SELECT gen_random_uuid(), 'Diego Ferreira', 'Academia Seven', '43 8447 0068', 'thutio@hotmail.com', 'ACTIVE'::"ClientStatus", '2026-03-03'::timestamp, u.id, NOW(), NOW()
FROM "users" u
WHERE u.role = 'ADMIN'
AND NOT EXISTS (SELECT 1 FROM "clients" WHERE LOWER(email) = LOWER('thutio@hotmail.com'))
LIMIT 1;

INSERT INTO "clients" (id, name, company, phone, email, status, activated_at, owner_id, created_at, updated_at)
SELECT gen_random_uuid(), 'Felipe Dantas', 'Felipe Dantas', '71 9624-4487', 'fd1991dantas@gmail.com', 'ACTIVE'::"ClientStatus", '2026-03-11'::timestamp, u.id, NOW(), NOW()
FROM "users" u
WHERE u.role = 'ADMIN'
AND NOT EXISTS (SELECT 1 FROM "clients" WHERE LOWER(email) = LOWER('fd1991dantas@gmail.com'))
LIMIT 1;

INSERT INTO "clients" (id, name, company, phone, email, status, activated_at, owner_id, created_at, updated_at)
SELECT gen_random_uuid(), 'Gleison', 'Reduto Studio Fitness', '55 47 9243-7781', 'reduto@redutofitness.com.br', 'ACTIVE'::"ClientStatus", '2026-03-09'::timestamp, u.id, NOW(), NOW()
FROM "users" u
WHERE u.role = 'ADMIN'
AND NOT EXISTS (SELECT 1 FROM "clients" WHERE LOWER(email) = LOWER('reduto@redutofitness.com.br'))
LIMIT 1;

INSERT INTO "clients" (id, name, company, phone, email, status, activated_at, owner_id, created_at, updated_at)
SELECT gen_random_uuid(), 'Evlin Domiciano', 'Clínica Flessibilita', '65810044883', 'evlin.domiciano@hotmail.com', 'ACTIVE'::"ClientStatus", '2026-03-11'::timestamp, u.id, NOW(), NOW()
FROM "users" u
WHERE u.role = 'ADMIN'
AND NOT EXISTS (SELECT 1 FROM "clients" WHERE LOWER(email) = LOWER('evlin.domiciano@hotmail.com'))
LIMIT 1;

INSERT INTO "clients" (id, name, company, phone, email, status, activated_at, owner_id, created_at, updated_at)
SELECT gen_random_uuid(), 'Lacaciele Brito', 'LK3 Cursos', '71 9228-2414', 'lakacursos@gmail.com', 'ACTIVE'::"ClientStatus", '2026-03-12'::timestamp, u.id, NOW(), NOW()
FROM "users" u
WHERE u.role = 'ADMIN'
AND NOT EXISTS (SELECT 1 FROM "clients" WHERE LOWER(email) = LOWER('lakacursos@gmail.com'))
LIMIT 1;

INSERT INTO "clients" (id, name, company, phone, email, status, activated_at, owner_id, created_at, updated_at)
SELECT gen_random_uuid(), 'Alex', 'Cia do Corpo', '5430211079', 'contato@ciadocorpo.com.br', 'ACTIVE'::"ClientStatus", '2026-04-06'::timestamp, u.id, NOW(), NOW()
FROM "users" u
WHERE u.role = 'ADMIN'
AND NOT EXISTS (SELECT 1 FROM "clients" WHERE LOWER(email) = LOWER('contato@ciadocorpo.com.br'))
LIMIT 1;

INSERT INTO "clients" (id, name, company, phone, email, status, activated_at, owner_id, created_at, updated_at)
SELECT gen_random_uuid(), 'Rudah', 'Gracie Barra', '61981881711', 'ceafi.sces@gmail.com', 'ACTIVE'::"ClientStatus", '2026-04-27'::timestamp, u.id, NOW(), NOW()
FROM "users" u
WHERE u.role = 'ADMIN'
AND NOT EXISTS (SELECT 1 FROM "clients" WHERE LOWER(email) = LOWER('ceafi.sces@gmail.com'))
LIMIT 1;

INSERT INTO "clients" (id, name, company, phone, email, status, activated_at, owner_id, created_at, updated_at)
SELECT gen_random_uuid(), 'Jackson de Paula Velasco', 'AJE de Boxe', '92 9932-1954', 'jacksonvelasco007@gmail.com', 'ACTIVE'::"ClientStatus", '2026-04-23'::timestamp, u.id, NOW(), NOW()
FROM "users" u
WHERE u.role = 'ADMIN'
AND NOT EXISTS (SELECT 1 FROM "clients" WHERE LOWER(email) = LOWER('jacksonvelasco007@gmail.com'))
LIMIT 1;

INSERT INTO "clients" (id, name, company, phone, email, status, activated_at, owner_id, created_at, updated_at)
SELECT gen_random_uuid(), 'Mauricio', 'Flexfitness', '51994039791', 'mauriciorpaim@gmail.com', 'ACTIVE'::"ClientStatus", NULL, u.id, NOW(), NOW()
FROM "users" u
WHERE u.role = 'ADMIN'
AND NOT EXISTS (SELECT 1 FROM "clients" WHERE LOWER(email) = LOWER('mauriciorpaim@gmail.com'))
LIMIT 1;

INSERT INTO "clients" (id, name, company, phone, email, status, activated_at, owner_id, created_at, updated_at)
SELECT gen_random_uuid(), 'Aldo Luiz', 'Luitz Prime Consórcio', '(43) 99632-3544', 'aldoarqui0111@gmail.com', 'ACTIVE'::"ClientStatus", '2026-04-29'::timestamp, u.id, NOW(), NOW()
FROM "users" u
WHERE u.role = 'ADMIN'
AND NOT EXISTS (SELECT 1 FROM "clients" WHERE LOWER(email) = LOWER('aldoarqui0111@gmail.com'))
LIMIT 1;
