

MERGE INTO helpdesk.categories target
USING (
    SELECT 'Laptop' AS name, 'Problemy z laptopami' AS description FROM dual
    UNION ALL
    SELECT 'Komputer stacjonarny', 'Problemy z komputerami stacjonarnymi' FROM dual
    UNION ALL
    SELECT 'Drukarka', 'Problemy z drukarkami' FROM dual
    UNION ALL
    SELECT 'Inne', 'Pozostale problemy ze sprzetem' FROM dual
) source
ON (target.name = source.name)
WHEN NOT MATCHED THEN
    INSERT (name, description)
    VALUES (source.name, source.description);

COMMIT;

SELECT id, name, description
FROM helpdesk.categories
ORDER BY name;
