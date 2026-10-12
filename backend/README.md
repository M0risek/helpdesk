# Backend HelpDesk

Backend udostępnia API w Express i korzysta z Oracle Database. Działają odczyt kategorii, rejestracja, logowanie, wylogowanie, profil użytkownika i kontrola ról klienta oraz pracownika. Interfejs React i operacje na zgłoszeniach pozostają kolejnymi etapami.

## Wymagania

- Node.js 24.10 lub nowszy. Na komputerze projektu sprawdzono wersję 24.15.0.
- Uruchomiona baza Oracle oraz listener na porcie 1521.
- Konto `HELPDESK` z przygotowanymi tabelami `USERS`, `CATEGORIES`, `TICKETS`. Tabelę `AUTH_SESSIONS` dodaje migracja poniżej.

Sterownik `oracledb` używa domyślnego trybu Thin, który nie wymaga instalowania Oracle Instant Client.

## Pierwsze uruchomienie

Otwórz folder `helpdesk` w VS Code i wybierz **Terminal → New Terminal**. W PowerShell używamy `npm.cmd`, ponieważ na tym komputerze uruchamianie skryptu `npm.ps1` jest zablokowane.

```powershell
cd .\backend
npm.cmd ci
```

Zależności zostały już zainstalowane podczas przygotowania projektu. `npm.cmd ci` służy do ich ponownego odtworzenia, np. po sklonowaniu repozytorium na innym komputerze.

Na komputerze projektu `.env` jest już uzupełniony. Po sklonowaniu projektu na innym komputerze uruchom `npm.cmd run auth:setup`, a następnie wpisz lokalnie w `.env` hasło konta Oracle `HELPDESK`:

```dotenv
HOST=127.0.0.1
PORT=3000
DB_USER=HELPDESK
DB_PASSWORD="TUTAJ_WPISZ_SWOJE_HASLO"
DB_CONNECT_STRING=localhost:1521/FREEPDB1
NODE_ENV=development
SESSION_SECRET="KLUCZ_WYGENEROWANY_PRZEZ_AUTH_SETUP"
TRUST_PROXY=0
```

`auth:setup` tworzy `.env` z `.env.example`, jeśli plik jeszcze nie istnieje. Generuje losowy klucz podpisywania sesji, gdy brakuje `SESSION_SECRET`; zachowuje istniejące hasło Oracle i klucz. Prawdziwy `.env` jest ignorowany przez Git, a `.env.example` trafia do repozytorium. Hasło bazy nie jest hasłem użytkownika aplikacji. Zmiana klucza sesji wylogowuje wszystkich użytkowników.

Przed pierwszym uruchomieniem logowania:

```powershell
npm.cmd run auth:setup
npm.cmd run db:migrate
```

Migracja tworzy wyłącznie tabelę `AUTH_SESSIONS` i indeks czasu wygaśnięcia. Można ją powtarzać. Na komputerze projektu została już wykonana; nie uruchamiaj ponownie `01_schema.sql` w istniejącym schemacie.

Sprawdź prawdziwe połączenie z bazą:

```powershell
npm.cmd run db:check
```

Oczekiwany wynik początkowy:

```json
{
  "status": "ok",
  "tables": ["CATEGORIES", "TICKETS", "USERS"],
  "categoriesCount": 4
}
```

Uruchom serwer:

```powershell
npm.cmd run dev
```

Terminal pozostaje otwarty podczas działania serwera. Zmiana plików JavaScript powoduje restart. Po zmianie `.env` zatrzymaj serwer przez **Ctrl+C** i uruchom go ponownie.

## Dostępne adresy

| Metoda i adres | Działanie |
|---|---|
| `GET /api/health` | Kontrola działania serwera, bez zapytania do bazy |
| `GET /api/health/database` | Wykonanie zapytania kontrolnego do Oracle |
| `GET /api/categories` | Odczyt kategorii z tabeli `CATEGORIES`, posortowanych według nazwy |
| `GET /api/auth/csrf` | Utworzenie sesji i pobranie tokenu CSRF do formularzy |
| `POST /api/auth/register` | Rejestracja konta klienta |
| `POST /api/auth/login` | Logowanie i utworzenie nowej sesji |
| `GET /api/auth/me` | Profil zalogowanego użytkownika |
| `POST /api/auth/logout` | Wylogowanie i usunięcie sesji z Oracle |
| `GET /api/staff/summary` | Liczba klientów i zgłoszeń; dostęp tylko dla pracownika |

Otwórz w przeglądarce `http://localhost:3000/api/categories`. Powinien pojawić się JSON z czterema kategoriami. Identyfikatory pochodzą z Oracle; ich kolejność nie ma znaczenia.

API kategorii zwraca obiekt `{ "data": [...] }`. Każda kategoria ma pola `id`, `name`, `description`. Nieistniejące adresy zwracają HTTP 404. Awaria bazy przy żądaniu zwraca HTTP 503 z ogólnym komunikatem. Hasło ani pełna treść błędu Oracle nie są zwracane przez API.

Przy starcie backend sprawdza połączenie, trzy tabele domenowe oraz tabelę i indeks sesji. Jeśli ten krok się nie powiedzie, serwer nie zaczyna przyjmować żądań. Pula połączeń jest zamykana przy zatrzymaniu serwera. `db:check` sprawdza trzy tabele domenowe i kategorie; instalację sesji dodatkowo sprawdzają migracja, start serwera i test integracyjny.

