// Generator bazy startowej server/seed.sql.
// Dane są deterministyczne (stałe ziarno losowania), więc wyniki zadań są zawsze takie same.
// Uruchomienie po zmianach:  node server/generate-seed.js
import fs from 'node:fs'

function mulberry32(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(2024)
const randInt = (min, max) => min + Math.floor(rand() * (max - min + 1))
const pick = (arr) => arr[Math.floor(rand() * arr.length)]

const sqlValue = (v) => {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2)
  return `'${String(v).replace(/'/g, "''")}'`
}
const insert = (table, columns, rows) =>
  `INSERT INTO ${table} (${columns.join(', ')}) VALUES\n` +
  rows.map((r) => `  (${r.map(sqlValue).join(', ')})`).join(',\n') +
  ';\n'

const addDays = (iso, days) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

// ---------- Dane stałe ----------

const kategorie = [
  [1, 'Elektronika'],
  [2, 'Komputery'],
  [3, 'Książki'],
  [4, 'Dom i ogród'],
  [5, 'Sport'],
  [6, 'Zabawki'],
  [7, 'Moda'],
  [8, 'Zdrowie i uroda'],
]

const dostawcy = [
  [1, 'TechPol Sp. z o.o.', 'Warszawa', 'Polska', 'biuro@techpol.example.pl', '221234567'],
  [2, 'MegaBooks', 'Kraków', 'Polska', 'zamowienia@megabooks.example.pl', '124567890'],
  [3, 'Home&Garden GmbH', 'Berlin', 'Niemcy', 'sales@homegarden.example.de', null],
  [4, 'SportMax', 'Poznań', 'Polska', 'kontakt@sportmax.example.pl', '618765432'],
  [5, 'ToyWorld s.r.o.', 'Praga', 'Czechy', 'info@toyworld.example.cz', null],
  [6, 'FashionHub', 'Łódź', 'Polska', 'hurt@fashionhub.example.pl', '426543210'],
  [7, 'ElectroAsia Ltd.', 'Shenzhen', 'Chiny', 'export@electroasia.example.cn', null],
  [8, 'ZdrowieNatura', 'Gdańsk', 'Polska', 'sklep@zdrowienatura.example.pl', '583456789'],
]

// id, nazwa, kategoria_id, dostawca_id, cena, stan_magazynowy, stan_minimalny, data_dodania, aktywny
const produkty = [
  [1, 'Smartfon Galaxy A54', 1, 1, 1699.0, 25, 5, '2023-03-10', 1],
  [2, 'Słuchawki bezprzewodowe', 1, 7, 249.99, 60, 10, '2023-03-10', 1],
  [3, 'Smartwatch FitPro', 1, 7, 599.0, 3, 5, '2024-02-01', 1],
  [4, 'Głośnik Bluetooth', 1, 7, 179.9, 40, 10, '2023-06-20', 1],
  [5, 'Telewizor 55" 4K', 1, 1, 2899.0, 6, 3, '2024-09-15', 1],
  [6, 'Laptop ThinkPad E14', 2, 1, 3899.0, 8, 3, '2023-01-20', 1],
  [7, 'Klawiatura mechaniczna', 2, 7, 349.0, 30, 10, '2023-01-20', 1],
  [8, 'Mysz bezprzewodowa', 2, 7, 89.99, 0, 15, '2023-01-20', 1],
  [9, 'Monitor 27" IPS', 2, 1, 1149.0, 12, 4, '2024-04-05', 1],
  [10, 'Dysk SSD 1TB', 2, 7, 329.0, 2, 8, '2024-11-12', 1],
  [11, 'Wiedźmin: Ostatnie życzenie', 3, 2, 39.9, 120, 20, '2023-01-05', 1],
  [12, 'Pan Tadeusz', 3, 2, 24.99, 80, 20, '2023-01-05', 1],
  [13, 'SQL. Leksykon kieszonkowy', 3, 2, 49.0, 15, 5, '2023-05-18', 1],
  [14, 'Lalka', 3, 2, 29.99, 0, 10, '2023-01-05', 0],
  [15, 'Kurs PHP i MySQL', 3, 2, 79.0, 22, 5, '2025-02-14', 1],
  [16, 'Solaris', 3, 2, 34.9, 18, 5, '2026-09-01', 1],
  [17, 'Ekspres do kawy', 4, 3, 1299.0, 12, 3, '2023-08-01', 1],
  [18, 'Zestaw garnków', 4, 3, 459.0, 20, 5, '2023-08-01', 1],
  [19, 'Lampa biurkowa LED', 4, 3, 129.99, 0, 5, '2023-08-01', 0],
  [20, 'Kosiarka elektryczna', 4, 3, 899.0, 7, 2, '2024-03-25', 1],
  [21, 'Odkurzacz bezprzewodowy', 4, 3, 1099.0, 9, 3, '2025-01-15', 1],
  [22, 'Rower górski', 5, 4, 2499.0, 5, 2, '2023-04-01', 1],
  [23, 'Mata do jogi', 5, 4, 89.99, 70, 10, '2023-04-01', 1],
  [24, 'Hantle 2x5 kg', 5, 4, 119.0, 40, 10, '2023-04-01', 1],
  [25, 'Piłka nożna', 5, 4, 99.0, 55, 15, '2024-05-20', 1],
  [26, 'Namiot 3-osobowy', 5, 4, 649.0, 4, 5, '2024-05-20', 1],
  [27, 'Klocki konstrukcyjne', 6, 5, 199.99, 35, 10, '2023-10-01', 1],
  [28, 'Puzzle 1000 elementów', 6, 5, 59.99, 0, 5, '2023-10-01', 1],
  [29, 'Gra planszowa Kolejka', 6, 5, 139.0, 16, 5, '2024-10-10', 1],
  [30, 'Lalka interaktywna', 6, 5, 249.0, 11, 3, '2025-11-01', 1],
  [31, 'Kurtka zimowa', 7, 6, 459.0, 14, 4, '2024-10-01', 1],
  [32, 'Buty sportowe', 7, 6, 329.0, 25, 6, '2024-03-01', 1],
  [33, 'Plecak miejski', 7, 6, 149.0, 30, 8, '2025-08-15', 1],
  [34, 'Karta podarunkowa 100 zł', null, null, 100.0, 999, 0, '2023-01-01', 1],
  [35, 'Krem nawilżający', 8, 6, 45.5, 50, 10, '2026-10-20', 1],
]
const neverOrdered = new Set([16, 28, 35])

