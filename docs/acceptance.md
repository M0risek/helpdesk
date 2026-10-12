# Odbiór i powiązanie wymagań z testami

Stan 12.10.2026. Ta macierz łączy [SRS](requirements.md), istniejący kod i dowody APP-04. Dokumentacja DOC-01 nie zmienia zachowania aplikacji. Wyniki automatyczne pochodzą z opisanego w APP-04 sprawdzenia; kontrola ręczna nie została jeszcze wykonana.

## Dowody automatyczne

| Dowód | Zakres i rzeczywisty wynik APP-04 | Polecenie z `helpdesk` |
|---|---|---|
| A1 | 29 testów backendu: konfiguracja, hasła, sesje, reguły, HTTP; przeszły | `npm.cmd --prefix backend test` |
| A2 | 20 testów React/API w jsdom; przeszły | `npm.cmd --prefix frontend test` |
| A3 | HTTP Vite → Express → Oracle, CRUD, role, CSRF, filtry, Unicode i równoczesny zapis; przeszedł | `npm.cmd --prefix frontend run test:integration` |
| A4 | Logowanie i trwałe sesje między dwoma serwerami, unieważnienie/wygaśnięcie; przeszedł | `npm.cmd --prefix backend run test:oracle` |
| A5 | Produkcyjny build frontendu; przeszedł | `npm.cmd run build` |

