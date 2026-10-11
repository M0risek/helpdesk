
SELECT
    USER AS uzytkownik,
    SYS_CONTEXT('USERENV', 'CON_NAME') AS kontener
FROM dual;

SELECT table_name
FROM user_tables
WHERE table_name IN ('USERS', 'CATEGORIES', 'TICKETS')
ORDER BY table_name;


SELECT COUNT(*) AS liczba_kategorii_poczatkowych
FROM helpdesk.categories
WHERE name IN ('Laptop', 'Komputer stacjonarny', 'Drukarka', 'Inne');


SELECT table_name, constraint_name, constraint_type, status, validated
FROM user_constraints
WHERE table_name IN ('USERS', 'CATEGORIES', 'TICKETS')
ORDER BY table_name, constraint_name;


SELECT index_name, status
FROM user_indexes
WHERE index_name IN (
    'IDX_TICKETS_CATEGORY', 'IDX_TICKETS_CLIENT', 'IDX_TICKETS_ASSIGNED'
)
ORDER BY index_name;