// id, imie, nazwisko, plec, email, telefon, miasto, data_urodzenia, data_rejestracji
const klienci = [
  [1, 'Anna', 'Kowalska', 'K', 'anna.kowalska@example.pl', '501234567', 'Warszawa', '1990-04-12', '2023-01-15'],
  [2, 'Jan', 'Nowak', 'M', 'jan.nowak@example.pl', null, 'Kraków', '1985-11-03', '2023-02-03'],
  [3, 'Katarzyna', 'Wiśniewska', 'K', 'k.wisniewska@example.pl', '502345678', 'Gdańsk', '1998-07-21', '2023-03-21'],
  [4, 'Piotr', 'Wójcik', 'M', 'piotr.wojcik@example.pl', '503456789', 'Wrocław', '1979-01-30', '2023-04-10'],
  [5, 'Magdalena', 'Kamińska', 'K', 'magda.kaminska@example.pl', null, 'Warszawa', '2001-09-09', '2023-05-05'],
  [6, 'Tomasz', 'Lewandowski', 'M', 't.lewandowski@example.pl', '504567890', 'Poznań', '1993-03-17', '2023-06-18'],
  [7, 'Agnieszka', 'Zielińska', 'K', 'aga.zielinska@example.pl', '505678901', 'Łódź', '1988-12-24', '2023-07-22'],
  [8, 'Michał', 'Szymański', 'M', 'michal.szymanski@example.pl', null, 'Kraków', '2003-05-02', '2023-09-01'],
  [9, 'Ewa', 'Woźniak', 'K', 'ewa.wozniak@example.pl', '506789012', 'Katowice', '1975-08-14', '2023-10-14'],
  [10, 'Krzysztof', 'Dąbrowski', 'M', 'k.dabrowski@example.pl', '507890123', null, '1969-02-11', '2024-01-08'],
  [11, 'Zofia', 'Kozłowska', 'K', 'zofia.kozlowska@example.pl', '508901234', 'Gdańsk', '2005-06-30', '2024-02-29'],
  [12, 'Paweł', 'Jankowski', 'M', 'pawel.jankowski@example.pl', null, 'Szczecin', null, '2024-03-17'],
  [13, 'Aleksandra', 'Mazur', 'K', 'ola.mazur@example.pl', '509012345', 'Lublin', '1996-10-05', '2024-04-02'],
  [14, 'Mateusz', 'Krawczyk', 'M', 'mateusz.krawczyk@example.pl', '510123456', 'Warszawa', '1991-12-12', '2024-05-19'],
  [15, 'Julia', 'Piotrowska', 'K', 'julia.piotrowska@example.pl', null, 'Katowice', '2004-03-08', '2024-06-11'],
  [16, 'Jakub', 'Grabowski', 'M', 'jakub.grabowski@example.pl', '511234567', 'Bydgoszcz', '1983-07-27', '2024-07-30'],
  [17, 'Natalia', 'Nowakowska', 'K', 'natalia.nowakowska@example.pl', '512345678', 'Kraków', '1999-01-19', '2024-09-03'],
  [18, 'Wojciech', 'Pawłowski', 'M', 'w.pawlowski@example.pl', '513456789', 'Rzeszów', '1972-04-04', '2024-10-21'],
  [19, 'Maria', 'Michalska', 'K', 'maria.michalska@example.pl', null, 'Warszawa', '1965-09-15', '2025-01-12'],
  [20, 'Kacper', 'Wróblewski', 'M', 'kacper.wroblewski@example.pl', '514567890', 'Białystok', '2006-11-11', '2025-03-08'],
  [21, 'Karolina', 'Jasińska', 'K', 'karolina.jasinska@example.pl', '515678901', 'Gdynia', '1994-02-28', '2025-06-25'],
  [22, 'Łukasz', 'Kaczmarczyk', 'M', 'lukasz.k@example.pl', '516789012', 'Toruń', '1987-08-08', '2025-09-14'],
  [23, 'Dominika', 'Wieczorek', 'K', 'dominika.wieczorek@example.pl', null, 'Opole', '2002-12-01', '2026-02-10'],
  [24, 'Szymon', 'Zając', 'M', 'szymon.zajac@example.pl', '517890123', 'Kielce', null, '2026-08-19'],
  [25, 'Emilia', 'Król', 'K', 'emilia.krol@example.pl', '518901234', 'Wrocław', '2000-05-25', '2026-10-30'],
]
const buyers = klienci.slice(0, 22).map((k) => k[0])

