-- Zapytania odczytowe. Uruchom jako HELPDESK, przez F5.

-- Oczekiwany uzytkownik: HELPDESK; kontener lokalny: FREEPDB1.
SELECT
    USER AS uzytkownik,
    SYS_CONTEXT('USERENV', 'CON_NAME') AS kontener
FROM dual;

-- Oczekiwane tabele: CATEGORIES, TICKETS, USERS.
SELECT table_name
FROM user_tables
WHERE table_name IN ('USERS', 'CATEGORIES', 'TICKETS')
ORDER BY table_name;

-- Po 02_seed_categories.sql liczba kategorii poczatkowych powinna wynosic 4.
SELECT COUNT(*) AS liczba_kategorii_poczatkowych
FROM helpdesk.categories
WHERE name IN ('Laptop', 'Komputer stacjonarny', 'Drukarka', 'Inne');

-- Stan wszystkich ograniczen powinien wynosic ENABLED / VALIDATED.
SELECT table_name, constraint_name, constraint_type, status, validated
FROM user_constraints
WHERE table_name IN ('USERS', 'CATEGORIES', 'TICKETS')
ORDER BY table_name, constraint_name;

-- Oczekiwane 3 jawne indeksy na kluczach obcych tabeli TICKETS, status VALID.
SELECT index_name, status
FROM user_indexes
WHERE index_name IN (
    'IDX_TICKETS_CATEGORY', 'IDX_TICKETS_CLIENT', 'IDX_TICKETS_ASSIGNED'
)
ORDER BY index_name;
