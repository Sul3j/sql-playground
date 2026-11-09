# SQL Playground (MySQL)

Interaktywne środowisko do nauki **MySQL** dla uczniów przygotowujących się m.in. do egzaminu zawodowego **INF.03**. Zapytania wykonuje prawdziwy serwer **MySQL 8.4**
(w Dockerze), a każdy uczeń automatycznie dostaje **własną bazę danych** z gotowymi danymi sklepu internetowego —
uczniowie nie widzą swoich zmian nawzajem i każdy może zresetować swoją bazę.

**Stos:** React 18 · Vite 5 · Tailwind CSS 3 · CodeMirror 6 · Node.js (Express + mysql2) · MySQL 8.4 (Docker)

```
przeglądarka ucznia ──► serwer Node.js (port 3001) ──► MySQL 8.4 w Dockerze (127.0.0.1:3307)
                         osobna baza + użytkownik MySQL dla każdego ucznia
```

## Uruchomienie krok po kroku

### Jednorazowo

1. **Zainstaluj Node.js** 18 lub nowszy: <https://nodejs.org> (wersja LTS).
2. **Zainstaluj Docker Desktop**: <https://www.docker.com/products/docker-desktop/> i uruchom go
   (ikona wieloryba w zasobniku systemowym musi być aktywna).
3. Otwórz terminal w folderze projektu (`sql-playground`) i zainstaluj zależności:
   ```bash
   npm install
   ```

### Na co dzień

1. Upewnij się, że **Docker Desktop jest uruchomiony**.
2. Włącz serwer MySQL (za pierwszym razem pobierze obraz ~250 MB i potrwa chwilę dłużej):
   ```bash
   npm run db:start
   ```
3. Uruchom aplikację:
   ```bash
   npm run dev
   ```
4. Otwórz <http://localhost:5173>.

Wyłączenie bazy: `npm run db:stop` (dane uczniów i tak są tymczasowe).

### Lekcja w pracowni — dostęp dla całej klasy

Na komputerze nauczyciela:

```bash
npm run db:start
npm run build
npm start
```

Serwer wypisze adres w sieci lokalnej, np. `http://192.168.1.20:3001` — uczniowie otwierają go w przeglądarce
na swoich komputerach. Jeśli się nie łączą, zezwól programowi Node.js na ruch przychodzący w Zaporze Windows
(port 3001, sieć prywatna).

## Funkcje

- **Edytor SQL** z podświetlaniem składni MySQL i autouzupełnianiem nazw tabel i kolumn.
  - `Ctrl+Enter` lub przycisk **Wykonaj zapytanie**; zaznacz fragment, aby wykonać tylko jego.
  - Wiele poleceń naraz (rozdzielonych `;`), obsługa `DELIMITER` dla procedur i wyzwalaczy.
- **Struktura bazy** — tabele i widoki z typami MySQL (`varchar(50)`, `decimal(10,2)`…), kluczami głównymi,
  obcymi (→ tabela.kolumna), `AUTO_INCREMENT`, `UNIQUE`, `NOT NULL` oraz liczbą wierszy.
  Ikona oka pokazuje zawartość tabeli jednym kliknięciem.
- **Wyniki** — tabela z nagłówkami; `NULL` wyróżnione; liczby wyrównane do prawej.
  - Błędy w formacie klienta MySQL, np. `ERROR 1064 (42000): You have an error in your SQL syntax…`,
    z podpowiedzią po polsku.
  - `INSERT` / `UPDATE` / `DELETE` — liczba zmienionych wierszy (`Query OK, 3 rows affected`),
    nowe `id` po INSERT, ostrzeżenia MySQL i aktualna zawartość zmodyfikowanej tabeli.
- **Baza startowa `sklep`** (12 tabel, ~400 wierszy): `klienci`, `kategorie`, `produkty`, `dostawcy`,
  `zamowienia`, `pozycje_zamowienia`, `rodzaje_dostawy`, `opinie`, `promocje`, `produkty_promocje` (n:m),
  `pracownicy` (z przełożonym — self join), `stanowiska` (widełki płac). Dane zawierają celowo
  NULL-e, klientów bez zamówień, produkty nigdy niezamówione, pensje poza widełkami itp. — wszystko, czego
  wymagają typowe zadania egzaminacyjne.
- **Resetuj bazę danych** — przywraca stan początkowy bazy danego ucznia (łącznie z usunięciem utworzonych kont).
- **Ściągawka — 150 przykładów** w 17 działach zgodnych z zakresem INF.03: SELECT, WHERE, ORDER BY,
  funkcje tekstowe / liczbowe / daty / warunkowe, GROUP BY + HAVING, JOIN (n:m, self join, po kolumnie
  niebędącej kluczem, LEFT/RIGHT), podzapytania, UNION, INSERT / UPDATE / DELETE, CREATE / ALTER TABLE
  (ADD, CHANGE, MODIFY, RENAME, DROP COLUMN), widoki, **CREATE USER, GRANT, REVOKE, role**.
