# Aktualizacja Twojej tablicy Trello — DOC-01

Instrukcja na podstawie dwóch zrzutów tablicy „Projekt Aplikacji Webowej” dostarczonych przez studenta. Stan lokalnego repozytorium sprawdzono 12.10.2026. Nie dokonano zmian w Trello ani nie sprawdzono, czy lokalne commity zostały wysłane na GitHub.

## Listy pozostają

Zachowaj: **Informacje o projekcie**, **Plan Aplikacji Webowej**, **Do wykonania**, **W trakcie**, **Do sprawdzenia**, **Gotowe**. Jest to rozwinięcie przykładowego układu z PDF-u. W planie pozostaw sześć kart faz. Konkretne zadania przechodzą kolejno przez cztery listy wykonania.

Zielony znacznik i pełna checklista oznaczają wykonane punkty, ale nie przenoszą same karty. „Do sprawdzenia” służy do odbioru przygotowanego rezultatu, „Gotowe” — po rzeczywistym przeglądzie kryteriów. Przypisz swoje konto, a umowną rolę z [planu zespołu](project-plan.md) wpisz w opisie. Nie trzeba tworzyć kont dla fikcyjnych członków zespołu.

## Istniejące karty — co zmienić

| Karta widoczna na zrzucie | Obecnie | Zalecana czynność |
|---|---|---|
| **3. Implementacja** | W trakcie, 3/3 | Przenieś z powrotem do **Plan Aplikacji Webowej** jako podsumowanie fazy. Powiąż APP-01–APP-04. Implementacja lokalna działa; odbiór i wdrożenie mają osobne zadania. |
| **6. Konfiguracja środowiska backend** | Do wykonania, 0/1 | Przenieś do **Do sprawdzenia**; konfiguracja i uruchomienie Express/Oracle istnieją w APP-01. Po sprawdzeniu instrukcji i startu możesz zaznaczyć punkt i przenieść „Gotowe”. |
| **7. Integracja z bazą danych** | W trakcie, 7/7 | Przenieś do **Do sprawdzenia**. Dołącz wynik integracji APP-04 i potwierdź zakres siedmiu istniejących punktów. Następnie „Gotowe”, jeżeli wszystkie rzeczywiście odebrane. |
| **8. Stworzenie formularza rejestracji użytkowników** | W trakcie, 1/1 | Przenieś do **Do sprawdzenia**; formularz jest w APP-03. Dopisz odbiór w przeglądarce przed „Gotowe”. |
| **10. Rejestracja, logowanie i role użytkowników** | W trakcie | Przenieś do **Do sprawdzenia**, połącz APP-02 i APP-03. Sprawdź M01/M02 oraz logowanie pracownika. |
| **2. Tworzenie struktury HTML** | Do wykonania, 0/2 | Przenieś do **Do sprawdzenia**; React generuje już strukturę HTML. Zweryfikuj dwa istniejące punkty, bez tworzenia drugiej strony poza React. |
| **3. Stylizacja za pomocą CSS** | Do wykonania, 0/3 | Przenieś do **Do sprawdzenia**: style istnieją. Zaznacz tylko sprawdzone punkty; responsywność wymaga M09. |
| **1. Przegląd projektu graficznego** | Do wykonania, 0/2 | Po rozpoczęciu przeglądu przenieś „W trakcie”; zobacz makiety i aplikację, zapisz uwagi. Nie zaznaczaj wykonania samego przeglądu przed przeczytaniem. |
| **4. Testowanie w przeglądarkach** | Do wykonania, 0/2 | Pozostaw; wykonaj Chrome/Firefox/Edge oraz kontrolę mobilną M09. Testy jsdom/HTTP tego nie zastępują. |
| **5. Zgłoszenie zadania na GitHubie** | Do wykonania, 0/1 | Sprawdź **Push origin** i obecność commitów na stronie repozytorium. Zaznacz/przenieś dopiero po potwierdzeniu wysłania. Jeżeli własna checklista wymaga Issue, utwórz również odpowiednie zgłoszenie. |
| **9. Wdrożenie na środowisko testowe** | Do wykonania, 0/1 | Pozostaw do wykonania: zdalne UI, API, Oracle i HTTPS. Lokalny `npm.cmd run dev` nie kończy tej karty. |

Nie znamy tekstu wszystkich checklist ze zrzutu, dlatego nie przypisujemy im automatycznie procentów ukończenia. Linki i wyniki mają odpowiadać temu, co faktycznie zawiera dana karta.

## Karty faz na liście planu

W PDF-ie checklisty faz mają po trzy obszary. Uzupełnij je na podstawie własnego przeglądu:

| Faza | Trzy obszary z materiału | Dostępny rezultat / dalsza praca |
|---|---|---|
| 1. Planowanie | Wymagania; technologie; środowisko | SRS, decyzje w architekturze, działające środowisko — do przeglądu |
| 2. Projektowanie | Makiety; struktura bazy; architektura | DOC-01 + SQL — do przeglądu |
| 3. Implementacja | UI; backend; integracja bazy | APP-01–APP-04, testy automatyczne; odbiór ręczny osobno |
| 4. Testowanie | Jednostkowe; integracyjne; funkcjonalność/wydajność | Dwa pierwsze wykonane; odbiór ręczny i wydajność pozostają |
| 5. Wdrożenie | Hosting; serwer; środowisko produkcyjne | Do wykonania |
| 6. Utrzymanie | Monitorowanie; błędy; rozwój | Do wykonania po wdrożeniu; nie rozszerzamy zakresu przed zamknięciem braków |

