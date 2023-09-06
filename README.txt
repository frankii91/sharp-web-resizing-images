sharp-web-resizing-images
Opis
Repozytorium sharp-web-resizing-images zawiera kod w Node.js, który wykorzystuje bibliotekę Sharp do manipulacji obrazami. Dzięki temu kodowi można skalować, konwertować formaty obrazów i wiele więcej, wszystko to za pośrednictwem interfejsu API HTTP. Kod jest modularny i dobrze zorganizowany, co ułatwia dodawanie nowych funkcji i utrzymanie.

Przykładowe zapytanie do przeskalowania obrazu:

http://localhost:3000/?loaderTyp=local&imagePath=/example.jpg&outputFormat=webp&outputResize=200x200

Główne funkcje
Parametry wejściowe
loaderTyp: Typ źródła obrazu (lokalny, montowany, URL).
imagePath: Ścieżka do obrazu.
outputFormat: Format wyjściowy obrazu (jpg, webp, avif).
outputResize: Rozmiary, do których ma być przeskalowany obraz.
fit, position, background, kernel: Opcje do konfiguracji skalowania.
quality, alphaQuality, lossless itd.: Opcje do konfiguracji formatów wyjściowych.
Obsługiwane formaty
JPEG
WebP
AVIF
Obsługiwane metody skalowania
fit: dopasowanie obrazu
position: pozycja obrazu
background: kolor tła
kernel: metoda przetwarzania obrazu
withoutEnlargement, withoutReduction: kontrola nad zmianą rozmiaru
Zapis wyników
Obrazy można zapisać na dysku lokalnym lub na zewnętrznym nośniku, lub też przesłać je jako strumień HTTP.

Opis Repozytorium: sharp-web-resizing-images
Opis
Repozytorium sharp-web-resizing-images zawiera kod w Node.js, który wykorzystuje bibliotekę Sharp do manipulacji obrazami. Dzięki temu kodowi można skalować, konwertować formaty obrazów i wiele więcej, wszystko to za pośrednictwem interfejsu API HTTP. Kod jest modularny i dobrze zorganizowany, co ułatwia dodawanie nowych funkcji i utrzymanie.

Główne funkcje
Parametry wejściowe
loaderTyp: Typ źródła obrazu (lokalny, montowany, URL).
imagePath: Ścieżka do obrazu.
outputFormat: Format wyjściowy obrazu (jpg, webp, avif).
outputResize: Rozmiary, do których ma być przeskalowany obraz.
fit, position, background, kernel: Opcje do konfiguracji skalowania.
quality, alphaQuality, lossless itd.: Opcje do konfiguracji formatów wyjściowych.
Obsługiwane formaty
JPEG
WebP
AVIF
Obsługiwane metody skalowania
fit: dopasowanie obrazu
position: pozycja obrazu
background: kolor tła
kernel: metoda przetwarzania obrazu
withoutEnlargement, withoutReduction: kontrola nad zmianą rozmiaru
Zapis wyników
Obrazy można zapisać na dysku lokalnym lub na zewnętrznym nośniku, lub też przesłać je jako strumień HTTP.
Jak używać
Instalacja
bash
Copy code
npm install
Uruchomienie serwera
bash
Copy code
npm start
Przykład zapytania
bash
Copy code
curl -GET "http://localhost:3000?loaderTyp=local&imagePath=/path/to/image&outputFormat=webp&outputResize=200x200"
Błędy i odpowiedzi
Kod jest zaprojektowany w taki sposób, aby jak najlepiej informować użytkownika o błędach. Możliwe są odpowiedzi takie jak:

400 Bad Request w przypadku błędnych parametrów.
500 Internal Server Error w przypadku błędów serwera.

Uruchamianie w Dockerze:
Projekt zawiera również plik  docker-compose, dzięki czemu jest łatwy do uruchomienia w kontenerze. To wstępna wersja pliku, ale już teraz ułatwia wdrożenie i testowanie aplikacji.

Licencja
MIT