- **87 zadań w stylu egzaminu INF.03** w 8 działach, z poziomem trudności i **automatycznym sprawdzaniem**:
  - zapytania SELECT — wynik ucznia jest porównywany z wynikiem rozwiązania wzorcowego (liczba kolumn,
    wiersze, wartości, kolejność przy ORDER BY, nazwy kolumn / aliasy) z podpowiedzią, co jest nie tak,
  - INSERT / UPDATE / DELETE / ALTER / CREATE USER / GRANT — sprawdzany jest stan bazy po wykonaniu polecenia,
  - postęp ucznia zapisuje się w przeglądarce.
- **Użytkownicy i uprawnienia** działają jak na egzaminie: `CREATE USER 'anna'@'localhost' …`,
  `GRANT SELECT ON sklep.klienci TO …`, `SHOW GRANTS FOR …`, `REVOKE`, `DROP USER`, role.
  Każdy uczeń widzi tylko swoje konta — dwóch uczniów może mieć jednocześnie konto `'anna'@'localhost'`.
- **Jasny / ciemny motyw**.

## Bezpieczeństwo i ograniczenia

- Każdy uczeń łączy się jako osobny użytkownik MySQL z uprawnieniami **wyłącznie do swojej bazy** —
  nie może podejrzeć ani usunąć cudzych danych ani baz systemowych. Uczeń widzi swoją bazę pod nazwą `sklep`
  (wewnętrznie każda baza ma unikalną nazwę).
- Konta tworzone przez ucznia dostają niewidoczny dla niego przyrostek sesji (`anna` → `anna~1a2b3c4d`).
  Polecenia dotyczące kont są sprawdzane przed wykonaniem (m.in. nie można odwołać się do kont innych
  uczniów ani zmienić własnego konta), a po wykonaniu serwer usuwa każde konto bez przyrostka.
  Limit: 30 kont na ucznia. `GRANT … ON *.*` jest ograniczane do bazy `sklep` (z komunikatem dla ucznia),
  a `FLUSH PRIVILEGES` jest akceptowane jako polecenie bez efektu (w MySQL 8 niepotrzebne).
- Pojedyncze zapytanie `SELECT` może trwać maks. 5 s; wynik jest obcinany do 1000 wierszy.
- Bazy uczniów są tymczasowe: usuwane po 3 h bezczynności oraz przy restarcie serwera
  (uczeń dostaje wtedy automatycznie nową, świeżą bazę).
- Nazwy tabel nie rozróżniają wielkości liter (`lower_case_table_names=1`), tak jak w MySQL na Windows.
- MySQL jest dostępny tylko lokalnie (`127.0.0.1:3307`, hasło roota `playground`) — nie wystawiaj tego portu
  do sieci.

## Struktura projektu

```
docker-compose.yml           # serwer MySQL 8.4
server/
├── index.js                 # serwer HTTP (API + zbudowany frontend)
├── db.js                    # sesje uczniów, wykonywanie zapytań, odczyt struktury bazy
├── rewrite.js               # nazwa bazy "sklep" i izolacja kont tworzonych przez uczniów
├── sqlSplit.js              # dzielenie skryptu na polecenia (napisy, komentarze, DELIMITER)
├── generate-seed.js         # generator bazy startowej  ← tu zmienisz dane początkowe
└── seed.sql                 # baza startowa (plik generowany — nie edytuj ręcznie)
src/
├── App.jsx
├── components/              # Header, SqlEditor, SchemaViewer, ResultsPanel, DataTable, CheatSheet
├── db/
│   ├── useDatabase.js       # komunikacja z API
│   └── errorHints.js        # polskie podpowiedzi do numerów błędów MySQL
└── data/
    ├── examples.js          # przykłady (ściągawka)        ← tu dodasz własne
    ├── tasks.js             # zadania + sposób sprawdzania  ← tu dodasz własne
    └── checkTask.js         # porównywanie wyników zadań
```

### Zmiana danych startowych

Edytuj `server/generate-seed.js`, a następnie wygeneruj plik i zrestartuj serwer:

```bash
node server/generate-seed.js
```

Dane są deterministyczne (stałe ziarno losowania). Po zmianie danych sprawdź zadania, które w `verify`
odwołują się do konkretnych wartości (np. `m5`, `m6`, `m8` w `src/data/tasks.js`).

## Konfiguracja (zmienne środowiskowe serwera)

| Zmienna | Domyślnie |
|---|---|
| `PORT` | `3001` |
| `MYSQL_HOST` / `MYSQL_PORT` | `127.0.0.1` / `3307` |
| `MYSQL_USER` / `MYSQL_PASSWORD` | `root` / `playground` |

Można więc podłączyć inny serwer MySQL 8 zamiast Dockera — wystarczy konto z prawem tworzenia baz i użytkowników.
