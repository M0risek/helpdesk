# HelpDesk

Projekt aplikacji webowej do obsługi zgłoszeń w serwisie komputerowym.

## Cel projektu
Umożliwienie klientom zgłaszania problemów oraz pracownikom
zarządzania zgłoszeniami i aktualizowania ich statusu.

## Planowane funkcje
- Rejestracja i logowanie użytkowników.
- Dodawanie, przeglądanie, edycja i usuwanie zgłoszeń.
- Przypisywanie zgłoszeń pracownikom.
- Zmiana statusu i filtrowanie zgłoszeń.

## Technologie
React, Vite, Bootstrap, Node.js, Express i Oracle Database. Do pracy z bazą używamy Oracle SQL Developer.

## Status
Utworzono i sprawdzono schemat Oracle `HELPDESK`: trzy tabele, cztery początkowe kategorie, aktywne ograniczenia i poprawne indeksy.

Backend Express obsługuje połączenie z Oracle, odczyt kategorii, rejestrację, logowanie, wylogowanie i uprawnienia klienta oraz pracownika. Sesje są przechowywane w dodatkowej tabeli `AUTH_SESSIONS`.

Frontend React zawiera formularze rejestracji i logowania, pulpity klienta i pracownika, wyszukiwanie kategorii wsparcia oraz widok konta. Dane pochodzą z API i Oracle; sesja jest odtwarzana po odświeżeniu strony. Następny etap to dodawanie i obsługa zgłoszeń.

## Uruchomienie na komputerze projektu

Otwórz folder `helpdesk` w VS Code i wybierz **Terminal → New Terminal**. Zależności i konfiguracja Oracle są już przygotowane. W terminalu folderu `helpdesk` wpisz:

```powershell
npm.cmd run dev
```

Polecenie uruchamia API i interfejs razem. Otwórz **http://127.0.0.1:5173/**. Terminal pozostaje otwarty; zakończenie pracy: **Ctrl+C**. Nie uruchamiaj równocześnie drugiego backendu na porcie 3000 ani drugiego Vite na 5173.

Na stronie kliknij **Utwórz konto**, zarejestruj klienta, a następnie się zaloguj. Hasło użytkownika aplikacji jest osobne od hasła Oracle. Konto pracownika utworzysz w drugim terminalu przez:

```powershell
npm.cmd --prefix backend run staff:create
```

Po sklonowaniu repozytorium na nowym komputerze odtwórz zależności:

```powershell
npm.cmd ci
npm.cmd --prefix backend ci
npm.cmd --prefix frontend ci
```

Następnie przygotuj lokalny schemat Oracle i `backend/.env` według instrukcji backendu. `frontend/.env` jest opcjonalny, np. gdy API pracuje na innym porcie. Repozytorium nie zawiera prywatnego hasła Oracle ani klucza sesji.

## Sprawdzenie aplikacji

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run test:integration
npm.cmd run build
```

Frontend: 12 testów komponentów i komunikacji API. Backend: 22 testy uwierzytelniania i API. Test integracyjny uruchamia własne serwery na wolnych portach i sprawdza przepływ frontend → backend → Oracle; tworzy i usuwa wyłącznie własne konta oraz sesje testowe.

Testy komponentów korzystają z DOM w jsdom. Test integracyjny działa przez HTTP. W tej sesji nie było dostępnego narzędzia sterowania przeglądarką, dlatego wygląd na komputerze i telefonie wymaga jeszcze ręcznej kontroli w przeglądarce.

## Uruchomienie i dokumentacja
- [Baza danych i skrypty SQL](database/README.md)
- [Backend: konfiguracja, uruchomienie i API](backend/README.md)
- [Logowanie: wymagania, API, role i testy](docs/authentication.md)
- [Frontend: konfiguracja i testy](frontend/README.md)
- [Interfejs: widoki, zachowanie i sprawdzenie ręczne](docs/interface.md)