const stanowiska = [
  [1, 'Prezes', 15000, 25000],
  [2, 'Kierownik sklepu', 8000, 11000],
  [3, 'Sprzedawca', 4600, 6500],
  [4, 'Magazynier', 4600, 6000],
  [5, 'Księgowy', 6000, 9000],
  [6, 'Informatyk', 7000, 14000],
]

// id, imie, nazwisko, stanowisko_id, przelozony_id, pensja, data_zatrudnienia, miasto, telefon
const pracownicy = [
  [1, 'Marek', 'Zieliński', 1, null, 18500, '2015-03-01', 'Warszawa', '600100100'],
  [2, 'Joanna', 'Kaczmarek', 2, 1, 9800, '2017-06-15', 'Warszawa', '600100101'],
  [3, 'Adam', 'Mazur', 2, 1, 12500, '2018-01-10', 'Piaseczno', '600100102'],
  [4, 'Ewelina', 'Krawczyk', 3, 2, 5200, '2019-04-01', 'Warszawa', '600100103'],
  [5, 'Bartosz', 'Wróbel', 3, 2, 4800, '2021-09-01', 'Pruszków', null],
  [6, 'Natalia', 'Jabłońska', 3, 3, 6900, '2016-05-16', 'Warszawa', '600100105'],
  [7, 'Kamil', 'Pawlak', 3, 3, 4300, '2024-01-02', 'Legionowo', '600100106'],
  [8, 'Oliwia', 'Michalska', 3, 2, 5600, '2023-02-01', 'Warszawa', '600100107'],
  [9, 'Dawid', 'Nowicki', 4, 3, 4900, '2020-10-12', 'Ząbki', null],
  [10, 'Sebastian', 'Adamczyk', 4, 3, 5100, '2019-07-08', 'Warszawa', '600100109'],
  [11, 'Monika', 'Dudek', 5, 1, 8200, '2016-11-21', 'Warszawa', '600100110'],
  [12, 'Rafał', 'Wieczorek', 6, 1, 11200, '2020-02-17', 'Otwock', '600100111'],
  [13, 'Patrycja', 'Sikora', 3, 2, 5000, '2025-03-01', 'Warszawa', '600100112'],
  [14, 'Hubert', 'Baran', 4, 3, 4700, '2026-07-01', 'Marki', null],
  [15, 'Weronika', 'Górska', 3, 2, 4650, '2026-10-01', 'Warszawa', '600100114'],
]
const sellers = [4, 5, 6, 7, 8, 13]

