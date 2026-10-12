# Diagramy i makiety

Źródła są tekstowymi plikami UTF-8 `.puml`. Każdy ma obraz `.png` o tej samej nazwie, wyświetlany w dokumentacji i na GitHubie. Do czytania obrazów nie trzeba instalować narzędzia UML.

| Plik | Rodzaj i treść |
|---|---|
| `01-use-cases-client` | UML — przypadki użycia gościa i klienta |
| `02-use-cases-staff` | UML — przypadki użycia pracownika i operatora |
| `03-domain-classes` | UML — pojęciowy model klas, relacje i krotności |
| `04-login-sequence` | UML — sekwencja logowania i zapis sesji |
| `05-ticket-sequence` | UML — sekwencja zmiany przypisania/statusu |
| `06-architecture` | UML deployment/component — lokalne trzy warstwy |
| `07-erd` | ERD — rzeczywiste tabele i klucze Oracle |
| `08-wireframe-login` | Salt — makieta logowania |
| `09-wireframe-desktop` | Salt — makieta panelu klienta |
| `10-wireframe-mobile` | Salt — makieta formularza mobilnego |

Makiety pokazują strukturę istniejącego UI i powstały po implementacji. Nie są testami wizualnymi aplikacji. Wymagania i powiązania opisano w [use-cases.md](../use-cases.md), [architecture.md](../architecture.md) i [wireframes.md](../wireframes.md).

## Zmiana i regeneracja

Edytuj źródło `.puml`, a następnie odtwórz PNG. Nie poprawiaj samego obrazu, ponieważ następne generowanie nadpisałoby ręczne zmiany.

Opcjonalne narzędzia: Java i plik JAR z [oficjalnej strony PlantUML](https://plantuml.com/download). Dobierz JAR zgodny z lokalną wersją Java. Generator nie jest zależnością aplikacji ani częścią `npm.cmd run dev`. Nie dodajemy pliku JAR do repozytorium.

Z folderu `helpdesk`, z własną ścieżką do pobranego JAR:

```powershell
java '-Djava.awt.headless=true' -jar 'C:\narzedzia\plantuml.jar' -charset UTF-8 -checkonly -failfast2 docs/diagrams
java '-Djava.awt.headless=true' -jar 'C:\narzedzia\plantuml.jar' -charset UTF-8 -tpng -failfast2 docs/diagrams
```

Ścieżka `C:\narzedzia\plantuml.jar` jest przykładem. Polecenia sprawdzają składnię i zapisują PNG obok źródeł. Diagramy struktur korzystają z `!pragma layout smetana`, czyli silnika układu wewnątrz JAR, bez osobnej instalacji Graphviza. Instrukcje: [CLI](https://plantuml.com/command-line), [Smetana](https://plantuml.com/smetana02), [makiety Salt](https://plantuml.com/salt).

Po generowaniu otwórz obrazy i sprawdź tekst, relacje, krotności oraz brak przycięcia. Do commita dodaj zarówno `.puml`, jak i odpowiadające `.png`. Jeśli zmienił się zakres lub model, zaktualizuj również opis, SRS i protokół odbioru.

## Wykonane sprawdzenie DOC-01

12.10.2026: źródła przeszły `-checkonly`; wygenerowano 10 PNG i sprawdzono ich układ. Narzędzie użyte do tej wersji: wariant Java 8 PlantUML `1.2026.9beta4`, commit generatora `7e5e95f`, Java `1.8.0_503`. Pobrany oficjalny JAR ma SHA-256 `E2F18BECB113B05D1C3D0F7F9F6B9F897A60DE3BE357397475396C5748184799`. Informacja służy identyfikacji generatora; nowszy zgodny JAR może nieznacznie zmienić rozmieszczenie.
