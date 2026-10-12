# Frontend HelpDesk

Etapy APP-03 i APP-04: React, Vite i Bootstrap. Formularze oraz widoki korzystają z działającego backendu Express i Oracle. Interfejs obsługuje logowanie i zgłoszenia, w tym pracę klienta oraz pracownika. Dane i liczniki pochodzą z API.

## Uruchomienie

Najwygodniej: z folderu `helpdesk` uruchom `npm.cmd run dev`. Frontend i backend pracują wtedy w jednym terminalu. Zależności są już zainstalowane na komputerze projektu.

Sam frontend, np. gdy API już działa:

```powershell
cd .\frontend
npm.cmd run dev
```

Adres: **http://127.0.0.1:5173/**. Jeśli port jest zajęty, Vite kończy uruchamianie z komunikatem, aby nie zmieniać adresu bez wiedzy użytkownika. Używaj konsekwentnie `127.0.0.1`; `localhost` to inny host cookie.

Vite przekazuje `/api` do `http://127.0.0.1:3000`. Przeglądarka wysyła cookie do tego samego adresu co stronę, dlatego nie potrzebujemy dodatkowej konfiguracji CORS.

Jeśli zmienisz port API, skopiuj `.env.example` do lokalnego `frontend/.env`, ustaw `API_PROXY_TARGET` i zrestartuj Vite. W pliku frontendu nie umieszczamy hasła Oracle ani `SESSION_SECRET`; pozostają wyłącznie w konfiguracji backendu.

## Widoki

| Adres | Zawartość |
|---|---|
| `/#/login` | Logowanie, walidacja pól, pokazywanie hasła i komunikaty API |
| `/#/register` | Rejestracja klienta oraz sprawdzenie powtórzonego hasła |
| `/#/dashboard` | Pulpit klienta lub pracownika, zależnie od roli |
| `/#/categories` | Kategorie z Oracle i wyszukiwanie po nazwie lub opisie |
| `/#/account` | Imię i nazwisko, e-mail oraz typ konta |
| `/#/tickets` | Własne zgłoszenia klienta lub kolejka pracownika; filtry i paginacja |
| `/#/tickets/new` | Formularz dodania zgłoszenia klienta |
| `/#/tickets/:id` | Szczegóły, edycja/usunięcie nowego zgłoszenia klienta lub obsługa pracownika |

Routing wykorzystuje fragment adresu (`#`), co pozwala odświeżać widoki bez dodatkowej konfiguracji przekierowań serwera. Zalogowany użytkownik adresu logowania trafia do pulpitu, a niezalogowany użytkownik chronionego widoku trafia do logowania.

Pulpit pracownika pobiera rzeczywistą liczbę klientów i zgłoszeń z `/api/staff/summary`. Klient nie wywołuje tej trasy. Kontrola dostępu jest również wymuszana przez backend.

Zgłoszenia obsługuje `src/components/Tickets.jsx`. Błąd zapisu pozostawia wpisaną treść w formularzu. Konflikt wersji udostępnia przycisk pobrania aktualnego zgłoszenia. Odświeżenie aktualnych danych po konflikcie zastępuje szkic danymi serwera. Powrót fokusu do okna sprawdza sesję, zachowując szkic zgłoszenia. Usunięcie wymaga osobnego potwierdzenia. Reguły i API są w [docs/tickets.md](../docs/tickets.md).

## Sesja i błędy

- `api.js` pobiera token CSRF przed zapisem, wysyła cookie oraz aktualizuje token po logowaniu.
- Token pozostaje w pamięci aplikacji. Hasło, token i profil nie są zapisywane w `localStorage` ani `sessionStorage`.
- Po odświeżeniu aplikacja odczytuje profil przez `/api/auth/me`.
- Odświeżenie danych i powrót do aktywnego okna ponownie sprawdzają sesję oraz rolę.
- Wygaśnięcie sesji kieruje do logowania. Błąd wylogowania nie udaje pomyślnego zakończenia sesji.
- Przy błędzie CSRF następna próba pobiera świeży token; zapis nie jest automatycznie ponawiany.
- Przy awarii danych wyświetlany jest komunikat i przycisk ponowienia, bez zastępowania danych zerowymi licznikami.

## Testy i build

Z folderu `frontend`:

```powershell
npm.cmd test
npm.cmd run test:integration
npm.cmd run build
```

Sprawdzenie 2026-10-12:

- 20 testów Vitest/Testing Library przeszło. Sprawdzają logowanie, sesję, role, walidację zgłoszeń, zapis, usuwanie z potwierdzeniem, filtry, obsługę pracownika, konflikty, awarie API i CSRF.
- Test HTTP przez Vite, Express i rzeczywiste Oracle przeszedł. Sprawdził uwierzytelnianie oraz CRUD, izolację klientów, przypisanie, statusy, paginację, CLOB i dwa równoczesne zapisy. Własne dane testowe usunięto.
- Build produkcyjny powstał w `frontend/dist`. Ten katalog jest ignorowany przez Git.
- Test wizualny w prawdziwej przeglądarce nie został wykonany: narzędzie przeglądarki było niedostępne. Lista kontroli ręcznej jest w `docs/interface.md`.

Test integracyjny korzysta z `backend/.env` i bibliotek backendu. Wymaga zainstalowanych zależności obu części oraz lokalnego, przygotowanego Oracle. Uruchamia własne serwery na wolnych portach i zamyka je po teście. Nie uruchamiaj go na produkcyjnej bazie.

Podgląd wersji zbudowanej:

```powershell
npm.cmd run preview
```

Adres podglądu: `http://127.0.0.1:4173/`. API musi działać. Proxy używane przez `dev` i `preview` nie jest częścią katalogu `dist`. Na docelowym hostingu potrzebne będzie przekazywanie `/api` do Express pod tym samym adresem co interfejs.

## GitHub i Trello

Commit bieżącego etapu: `APP-04: Dodano zgłoszenia i obsługę serwisu`.

Do repozytorium dodaj kod frontendu, testy, konfigurację, pliki `package.json` i `package-lock.json` z katalogu głównego i frontendu oraz dokumentację. `node_modules`, `dist` i prywatne `.env` pozostają ignorowane.

W Trello uzupełnij kartę obsługi zgłoszeń i przenieś ją „Do sprawdzenia”. Dołącz link do commita i wynik testów; kontrola ręczna w przeglądarce pozostaje do wykonania. Gotowa checklista i komentarz są w [docs/tickets.md](../docs/tickets.md).

## Źródła

- [React: aplikacja budowana z Vite](https://react.dev/learn/build-a-react-app-from-scratch)
- [Vite: konfiguracja serwera i proxy](https://vite.dev/config/server-options)
- [Bootstrap: formularze i dostępna walidacja](https://getbootstrap.com/docs/5.3/forms/validation/)