const rodzajeDostawy = [
  [1, 'Kurier', 16.99, 2],
  [2, 'Paczkomat', 12.99, 2],
  [3, 'Poczta Polska', 9.99, 4],
  [4, 'Odbiór osobisty', 0.0, 1],
  [5, 'Kurier ekspres', 29.99, 1],
]

const promocje = [
  [1, 'Black Friday 2025', 20, '2025-11-24', '2025-11-30'],
  [2, 'Wyprzedaż zimowa', 30, '2026-01-02', '2026-01-31'],
  [3, 'Dzień Dziecka', 15, '2026-05-25', '2026-06-01'],
  [4, 'Powrót do szkoły', 10, '2026-08-20', '2026-09-10'],
  [5, 'Jesienne rabaty', 25, '2026-10-15', '2026-11-30'],
]
const produktyPromocje = [
  [1, 1], [2, 1], [5, 1], [6, 1], [9, 1], [17, 1], [21, 1],
  [31, 2], [32, 2], [26, 2], [22, 2],
  [27, 3], [29, 3], [30, 3], [25, 3],
  [7, 4], [8, 4], [13, 4], [15, 4], [33, 4],
  [2, 5], [4, 5], [18, 5], [23, 5], [31, 5],
]

// ---------- Dane generowane ----------

const productById = Object.fromEntries(produkty.map((p) => [p[0], p]))
const orderable = produkty.filter((p) => !neverOrdered.has(p[0])).map((p) => p[0])

function priceOn(productId, date) {
  const base = productById[productId][4]
  const promo = produktyPromocje
    .filter(([pid]) => pid === productId)
    .map(([, promoId]) => promocje.find((p) => p[0] === promoId))
    .find((p) => date >= p[3] && date <= p[4])
  return promo ? Math.round(base * (100 - promo[2])) / 100 : base
}

const start = new Date('2024-01-05T00:00:00Z').getTime()
const recent = new Date('2026-10-05T00:00:00Z').getTime()
const end = new Date('2026-11-06T00:00:00Z').getTime()
const randomDate = (from, to) => new Date(from + rand() * (to - from)).toISOString().slice(0, 10)
// 44 zamówienia z ostatnich lat + 10 świeżych (różne statusy realizacji)
const orderDates = [
  ...Array.from({ length: 44 }, () => randomDate(start, recent)),
  ...Array.from({ length: 10 }, () => randomDate(recent, end)),
].sort()

const zamowienia = []
const pozycje = []
const purchases = [] // [klient_id, produkt_id, data] — do generowania opinii
orderDates.forEach((date, i) => {
  const id = i + 1
  // pierwszych 22 klientów kupuje co najmniej raz; potem losowo
  const klientId = i < buyers.length ? buyers[(i * 7) % buyers.length] : pick(buyers)
  const age = (end - new Date(`${date}T00:00:00Z`).getTime()) / 86400000
  let status
  const fromEnd = orderDates.length - i
  if (fromEnd <= 3) status = ['nowe', 'nowe', 'opłacone'][fromEnd - 1]
  else if (age < 6) status = pick(['nowe', 'opłacone'])
  else if (age < 15) status = pick(['opłacone', 'wysłane'])
  else if (age < 30) status = pick(['wysłane', 'dostarczone'])
  else status = rand() < 0.1 ? 'anulowane' : 'dostarczone'
  const shipped = status === 'wysłane' || status === 'dostarczone' ? addDays(date, randInt(1, 3)) : null
  const dostawa = pick(rodzajeDostawy)[1]
  const pracownik = rand() < 0.25 ? null : pick(sellers)
  zamowienia.push([id, klientId, pracownik, date, shipped, status, dostawa])

  const count = randInt(1, 4)
  const chosen = new Set()
  while (chosen.size < count) chosen.add(pick(orderable))
  for (const pid of chosen) {
    const isBook = productById[pid][2] === 3
    const ilosc = isBook ? randInt(1, 4) : rand() < 0.8 ? 1 : 2
    pozycje.push([pozycje.length + 1, id, pid, ilosc, priceOn(pid, date)])
    if (status !== 'anulowane') purchases.push([klientId, pid, date])
  }
})

