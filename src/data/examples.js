// Gotowe zapytania do kliknięcia (ściągawka), ułożone według działów egzaminu INF.03.
const ex = (title, sql) => ({ title, sql: sql.trim() })

export const DEFAULT_QUERY = `-- Witaj w SQL Playground (MySQL)!
-- Pracujesz na bazie "sklep". Strukturę tabel widzisz w panelu po lewej.
-- Wpisz zapytanie i naciśnij Ctrl+Enter (lub przycisk "Wykonaj").
-- Zaznacz fragment kodu, aby wykonać tylko jego.

SELECT imie, nazwisko, miasto
FROM klienci
WHERE miasto = 'Warszawa';
`

export const EXAMPLE_GROUPS = [
  {
    name: 'Podgląd struktury bazy',
    items: [
      ex('Lista tabel (SHOW TABLES)', 'SHOW TABLES;'),
      ex('Kolumny tabeli (DESCRIBE)', 'DESCRIBE produkty;'),
      ex('Kolumny tabeli (SHOW COLUMNS)', 'SHOW COLUMNS FROM zamowienia;'),
      ex('Kod tworzący tabelę', 'SHOW CREATE TABLE pracownicy;'),
      ex('Nazwa bieżącej bazy', 'SELECT DATABASE();'),
    ],
  },
  {
    name: 'SELECT — podstawy',
    items: [
      ex('Wszystkie kolumny (*)', 'SELECT * FROM klienci;'),
      ex('Wybrane kolumny', 'SELECT imie, nazwisko, email\nFROM klienci;'),
      ex(
        'Aliasy kolumn (AS)',
        `
-- alias ze spacją lub polskimi znakami zapisujemy w \`odwrotnych apostrofach\`
SELECT nazwa AS produkt, cena AS \`cena w zł\`
FROM produkty;`,
      ),
      ex('Bez powtórzeń (DISTINCT)', 'SELECT DISTINCT miasto\nFROM klienci;'),
      ex('DISTINCT dla kilku kolumn', 'SELECT DISTINCT kraj, miasto\nFROM dostawcy;'),
      ex(
        'Kolumna obliczana',
        'SELECT nazwa, cena, stan_magazynowy,\n       cena * stan_magazynowy AS wartosc_towaru\nFROM produkty;',
      ),
      ex(
        'Cena netto (VAT 23%)',
        'SELECT nazwa,\n       cena AS brutto,\n       ROUND(cena / 1.23, 2) AS netto\nFROM produkty;',
      ),
      ex('Pierwsze 5 wierszy (LIMIT)', 'SELECT * FROM produkty\nLIMIT 5;'),
      ex(
        'Stronicowanie (LIMIT … OFFSET)',
        `
-- pomija 5 wierszy i zwraca kolejne 5 (to samo co: LIMIT 5, 5)
SELECT id, nazwa
FROM produkty
LIMIT 5 OFFSET 5;`,
      ),
      ex('Nazwa tabeli z nazwą bazy', 'SELECT * FROM sklep.kategorie;'),
    ],
  },
  {
    name: 'Filtrowanie (WHERE)',
    items: [
      ex('Równość (=)', "SELECT imie, nazwisko\nFROM klienci\nWHERE miasto = 'Kraków';"),
      ex('Różne od (<>)', "SELECT id, status\nFROM zamowienia\nWHERE status <> 'dostarczone';"),
      ex('Większe / mniejsze', 'SELECT nazwa, cena\nFROM produkty\nWHERE cena > 1000;'),
      ex('Zakres liczb (BETWEEN)', 'SELECT nazwa, cena\nFROM produkty\nWHERE cena BETWEEN 100 AND 300;'),
      ex(
        'Zakres dat (BETWEEN)',
        "SELECT id, data_zamowienia\nFROM zamowienia\nWHERE data_zamowienia BETWEEN '2025-01-01' AND '2025-12-31';",
      ),
      ex('Lista wartości (IN)', "SELECT imie, nazwisko, miasto\nFROM klienci\nWHERE miasto IN ('Warszawa', 'Gdańsk', 'Kraków');"),
      ex('Poza listą (NOT IN)', 'SELECT nazwa, kategoria_id\nFROM produkty\nWHERE kategoria_id NOT IN (1, 2);'),
      ex('Zaczyna się od (LIKE)', "-- % = dowolny ciąg znaków\nSELECT imie, nazwisko\nFROM klienci\nWHERE nazwisko LIKE 'K%';"),
      ex('Kończy się na (LIKE)', "SELECT imie, nazwisko\nFROM klienci\nWHERE nazwisko LIKE '%ska';"),
      ex('Zawiera fragment (LIKE)', "SELECT nazwa\nFROM produkty\nWHERE nazwa LIKE '%bezprzewod%';"),
      ex('Jeden dowolny znak (_)', "-- _ = dokładnie jeden znak; tu: druga litera imienia to „a”\nSELECT imie\nFROM klienci\nWHERE imie LIKE '_a%';"),
      ex('Kilka wzorców (LIKE … OR)', "SELECT nazwa\nFROM produkty\nWHERE nazwa LIKE 'S%' OR nazwa LIKE 'K%';"),
      ex('Nie pasuje (NOT LIKE)', "SELECT nazwa, kraj\nFROM dostawcy\nWHERE kraj NOT LIKE 'Pol%';"),
      ex('Brak wartości (IS NULL)', 'SELECT imie, nazwisko\nFROM klienci\nWHERE telefon IS NULL;'),
      ex('Jest wartość (IS NOT NULL)', 'SELECT id, data_wysylki\nFROM zamowienia\nWHERE data_wysylki IS NOT NULL;'),
      ex(
        'AND i OR z nawiasami',
        'SELECT nazwa, kategoria_id, cena\nFROM produkty\nWHERE (kategoria_id = 1 OR kategoria_id = 2)\n  AND cena < 500;',
      ),
      ex('Pole tak/nie (TINYINT(1))', '-- 1 = prawda, 0 = fałsz\nSELECT nazwa, aktywny\nFROM produkty\nWHERE aktywny = 0;'),
      ex(
        'Porównanie dwóch kolumn',
        '-- produkty, których jest mniej niż wymagane minimum\nSELECT nazwa, stan_magazynowy, stan_minimalny\nFROM produkty\nWHERE stan_magazynowy < stan_minimalny;',
      ),
    ],
  },
  {
    name: 'Sortowanie (ORDER BY)',
    items: [
      ex('Rosnąco (ASC)', 'SELECT nazwisko, imie\nFROM klienci\nORDER BY nazwisko;'),
      ex('Malejąco (DESC)', 'SELECT nazwa, cena\nFROM produkty\nORDER BY cena DESC;'),
      ex('Według kilku kolumn', 'SELECT miasto, nazwisko, imie\nFROM klienci\nORDER BY miasto, nazwisko;'),
      ex(
        'Według aliasu',
        'SELECT nazwa, cena * stan_magazynowy AS wartosc\nFROM produkty\nORDER BY wartosc DESC;',
      ),
      ex('3 najdroższe (ORDER BY + LIMIT)', 'SELECT nazwa, cena\nFROM produkty\nORDER BY cena DESC\nLIMIT 3;'),
      ex(
        'Najmłodszy klient',
        'SELECT imie, nazwisko, data_urodzenia\nFROM klienci\nORDER BY data_urodzenia DESC\nLIMIT 1;',
      ),
      ex('Losowa kolejność (RAND)', 'SELECT nazwa\nFROM produkty\nORDER BY RAND()\nLIMIT 3;'),
      ex('NULL na końcu', '-- najpierw wiersze z miastem, puste na końcu\nSELECT imie, miasto\nFROM klienci\nORDER BY miasto IS NULL, miasto;'),
    ],
  },
  {
    name: 'Funkcje tekstowe',
    items: [
      ex('Łączenie (CONCAT)', "SELECT CONCAT(imie, ' ', nazwisko) AS klient\nFROM klienci;"),
      ex('Łączenie z separatorem (CONCAT_WS)', "SELECT CONCAT_WS(', ', nazwa, miasto, kraj) AS dostawca\nFROM dostawcy;"),
      ex('Wielkie / małe litery', 'SELECT UPPER(nazwisko) AS nazwisko, LOWER(email) AS email\nFROM klienci;'),
      ex(
        'Długość tekstu',
        '-- LENGTH liczy bajty (polskie litery = 2 bajty), CHAR_LENGTH liczy znaki\nSELECT nazwisko,\n       LENGTH(nazwisko) AS bajty,\n       CHAR_LENGTH(nazwisko) AS znaki\nFROM klienci;',
      ),
      ex(
        'Fragment z lewej / prawej',
        "SELECT CONCAT(LEFT(imie, 1), '. ', nazwisko) AS skrot,\n       RIGHT(telefon, 3) AS koncowka_telefonu\nFROM klienci;",
      ),
      ex(
        'Wycinanie (SUBSTRING, LOCATE)',
        "-- domena = wszystko po znaku @\nSELECT email, SUBSTRING(email, LOCATE('@', email) + 1) AS domena\nFROM dostawcy;",
      ),
      ex('Zamiana tekstu (REPLACE)', "SELECT nazwa, REPLACE(nazwa, ' ', '_') AS nazwa_pliku\nFROM produkty;"),
      ex('Usuwanie spacji (TRIM)', "SELECT CONCAT('[', TRIM('   tekst   '), ']') AS wynik;"),
    ],
  },
  {
    name: 'Funkcje liczbowe',
    items: [
      ex(
        'Zaokrąglanie (ROUND, TRUNCATE)',
        'SELECT cena,\n       ROUND(cena) AS do_calosci,\n       ROUND(cena, 1) AS jedno_miejsce,\n       TRUNCATE(cena, 1) AS obciecie\nFROM produkty;',
      ),
      ex('W dół / w górę (FLOOR, CEIL)', 'SELECT cena, FLOOR(cena) AS w_dol, CEIL(cena) AS w_gore\nFROM produkty;'),
      ex('Losowa liczba 1–10', 'SELECT FLOOR(RAND() * 10 + 1) AS los;'),
      ex('Reszta z dzielenia (MOD)', '-- produkty o parzystym id\nSELECT id, nazwa\nFROM produkty\nWHERE MOD(id, 2) = 0;'),
    ],
  },
  {
    name: 'Funkcje daty i czasu',
    items: [
      ex('Dzisiejsza data i czas', 'SELECT NOW(), CURDATE(), CURTIME();'),
      ex(
        'Części daty (YEAR, MONTH, DAY)',
        'SELECT data_zamowienia,\n       YEAR(data_zamowienia) AS rok,\n       MONTH(data_zamowienia) AS miesiac,\n       DAY(data_zamowienia) AS dzien\nFROM zamowienia;',
      ),
      ex(
        'Polskie nazwy dni i miesięcy',
        "SET lc_time_names = 'pl_PL';\n\nSELECT data_zamowienia,\n       DAYNAME(data_zamowienia) AS dzien_tygodnia,\n       MONTHNAME(data_zamowienia) AS miesiac\nFROM zamowienia;",
      ),
      ex(
        'Formatowanie (DATE_FORMAT)',
        "SELECT imie, nazwisko,\n       DATE_FORMAT(data_rejestracji, '%d.%m.%Y') AS zarejestrowany\nFROM klienci;",
      ),
      ex(
        'Różnica dat (DATEDIFF)',
        '-- DATEDIFF(późniejsza, wcześniejsza)\nSELECT id,\n       DATEDIFF(data_wysylki, data_zamowienia) AS dni_do_wysylki\nFROM zamowienia\nWHERE data_wysylki IS NOT NULL;',
      ),
      ex(
        'Ile dni temu?',
        'SELECT imie, nazwisko,\n       DATEDIFF(CURDATE(), data_rejestracji) AS dni_w_sklepie\nFROM klienci;',
      ),
      ex(
        'Wiek w latach (TIMESTAMPDIFF)',
        'SELECT imie, nazwisko,\n       TIMESTAMPDIFF(YEAR, data_urodzenia, CURDATE()) AS wiek\nFROM klienci;',
      ),
      ex(
        'Dodawanie dni (DATE_ADD)',
        'SELECT id, data_zamowienia,\n       DATE_ADD(data_zamowienia, INTERVAL 14 DAY) AS termin_zwrotu\nFROM zamowienia;',
      ),
      ex(
        'Ostatnie 30 dni',
        'SELECT id, data_zamowienia, status\nFROM zamowienia\nWHERE data_zamowienia >= CURDATE() - INTERVAL 30 DAY;',
      ),
      ex('Bieżący rok', 'SELECT id, data_zamowienia\nFROM zamowienia\nWHERE YEAR(data_zamowienia) = YEAR(CURDATE());'),
    ],
  },
  {
    name: 'Funkcje warunkowe',
    items: [
      ex('IF', "SELECT nazwa,\n       IF(stan_magazynowy > 0, 'dostępny', 'niedostępny') AS dostepnosc\nFROM produkty;"),
      ex('Zastąp NULL (IFNULL)', "SELECT imie, nazwisko, IFNULL(telefon, 'brak') AS telefon\nFROM klienci;"),
      ex('Pierwsza niepusta (COALESCE)', 'SELECT imie, nazwisko, COALESCE(telefon, email) AS kontakt\nFROM klienci;'),
      ex(
        'Przedziały (CASE WHEN)',
        "SELECT nazwa, cena,\n       CASE\n         WHEN cena < 100 THEN 'tani'\n         WHEN cena < 1000 THEN 'średni'\n         ELSE 'drogi'\n       END AS przedzial\nFROM produkty;",
      ),
      ex(
        'Tłumaczenie wartości (CASE)',
        "SELECT id,\n       CASE status\n         WHEN 'nowe' THEN 'czeka na płatność'\n         WHEN 'opłacone' THEN 'do wysłania'\n         WHEN 'wysłane' THEN 'w drodze'\n         ELSE status\n       END AS opis\nFROM zamowienia;",
      ),
    ],
  },
  {
    name: 'Agregacja i grupowanie',
    items: [
      ex('Liczba wierszy (COUNT)', 'SELECT COUNT(*) AS liczba_klientow\nFROM klienci;'),
      ex(
        'COUNT(kolumna) pomija NULL',
        'SELECT COUNT(*) AS wszyscy,\n       COUNT(telefon) AS z_telefonem\nFROM klienci;',
      ),
      ex('Unikalne wartości (COUNT DISTINCT)', 'SELECT COUNT(DISTINCT miasto) AS liczba_miast\nFROM klienci;'),
      ex('Suma (SUM)', 'SELECT SUM(stan_magazynowy) AS sztuk_w_magazynie\nFROM produkty;'),
      ex('Średnia (AVG + ROUND)', 'SELECT ROUND(AVG(cena), 2) AS srednia_cena\nFROM produkty;'),
      ex(
        'Minimum i maksimum',
        'SELECT MIN(pensja) AS najnizsza,\n       MAX(pensja) AS najwyzsza\nFROM pracownicy;',
      ),
      ex(
        'Grupowanie (GROUP BY)',
        'SELECT kategoria_id, COUNT(*) AS liczba_produktow\nFROM produkty\nGROUP BY kategoria_id;',
      ),
      ex(
        'Grupowanie po kilku kolumnach',
        'SELECT YEAR(data_zamowienia) AS rok, status, COUNT(*) AS liczba\nFROM zamowienia\nGROUP BY rok, status\nORDER BY rok, status;',
      ),
      ex(
        'Zamówienia w miesiącach',
        "SELECT DATE_FORMAT(data_zamowienia, '%Y-%m') AS miesiac, COUNT(*) AS liczba\nFROM zamowienia\nGROUP BY miesiac\nORDER BY miesiac;",
      ),
      ex(
        'Warunek dla grup (HAVING)',
        'SELECT miasto, COUNT(*) AS liczba\nFROM klienci\nGROUP BY miasto\nHAVING COUNT(*) >= 2;',
      ),
      ex(
        'WHERE + GROUP BY + HAVING',
        "-- WHERE filtruje wiersze PRZED grupowaniem, HAVING — grupy PO grupowaniu\nSELECT klient_id, COUNT(*) AS zamowien\nFROM zamowienia\nWHERE status <> 'anulowane'\nGROUP BY klient_id\nHAVING COUNT(*) > 2\nORDER BY zamowien DESC;",
      ),
      ex(
        'Lista w komórce (GROUP_CONCAT)',
        "SELECT miasto,\n       GROUP_CONCAT(nazwisko ORDER BY nazwisko SEPARATOR ', ') AS klienci\nFROM klienci\nGROUP BY miasto;",
      ),
      ex(
        'Podsumowanie (WITH ROLLUP)',
        '-- ostatni wiersz (NULL) to suma ze wszystkich grup\nSELECT kategoria_id, SUM(stan_magazynowy) AS sztuk\nFROM produkty\nGROUP BY kategoria_id WITH ROLLUP;',
      ),
    ],
  },
  {
    name: 'Złączenia (JOIN)',
    items: [
      ex(
        'Złączenie dwóch tabel',
        'SELECT produkty.nazwa, kategorie.nazwa\nFROM produkty\nJOIN kategorie ON produkty.kategoria_id = kategorie.id;',
      ),
      ex(
        'Aliasy tabel',
        'SELECT p.nazwa AS produkt, k.nazwa AS kategoria\nFROM produkty AS p\nJOIN kategorie AS k ON p.kategoria_id = k.id;',
      ),
      ex(
        'Złączenie w WHERE (stara składnia)',
        'SELECT p.nazwa, k.nazwa\nFROM produkty p, kategorie k\nWHERE p.kategoria_id = k.id;',
      ),
      ex(
        'Trzy tabele',
        "SELECT z.id, z.data_zamowienia,\n       CONCAT(k.imie, ' ', k.nazwisko) AS klient,\n       CONCAT(p.imie, ' ', p.nazwisko) AS obsluzyl\nFROM zamowienia z\nJOIN klienci k ON k.id = z.klient_id\nJOIN pracownicy p ON p.id = z.pracownik_id;",
      ),
      ex(
        'Cztery tabele',
        '-- kto kupił jaki produkt\nSELECT k.nazwisko, z.id AS zamowienie, pr.nazwa, pz.ilosc\nFROM klienci k\nJOIN zamowienia z ON z.klient_id = k.id\nJOIN pozycje_zamowienia pz ON pz.zamowienie_id = z.id\nJOIN produkty pr ON pr.id = pz.produkt_id\nORDER BY z.id;',
      ),
      ex(
        'Relacja wiele-do-wielu (n:m)',
        '-- produkty_promocje to tabela pośrednicząca\nSELECT pr.nazwa AS produkt, pm.nazwa AS promocja, pm.rabat_procent\nFROM produkty pr\nJOIN produkty_promocje pp ON pp.produkt_id = pr.id\nJOIN promocje pm ON pm.id = pp.promocja_id\nORDER BY pm.id;',
      ),
      ex(
        'LEFT JOIN (wszystkie z lewej)',
        '-- także produkt bez kategorii (kategoria = NULL)\nSELECT p.nazwa, k.nazwa AS kategoria\nFROM produkty p\nLEFT JOIN kategorie k ON k.id = p.kategoria_id;',
      ),
      ex(
        'LEFT JOIN — brak dopasowania',
        '-- klienci, którzy nic nie zamówili\nSELECT k.imie, k.nazwisko\nFROM klienci k\nLEFT JOIN zamowienia z ON z.klient_id = k.id\nWHERE z.id IS NULL;',
      ),
      ex(
        'RIGHT JOIN',
        '-- dostawcy bez żadnego produktu\nSELECT d.nazwa AS dostawca\nFROM produkty p\nRIGHT JOIN dostawcy d ON p.dostawca_id = d.id\nWHERE p.id IS NULL;',
      ),
      ex(
        'Samozłączenie (self join)',
        "-- pracownik i jego przełożony — ta sama tabela dwa razy\nSELECT CONCAT(p.imie, ' ', p.nazwisko) AS pracownik,\n       CONCAT(s.imie, ' ', s.nazwisko) AS przelozony\nFROM pracownicy p\nLEFT JOIN pracownicy s ON s.id = p.przelozony_id;",
      ),
      ex(
        'Złączenie po kolumnie, która nie jest kluczem',
        '-- zamowienia.sposob_dostawy = rodzaje_dostawy.nazwa\nSELECT z.id, z.sposob_dostawy, r.cena AS koszt_dostawy, r.czas_dni\nFROM zamowienia z\nJOIN rodzaje_dostawy r ON r.nazwa = z.sposob_dostawy;',
      ),
      ex(
        'Porównanie kolumn z dwóch tabel',
        '-- pracownicy zarabiający powyżej widełek stanowiska\nSELECT p.imie, p.nazwisko, p.pensja, s.nazwa, s.pensja_max\nFROM pracownicy p\nJOIN stanowiska s ON s.id = p.stanowisko_id\nWHERE p.pensja > s.pensja_max;',
      ),
      ex(
        'JOIN + GROUP BY',
        'SELECT k.nazwa AS kategoria, COUNT(p.id) AS liczba_produktow\nFROM kategorie k\nLEFT JOIN produkty p ON p.kategoria_id = k.id\nGROUP BY k.id, k.nazwa;',
      ),
      ex(
        'JOIN + SUM (wartość zamówień)',
        'SELECT z.id, SUM(pz.ilosc * pz.cena_jednostkowa) AS wartosc\nFROM zamowienia z\nJOIN pozycje_zamowienia pz ON pz.zamowienie_id = z.id\nGROUP BY z.id\nORDER BY wartosc DESC;',
      ),
      ex(
        'JOIN + HAVING',
        "-- klienci, którzy wydali ponad 3000 zł\nSELECT k.imie, k.nazwisko, SUM(pz.ilosc * pz.cena_jednostkowa) AS wydano\nFROM klienci k\nJOIN zamowienia z ON z.klient_id = k.id\nJOIN pozycje_zamowienia pz ON pz.zamowienie_id = z.id\nWHERE z.status <> 'anulowane'\nGROUP BY k.id, k.imie, k.nazwisko\nHAVING wydano > 3000\nORDER BY wydano DESC;",
      ),
    ],
  },
  {
    name: 'Podzapytania',
    items: [
      ex('Droższe niż średnia', 'SELECT nazwa, cena\nFROM produkty\nWHERE cena > (SELECT AVG(cena) FROM produkty);'),
      ex('Najdroższy produkt (= MAX)', 'SELECT nazwa, cena\nFROM produkty\nWHERE cena = (SELECT MAX(cena) FROM produkty);'),
      ex(
        'Należy do zbioru (IN)',
        "SELECT imie, nazwisko\nFROM klienci\nWHERE id IN (SELECT klient_id FROM zamowienia WHERE status = 'anulowane');",
      ),
      ex(
        'Nie należy do zbioru (NOT IN)',
        '-- produkty, których nikt nie zamówił\nSELECT nazwa\nFROM produkty\nWHERE id NOT IN (SELECT produkt_id FROM pozycje_zamowienia);',
      ),
      ex(
        'Istnieje (EXISTS)',
        'SELECT d.nazwa\nFROM dostawcy d\nWHERE EXISTS (SELECT 1 FROM produkty p WHERE p.dostawca_id = d.id AND p.cena > 2000);',
      ),
      ex(
        'Podzapytanie w SELECT',
        'SELECT nazwa, cena,\n       ROUND(cena - (SELECT AVG(cena) FROM produkty), 2) AS roznica_od_sredniej\nFROM produkty;',
      ),
      ex(
        'Podzapytanie skorelowane',
        '-- dla każdego klienta liczymy jego zamówienia\nSELECT k.imie, k.nazwisko,\n       (SELECT COUNT(*) FROM zamowienia z WHERE z.klient_id = k.id) AS liczba_zamowien\nFROM klienci k;',
      ),
      ex(
        'Tabela pochodna (podzapytanie w FROM)',
        '-- średnia wartość jednego zamówienia\nSELECT ROUND(AVG(wartosc), 2) AS srednia_wartosc\nFROM (\n  SELECT zamowienie_id, SUM(ilosc * cena_jednostkowa) AS wartosc\n  FROM pozycje_zamowienia\n  GROUP BY zamowienie_id\n) AS t;',
      ),
      ex(
        'Większe od wszystkich (ALL)',
        '-- produkty droższe od każdego produktu z kategorii Sport\nSELECT nazwa, cena\nFROM produkty\nWHERE cena > ALL (SELECT cena FROM produkty WHERE kategoria_id = 5);',
      ),
    ],
  },
  {
    name: 'Łączenie wyników (UNION)',
    items: [
      ex(
        'UNION (bez powtórzeń)',
        '-- miasta klientów i dostawców w jednej liście\nSELECT miasto FROM klienci\nUNION\nSELECT miasto FROM dostawcy\nORDER BY miasto;',
      ),
      ex(
        'UNION ALL (z powtórzeniami)',
        "SELECT 'klient' AS kto, imie, nazwisko FROM klienci\nUNION ALL\nSELECT 'pracownik', imie, nazwisko FROM pracownicy;",
      ),
    ],
  },
  {
    name: 'Dodawanie danych (INSERT)',
    items: [
      ex(
        'Jeden wiersz',
        "-- id pomijamy — nada je AUTO_INCREMENT\nINSERT INTO klienci (imie, nazwisko, plec, email, miasto, data_rejestracji)\nVALUES ('Ola', 'Mazur', 'K', 'ola.m@example.pl', 'Lublin', CURDATE());",
      ),
      ex('Kilka wierszy naraz', "INSERT INTO kategorie (nazwa)\nVALUES ('Motoryzacja'), ('Muzyka'), ('Ogród zimowy');"),
      ex(
        'Wartość losowa (RAND)',
        '-- ocena losowa od 1 do 5\nINSERT INTO opinie (produkt_id, klient_id, ocena, data_dodania)\nVALUES (13, 5, FLOOR(RAND() * 5 + 1), CURDATE());',
      ),
      ex(
        'Data i czas bieżący',
        "INSERT INTO promocje (nazwa, rabat_procent, data_od, data_do)\nVALUES ('Promocja tygodnia', 15, CURDATE(), CURDATE() + INTERVAL 7 DAY);",
      ),
      ex(
        'INSERT … SELECT',
        '-- wszystkie książki trafiają do promocji nr 5\nINSERT INTO produkty_promocje (produkt_id, promocja_id)\nSELECT id, 5 FROM produkty WHERE kategoria_id = 3;',
      ),
    ],
  },
  {
    name: 'Zmiana danych (UPDATE)',
    items: [
      ex('Jeden wiersz', "UPDATE klienci\nSET telefon = '600700800'\nWHERE id = 2;"),
      ex('Kilka kolumn', "UPDATE klienci\nSET miasto = 'Sopot', telefon = '600111222'\nWHERE email = 'zofia.kozlowska@example.pl';"),
      ex('Podwyżka o 5%', 'UPDATE pracownicy\nSET pensja = pensja * 1.05\nWHERE stanowisko_id = 3;'),
      ex('Zwiększenie o wartość', "UPDATE klienci\nSET punkty = punkty + 100\nWHERE miasto = 'Warszawa';"),
      ex(
        'Bieżąca data + IN',
        "UPDATE zamowienia\nSET status = 'wysłane', data_wysylki = CURDATE()\nWHERE id IN (52, 53);",
      ),
      ex(
        'UPDATE ze złączeniem',
        "-- 10% taniej wszystkie książki (warunek na nazwie kategorii)\nUPDATE produkty p\nJOIN kategorie k ON k.id = p.kategoria_id\nSET p.cena = ROUND(p.cena * 0.9, 2)\nWHERE k.nazwa = 'Książki';",
      ),
      ex('Ustawienie NULL', 'UPDATE klienci\nSET telefon = NULL\nWHERE id = 1;'),
    ],
  },
  {
    name: 'Usuwanie danych (DELETE)',
    items: [
      ex('Jeden wiersz', 'DELETE FROM opinie\nWHERE id = 1;'),
      ex('Z warunkiem', 'DELETE FROM opinie\nWHERE ocena = 1;'),
      ex(
        'Usuwanie kaskadowe',
        '-- pozycje tego zamówienia usuną się same (ON DELETE CASCADE)\nDELETE FROM zamowienia\nWHERE id = 54;',
      ),
      ex(
        'Z podzapytaniem',
        '-- klienci bez zamówień\nDELETE FROM klienci\nWHERE id NOT IN (SELECT klient_id FROM zamowienia);',
      ),
      ex('Błąd klucza obcego', '-- klient 1 ma zamówienia — MySQL nie pozwoli go usunąć\nDELETE FROM klienci\nWHERE id = 1;'),
    ],
  },
  {
    name: 'Struktura tabel (CREATE / ALTER / DROP)',
    items: [
      ex(
        'Nowa tabela z kluczem obcym',
        `
CREATE TABLE reklamacje (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  zamowienie_id   INT UNSIGNED NOT NULL,
  opis            TEXT,
  data_zgloszenia DATE NOT NULL,
  rozpatrzona     TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (zamowienie_id) REFERENCES zamowienia(id)
);

DESCRIBE reklamacje;`,
      ),
      ex('Dodaj kolumnę (ADD COLUMN)', 'ALTER TABLE klienci ADD COLUMN nip VARCHAR(10);\n\nDESCRIBE klienci;'),
      ex(
        'Dodaj kolumnę w wybranym miejscu',
        'ALTER TABLE produkty\nADD COLUMN gwarancja TINYINT UNSIGNED NOT NULL DEFAULT 24 AFTER cena;\n\nSELECT nazwa, cena, gwarancja FROM produkty;',
      ),
      ex(
        'Zmień nazwę i typ (CHANGE COLUMN)',
        '-- CHANGE COLUMN stara_nazwa nowa_nazwa TYP\nALTER TABLE pracownicy CHANGE COLUMN telefon nr_telefonu VARCHAR(20);\n\nDESCRIBE pracownicy;',
      ),
      ex(
        'Zmień tylko typ (MODIFY COLUMN)',
        '-- uwaga: trzeba powtórzyć NOT NULL, inaczej kolumna stanie się NULL-owalna\nALTER TABLE dostawcy MODIFY COLUMN nazwa VARCHAR(150) NOT NULL;\n\nDESCRIBE dostawcy;',
      ),
      ex(
        'Zmień tylko nazwę (RENAME COLUMN)',
        'ALTER TABLE pracownicy RENAME COLUMN pensja TO wynagrodzenie;\n\nDESCRIBE pracownicy;',
      ),
      ex('Usuń kolumnę (DROP COLUMN)', 'ALTER TABLE klienci DROP COLUMN punkty;\n\nDESCRIBE klienci;'),
      ex(
        'Dodaj klucz obcy',
        '-- rodzaje_dostawy.nazwa jest UNIQUE, więc może być celem klucza obcego\nALTER TABLE zamowienia\nADD CONSTRAINT fk_dostawa FOREIGN KEY (sposob_dostawy) REFERENCES rodzaje_dostawy(nazwa);\n\nSHOW CREATE TABLE zamowienia;',
      ),
      ex(
        'Indeks i unikalność',
        'CREATE INDEX idx_nazwisko ON klienci (nazwisko);\nALTER TABLE dostawcy ADD UNIQUE (email);\n\nSHOW INDEX FROM klienci;',
      ),
      ex('Zmień nazwę tabeli', 'RENAME TABLE opinie TO recenzje;\n\nSHOW TABLES;'),
      ex(
        'Widok (CREATE VIEW)',
        'CREATE VIEW produkty_z_kategoria AS\nSELECT p.id, p.nazwa, p.cena, k.nazwa AS kategoria\nFROM produkty p\nLEFT JOIN kategorie k ON k.id = p.kategoria_id;\n\nSELECT * FROM produkty_z_kategoria;',
      ),
      ex(
        'Usuń tabelę (DROP TABLE)',
        'CREATE TABLE tymczasowa (id INT);\nDROP TABLE IF EXISTS tymczasowa;\n\nSHOW TABLES;',
      ),
    ],
  },
  {
    name: 'Użytkownicy i uprawnienia',
    items: [
      ex('Utwórz użytkownika', "CREATE USER 'anna'@'localhost' IDENTIFIED BY 'Anna123!';"),
      ex(
        'Prawo odczytu tabeli',
        "CREATE USER 'jan'@'localhost' IDENTIFIED BY 'Jan2024';\nGRANT SELECT ON sklep.produkty TO 'jan'@'localhost';\n\nSHOW GRANTS FOR 'jan'@'localhost';",
      ),
      ex(
        'Kilka praw naraz',
        "CREATE USER 'sprzedawca1'@'localhost' IDENTIFIED BY 'Sprzedaz1';\nGRANT SELECT, INSERT, UPDATE ON sklep.zamowienia TO 'sprzedawca1'@'localhost';\n\nSHOW GRANTS FOR 'sprzedawca1'@'localhost';",
      ),
      ex(
        'Prawa do całej bazy (sklep.*)',
        "CREATE USER 'analityk'@'localhost' IDENTIFIED BY 'Dane2025';\nGRANT SELECT ON sklep.* TO 'analityk'@'localhost';\n\nSHOW GRANTS FOR 'analityk'@'localhost';",
      ),
      ex(
        'Wszystkie prawa (ALL PRIVILEGES)',
        "CREATE USER 'kierownik'@'localhost' IDENTIFIED BY 'Szef!123';\nGRANT ALL PRIVILEGES ON sklep.* TO 'kierownik'@'localhost';\n\nSHOW GRANTS FOR 'kierownik'@'localhost';",
      ),
      ex(
        'Prawa do wybranych kolumn',
        "CREATE USER 'stazysta'@'localhost' IDENTIFIED BY 'Staz2025';\nGRANT SELECT (imie, nazwisko, miasto), UPDATE (telefon) ON sklep.klienci TO 'stazysta'@'localhost';\n\nSHOW GRANTS FOR 'stazysta'@'localhost';",
      ),
      ex(
        'Prawa do zmiany struktury',
        "CREATE USER 'programista'@'localhost' IDENTIFIED BY 'Kod#2025';\nGRANT CREATE, ALTER, DROP, INDEX ON sklep.* TO 'programista'@'localhost';\n\nSHOW GRANTS FOR 'programista'@'localhost';",
      ),
      ex(
        'Przekazywanie praw (WITH GRANT OPTION)',
        "CREATE USER 'admin_sklepu'@'localhost' IDENTIFIED BY 'Admin2025';\nGRANT SELECT, INSERT ON sklep.* TO 'admin_sklepu'@'localhost' WITH GRANT OPTION;\n\nSHOW GRANTS FOR 'admin_sklepu'@'localhost';",
      ),
      ex(
        'Odebranie prawa (REVOKE)',
        "CREATE USER 'marek'@'localhost' IDENTIFIED BY 'Marek123';\nGRANT SELECT, DELETE ON sklep.opinie TO 'marek'@'localhost';\nREVOKE DELETE ON sklep.opinie FROM 'marek'@'localhost';\n\nSHOW GRANTS FOR 'marek'@'localhost';",
      ),
      ex(
        'Zmiana hasła',
        "CREATE USER 'ewa'@'localhost' IDENTIFIED BY 'StareHaslo1';\nALTER USER 'ewa'@'localhost' IDENTIFIED BY 'NoweHaslo1';",
      ),
      ex(
        'Zmiana nazwy konta',
        "CREATE USER 'tomek'@'localhost' IDENTIFIED BY 'Tomek123';\nRENAME USER 'tomek'@'localhost' TO 'tomasz'@'localhost';\n\nSHOW GRANTS FOR 'tomasz'@'localhost';",
      ),
      ex(
        'Usunięcie użytkownika',
        "CREATE USER 'tymczasowy'@'localhost' IDENTIFIED BY 'Temp1234';\nDROP USER 'tymczasowy'@'localhost';",
      ),
      ex(
        'Role (CREATE ROLE)',
        "CREATE ROLE 'rola_sprzedawcy';\nGRANT SELECT, INSERT, UPDATE ON sklep.zamowienia TO 'rola_sprzedawcy';\n\nCREATE USER 'kasia'@'localhost' IDENTIFIED BY 'Kasia123';\nGRANT 'rola_sprzedawcy' TO 'kasia'@'localhost';\n\nSHOW GRANTS FOR 'kasia'@'localhost' USING 'rola_sprzedawcy';",
      ),
      ex('Uprawnienia własnego konta', 'SHOW GRANTS;'),
    ],
  },
]
