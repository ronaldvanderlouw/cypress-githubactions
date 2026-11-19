// ***********************************************
// Custom Cypress commands voor de ShopNow-tests.
//
// Alle testdata en selectors staan in `cypress/test-data/`:
//   - `selectors.json` : CSS-selectors
//   - `shopnow.json`   : teksten, URL, klantgegevens, kortingscode, timeouts
//   - `index.ts`       : getypeerde export van beide (en van `KlantGegevens`)
//
// De types van de commando's staan in `./index.d.ts` (een module met een
// `declare global`-blok). Daardoor staan de commandonamen in `keyof Cypress.Chainable`
// en klopt `Cypress.Commands.add("voegProductToe", ...)` type-technisch.
// ***********************************************

/// <reference path="./index.d.ts" />

import "./index.d.ts";

import { selectors, testData, type KlantGegevens } from "../test-data";

/**
 * Opent het eerste product dat op voorraad is, voegt het toe aan het mandje en zet
 * de aliassen `@productNaam`, `@prijsTekst` en `@prijsGetal` klaar.
 *
 * De naam en prijs worden gelezen op de detailpagina (`.detail-copy h1` / `.detail-price`),
 * met selectors die alleen daar bestaan. `main h1, main h2` zou ook de koppen van het mandje
 * ("Jouw mandje.", "Overzicht") matchen zodra de app opnieuw rendert; daardoor kwam er
 * eerder "Jouw mandje." in `@productNaam` terecht.
 *
 * De waarden worden in een `.then()` vastgelegd (dus vóór de klik naar het mandje) en met
 * `cy.wrap(...).as(...)` bewaard, zodat latere asserts altijd de productgegevens krijgen
 * en niet de tekst van een ander scherm.
 */
function voegEersteProductToeAanMandje(): void {
    cy.get(selectors.productkaarten.zichtbaarProduct)
        .first()
        .should("be.visible")
        .click({ force: true });

    cy.get(selectors.productdetail.toevoegenKnop).should("be.visible");

    cy.get(selectors.productdetail.prijs)
        .invoke("text")
        .then((prijsTekst) => {
            const match = prijsTekst.match(/(\d+,\d{2})/);
            const prijsAlsTekst = match ? match[1] : "0,00";
            cy.wrap(prijsAlsTekst).as("prijsTekst");
            cy.wrap(parseFloat(prijsAlsTekst.replace(",", "."))).as("prijsGetal");
        });

    cy.get(selectors.productdetail.kop)
        .invoke("text")
        .invoke("trim")
        .as("productNaam");

    cy.get(selectors.productdetail.toevoegenKnop).click();
    cy.get(selectors.mandje.aantal).should("be.visible").and("have.text", "1");
}

// Beide namen registreren (twee aliassen voor hetzelfde commando).
Cypress.Commands.add("voegProductToe", voegEersteProductToeAanMandje);
Cypress.Commands.add("voegEersteProductToeAanMandje", voegEersteProductToeAanMandje);

/** Start de checkout vanuit het mandje en vult het adresformulier in. */
Cypress.Commands.add("vulAdresEnGaVerder", (aangepasteGegevens?: Partial<KlantGegevens>) => {
    cy.wrap({
        ...testData.checkout.klantGegevens,
        ...aangepasteGegevens,
    }).as("klantGegevens");

    cy.get(selectors.samenvatting.checkoutKnop).should("be.visible").click();

    cy.get(selectors.adresformulier.formulier)
        .should("be.visible")
        .within(() => {
            cy.get("@klantGegevens").then(({ firstName, lastName, email, street, houseNumber, postalCode, city, country }) => {
                cy.get(selectors.adresformulier.voornaam).type(firstName);
                cy.get(selectors.adresformulier.achternaam).type(lastName);
                cy.get(selectors.adresformulier.email).type(email);
                cy.get(selectors.adresformulier.straat).type(street);
                cy.get(selectors.adresformulier.huisnummer).type(houseNumber);
                cy.get(selectors.adresformulier.postcode).type(postalCode);
                cy.get(selectors.adresformulier.woonplaats).type(city);
                cy.get(selectors.adresformulier.land).type(country);
            });
            cy.get(selectors.adresformulier.verzenden).should("be.visible").click();
        });
});
