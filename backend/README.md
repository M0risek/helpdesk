# Backend HelpDesk

Backend udostępnia API w Express i odczytuje dane z Oracle Database. Ten etap obejmuje konfigurację serwera, sprawdzenie połączenia i odczyt kategorii. Logowanie, role i operacje na zgłoszeniach będą kolejnym etapem.

## Wymagania

- Node.js 24.10 lub nowszy. Na komputerze projektu sprawdzono wersję 24.15.0.
- Uruchomiona baza Oracle oraz listener na porcie 1521.
- Konto `HELPDESK` z przygotowanymi tabelami `USERS`, `CATEGORIES`, `TICKETS`.

Sterownik `oracledb` używa domyślnego trybu Thin, który nie wymaga instalowania Oracle Instant Client.

## Pierwsze uruchomienie

Otwórz folder `helpdesk` w VS Code i wybierz **Terminal → New Terminal**. W PowerShell używamy `npm.cmd`, ponieważ na tym komputerze uruchamianie skryptu `npm.ps1` jest zablokowane.

```powershell
cd .\backend
npm.cmd ci
```

Zależności zostały już zainstalowane podczas przygotowania projektu. `npm.cmd ci` służy do ich ponownego odtworzenia, np. po sklonowaniu repozytorium na innym komputerze.

Lokalny plik `.env` przygotowano z pustym hasłem. Uzupełnij w nim `DB_PASSWORD` swoim hasłem konta Oracle `HELPDESK`:

```dotenv
HOST=127.0.0.1
PORT=3000
DB_USER=HELPDESK
DB_PASSWORD="TUTAJ_WPISZ_SWOJE_HASLO"
DB_CONNECT_STRING=localhost:1521/FREEPDB1
```

Po sklonowaniu repozytorium, jeśli `.env` jeszcze nie istnieje, utwórz go przez skopiowanie `.env.example`. Prawdziwy `.env` jest ignorowany przez Git, a przykładowy `.env.example` trafia do repozytorium. Hasło bazy nie jest hasłem przyszłego użytkownika aplikacji.

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

Otwórz w przeglądarce `http://localhost:3000/api/categories`. Powinien pojawić się JSON z czterema kategoriami. Identyfikatory pochodzą z Oracle; ich kolejność nie ma znaczenia.

API kategorii zwraca obiekt `{ "data": [...] }`. Każda kategoria ma pola `id`, `name`, `description`. Nieistniejące adresy zwracają HTTP 404. Awaria bazy przy żądaniu zwraca HTTP 503 z ogólnym komunikatem. Hasło ani pełna treść błędu Oracle nie są zwracane przez API.

Przy starcie backend sprawdza połączenie i obecność trzech tabel. Jeśli ten krok się nie powiedzie, serwer nie zaczyna przyjmować żądań. Pula połączeń jest zamykana przy zatrzymaniu serwera.

## Testy

```powershell
npm.cmd test
```

Testy konfiguracji i API używają wbudowanego narzędzia `node:test`. Sprawdzają wymagane dane, port, odpowiedzi HTTP, odczyt kategorii, błędy bazy bez ujawniania szczegółów oraz nieistniejące trasy. Warstwa bazy jest w nich zastąpiona obiektem testowym. Oddzielny `db:check` sprawdza prawdziwe Oracle i wykonuje wyłącznie odczyt danych.

Sprawdzenie wykonane 2026-10-11:

- 9 testów konfiguracji i API: wszystkie przeszły.
- `db:check` połączył się z lokalnym Oracle, odnalazł trzy tabele i odczytał cztery kategorie.
- Uruchomiony serwer zwrócił poprawne odpowiedzi dla wszystkich trzech adresów API. `/api/categories` zwróciło cztery rzeczywiste rekordy z bazy.
- Git ignoruje lokalny `.env` i `node_modules`, a `.env.example` jest przeznaczony do repozytorium.

## Rozwiązywanie problemów

| Komunikat | Działanie |
|---|---|
| `Uzupełnij DB_PASSWORD` | Wpisz lokalnie hasło konta `HELPDESK` w `.env` i zapisz plik |
| Kod `ORA-01017` | Sprawdź nazwę konta i hasło w `.env` |
| Błąd połączenia z Oracle | Sprawdź działanie `OracleServiceFREE`, listenera i adres `localhost:1521/FREEPDB1` |
| `Brakuje tabel projektu` | Sprawdź, czy używasz konta `HELPDESK` i czy trzy tabele istnieją w tym schemacie |
| `Port jest zajęty` | Zatrzymaj wcześniejszy serwer lub ustaw inny `PORT` w `.env` |

## GitHub i Trello

Do commita dodaj kod, `package.json`, `package-lock.json`, `.env.example`, testy i dokumentację. Pliki `.env` i `node_modules` są ignorowane.

Przykładowy opis commita: `APP-01: Dodano backend Express i połączenie z Oracle`.

W Trello zaznacz zakończone elementy konfiguracji backendu. Integrację z bazą potwierdź wynikiem `db:check` i odczytem czterech kategorii przez API, a do karty dołącz link do commita. Zakończenie integracji nie oznacza ukończenia całego backendu: logowanie i obsługa zgłoszeń pozostają osobnymi zadaniami.

## Dokumentacja użytych narzędzi

- [Połączenia i pula Oracle](https://node-oracledb.readthedocs.io/en/latest/user_guide/connection_handling.html)
- [Obsługa błędów w Express](https://expressjs.com/en/guide/error-handling/)
- [Wczytywanie pliku .env przez Node.js](https://nodejs.org/api/cli.html#--env-filefile)
