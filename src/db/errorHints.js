// Podpowiedzi dla ucznia na podstawie numeru błędu MySQL.
const HINTS = {
  1064: 'Błąd składni. MySQL pokazuje fragment zapytania zaczynający się tuż przy błędzie („near …”). Sprawdź literówki w słowach kluczowych, przecinki między kolumnami i kolejność: SELECT … FROM … WHERE … GROUP BY … HAVING … ORDER BY … LIMIT.',
  1146: 'Taka tabela nie istnieje. Sprawdź nazwę w panelu „Struktura bazy” — może to literówka?',
  1054: 'Taka kolumna nie istnieje. Sprawdź nazwy kolumn w panelu „Struktura bazy”. Pamiętaj, że tekst zapisujemy w apostrofach: \'Warszawa\'.',
  1052: 'Kolumna o tej nazwie występuje w kilku złączonych tabelach. Poprzedź ją nazwą lub aliasem tabeli, np. k.id.',
  1451: 'Nie można usunąć ani zmienić tego wiersza, bo odwołują się do niego wiersze w innej tabeli (klucz obcy). Najpierw usuń lub zmień wiersze zależne.',
  1452: 'Klucz obcy wskazuje na wiersz, który nie istnieje. Sprawdź, czy podane id istnieje w tabeli nadrzędnej.',
  1062: 'Taka wartość już istnieje w kolumnie, która musi być unikalna (PRIMARY KEY lub UNIQUE).',
  1048: 'Ta kolumna nie może być pusta (NOT NULL) — podaj dla niej wartość.',
  1364: 'Kolumna nie ma wartości domyślnej i jest wymagana — dodaj ją do listy kolumn w INSERT.',
  1136: 'Liczba wartości w VALUES nie zgadza się z liczbą kolumn.',
  3819: 'Wartość nie spełnia warunku CHECK zdefiniowanego w tabeli (np. ujemna cena albo ilość równa 0).',
  1265: 'Wartość nie pasuje do typu kolumny (np. niedozwolona wartość ENUM).',
  1366: 'Wartość ma zły typ dla tej kolumny (np. tekst w kolumnie liczbowej).',
  1406: 'Tekst jest za długi dla tej kolumny (np. VARCHAR(50) mieści maksymalnie 50 znaków).',
  1292: 'Nieprawidłowa wartość — często zły format daty. W MySQL daty zapisujemy jako \'RRRR-MM-DD\'.',
  1111: 'Funkcji agregujących (COUNT, SUM, AVG…) nie można użyć w WHERE — użyj HAVING.',
  1055: 'Przy GROUP BY każda kolumna w SELECT musi być w GROUP BY albo w funkcji agregującej (COUNT, SUM, MAX…).',
  1050: 'Tabela o tej nazwie już istnieje. Użyj innej nazwy albo CREATE TABLE IF NOT EXISTS.',
  1051: 'Nie ma takiej tabeli. Możesz użyć DROP TABLE IF EXISTS.',
  1091: 'Nie ma takiej kolumny ani klucza do usunięcia.',
  1060: 'Kolumna o tej nazwie już istnieje w tabeli.',
  1044: 'W tym środowisku pracujesz na gotowej bazie sklep — nie możesz tworzyć ani usuwać innych baz danych.',
  1142: 'Brak uprawnień — w tym środowisku masz dostęp tylko do bazy sklep.',
  1227: 'To polecenie wymaga uprawnień administratora serwera, których w tym środowisku nie masz.',
  1396: 'Operacja na koncie się nie powiodła: przy CREATE USER — taki użytkownik już istnieje; przy DROP / ALTER / RENAME USER — taki użytkownik nie istnieje. Pamiętaj, że konto to nazwa ORAZ host, np. \'anna\'@\'localhost\'.',
  1410: 'Nie można nadać uprawnień nieistniejącemu użytkownikowi — najpierw utwórz go poleceniem CREATE USER.',
  1133: 'Nie ma takiego użytkownika — najpierw utwórz go poleceniem CREATE USER.',
  1141: 'Ten użytkownik nie ma takich uprawnień — nie ma czego odebrać (REVOKE) ani pokazać.',
  1147: 'Ten użytkownik nie ma takich uprawnień do tej tabeli.',
  1221: 'Nieprawidłowe użycie GRANT — uprawnień globalnych (np. CREATE USER) nie można nadać do jednej bazy.',
  1046: 'Nie wybrano bazy danych. Wykonaj USE sklep; albo pisz sklep.nazwa_tabeli.',
  1049: 'Nie ma takiej bazy danych. W tym środowisku pracujesz na bazie sklep.',
  3024: 'Zapytanie trwało zbyt długo i zostało przerwane (limit 5 s). Sprawdź warunki złączeń — może brakuje ON?',
  1305: 'Nie ma takiej funkcji ani procedury. Sprawdź pisownię — i czy między nazwą funkcji a nawiasem nie ma spacji.',
  1241: 'Podzapytanie zwraca kilka kolumn, a oczekiwana jest jedna.',
  1242: 'Podzapytanie zwraca kilka wierszy, a oczekiwany jest jeden. Użyj IN zamiast = albo dodaj LIMIT 1.',
  1248: 'Każda tabela pochodna (podzapytanie w FROM) musi mieć alias, np. (SELECT …) AS t.',
}

export function errorHint(errno) {
  return HINTS[errno] ?? null
}

/** Komunikat w formacie klienta wiersza poleceń mysql: ERROR 1064 (42000): … */
export function formatError(item) {
  if (!item.errno) return item.message
  return `ERROR ${item.errno}${item.sqlState ? ` (${item.sqlState})` : ''}: ${item.message}`
}