const tresci = {
  5: ['Rewelacja, polecam!', 'Najlepszy zakup w tym roku.', 'Wszystko zgodnie z opisem, szybka wysyłka.', null],
  4: ['Bardzo dobry produkt.', 'Dobra jakość w tej cenie.', 'Jestem zadowolony, drobne zastrzeżenia.', null],
  3: ['Przeciętny, spodziewałem się więcej.', 'Może być.', null],
  2: ['Słaba jakość wykonania.', 'Nie polecam, długa dostawa.'],
  1: ['Produkt uszkodzony, zwrot.', 'Zupełnie niezgodny z opisem!'],
}
const opinie = []
const seenPairs = new Set()
for (const [klientId, pid, date] of purchases) {
  const key = `${klientId}-${pid}`
  if (seenPairs.has(key) || rand() < 0.35) continue
  seenPairs.add(key)
  const r = rand()
  const ocena = r < 0.45 ? 5 : r < 0.75 ? 4 : r < 0.87 ? 3 : r < 0.95 ? 2 : 1
  opinie.push([opinie.length + 1, pid, klientId, ocena, pick(tresci[ocena]), addDays(date, randInt(3, 20))])
}

// punkty lojalnościowe: 1 pkt za każde wydane 10 zł (bez zamówień anulowanych)
const spent = {}
for (const [, zid, , ilosc, cena] of pozycje) {
  const z = zamowienia[zid - 1]
  if (z[5] !== 'anulowane') spent[z[1]] = (spent[z[1]] ?? 0) + ilosc * cena
}
const klienciRows = klienci.map((k) => [...k, Math.floor((spent[k[0]] ?? 0) / 10)])

// ---------- Wynik ----------

const schema = `-- Baza startowa "sklep" — sklep internetowy.
-- PLIK WYGENEROWANY przez server/generate-seed.js — zmieniaj dane w generatorze, nie tutaj.
-- Wykonywana dla każdego ucznia przy pierwszym wejściu oraz po kliknięciu "Resetuj bazę danych".

CREATE TABLE kategorie (
  id    INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nazwa VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE dostawcy (
  id      INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nazwa   VARCHAR(100) NOT NULL,
  miasto  VARCHAR(50) NOT NULL,
  kraj    VARCHAR(50) NOT NULL DEFAULT 'Polska',
  email   VARCHAR(100),
  telefon VARCHAR(15)
);

CREATE TABLE produkty (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nazwa           VARCHAR(100) NOT NULL,
  kategoria_id    INT UNSIGNED,
  dostawca_id     INT UNSIGNED,
  cena            DECIMAL(10,2) NOT NULL CHECK (cena >= 0),
  stan_magazynowy INT NOT NULL DEFAULT 0,
  stan_minimalny  INT NOT NULL DEFAULT 0,
  data_dodania    DATE NOT NULL,
  aktywny         TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (kategoria_id) REFERENCES kategorie(id),
  FOREIGN KEY (dostawca_id) REFERENCES dostawcy(id)
);

CREATE TABLE klienci (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  imie             VARCHAR(50)  NOT NULL,
  nazwisko         VARCHAR(50)  NOT NULL,
  plec             ENUM('K', 'M') NOT NULL,
  email            VARCHAR(100) NOT NULL UNIQUE,
  telefon          VARCHAR(15),
  miasto           VARCHAR(50),
  data_urodzenia   DATE,
  data_rejestracji DATE NOT NULL,
  punkty           INT NOT NULL DEFAULT 0
);

CREATE TABLE stanowiska (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nazwa      VARCHAR(50) NOT NULL UNIQUE,
  pensja_min DECIMAL(10,2) NOT NULL,
  pensja_max DECIMAL(10,2) NOT NULL
);

CREATE TABLE pracownicy (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  imie              VARCHAR(50) NOT NULL,
  nazwisko          VARCHAR(50) NOT NULL,
  stanowisko_id     INT UNSIGNED NOT NULL,
  przelozony_id     INT UNSIGNED,
  pensja            DECIMAL(10,2) NOT NULL,
  data_zatrudnienia DATE NOT NULL,
  miasto            VARCHAR(50),
  telefon           VARCHAR(15),
  FOREIGN KEY (stanowisko_id) REFERENCES stanowiska(id),
  FOREIGN KEY (przelozony_id) REFERENCES pracownicy(id)
);

CREATE TABLE rodzaje_dostawy (
  id       INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nazwa    VARCHAR(30) NOT NULL UNIQUE,
  cena     DECIMAL(6,2) NOT NULL,
  czas_dni TINYINT UNSIGNED NOT NULL
);

-- Uwaga: zamowienia.sposob_dostawy łączy się z rodzaje_dostawy.nazwa (złączenie po kolumnie, która nie jest kluczem)
CREATE TABLE zamowienia (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  klient_id       INT UNSIGNED NOT NULL,
  pracownik_id    INT UNSIGNED,
  data_zamowienia DATE NOT NULL,
  data_wysylki    DATE,
  status          ENUM('nowe', 'opłacone', 'wysłane', 'dostarczone', 'anulowane') NOT NULL DEFAULT 'nowe',
  sposob_dostawy  VARCHAR(30) NOT NULL,
  FOREIGN KEY (klient_id) REFERENCES klienci(id),
  FOREIGN KEY (pracownik_id) REFERENCES pracownicy(id)
);

CREATE TABLE pozycje_zamowienia (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  zamowienie_id    INT UNSIGNED NOT NULL,
  produkt_id       INT UNSIGNED NOT NULL,
  ilosc            INT NOT NULL CHECK (ilosc > 0),
  cena_jednostkowa DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (zamowienie_id) REFERENCES zamowienia(id) ON DELETE CASCADE,
  FOREIGN KEY (produkt_id) REFERENCES produkty(id)
);

CREATE TABLE opinie (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  produkt_id   INT UNSIGNED NOT NULL,
  klient_id    INT UNSIGNED NOT NULL,
  ocena        TINYINT NOT NULL CHECK (ocena BETWEEN 1 AND 5),
  tresc        VARCHAR(255),
  data_dodania DATE NOT NULL,
  FOREIGN KEY (produkt_id) REFERENCES produkty(id),
  FOREIGN KEY (klient_id) REFERENCES klienci(id)
);

CREATE TABLE promocje (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nazwa         VARCHAR(100) NOT NULL,
  rabat_procent TINYINT UNSIGNED NOT NULL,
  data_od       DATE NOT NULL,
  data_do       DATE NOT NULL
);

-- Tabela pośrednicząca (relacja wiele-do-wielu: produkty <-> promocje)
CREATE TABLE produkty_promocje (
  produkt_id  INT UNSIGNED NOT NULL,
  promocja_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (produkt_id, promocja_id),
  FOREIGN KEY (produkt_id) REFERENCES produkty(id),
  FOREIGN KEY (promocja_id) REFERENCES promocje(id)
);
`

