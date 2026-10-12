# Baza danych HelpDesk

## Środowisko

Projekt korzysta z Oracle Database. Lokalnie używane jest konto `HELPDESK`, host `localhost`, port `1521` i **Service name** `FREEPDB1`. Hasło ustala się podczas tworzenia konta i przechowuje lokalnie.

Konto ma uprawnienia `CREATE SESSION`, `CREATE TABLE`, `CREATE SEQUENCE` i limit 100 MB w przestrzeni `USERS`. Konto `SYSTEM` służyło do przygotowania konta projektu. Skrypty aplikacji wykonujemy po zalogowaniu jako `HELPDESK`.

## Uruchomienie w SQL Developer

1. Otwórz arkusz połączenia `HELPDESK`. W prawym górnym rogu arkusza sprawdź nazwę połączenia.
2. Otwórz `01_schema.sql` albo skopiuj jego całą treść do arkusza. Naciśnij **F5**, aby uruchomić wszystkie instrukcje. Ten plik wykonaj raz w pustym schemacie: powinny powstać trzy tabele, trzy indeksy oraz komentarze.
3. Jeśli pojawi się błąd `ORA-...`, sprawdź jego treść przed przejściem do następnego pliku. Ponowne wykonanie `01_schema.sql` po utworzeniu tabel zgłosi istniejące obiekty.
4. W ten sam sposób wykonaj `02_seed_categories.sql`. Dodaje cztery początkowe kategorie i zatwierdza zapis przez `COMMIT`. Można go powtarzać: istniejące kategorie są pomijane.
5. Wykonaj `03_verify.sql`. Sprawdź konto, obecność trzech tabel domenowych, cztery początkowe kategorie, aktywne ograniczenia i poprawne indeksy. Testy zachowania API są opisane w `backend/README.md`.
6. Rozwiń połączenie `HELPDESK` i odśwież węzeł **Tables**, aby zobaczyć utworzone tabele.
7. Do logowania potrzebna jest dodatkowa tabela `AUTH_SESSIONS`. Zalecana instalacja: w terminalu folderu `backend` uruchom `npm.cmd run auth:setup`, a potem `npm.cmd run db:migrate`. Migracja korzysta z `04_auth_sessions.sql`, tworzy tylko tabelę sesji oraz jej indeks i może być powtarzana. Alternatywnie plik `04_auth_sessions.sql` można wykonać raz przez F5 jako `HELPDESK`.

Skrypty mają wskazanego właściciela obiektów `HELPDESK`. Przygotowanie konta i hasła jest wykonywane lokalnie. Ewentualne prywatne pliki administracyjne można przechowywać w ignorowanym przez Git katalogu `database/local/`.

## Model danych

| Tabela | Przeznaczenie | Główne pola |
|---|---|---|
| `USERS` | Konta klientów i pracowników | `id`, `full_name`, `email`, `password_hash`, `user_role`, `created_at` |
| `CATEGORIES` | Kategorie sprzętu | `id`, `name`, `description` |
| `TICKETS` | Zgłoszenia klientów | `id`, `title`, `description`, `category_id`, `client_id`, `assigned_to`, `status`, `created_at`, `updated_at` |
| `AUTH_SESSIONS` | Sesje logowania i tokeny CSRF | `session_id`, `session_data`, `expires_at` |

Identyfikatory `id` tabel domenowych są generowane przez Oracle. Przy dodawaniu wierszy pomijamy to pole. `AUTH_SESSIONS.session_id` jest losowym identyfikatorem generowanym przez backend, a `session_data` zawiera JSON sesji. Ta tabela nie przechowuje haseł.

Relacje:

- Jedna kategoria ma wiele zgłoszeń: `CATEGORIES.id` → `TICKETS.category_id`.
- Jeden klient ma wiele zgłoszeń: `USERS.id` → `TICKETS.client_id`.
- Jeden pracownik obsługuje wiele zgłoszeń: `USERS.id` → `TICKETS.assigned_to`.

## Reguły

- Role: `CLIENT` (klient) i `STAFF` (pracownik).
- Statusy: `NEW` (nowe), `IN_PROGRESS` (w realizacji), `CLOSED` (zakończone).
- Nowe zgłoszenie może być nieprzypisane. W realizacji i zakończone musi mieć przypisanego pracownika.
- E-mail jest unikalny i przechowywany małymi literami, bez spacji na początku i końcu. Backend normalizuje go przed zapisem.
- `password_hash` przechowuje wynik funkcji scrypt wraz z solą i parametrami. Backend tworzy klientów przez rejestrację; konto pracownika tworzymy lokalnie poleceniem `npm.cmd run staff:create`.
- Sesje wygasają po godzinie braku aktywności. Wylogowanie usuwa konkretną sesję. Wygasłe rekordy są usuwane przy zapisie nowych sesji.
- Klucze obce wymagają istniejącej kategorii, klienta i przypisanego użytkownika. Usuwanie powiązanych użytkowników lub kategorii wymaga rozwiązania zależności.
- Backend sprawdza role wskazanych użytkowników, właściciela zgłoszenia i dozwolone zmiany statusu. Klient edytuje/usuwa własne `NEW`; pracownik przypisuje i prowadzi `NEW` → `IN_PROGRESS` → `CLOSED`. Same klucze obce nie sprawdzają roli użytkownika.
- `created_at` i `updated_at` otrzymują datę utworzenia. Przy aktualizacji backend ustawia bieżący czas Oracle lub poprzedni czas + 1 mikrosekunda, tak aby wersja zawsze wzrosła; w schemacie nie ma wyzwalacza aktualizacji.
- `updated_at` jest wersją zgłoszenia. Zapis porównuje wersję przesłaną przez klienta po zablokowaniu rekordu w jednej transakcji. Nieaktualna wersja powoduje 409 i ROLLBACK. Szczegóły: [docs/tickets.md](../docs/tickets.md).

## Trello i GitHub

Przygotowanie schematu można ująć w checkliście zadania dotyczącego bazy danych: model tabel, skrypt SQL, wykonanie i sprawdzenie w SQL Developer. Po uruchomieniu do karty dołącz wynik kontroli i link do commita. Połączenie aplikacji z bazą jest osobnym krokiem.

## Dokumentacja Oracle

- [Tworzenie tabel i kolumn IDENTITY](https://docs.oracle.com/en/database/oracle/oracle-database/23/sqlrf/CREATE-TABLE.html)
- [Klucze i ograniczenia danych](https://docs.oracle.com/en/database/oracle/oracle-database/23/sqlrf/constraint.html)
- [MERGE](https://docs.oracle.com/en/database/oracle/oracle-database/23/sqlrf/MERGE.html)
