### TODO
- [ ] allure reporting configureren voor Cypress
- [ ] beaconreporter installeren en configureren
- [ ] 


### Wat er is aangemaakt ###
Bestand	Inhoud
cypress/test-data/shopnow.json	url, timeouts, startpagina (titel, hero-tekst, zoekbalk-placeholder, mandje-label, laadtekst), categorieen, navigatie, zoeken (term + toets), winkelmandje (drempel, tarief, teksten), checkout (klantgegevens, kortingscode, betaalmethode), teksten
cypress/test-data/selectors.json	Alle CSS-selectors, gegroepeerd per scherm: zoekbalk, productkaarten, productdetail, mandje, samenvatting, adresformulier, kortingscode, betaling, bevestiging
cypress/test-data/index.ts	Getypeerde export: testData, selectors en het type KlantGegevens

### Aanpassingen ###
- __`tsconfig.json`__ — `resolveJsonModule` en `esModuleInterop` toegevoegd (nodig om de `.json` te importeren).

- __`cypress/support/commands.ts`__ — alle hardcoded klantgegevens en selectors vervangen door `testData.checkout.klantGegevens` en `selectors.*`. De dubbele implementatie van `voegProductToe` / `voegEersteProductToeAanMandje` is nu één functie die twee keer geregistreerd wordt. `vulAdresEnGaVerder` accepteert `Partial<KlantGegevens>`, zodat je per test één veld kunt overschrijven.

- __`cypress/support/index.d.ts`__ — nog steeds de module die de global augmentation doet (dat was de kern van je oorspronkelijke fout); `KlantGegevens` wordt nu uit `test-data` geïmporteerd in plaats van lokaal gedupliceerd.

- __`cypress/e2e/smoke/shopnow.cy.ts`__ — importeert `selectors` en `testData`; geen enkele URL, tekst, selector of klantgegeven staat nog in de spec.


### Bewijs dat het werkt ###

npx tsc --noEmit     → tsc_exit=0   
npx cypress run      → 6 passing, 0 failing

De suite-titel in de output is nu `ShopNow Smoke & E2E Test - https://shopnow.squerist.nl` — die kwam voorheen uit een hardcoded string en wordt nu uit `testData.url` gelezen. De grep-controle vindt verder geen hardcoded testdata meer in de spec of in `commands.ts`.

Twee dingen om te weten:

- __Ik gebruik bewust JSON-imports, geen `cy.fixture`.__ `cy.fixture` is asynchroon, waardoor je de standaard klantgegevens niet als default-parameter in `vulAdresEnGaVerder()` kunt gebruiken en elke test eerst een `then()` nodig heeft. De webpack-preprocessor van Cypress bakt de JSON-imports in, dus de data is direct beschikbaar. Wil je ze später toch buiten de bundle om kunnen aanpassen (bijv. per omgeving), dan is `cy.fixture` de logische vervolgstap — maar dat kost je de synchrone default.

- __De `it()`-titels heb ik leesbaar gelaten__ (`categorieën`), want dat is rapportagetekst voor Allure, geen testdata. Alle waarden die de app nodig heeft staan wél in de JSON.

- __`selectors.json` is nu de einzelne plek bij een UI-wijziging.__ Dat was voorheen verspreid over de spec én `commands.ts` — nu pas je één bestand aan en beide blijven kloppen.



Wat er nu staat
cypress/test-data/ — de testdata, los van de code:

| Bestand	| Inhoud |
|----------------------------|-----------------------|
| shopnow.json |	url, timeouts, startpagina (titel, hero-tekst, zoekbalk-placeholder, mandje-label, laadtekst), categorieen, navigatie, zoeken (term + toets), winkelmandje (drempel 50, tarief 4.95, teksten), checkout (klantgegevens, kortingscode, betaalmethode), teksten |
| selectors.json |	Alle CSS-selectors per scherm: zoekbalk, productkaarten, productdetail, mandje, samenvatting, adresformulier, kortingscode, betaling, bevestiging |
index.ts |Getypeerde export testData, selectors en KlantGegevens |	 |


__Aangepast:__ `tsconfig.json` (`resolveJsonModule` + `esModuleInterop`), `commands.ts` (leest alles uit `test-data`), `index.d.ts` (`KlantGegevens` komt nu uit `test-data`), `shopnow.cy.ts` (geen hardcoded URL/teksten/selectors meer).

## De twee fouten uit je log

1. __`cy.voegEersteProductToeAanMandje is not a function`__ — de registratie was weg. Nu staan beide registraties expliciet naast elkaar:

   ```ts
   Cypress.Commands.add("voegProductToe", voegEersteProductToeAanMandje);
   Cypress.Commands.add("voegEersteProductToeAanMandje", voegEersteProductToeAanMandje);
   ```

   (De vorige versie verwees naar de variabele vóórdat die bestond — dat werkte alleen bij toeval.)

2. __`expected '...ElektronicaOrbit Bluetooth speaker...' to include 'Jouw mandje.'`__ — `@productNaam` bevatte de mandje-kop. Oorzaak: `cy.get("main h1, main h2")` matcht op de mandje-view óók `Jouw mandje.`, en de alias werd pas ná de navigatie uitgelezen. Nu leest de command de naam en prijs met `.detail-copy h1` / `.detail-price` — selectors die __alleen op de detailpagina bestaan__ — en legt de waarden vast vóór de klik naar het mandje.
#
## Nog één ding dat ik onderweg vond

Jouw `{ tags: '@smoke' }` werd door `@cypress/grepolder` wél gelezen, maar `--env grepTags=...` deed níets: een onbekende tag sloeg nog steeds alle 6 tests over tags heen. De juiste doorgeefmethode is `--expose`:

```javascript
npx cypress run --expose grepTags=@smoke       → 6 passing
npx cypress run --expose grepTags=@bestaatniet → 6 pending  (correct overgeslagen)
```

Belangrijk voor je GitHub Action: in `main.yml` staat nu `npx cypress run --browser chrome` zonder tag-filter. Wil je daar alleen de smoke-set draaien, gebruik dan `--expose grepTags=@smoke`. Met `--env` zou je actie ongemerkt de volledige suite draaien.
