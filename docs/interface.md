# Interfejs HelpDesk — APP-03 i APP-04

Stan implementacji: 2026-10-12. Dokument uzupełnia wymagania i API opisane w `authentication.md`. Nie stanowi jeszcze pełnej dokumentacji końcowej projektu.

## Układ i podział kodu

Interfejs używa ciemnej zieleni, jasnego tła i prostych kart. Na większym ekranie menu panelu znajduje się po lewej stronie, a na mniejszym przechodzi nad treść. Formularze na małych ekranach zajmują jedną kolumnę. Arkusz CSS ma warianty dla szerokości 1200, 900 i 540 px.

| Plik | Odpowiedzialność |
|---|---|
| `src/App.jsx` | Odtworzenie sesji, wybór widoku i przejścia między logowaniem a panelem |
| `src/api.js` | Żądania HTTP, cookie, token CSRF i interpretacja błędów |
| `src/components/AuthForm.jsx` | Formularze, walidacja i komunikaty |
| `src/components/Dashboard.jsx` | Pulpit, kategorie, profil i wylogowanie |
| `src/components/Tickets.jsx` | Lista, filtry, formularz, szczegóły, potwierdzenie usunięcia i obsługa pracownika |
| `src/components/Brand.jsx` / `Icon.jsx` | Wspólna identyfikacja i ikony SVG |
| `src/styles.css` | Kolory, czytelność, responsywność i stany fokusowania |

Przepływ danych: komponent React → `api.js` → proxy `/api` w Vite → Express → Oracle. Przeglądarka nie łączy się bezpośrednio z Oracle.

## Przypadki użycia

| ID | Czynność | Oczekiwany rezultat |
|---|---|---|
| UI-01 | Klient rejestruje konto | Formularz sprawdza dane i zgodność haseł; po zapisie pokazuje logowanie z potwierdzeniem |
| UI-02 | Użytkownik się loguje | Otwiera się pulpit właściwy dla roli |
| UI-03 | Użytkownik odświeża stronę | Profil jest odtwarzany z aktywnej sesji Oracle |
| UI-04 | Klient przegląda kategorie | Widzi aktualne kategorie i filtruje je po nazwie lub opisie |
| UI-05 | Pracownik otwiera pulpit | Widzi aktualną liczbę klientów i zgłoszeń |
| UI-06 | Użytkownik otwiera „Moje konto” | Widzi imię i nazwisko, e-mail oraz typ konta |
| UI-07 | Użytkownik się wylogowuje | Backend usuwa sesję; interfejs wraca do logowania |
| UI-08 | Sesja wygasa lub API jest niedostępne | Użytkownik dostaje właściwy komunikat i możliwość ponowienia lub logowania |
| UI-09 | Klient tworzy/edytuje zgłoszenie | Formularz sprawdza dane; błąd zapisu zachowuje szkic |
| UI-10 | Klient usuwa nowe zgłoszenie | Osobne potwierdzenie; anulowanie nie wywołuje API |
| UI-11 | Pracownik obsługuje zgłoszenie | Przypisuje pracownika i zmienia status; zamknięcie pozostawia widok do odczytu |
| UI-12 | Lista jest filtrowana i stronicowana | Parametry trafiają do API; zmiana filtrów wraca na stronę 1 |
| UI-13 | Zgłoszenie zmieniła inna osoba | Komunikat o konflikcie; szkic pozostaje, użytkownik może pobrać aktualne dane |

## Dostępność

- Dokument ma język polski, widoczne etykiety formularzy i odpowiednie `autocomplete`.
- Błędy pól są powiązane z kontrolkami przez `aria-describedby`; niepoprawne pole ma `aria-invalid`.
- Błędy API używają `role="alert"`, a potwierdzenia i ładowanie `role="status"`.
- Walidacja kieruje fokus do pierwszego błędnego pola. Błąd API może być odczytany po przeniesieniu fokusu do komunikatu.
- Link „Przejdź do treści” umożliwia pominięcie menu. Zmiana widoku aktualizuje tytuł dokumentu i kieruje fokus do głównej treści.
- Aktywne menu ma `aria-current="page"`. Ikony dekoracyjne są ukryte przed czytnikami ekranu.
- Przycisk pokazywania hasła ma etykietę i `aria-pressed`. Operacje w toku blokują ponowne wysłanie formularza.
- CSS uwzględnia `prefers-reduced-motion`.

Te rozwiązania są zaimplementowane; pełny audyt dostępności i wyglądu nie został jeszcze wykonany.

## Kontrola ręczna w przeglądarce

Uruchom `npm.cmd run dev` z folderu `helpdesk` i otwórz `http://127.0.0.1:5173/`.

1. Zarejestruj konto klienta. Sprawdź błędny e-mail, zbyt krótkie hasło i różne powtórzone hasło. Popraw dane i sprawdź potwierdzenie.
2. Zaloguj się poprawnymi danymi. Sprawdź pulpit, kategorie i własny profil.
3. Na stronie kategorii wpisz „druk”, potem nieistniejącą nazwę. Wyczyść wyszukiwanie.
4. Odśwież stronę. Aktywna sesja powinna pozostawić użytkownika w panelu.
5. Wyloguj się. Próba wejścia na `/#/account` powinna pokazać logowanie.
6. Utwórz własne konto pracownika przez `npm.cmd --prefix backend run staff:create`, zaloguj się nim i sprawdź liczniki.
7. Sprawdź szerokości okna około 1440, 768 i 390 px. Treść nie powinna wymagać przewijania w poziomie; menu, formularze i wylogowanie muszą być dostępne.
8. Przejdź przez formularz i menu klawiszem Tab. Sprawdź widoczny fokus i działanie klawisza Enter.
9. Klient: dodaj zgłoszenie, popraw opis, dodaj drugie i usuń je. Anuluj raz potwierdzenie i sprawdź, że rekord pozostał.
10. Pracownik: otwórz zgłoszenie, przypisz do siebie i rozpocznij obsługę, następnie zamknij. Klient powinien widzieć aktualny status i opis, bez przycisków edycji/usuwania.
11. Sprawdź filtry statusu, kategorii i wyszukiwanie; pracownik także filtr przypisania. Otwórz zgłoszenie w dwóch kartach, zapisz w jednej i sprawdź komunikat o konflikcie w drugiej.

Nie zaznaczaj tej kontroli jako wykonanej przed jej rzeczywistym przeprowadzeniem. Automatyczne testy komponentów i HTTP nie sprawdzają układu graficznego w przeglądarce.

## Następny etap

Obsługa zgłoszeń została dodana w APP-04; API i reguły opisano w `tickets.md`. Następne prace: ręczny odbiór widoków, dokumentacja całego projektu i przygotowanie hostingu.