Testy A1/A2 korzystają z danych testowych i nie potwierdzają łączności z rzeczywistą bazą. A3/A4 tworzą i sprzątają wyłącznie własne rekordy w lokalnym schemacie. Wyniki, zakres i ograniczenia: [tickets.md](tickets.md#sprawdzenie), [backend/README.md](../backend/README.md#testy). Build nie potwierdza zdalnego wdrożenia. Nie wpisujemy nazwiska fikcyjnego testera ani zmyślonej daty odbioru.

## Macierz funkcji

Pliki testów są dowodem wykonywalnym. Nazwy FR pochodzą z SRS; wcześniejsze ZG-01–ZG-08 w `tickets.md` odpowiadają FR-06–FR-12/FR-15.

| SRS | Przypadek | Test / implementacja | Dowód | Odbiór ręczny |
|---|---|---|---|---|
| FR-01 | UC-01 | [auth.test.js](../backend/test/auth.test.js), [passwords.test.js](../backend/test/passwords.test.js), [App.test.jsx](../frontend/test/App.test.jsx) | A1/A2/A3/A4 | M01 |
| FR-02 | UC-02 | [auth.test.js](../backend/test/auth.test.js), [api.test.js](../frontend/test/api.test.js) | A1/A2/A3/A4 | M01, M02 |
| FR-03 | UC-03 | [auth.test.js](../backend/test/auth.test.js), [App.test.jsx](../frontend/test/App.test.jsx), [test-oracle-auth.js](../backend/scripts/test-oracle-auth.js) | A1/A2/A3/A4 | M02, M08 |
| FR-04 | UC-03 | [App.test.jsx](../frontend/test/App.test.jsx) i `/api/auth/me` | A1/A2/A4 | M02 |
| FR-05 | UC-04 | [app.test.js](../backend/test/app.test.js), [App.test.jsx](../frontend/test/App.test.jsx) | A1/A2/A3 | M03 |
| FR-06 | UC-05 | [tickets.test.js](../backend/test/tickets.test.js), [tickets.test.jsx](../frontend/test/tickets.test.jsx), [check-integration.js](../frontend/scripts/check-integration.js) | A1/A2/A3 | M03 |
| FR-07 | UC-06 | Role/właściciel w testach zgłoszeń i rzeczywiste dwa konta klientów | A1/A3 | M04 |
| FR-08 | UC-07 | Reguły i formularz edycji w testach zgłoszeń | A1/A2/A3 | M03, M05 |
| FR-09 | UC-08 | Potwierdzenie/anulowanie w React oraz DELETE w Oracle | A1/A2/A3 | M03 |
| FR-10 | UC-06/09 | Kontrola ról/przypisania i widok obsługi pracownika | A1/A2/A3 | M05 |
| FR-11 | UC-09/10 | Kolejność statusów i zamknięcie w testach zgłoszeń | A1/A2/A3 | M05 |
| FR-12 | UC-06 | Filtry/paginacja w testach API, UI i integracji | A1/A2/A3 | M06 |
| FR-13 | UC-11 | [auth.test.js](../backend/test/auth.test.js), [App.test.jsx](../frontend/test/App.test.jsx), podsumowanie API | A1/A2/A4 | M05 |
| FR-14 | UC-12 | [create-staff.js](../backend/scripts/create-staff.js); kontrola interaktywnego CLI pozostaje do wykonania | Implementacja; A3/A4 sprawdzają konto STAFF, nie interaktywne wpisywanie | M10 |
| FR-15 | UC-07/08/09/10 | Równoczesne PATCH 200 + 409 w [check-integration.js](../frontend/scripts/check-integration.js); szkic w React | A1/A2/A3 | M07 |
| FR-16 | Wszystkie formularze | Testy API, błędów UI i zachowania szkicu | A1/A2 | M08 |

## Pozostałe kontrole niefunkcjonalne

| SRS | Stan dowodów | Co trzeba jeszcze wykonać |
|---|---|---|
| NFR-01–03 | Testy sesji, CSRF, uprawnień, scrypt, walidacji, bindów i limitu istnieją | Przejrzeć konfigurację produkcyjną i raport bezpieczeństwa; wynik testów nie jest pełnym audytem |
| NFR-04 | Równoczesny zapis w Oracle sprawdzony w A3 | Ręczny scenariusz dwóch kart M07 |
| NFR-05–06 | Style responsywne i testy DOM istnieją | M09 w Chrome, Edge i Firefox; klawiatura, fokus, szerokości |
| NFR-07 | Brak pomiaru obciążenia | Syntetyczne dane, środowisko, 10 użytkowników/60 s, p95 i błędy według SRS; osobny raport |
| NFR-08 | Pliki lock i instrukcje istnieją | Odtworzenie na czystym środowisku i zapis wyniku |
| NFR-09 | Błędy API i zachowanie szkicu sprawdzone | M08; bez celowego zatrzymywania usług innych zajęć |
| NFR-10 | Brak zdalnego wdrożenia | Hosting, HTTPS, CI/CD, kontrola działania, kopia/odtworzenie |
| NFR-11 | SRS/UML/ERD/plan i techniczne opisy istnieją | Instrukcja użytkownika/FAQ, API do importu, wdrożenie/utrzymanie, aktualizacja Trello |

## Protokół ręczny do wypełnienia

Uruchom lokalną aplikację według [README](../README.md#uruchomienie-na-komputerze-projektu). Użyj własnych danych demonstracyjnych: klient A, klient B i pracownik. Pracownika utwórz przez CLI, a klientów przez formularz. Nie wpisuj haseł do raportu. Wszystkie wyniki poniżej są **niewykonane** do chwili rzeczywistego sprawdzenia.

Wykonawca: ______; data: ______; system: ______; wersja commita: ______; adres środowiska: ______.

| ID | Czynności | Oczekiwany rezultat | Wynik / uwagi |
|---|---|---|---|
| M01 | Zarejestruj A; sprawdź niezgodne hasła i duplikat e-maila; zaloguj poprawnie i błędnym hasłem | Błędy czytelne; poprawna próba otwiera konto CLIENT | Niewykonane |
| M02 | Odczytaj profil, odśwież stronę, wyloguj, użyj chronionego adresu | Sesja odtworzona; po wylogowaniu wymagany login | Niewykonane |
| M03 | Jako A odfiltruj kategorię, dodaj zgłoszenie, popraw opis; dodaj drugie, anuluj usunięcie, następnie potwierdź | Treść zgodna z zapisem; anulowanie nic nie usuwa; potwierdzenie usuwa tylko drugie | Niewykonane |
| M04 | Zaloguj B i otwórz adres szczegółów pierwszego zgłoszenia A | Brak dostępu; 404, bez danych A | Niewykonane |
| M05 | Pracownik przypisuje pierwsze do siebie, zaczyna i zamyka; A odczytuje status | Statusy kolejno, rzeczywiste liczniki; A nie może edytować/usunąć rozpoczętego | Niewykonane |
| M06 | Sprawdź wyszukiwanie, kategorię, status, reset i strony; pracownik także „Moje”/„Nieprzypisane” | Wynik zgodny z filtrami, pusty wynik opisany; filtr wraca na stronę 1 | Niewykonane |
| M07 | Otwórz jedno NEW w dwóch kartach, zapisz w pierwszej, potem w drugiej | Druga ma konflikt, nie nadpisuje; odświeżenie pobiera nową wersję | Niewykonane |
| M08 | Sprawdź komunikaty błędnych pól, przycisk podczas zapisu i ponowienie po błędzie | Fokus/komunikaty czytelne; szkic pozostaje; sesja wygasła wymaga logowania | Niewykonane |
| M09 | Przejdź login i scenariusz zgłoszenia myszą/klawiaturą na 1440/768/390 px w trzech przeglądarkach | Wszystkie elementy dostępne, bez przewijania całej strony w poziomie, czytelne statusy | Niewykonane |
| M10 | Uruchom CLI, sprawdź ukryte hasło, niezgodność powtórzenia i duplikat; zaloguj nowego STAFF | Niepoprawne próby nie tworzą konta ani nie zmieniają istniejącej roli; poprawna tworzy pracownika | Niewykonane |

M08 nie wymaga przerywania Oracle używanego na innych zajęciach: automatyczne testy błędów stanowią dowód awarii API. Ręcznie można potwierdzić niepoprawne pola i zachowanie formularza. W raporcie należy zapisać dokładnie sprawdzony wariant, bez rozszerzania wyniku na inne warianty.

| Przeglądarka i wersja | 1440 px | 768 px | 390 px | Klawiatura/fokus | Data i wykonawca |
|---|---|---|---|---|---|
| Chrome ______ | Niewykonane | Niewykonane | Niewykonane | Niewykonane | ______ |
| Edge ______ | Niewykonane | Niewykonane | Niewykonane | Niewykonane | ______ |
| Firefox ______ | Niewykonane | Niewykonane | Niewykonane | Niewykonane | ______ |

Wpisz „OK”, „Błąd” albo „Nie dotyczy” z uzasadnieniem. Błąd otrzymuje kartę Trello ze sposobem odtworzenia, oczekiwanym/rzeczywistym zachowaniem i dowodem. Po poprawce powtarzamy scenariusz, który się nie powiódł.

## Odbiór dokumentacji i całego projektu

- [ ] Lider przeczytał SRS i potwierdził zakres oraz reguły.
- [ ] UML, ERD i makiety zgadzają się z aplikacją.
- [ ] Role umowne i harmonogram są zaakceptowane; dokładny ostatni zjazd uzupełniony, gdy będzie znany.
- [ ] Protokoły ręczne mają rzeczywiste wyniki; błędy zamknięte lub opisane.
- [ ] Raport wydajności i przeglądu bezpieczeństwa uzupełniony.
- [ ] Instrukcja użytkownika/FAQ, API do importu, procedury wdrożenia i utrzymania kompletne.
- [ ] Aplikacja zdalna, CI/CD, monitoring i odtworzenie sprawdzone.
- [ ] Repozytorium i Trello aktualne; demonstracja przygotowana.

Przyjęcie DOC-01 oznacza odbiór dokumentów, nie automatyczny odbiór całego projektu.
