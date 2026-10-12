# Dokumentacja projektu HelpDesk

Wersja dokumentacji: 0.5, stan na 12.10.2026. Aplikacja obsługuje klientów i pracowników serwisu komputerowego. Dokumentacja jest rozwijana wraz z projektem; poniższy wykaz pokazuje wykonane elementy i prace pozostałe do zaliczenia.

## Od czego zacząć

| Dokument | Zawartość |
|---|---|
| [SRS: specyfikacja wymagań](requirements.md) | Cel, zakres, role, wymagania funkcjonalne i niefunkcjonalne, kryteria odbioru |
| [Plan projektu i zespołu](project-plan.md) | Zespół umowny, odpowiedzialności, harmonogram 9 zjazdów, plan nadrobienia, ryzyka |
| [Architektura i baza danych](architecture.md) | Trzy warstwy, organizacja kodu, model danych, ERD i decyzje techniczne |
| [Przypadki użycia i UML](use-cases.md) | Aktorzy, scenariusze, diagramy przypadków użycia, klas i sekwencji |
| [Interfejs i kontrola ręczna](interface.md) | Komponenty React, widoki, dostępność i scenariusze przeglądarkowe |
| [Makiety interfejsu](wireframes.md) | Makieta logowania, panelu i wersji mobilnej; powiązanie z istniejącymi widokami |
| [Uwierzytelnianie i API kont](authentication.md) | Rejestracja, logowanie, cookie, CSRF, role i testy |
| [Zgłoszenia i API](tickets.md) | CRUD, statusy, przypisanie, wersje, transakcje i wyniki testów |
| [Odbiór i powiązanie wymagań z testami](acceptance.md) | Macierz wymagań, dowody automatyczne i formularz kontroli ręcznej |
| [Aktualizacja Twojej tablicy Trello](trello.md) | Konkretne istniejące karty, zalecane listy, checklisty i linki do commitów |
| [Uruchomienie backendu](../backend/README.md) | Konfiguracja środowiska, konta pracowników, sesje, testy |
| [Uruchomienie frontendu](../frontend/README.md) | Vite, proxy, build, testy i widoki |
| [Skrypty i struktura Oracle](../database/README.md) | Instalacja schematu, tabele, ograniczenia i migracja sesji |

## Stan etapów

| Obszar | Stan udokumentowany |
|---|---|
| Planowanie i analiza | Dokumenty przygotowane w DOC-01; lider powinien je przeczytać i zatwierdzić jako założenia projektu |
| Projektowanie | Architektura, UML, ERD i makiety przygotowane; makiety odtwarzają założenia istniejącego interfejsu |
| Implementacja | Zakończony zakres lokalny APP-01–APP-04: uwierzytelnianie, zgłoszenia, role i Oracle |
| Testy | 29 testów backendu, 20 frontendu oraz integracja z Oracle przeszły w APP-04; pozostają odbiór w przeglądarkach i pomiary wydajności |
| Dokumentacja końcowa | Brakuje osobnej instrukcji użytkownika z FAQ, kompletnej specyfikacji API w formacie do importu, procedury wdrożenia i utrzymania |
| Wdrożenie | Docelowy hosting, CI/CD i monitoring do wykonania |
| Prezentacja | Demonstracja i materiał do przedstawienia do wykonania |

Dokumenty powstały po rozpoczęciu implementacji. Nie przedstawiamy ich jako historycznie wykonanych przed kodowaniem. Stan bazowy opisuje działający kod i uzgodnione decyzje, a harmonogram pokazuje plan wymagany do zamknięcia całego cyklu projektu.

## Wymagania zajęć i decyzje projektu

Materiały źródłowe dostarczone przez studenta:

- `Projekt.pdf`: cel i zakres, s. 2–4; harmonogram 9 spotkań po 2 godziny, s. 5; warunki zaliczenia i monitorowanie postępów, s. 6.
- `Zarządzanie projektami  - Trello.pdf`: przykładowe fazy i zadania, s. 3–5; powiązanie z GitHubem i udostępnienie tablicy prowadzącej, s. 5.

PDF-y określają zadanie zaliczeniowe. Temat HelpDesk, Oracle, sesje cookie, nazwy kart i proponowany plan nadrobienia są decyzjami tego projektu. Materiał wymienia React dla frontendu oraz przykładowe rozwiązania backendu i bazy; dokumentacja nie przypisuje prowadzącej wyboru Oracle ani konkretnego zakresu HelpDesk. Pełne zaliczenie wymaga przejścia wszystkich etapów, także wdrożenia i prezentacji.

Repozytorium nie zawiera kopii PDF-ów prowadzącej, danych połączenia ani danych rzeczywistych klientów. Dokumentacja opisuje umowny zespół na potrzeby ćwiczenia, zgodnie z potwierdzeniem studenta.

## Praca z dokumentacją

Pliki Markdown można przeglądać na GitHubie albo w VS Code przez **Ctrl+Shift+V**. Diagramy są dołączone jako obrazy PNG oraz edytowalne źródła PlantUML w `diagrams/`. Obrazy wyświetlają się bez instalowania rozszerzenia. Regenerację opisuje [instrukcja diagramów](diagrams/README.md).

Po zmianie funkcji aktualizujemy jednocześnie wymaganie, opis API, scenariusz odbioru i kartę Trello. Nową wersję dokumentu zapisujemy przez commit. Gotowość kodu, wynik testu i odbiór ręczny są odrębnymi dowodami postępu.
