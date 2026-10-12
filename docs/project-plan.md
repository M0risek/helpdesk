# Plan realizacji i zespołu HelpDesk

Wersja 1.0 do przeglądu, 12.10.2026. Uzgodnienie: student realizuje projekt jako lider **zespołu umownego**. Zakończenie zajęć przypada orientacyjnie w połowie lub pod koniec stycznia 2027; dokładna data ostatniego zjazdu nie została podana. Harmonogram opiera się na 9 spotkaniach po 2 godziny z materiału prowadzącej. Prace między spotkaniami wykonujemy osobno.

## Zespół i odpowiedzialności

Z1 to student — lider projektu. Z2–Z4 są identyfikatorami umownych stanowisk, nie rzeczywistymi osobami i nie autorami commitów. Na Trello zadania można przypisywać do rzeczywistego konta studenta, a role Z2–Z4 wpisać w opisie. Dokument nie stwierdza, że dodatkowe osoby wykonały kod lub testy.

| ID | Rola umowna | Odpowiedzialność | Rezultat do przeglądu lidera |
|---|---|---|---|
| Z1 | Lider, analityk i dokumentalista | Zakres, SRS, harmonogram, karty Trello, decyzje, kompletność dokumentacji i prezentacja | Spójny zakres, terminy i dowody realizacji |
| Z2 | Programista frontendu | Widoki React, CSS, formularze, sesja w UI i testy komponentów | Interfejs klienta i pracownika |
| Z3 | Programista backendu i specjalista Oracle | Express, REST API, reguły, schemat, zapytania, sesje i transakcje | API i trwały zapis danych |
| Z4 | Tester i osoba odpowiedzialna za wdrożenie | Plan testów, odbiór, pomiary, CI/CD, hosting i monitorowanie | Raport testów i działające środowisko |

Przy rzeczywistej realizacji student odpowiada za wszystkie rezultaty. Podział ról jest modelem zarządzania wymaganym na zajęciach. Osoba dokonująca przeglądu i wykonawca mogą pokrywać się w ćwiczeniu; zapisujemy to uczciwie w protokole.

## Macierz odpowiedzialności

R — wykonuje w modelu zespołu, A — odpowiada za odbiór/decyzję, C — konsultuje, I — otrzymuje informację. Każdy rezultat ma jedną rolę A.

| Rezultat | Z1 | Z2 | Z3 | Z4 |
|---|---|---|---|---|
| Zakres i SRS | R/A | C | C | C |
| UML, architektura, ERD | A | C | R | C |
| Makiety i frontend | A | R | C | C |
| Baza i backend | A | C | R | C |
| Testy jednostkowe | A | R | R | C |
| Odbiór, bezpieczeństwo, wydajność | A | C | C | R |
| Hosting, CI/CD i utrzymanie | A | C | C | R |
| Dokumentacja końcowa, Trello i prezentacja | R/A | C | C | C |

## Harmonogram wymagany według zjazdów

Numery zjazdów są numerami etapów z `Projekt.pdf`, s. 5. Nie przypisujemy im wymyślonych dat uczelni ani nie zakładamy, który zjazd odbywa się dzisiaj.

| Zjazd | Zakres z materiału | Kamień milowy i dowód | Stan obecny |
|---|---|---|---|
| 1–2 | Analiza, SRS, UML, architektura | M1: SRS, plan zespołu, diagramy i decyzje po przeglądzie lidera | Dokumenty uzupełnione teraz w DOC-01; do przeglądu |
| 3 | UI, makiety, projekt bazy, specyfikacja API | M2: makiety, ERD, model Oracle i projekt tras | Schemat/API są zaimplementowane; makiety, UML i ERD dodane w DOC-01; format API do importu do uzupełnienia |
| 4–5 | Frontend i baza, modele oraz CRUD | M3: klient dodaje, odczytuje, zmienia i usuwa nowe zgłoszenie | Kod APP-03/APP-04 i Oracle istnieją; kontrola ręczna do wykonania |
| 6 | Backend, uwierzytelnianie, logika, integracja | M4: klient/pracownik obsługują wspólne zgłoszenie | APP-01–APP-04 i test integracyjny wykonane; odbiór ręczny do wykonania |
| 7 | Testy jednostkowe, integracyjne, wydajności i bezpieczeństwa | M5: raport testów, ręczny odbiór, pomiary i poprawki | 29 + 20 testów i integracja przeszły; przeglądarki, wydajność i pełny przegląd bezpieczeństwa do wykonania |
| 8 | Wdrożenie, hosting, CI/CD | M6: dostępna aplikacja, działający pipeline i instrukcja wdrożenia | Do wykonania |
| 9 | Prezentacja i pełna dokumentacja | M7: demonstracja, dokumentacja i podsumowanie procesu | Do wykonania |

M1/M2 są uzupełniane po implementacji. Zachowujemy rzeczywistą historię commitów, a nie datujemy dokumentów wstecz. Na zjeździe pokazujemy aktualny stan, braki i plan ich zamknięcia.

## Plan nadrobienia i bufor do stycznia

Poniżej podano **proponowane terminy własnej pracy**, nie potwierdzone terminy zjazdów. Celem jest gotowość do demonstracji przed możliwym ostatnim zjazdem w połowie stycznia. Jeżeli ostatni zjazd będzie wcześniej, lider przesuwa daty tak, aby pozostawić tydzień na odbiór i poprawki.

