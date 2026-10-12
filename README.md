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

## Planowane technologie
React, Vite, Bootstrap, Node.js, Express i Oracle Database. Do pracy z bazą używamy Oracle SQL Developer.

## Status
Utworzono i sprawdzono schemat Oracle `HELPDESK`: trzy tabele, cztery początkowe kategorie, aktywne ograniczenia i poprawne indeksy.

Backend Express obsługuje połączenie z Oracle, odczyt kategorii, rejestrację, logowanie, wylogowanie i uprawnienia klienta oraz pracownika. Sesje są przechowywane w dodatkowej tabeli `AUTH_SESSIONS`. Następne etapy to interfejs React i obsługa zgłoszeń.

## Uruchomienie i dokumentacja
- [Baza danych i skrypty SQL](database/README.md)
- [Backend: konfiguracja, uruchomienie i API](backend/README.md)
- [Logowanie: wymagania, API, role i testy](docs/authentication.md)
