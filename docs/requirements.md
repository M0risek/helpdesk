# SRS — specyfikacja wymagań HelpDesk

Wersja 1.0 do przeglądu przez lidera, 12.10.2026. Zakres odpowiada lokalnej aplikacji po APP-04. Założenia wynikają z polecenia zajęć, rozmowy ze studentem i istniejącego kodu; nie przeprowadzono wywiadów z rzeczywistym serwisem ani klientami.

## Cel biznesowy

Mały serwis komputerowy potrzebuje wspólnego miejsca do przyjmowania zgłoszeń usterek. Klient powinien opisać problem i sprawdzić postęp bez kontaktowania się za każdym razem z pracownikiem. Pracownik powinien mieć kolejkę zgłoszeń, wskazać osobę odpowiedzialną i odnotować rozpoczęcie oraz zakończenie obsługi.

Miarą odbioru zakresu podstawowego jest wykonanie całego scenariusza: rejestracja klienta → zgłoszenie → przypisanie pracownika → rozpoczęcie → zamknięcie → odczyt statusu przez klienta. Dodatkowo inny klient nie może zobaczyć ani zmienić tego zgłoszenia. Kryteria mierzymy testami i protokołem odbioru, nie fikcyjnymi statystykami biznesowymi.

## Zakres produktu

Aplikacja obejmuje konta, role, kategorie sprzętu oraz CRUD zgłoszeń. Kategorie początkowe to Laptop, Komputer stacjonarny, Drukarka i Inne. Ich identyfikatory pobieramy z Oracle. Statusy zgłoszenia: `NEW`, `IN_PROGRESS`, `CLOSED`.

Poza zakresem podstawowym pozostają płatności, magazyn części, faktury, załączniki, czat, powiadomienia e-mail, samodzielne odzyskiwanie hasła, ponowne otwieranie zgłoszeń oraz panel administracyjny. Utworzenie pracownika odbywa się przez lokalne narzędzie CLI. Dodatkowe funkcje można rozważyć po ukończeniu dokumentacji, testów i wdrożenia.

## Użytkownicy i otoczenie

| Aktor | Potrzeby i dostęp |
|---|---|
| Gość | Rejestracja konta klienta i logowanie; publiczny odczyt kategorii |
| Klient (`CLIENT`) | Własny profil; utworzenie, lista i odczyt własnych zgłoszeń; edycja/usunięcie wyłącznie własnych nowych zgłoszeń |
| Pracownik (`STAFF`) | Profil, kolejka wszystkich zgłoszeń, liczby klientów i zgłoszeń, przypisanie istniejącego pracownika, zmiana statusu |
| Operator techniczny | Konfiguracja Oracle i środowiska, CLI tworzące pracownika, uruchomienie, testy i wdrożenie; nie jest trzecią rolą konta aplikacji |

Role klientów i pracowników aplikacji nie są rolami umownego zespołu projektowego. Lider projektu zarządza realizacją, a `STAFF` obsługuje zgłoszenia w produkcie.

Środowisko lokalne: Windows, VS Code, Node.js co najmniej 24.10, Oracle Database z usługą `FREEPDB1`, SQL Developer jako klient administracyjny, GitHub Desktop i Trello. Frontend działa na `127.0.0.1:5173`, API na `127.0.0.1:3000`, Oracle lokalnie na porcie 1521. Przeglądarka komunikuje się z HTTP API, a nie z bazą bezpośrednio.

## Wymagania funkcjonalne

„Zaimplementowane” oznacza istniejący kod i dowody testów automatycznych. Odbiór ręczny jest opisany osobno w [acceptance.md](acceptance.md).