const data = [
  insert('kategorie', ['id', 'nazwa'], kategorie),
  insert('dostawcy', ['id', 'nazwa', 'miasto', 'kraj', 'email', 'telefon'], dostawcy),
  insert(
    'produkty',
    ['id', 'nazwa', 'kategoria_id', 'dostawca_id', 'cena', 'stan_magazynowy', 'stan_minimalny', 'data_dodania', 'aktywny'],
    produkty,
  ),
  insert(
    'klienci',
    ['id', 'imie', 'nazwisko', 'plec', 'email', 'telefon', 'miasto', 'data_urodzenia', 'data_rejestracji', 'punkty'],
    klienciRows,
  ),
  insert('stanowiska', ['id', 'nazwa', 'pensja_min', 'pensja_max'], stanowiska),
  insert(
    'pracownicy',
    ['id', 'imie', 'nazwisko', 'stanowisko_id', 'przelozony_id', 'pensja', 'data_zatrudnienia', 'miasto', 'telefon'],
    pracownicy,
  ),
  insert('rodzaje_dostawy', ['id', 'nazwa', 'cena', 'czas_dni'], rodzajeDostawy),
  insert(
    'zamowienia',
    ['id', 'klient_id', 'pracownik_id', 'data_zamowienia', 'data_wysylki', 'status', 'sposob_dostawy'],
    zamowienia,
  ),
  insert('pozycje_zamowienia', ['id', 'zamowienie_id', 'produkt_id', 'ilosc', 'cena_jednostkowa'], pozycje),
  insert('opinie', ['id', 'produkt_id', 'klient_id', 'ocena', 'tresc', 'data_dodania'], opinie),
  insert('promocje', ['id', 'nazwa', 'rabat_procent', 'data_od', 'data_do'], promocje),
  insert('produkty_promocje', ['produkt_id', 'promocja_id'], produktyPromocje),
]

fs.writeFileSync(new URL('./seed.sql', import.meta.url), `${schema}\n${data.join('\n')}`)
console.log(
  `seed.sql: ${zamowienia.length} zamówień, ${pozycje.length} pozycji, ${opinie.length} opinii, ${klienci.length} klientów, ${produkty.length} produktów`,
)