Formaty formularzy, token CSRF, kody błędów i diagram logowania opisano w [dokumentacji uwierzytelniania](../docs/authentication.md).

## Konto pracownika

```powershell
npm.cmd run staff:create
```

W interaktywnym terminalu VS Code wpisz imię i nazwisko, e-mail oraz dwa razy hasło (12–128 znaków). Znaki hasła są ukryte. Powstaje użytkownik aplikacji z rolą `STAFF` w tabeli `USERS`; nie jest to nowe konto połączenia Oracle. Istniejący e-mail powoduje odmowę utworzenia konta, bez zmiany jego roli. Publiczna rejestracja zawsze tworzy `CLIENT`.

## Testy

```powershell
npm.cmd test
```

Testy używają wbudowanego narzędzia `node:test`. Sprawdzają konfigurację, API, haszowanie haseł, walidację, CSRF, ograniczenie prób, role, wygaśnięcie i unieważnianie sesji oraz błędy bez ujawniania szczegółów. Używają obiektu bazy testowej i magazynu sesji w pamięci. Aplikacja uruchamiana normalnie korzysta z magazynu sesji Oracle.

Pełny test z prawdziwą lokalną bazą:

```powershell
npm.cmd run test:oracle
```

Test uruchamia dwa tymczasowe serwery na wolnych portach, tworzy dwa losowe konta testowe, sprawdza cały przepływ i usuwa własne konta oraz sesje. Nie uruchamiaj go na bazie produkcyjnej. Oddzielny `db:check` wykonuje wyłącznie odczyt danych.

Sprawdzenie wykonane 2026-10-12:

- 22 testy konfiguracji, haseł, sesji i API: wszystkie przeszły.
- `db:check` połączył się z lokalnym Oracle, odnalazł trzy tabele i odczytał cztery kategorie.
- `test:oracle` sprawdził rejestrację, duplikat e-maila, CSRF, odrzucenie nadania roli, logowanie, dostęp klienta i pracownika, odczyt sesji przez drugi serwer, wylogowanie oraz wygaśnięcie. Dane testowe usunięto.
- Migracja utworzyła tabelę sesji i indeks; powtórzenie migracji pominęło istniejące obiekty.
- Git ignoruje lokalny `.env` i `node_modules`, a `.env.example` jest przeznaczony do repozytorium.

## Rozwiązywanie problemów

| Komunikat | Działanie |
|---|---|
| `Uzupełnij DB_PASSWORD` | Wpisz lokalnie hasło konta `HELPDESK` w `.env` i zapisz plik |
| Kod `ORA-01017` | Sprawdź nazwę konta i hasło w `.env` |
| Błąd połączenia z Oracle | Sprawdź działanie `OracleServiceFREE`, listenera i adres `localhost:1521/FREEPDB1` |
| `Brakuje tabel projektu` | Sprawdź, czy używasz konta `HELPDESK` i czy trzy tabele istnieją w tym schemacie |
| `Brakuje tabeli sesji` | Uruchom `npm.cmd run db:migrate` |
| Brak lub zbyt krótki `SESSION_SECRET` | Uruchom `npm.cmd run auth:setup`; własny klucz musi mieć co najmniej 32 znaki |
| `CSRF_INVALID` | Pobierz token przez `/api/auth/csrf`; prześlij cookie i nagłówek `X-CSRF-Token` |
| `Port jest zajęty` | Zatrzymaj wcześniejszy serwer lub ustaw inny `PORT` w `.env` |

## GitHub i Trello

Do commita dodaj kod, `package.json`, `package-lock.json`, `.env.example`, testy i dokumentację. Pliki `.env` i `node_modules` są ignorowane.

Przykładowy opis commita: `APP-02: Dodano rejestrację, logowanie i role użytkowników`.

W Trello na karcie rejestracji i logowania zaznacz wykonane elementy backendu: zapis kont, haszowanie, sesje, wylogowanie, role i testy. Dołącz link do commita oraz wynik testów. Interfejs formularzy pozostaje do wykonania; kartę obejmującą również frontend pozostaw „W trakcie”. Zadanie obejmujące tylko backend można przenieść „Do sprawdzenia”.

## Przygotowanie do wdrożenia

Lokalnie używamy HTTP i `NODE_ENV=development`. Na hostingu wymagane będą HTTPS, `NODE_ENV=production`, prywatne zmienne środowiskowe oraz dostępny serwer Oracle. Ustaw `TRUST_PROXY=1` tylko za jednym zaufanym proxy, które nadpisuje nagłówki przekazywane do aplikacji; bez proxy pozostaw `0`. Cookie sesji ma wtedy flagę `Secure`. Frontend i API powinny działać pod tym samym adresem; podczas pracy z Vite użyjemy proxy dla `/api`.

Limit prób logowania/rejestracji (20 łącznie na IP w ciągu 15 minut) jest przechowywany w pamięci jednego procesu. Przy wielu instancjach lub wymaganiu zachowania limitu po restarcie trzeba użyć współdzielonego magazynu limitów. Sesje już teraz są współdzielone w Oracle.

## Dokumentacja użytych narzędzi

- [Połączenia i pula Oracle](https://node-oracledb.readthedocs.io/en/latest/user_guide/connection_handling.html)
- [Obsługa błędów w Express](https://expressjs.com/en/guide/error-handling/)
- [Wczytywanie pliku .env przez Node.js](https://nodejs.org/api/cli.html#--env-filefile)
- [Sesje Express](https://expressjs.com/en/resources/middleware/session/)
- [Haszowanie haseł: zalecenia OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
