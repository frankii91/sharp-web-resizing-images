http://localhost:8080/one?loaderTyp=url&outputResize=1000x400&imagePath=https://i-meble.eu/images/homeslider/1488/forte-szkolne-rabaty-do-20.jpg&outputFormat=webp&resultTyp=local



/one
generuje tylko jedno zdjęcie

### LOADER
# dopuszczalne parametry dla /one

&loaderTyp=url
&loaderTyp=local
&loaderTyp=mount

### IMAGE PARTCH / URL
# wartosc zależna od loaderTyp jak url to:

&imagePath=https://i-meble.eu/images/homeslider/1488/forte-szkolne-rabaty-do-20.jpg

# jak local lub mount to ściezka  dostęp do ścieżki musi byczamontowany w dockerze 

&imagePath=/1488/forte-szkolne-rabaty-do-20.jpg

### RESULT
# co ma sie stać z zdjęciem wyjściowym 
# local, mount, stream jak nie podamy lub podamy wartość stream to wynik będzie na ekran przeglądarki

&resultTyp=local
&resultTyp=mount
&resultTyp=stream


### RESIZE
# zmiana rozdzielczosci
# jakś rozdzielczość

&outputResize=100x500

# opcje związne z fit czyli dopełnieniem tła itp.
# zgodnie z ustawieniami domyślnymi
# tu jest opic oco i jak https://sharp.pixelplumbing.com/api-resize
# jedno z ważniejszych wypełnienei background
# jełśi nie podamy to domyślnie wstawi biały
# tabela colorów rgb https://www.rapidtables.com/web/color/
# np.rgb(255,255,255) => white, rgb(255,0,0) => red, rgb(255,255,0) => yellow, rgb(0,0,255) => blue
&background=rgb(255,255,255)

# ważny parametr to też withoutEnlargement odpowiada za to czy obraz ma nie być powiększany (jeden z wymiarów)
# czy ma być dodawane tło (domyśłnie jest false ale dla nas wydaje siębyćdobrą opcją ustawienia na true
# withoutEnlargement=true obraz nei bedzie powiększany nizjego maksymalna wielkosć
# potem zostanie dodane białe tło = dal produktów obecnie mamy z tym problem jeśli rozdzielczość jest mniejsza.... ??????? 
&withoutEnlargement=true

###  OUTPUT FORMAT
# format wyjściowy jpg, webp, avif  narazie tylko tyle zrobione
# domyłśnei bez pdoanie teog parametru będzie jpg i innymi domyślnymi parametrami kompresji i jakości
outputFormat=webp
outputFormat=jpg
outputFormat=avif

### USTAWIENIA KOMPRESJI JPG, WEBP, AVIF
# zgodnie z ustawieniami domyślnymi i opisem na 
# https://sharp.pixelplumbing.com/api-output
# jełśi nazwy są alternatywne u nas działają tylko główne
# np. parametr [options.progressive] dla jpg u nas ustawiamy za pomoc apatametru w linku:
# &progressive=true   i inne analogicznie jak mówi dokumentacja


### wyjątki od dokumentacji
# WEBP brak pełnej obsługi dla parametru delay  jedynie number bez array number default 100 ms