| Termin roboczy | Praca | Szacowany wysiłek | Warunek zakończenia |
|---|---|---|---|
| Do 19.10.2026 | Przejrzeć DOC-01, uporządkować Trello, wykonać ręczny scenariusz klient/pracownik | 3–5 h | Spójne dokumenty, zapis odbioru i aktualne karty |
| Do 02.11.2026 | Specyfikacja API do importu, instrukcja użytkownika/FAQ, procedury deweloperskie | 4–6 h | Dokumentacja funkcji i środowiska z działającymi przykładami |
| Do 16.11.2026 | Testy Chrome/Edge/Firefox, dostępność, bezpieczeństwo, pomiary wydajności i poprawki | 5–8 h | Raport środowiska/wyników; kryteria odbioru spełnione lub udokumentowane poprawki |
| Do 30.11.2026 | Wybrać hosting zgodny z dostępem do Oracle i uruchomić środowisko testowe | 4–8 h | Zdalny scenariusz obu ról działa przez HTTPS |
| Do 14.12.2026 | CI/CD, konfiguracja produkcyjna, monitoring, kopia/odtworzenie i rollback | 4–8 h | Wdrożenie da się odtworzyć z repozytorium i opisanych sekretów |
| Do 04.01.2027 | Pełny przegląd projektu i dokumentacji, przygotowanie demonstracji | 3–5 h | Brak nieopisanych braków; materiał do prezentacji |
| Do 11.01.2027 | Próba prezentacji, poprawki, wersja do oddania | 2–4 h | Gotowość przed możliwym terminem w połowie stycznia |
| Pozostały styczeń | Bufor do rzeczywistego ostatniego zjazdu | Według potrzeb | Poprawki wynikające z odbioru i uwag prowadzącej |

Szacunki obejmują pracę poza zajęciami i są założeniem planu, a nie ewidencją już przepracowanych godzin. Nie rozszerzamy produktu, dopóki nie zamkniemy brakujących etapów.

## Praca na Trello i GitHubie

1. Każda konkretna praca ma kartę z rezultatem, rolą odpowiedzialną, terminem i checklistą odbioru.
2. Rozpoczęcie przenosi ją „W trakcie”; działający kod lub przygotowany dokument z dowodami — „Do sprawdzenia”; przegląd kryteriów — „Gotowe”.
3. Karty faz służą jako podsumowanie prac. Pozostawiamy je na „Plan Aplikacji Webowej” i aktualizujemy checklisty na podstawie konkretnych zadań.
4. Commit opisuje rzeczywistą zmianę. Po **Push origin** adres konkretnego commita dodajemy jako załącznik/komentarz do odpowiedniej karty.
5. Ręczny test ma datę, środowisko i wynik. Niewykonany test nie zostaje zaznaczony jako zakończony.
6. Na każdym zjeździe lider przedstawia działający fragment aplikacji, zmiany w repozytorium i aktualny stan tablicy.

W zespole umownym najprostsza praca odbywa się na `main` z małymi commitami. W rzeczywistym zespole można wprowadzić gałęzie i pull requesty, jeśli będzie to potrzebne. Nie tworzymy fikcyjnych autorów, commitów ani przeglądów.

## Ryzyka

| Ryzyko | Wpływ | Działanie i właściciel |
|---|---|---|
| Dokumentacja jest uzupełniana później niż kod | Rozjazd wymagań i zachowania | Z1 porównuje SRS/UML z kodem i wynikami, aktualizuje je przy zmianach |
| Hosting nie ma dostępu do Oracle | Frontend jest dostępny, ale aplikacja nie działa | Z3/Z4 wcześnie sprawdzają łączność i sposób hostowania bazy przed wyborem platformy |
| Zielone checklisty nie odpowiadają stanowi odbioru | Tablica pokazuje mylący postęp | Z1 rozdziela wykonanie i odbiór; przypina rzeczywiste dowody |
| Niezgodność wyglądu lub działania w przeglądarkach | Nieprzejście odbioru UI | Z2/Z4 sprawdzają trzy przeglądarki, trzy szerokości i klawiaturę |
| Utrata danych lub konfiguracji | Brak demonstracji i odtworzenia | Z3/Z4 opisują kopię i odtworzenie Oracle; sekrety pozostają poza repozytorium |
| Dokładny termin ostatniego zjazdu jest nieznany | Za mało czasu na oddanie | Z1 przyjmuje gotowość 11.01.2027 i aktualizuje harmonogram po potwierdzeniu daty |
| Rozbudowa o funkcje dodatkowe przed wdrożeniem | Niezamknięcie cyklu życia projektu | Z1 utrzymuje zakres podstawowy z SRS i bufor na testy |

## Zasada ukończenia

Zadanie jest gotowe, gdy istnieje rezultat, spełnia kryteria, ma dowód sprawdzenia i aktualną dokumentację oraz link w Trello. Dokument jest gotowy po rzeczywistym przeglądzie przez lidera. Cały projekt wymaga także zdalnego wdrożenia, CI/CD, utrzymania, dokumentacji użytkownika i prezentacji.