Karty faz podsumowują zadania i pozostają na liście planu. Zaznaczenie punktu wymaga zweryfikowania rezultatu.

## Dodaj kartę dokumentacji

Tytuł: **11. Dokumentacja SRS, UML i plan zespołu (DOC-01)**. Lista: **Do sprawdzenia**. Osoba: Ty. Rola umowna: Z1, konsultacja Z3/Z4. Proponowany termin przeglądu: **19.10.2026** — termin własnej pracy, nie data zjazdu.

Opis do wklejenia:

```text
Przygotować i odebrać dokumentację projektu HelpDesk zgodną z materiałami zajęć:
wymagania, przypadki użycia, UML, architektura, ERD, makiety,
zespół umowny ze studentem jako liderem i harmonogram 9 zjazdów.
Dokumenty: folder docs w repozytorium. Przygotowane 12.10.2026,
opisują istniejący kod; przegląd lidera pozostaje do wykonania.
Gotowość końcowa planowana na 11.01.2027; rzeczywisty termin zajęć do potwierdzenia.
```

Checklista:

- [x] Specyfikacja SRS: funkcje, reguły i wymagania niefunkcjonalne.
- [x] Scenariusze i UML: przypadki użycia, klasy, sekwencje.
- [x] Architektura trzech warstw i ERD Oracle.
- [x] Makiety logowania, panelu i widoku mobilnego.
- [x] Zespół umowny, odpowiedzialności, harmonogram i ryzyka.
- [x] Macierz wymagań/testów oraz formularz odbioru.
- [ ] Przegląd dokumentacji przez lidera i zapis uwag/wyniku.
- [ ] Commit DOC-01 wysłany i link dołączony do karty.

Komentarz po wysłaniu commita:

```text
DOC-01: Dodano SRS, UML, architekturę, ERD, makiety i plan zespołu umownego.
Harmonogram obejmuje 9 zjazdów z PDF-u oraz plan nadrobienia do stycznia.
Diagramy wygenerowane i sprawdzone; dokumentacja ma macierz testów i braków.
Do wykonania: przegląd lidera. To nie jest jeszcze odbiór całego projektu.
Commit: [wklej adres nowego commita DOC-01]
```

## Dodaj kartę zgłoszeń, jeśli nie masz jej poza zrzutem

Tytuł: **12. Obsługa zgłoszeń klienta i pracownika (APP-04)**. Lista: **Do sprawdzenia**. Wykorzystaj checklistę i komentarz z [tickets.md](tickets.md#github-i-trello). Siedem punktów wykonania już ma dowody; pozostają ręczny scenariusz obu ról i wygląd. Nie twórz duplikatu, jeżeli masz taką kartę w niewidocznym miejscu tablicy.

Commit APP-04 istnieje lokalnie: [d81588d — zgłoszenia i obsługa serwisu](https://github.com/M0risek/helpdesk/commit/d81588d267a48819328bfd3061eacdc23954d136). Jeżeli link nie działa, sprawdź wysłanie w GitHub Desktop.

## Linki do istniejących commitów

| Karta / etap | Link do commita |
|---|---|
| Baza, integracja — DB-01 | [7c43ba6](https://github.com/M0risek/helpdesk/commit/7c43ba60a4d28c96ba482a9153ed22232205c5f4) |
| Backend, Oracle — APP-01 | [8aed852](https://github.com/M0risek/helpdesk/commit/8aed85273047607dcc5b08db25b1c104ed3a5198) |
| Konta i role — APP-02 | [2a1fc25](https://github.com/M0risek/helpdesk/commit/2a1fc256c90cde55d63618e588ba3c4992d67699) |
| HTML/CSS, formularze — APP-03 | [124e49f](https://github.com/M0risek/helpdesk/commit/124e49f458b9bc8c53ac1dace4c0fb9eeff097c7) |
| Zgłoszenia i integracja — APP-04 | [d81588d](https://github.com/M0risek/helpdesk/commit/d81588d267a48819328bfd3061eacdc23954d136) |

Adresy zbudowano z odczytanych lokalnych hashy i wskazanego repozytorium. Obecność po stronie GitHuba potwierdź po **Push origin**.

## Jak wysłać DOC-01 i dołączyć commit

1. Otwórz GitHub Desktop: repozytorium `helpdesk`, gałąź `main`.
2. Przejrzyj zmiany dokumentów, źródeł diagramów i obrazów. W polu Summary wpisz **DOC-01: Dodano SRS, UML i plan projektu**.
3. Kliknij **Commit to main**, następnie **Push origin**.
4. W History otwórz nowy commit na GitHubie przez opcję wyświetlenia w przeglądarce i skopiuj pełny adres strony commita.
5. W karcie DOC-01 dodaj **Załącznik → link**, wklej adres i nazwij go „DOC-01 — dokumentacja projektu”. Możesz również wkleić adres w komentarzu z podsumowaniem.
6. Zaznacz punkt wysłania i dołączenia linku. Po przeczytaniu dokumentów dopisz wynik przeglądu i przenieś kartę do „Gotowe”, jeśli nie ma poprawek.

Power-Up GitHub jest już widoczny na kartach ze zrzutu, więc nie trzeba ponownie go konfigurować, aby dodać zwykły link. Status w Trello i commit dotyczą tego samego rezultatu; nie muszą mieć identycznej liczby kart i commitów.
