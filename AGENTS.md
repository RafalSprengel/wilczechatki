---
name: CodeIntegrityAgent
description: Agent odpowiedzialny za logikę biznesową i precyzyjną refaktoryzację w TSX.
---

## 🚨 KRYTYCZNA ZASADA: ZERO DOMYŚLNYCH WARTOŚCI DLA CEN
- **ZAKAZ STOSOWANIA `|| 0`, `?? 0`, `|| ""`**: Nigdy nie podstawiaj zera ani pustych ciągów znaków, gdy dane wejściowe do obliczeń ceny są nieobecne lub błędne.
- **CAŁKOWITY ZAKAZ DOMYŚLNYCH WARTOŚCI**: Nie stosuj domyślnych wartości (np. `|| 0`, `?? []`, `|| ""`) w żadnym miejscu w kodzie, chyba że wyraźnie o to poproszę w konkretnym zadaniu.
- **WYMAGANA JAWNOŚĆ**: Jeśli dane są niepewne, kod musi to odzwierciedlać poprzez odpowiednie typowanie (np. `string | null`) i jawną obsługę braku danych (np. instrukcje `if`, `throw error` lub zwrócenie `undefined`).
- **OBSŁUGA BRAKU DANYCH**: Jeśli `calculatePrice` lub pokrewne funkcje nie mogą zwrócić poprawnego wyniku, kod MUSI zwrócić `null` / `undefined` lub rzucić wyjątek (`throw error`).
- **INTEGRALNOŚĆ DANYCH > STABILNOŚĆ**: Błąd aplikacji jest preferowany ponad wyświetlenie błędnej ceny (0).

## 🛠️ ZASADY REFAKTORYZACJI I KODOWANIA
- **BRAK KOMENTARZY**: Nigdy nie dodawaj komentarzy oznajmiającyh mi co wlasnie zrobiles.
- **BEZ TAILWIND**: Pod żadnym pozorem nie używaj Tailwind CSS.
- **ZAKAZ ZGADYWANIA I DOMNIEMAŃ**: Jeśli jakakolwiek część logiki, struktury danych lub celu zadania budzi wątpliwości, ZATRZYMAJ SIĘ. Nie generuj kodu opartego na założeniach.
- **NAJPIERW PYTAJ**: Masz obowiązek zadać pytanie doprecyzowujące przed rozpoczęciem pisania kodu, jeśli brakuje pełnego kontekstu lub istnieją różne drogi implementacji.
- **NO SILENT FAILURES**: Nigdy nie używaj wartości domyślnych (tzw. "magic defaults") jak 0, "", [], false, aby "uciszyć" błędy typów lub brak danych.
- **OPTIONAL CHAINING & NULLISH COALESCING**: Używaj `?.` oraz `??`, ale tylko wtedy, gdy `null/undefined` jest świadomym stanem biznesowym, a nie ucieczką przed błędem.
- **ASYNC/AWAIT ONLY**: Zakaz używania `.then().catch()`. Zawsze stosuj `async/await` z blokami `try-catch`, gdzie w bloku `catch` musi nastąpić jawna obsługa błędu (logowanie/re-throw), a nie zwrócenie zera.
## 🌀 OBSŁUGA STANÓW ŁADOWANIA (UI/UX)
- **MANDATORY LOADING STATE**: Zawsze, gdy operacja jest asynchroniczna (pobieranie danych, wysyłanie formularza, obliczenia), musisz zaimplementować stan ładowania.
- **SPINNER & TEXT**: Stan ładowania musi być wyraźnie sygnalizowany napisem "Loading..." wraz z graficznym spinnerem (użyj czystego CSS/SCSS, bez Tailwind).
- **LAYOUT STABILITY**: Upewnij się, że element ładowania (spinner) nie powoduje "skakania" layoutu – powinien zajmować tyle samo miejsca, co docelowa treść, lub być wyśrodkowany w odpowiednim kontenerze.

- Nie usuwaj mi komentarzy
- Nie dodawaj komentarzy z informacją co w danym kodzie robisz

-to jest projekt w fazie budowania, nie ma tu waznych danych nie potrzeba migracji, wszystkie dane skazuje a nowe sobie dodam\

<!-- - **PRECYZJA**: Poprawiaj błędy, zachowując 100% otoczenia kodu. Nie upraszczaj struktury danych ani logiki. -->

- Nigdy nie używaj operatorów typu `|| "Domyślna wartość"` (np. `displayName || "Domek"`) dla kluczowych danych biznesowych.
   - Jeśli brakuje wymaganych danych (ID, nazwa obiektu, cena, daty), skrypt musi zostać przerwany, a system powinien wyrzucić jawny błąd (Error).
   - Logika aplikacji ma opierać się na zasadzie **Fail-Fast**: lepiej zatrzymać proces rezerwacji, niż pozwolić na zapisanie niekompletnych lub błędnych informacji w bazie danych.

2. **Ścisła walidacja przed procesami zewnętrznymi:**
   - Każda rezerwacja musi zostać w pełni zwalidowana (sprawdzenie istnienia obiektu w bazie, dostępność terminów, poprawność kwoty) **zanim** użytkownik zostanie przekierowany do Stripe.
   - Dane wejściowe z formularzy muszą być weryfikowane pod kątem typów i obowiązkowych pól.

3. **TypeScript jako standard prawdy:**
   - Nie ignoruj błędów TypeScript (zakaz używania `any` i `@ts-ignore`). 
   - Typy muszą dokładnie odzwierciedlać strukturę danych. Jeśli pole jest wymagane w bazie, musi być wymagane w kodzie.
 Używaj języka poslkiego