| ID | Wymaganie i kryterium | Priorytet | Stan |
|---|---|---|---|
| FR-01 | Rejestracja zapisuje klienta z imieniem, unikalnym e-mailem i hashem hasła. Formularz sprawdza zgodność powtórzonego hasła; roli pracownika nie można nadać przez rejestrację. | Wymagane | Zaimplementowane |
| FR-02 | Poprawne logowanie tworzy nową sesję i otwiera właściwy panel. Nieznany e-mail i błędne hasło mają ten sam komunikat. | Wymagane | Zaimplementowane |
| FR-03 | Po odświeżeniu strony aktywna sesja odtwarza profil; wylogowanie unieważnia sesję; wygaśnięcie prowadzi do logowania. | Wymagane | Zaimplementowane |
| FR-04 | Zalogowany użytkownik widzi własne imię, e-mail i rolę. | Wymagane | Zaimplementowane |
| FR-05 | Interfejs pobiera istniejące kategorie z Oracle i umożliwia ich wyszukanie po nazwie/opisie. | Wymagane | Zaimplementowane |
| FR-06 | Klient tworzy zgłoszenie z tytułem, opisem i kategorią. Backend ustawia jego ID jako właściciela, `NEW` i daty; opis wraca z bazy bez utraty treści. | Wymagane | Zaimplementowane |
| FR-07 | Klient widzi listę i szczegóły wyłącznie własnych zgłoszeń; cudzy/brakujący identyfikator daje 404. | Wymagane | Zaimplementowane |
| FR-08 | Klient zmienia tytuł, opis i kategorię swojego `NEW`; po rozpoczęciu obsługi zapis jest odrzucany. | Wymagane | Zaimplementowane |
| FR-09 | Usunięcie własnego `NEW` wymaga potwierdzenia w UI i usuwa rekord; anulowanie nie wysyła żądania. | Wymagane | Zaimplementowane |
| FR-10 | Pracownik odczytuje wszystkie zgłoszenia i może przypisać je wyłącznie do konta `STAFF`, także do siebie. | Wymagane | Zaimplementowane |
| FR-11 | Pracownik prowadzi `NEW` → `IN_PROGRESS` → `CLOSED`; obsługa wymaga przypisania. Zamknięcie jest końcowe. | Wymagane | Zaimplementowane |
| FR-12 | Lista filtruje tytuł/nazwę kategorii, kategorię i status oraz dzieli wynik na strony. Pracownik filtruje także przypisane do niego i nieprzypisane. | Wymagane | Zaimplementowane |
| FR-13 | Pulpit pracownika pokazuje rzeczywistą liczbę klientów i zgłoszeń; klient nie ma dostępu do tego podsumowania. | Wymagane | Zaimplementowane |
| FR-14 | CLI tworzy pracownika na podstawie danych operatora, ukrywa wpisywane hasło i odrzuca istniejący e-mail bez zmiany roli. | Wymagane | Zaimplementowane; kontrola interaktywna do odbioru |
| FR-15 | PATCH/DELETE nieaktualnej wersji zwraca 409; drugi równoczesny zapis nie nadpisuje pierwszego. UI zachowuje szkic i oferuje pobranie danych. | Wymagane | Zaimplementowane |
| FR-16 | Formularze pokazują błędy pól i API, stany oczekiwania oraz potwierdzenia. Awaria zapisu zachowuje treść i pozwala ponowić operację. | Wymagane | Zaimplementowane |

## Reguły biznesowe i walidacja

1. Konto aplikacji ma jedną rolę: klient albo pracownik. Publiczna rejestracja zawsze tworzy klienta; hasło Oracle jest osobne od hasła aplikacji.
2. Imię i nazwisko ma 2–120 znaków; e-mail jest normalizowany do małych liter, przycinany i unikalny. Hasło ma 12–128 znaków i nie jest przycinane przez backend.
3. Tytuł zgłoszenia ma 3–200 znaków, opis 10–5000, kategoria musi istnieć. Backend przycina brzegi tytułu/opisu i odrzuca nieznane pola formularza.
4. Nowe zgłoszenie może być nieprzypisane albo przypisane. Klient może edytować/usunąć własne `NEW`, również przypisane. W `IN_PROGRESS` i `CLOSED` przypisanie jest wymagane.
5. Pracownik zmienia przypisanie i status, nie treść klienta. Pracownik nie tworzy ani nie usuwa zgłoszeń w obecnym zakresie.
6. Nie cofamy statusów. `CLOSED` jest dostępne tylko do odczytu. Klient nie zmienia roli, właściciela ani statusu przez API.
7. Lista ma domyślnie 10 rekordów na stronę, maksymalnie 50. Wyszukiwanie ma do 100 znaków i oznacza dosłowny fragment tytułu/nazwy kategorii, bez rozróżniania wielkości liter.
8. Wersja `revision` jest tekstem UTC z sześcioma cyframi części ułamkowej, pochodzącym z `updated_at`. PATCH i DELETE przesyłają wersję dokładnie tak, jak otrzymały ją z API.
9. Sesja wygasa po godzinie bez aktywności. Uprawnienia wynikają z aktualnego konta w Oracle przy każdym chronionym żądaniu.

## Wymagania niefunkcjonalne

| ID | Wymaganie mierzalne | Dowód / pozostała kontrola |
|---|---|---|
| NFR-01 | Chronione odczyty wymagają sesji; zapisy wymagają CSRF; klient nie ma dostępu do cudzego zgłoszenia. | Testy HTTP, integracja Oracle; istnieją |
| NFR-02 | Hasła są hashowane przez scrypt z losową solą. Sekrety nie trafiają do repozytorium, odpowiedzi ani logów API; cookie ma `HttpOnly` i `SameSite=Lax`. Produkcyjne HTTPS wymaga `Secure`. | Testy haseł, sesji i konfiguracji; konfiguracja prawdziwego hostingu do sprawdzenia |
| NFR-03 | Walidacja i wiązane parametry SQL odrzucają niepoprawne ID; tekst wyglądający jak SQL pozostaje danymi. Logowanie/rejestracja mają łącznie limit 20 prób/IP/15 min w jednym procesie. | Testy API i integracja; pełny audyt bezpieczeństwa do wykonania |
| NFR-04 | Zapis zgłoszenia jest atomowy: sprawdzenie wersji/stanu i modyfikacja na jednym połączeniu, COMMIT albo ROLLBACK. Dwa zapisy tej samej wersji dają jeden sukces i jeden konflikt. | Rzeczywisty test równoczesnych zapisów Oracle; istnieje |
| NFR-05 | Widoki na 1440, 768 i 390 px zachowują dostęp do formularzy i menu bez przewijania strony w poziomie. Podstawowy scenariusz działa w Chrome, Edge i Firefox. | CSS istnieje; ręczne sprawdzenie przeglądarek i szerokości do wykonania |
| NFR-06 | Formularze mają etykiety, czytelne komunikaty i fokus; funkcje można obsłużyć klawiaturą. Status jest opisany słowem, nie samym kolorem. | Testy DOM częściowo; pełna kontrola ręczna do wykonania |
| NFR-07 | Plan pomiaru: przy 1000 syntetycznych zgłoszeń i 10 równoczesnych użytkownikach p95 odczytu listy/szczegółów ≤ 2 s, błędy 5xx < 1% w 60 s. Środowisko i obciążenie muszą być opisane. | Cel do weryfikacji w osobnym teście wydajności; nie deklarujemy osiągnięcia |
| NFR-08 | Nowy komputer odtwarza zależności przez pliki lock i `npm.cmd ci`; kod ma rozdzielone UI, API, reguły i zapytania. | Instrukcje istnieją; odtworzenie na czystym środowisku do odbioru |
| NFR-09 | Błąd bazy zwraca 503 z ogólnym komunikatem; API nie udaje sukcesu. Błąd zapisu nie usuwa szkicu zgłoszenia. | Testy API i React; istnieją |
| NFR-10 | Projekt zostaje uruchomiony na docelowym hostingu przez HTTPS, z procedurą CI/CD, kontrolą działania i odtworzenia danych. | Wdrożenie, CI/CD i procedury utrzymania do wykonania |
| NFR-11 | Wymagania, API, struktura bazy, instrukcja użytkownika/FAQ, konfiguracja i procedury testów/wdrożenia są wersjonowane z kodem i powiązane z kartami Trello. | Dokumentacja częściowa; brakujące elementy w [indeksie](README.md) |

NFR-07 jest proponowanym kryterium dla małego projektu, a nie wartością narzuconą przez PDF ani aktualnym wynikiem pomiaru. Analogicznie lista przeglądarek i szerokości stanowi plan odbioru.

## Warunki odbioru i zależności

Odbiór produktu wymaga przejścia FR-01–FR-16, przeglądu bezpieczeństwa, ręcznego scenariusza obu ról i weryfikacji NFR. Odbiór projektu na zajęcia wymaga dodatkowo pełnej dokumentacji, wdrożenia, CI/CD, monitorowania i prezentacji. Wynik testu automatycznego nie zastępuje tych etapów.

System wymaga działającego Oracle z tabelami `USERS`, `CATEGORIES`, `TICKETS`, `AUTH_SESSIONS`. Aplikacja nie uruchamia się, jeśli kontrola schematu przy starcie nie przejdzie. Hosting musi mieć dostęp sieciowy do bazy; samo opublikowanie statycznego React nie zapewni działania API i Oracle.

Powiązania wymagań z kodem, testami i kartami znajdują się w [acceptance.md](acceptance.md). Zmiana zakresu wymaga aktualizacji SRS, scenariuszy i planu przez lidera.
