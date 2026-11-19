/// <reference types="cypress" />

import type { KlantGegevens } from "../test-data";

/**
 * Type-definities van de custom commands in `cypress/support/commands.ts`.
 *
 * Dit bestand is een module (het importeert en heeft een `export` onderaan), zodat
 * het `declare global` blok hieronder de globale `Cypress` namespace echt uitbreidt.
 * Daardoor komen de commandonamen in `keyof Cypress.Chainable` terecht en is
 * `Cypress.Commands.add("voegProductToe", ...)` type-technisch geldig.
 *
 * Dit blok hoort bewust NIET in `commands.ts` zelf: daar werd het eerder over het
 * hoofd gezien omdat de module-binding ontbrak (TS2345 / TS2669 / TS2315).
 *
 * `KlantGegevensres` staat in `cypress/test-data/index.ts`, naast de testdata zelf,
 * zodat het type en de JSON-waarden op dezelfde plek leven.
 */
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Opent het eerste product dat op voorraad in de catalogus staat en voegt het
       * toe aan het winkelmandje. Na het commando zijn de aliassen `@productNaam`,
       * `@prijsTekst` en `@prijsGetal` beschikbaar.
       *
       * @example
       *   cy.voegProductToe()
       *   cy.get('@productNaam').then((naam) => { ... })
       */
      voegProductToe(): Chainable<void>

      /**
       * Zelfde als `cy.voegProductToe()`: opent het eerste product dat op voorraad is,
       * bewaart naam & prijs als aliassen en voegt het toe aan het mandje.
       */
      voegEersteProductToeAanMandje(): Chainable<void>

      /**
       * Start de checkout vanuit het mandje en vult het adresformulier in met de
       * standaard klantgegevens uit `cypress/test-data/shopnow.json`. Geef optioneel
       * een of meer afwijkende velden mee; die overschrijven de standaardwaarden.
       * De gebruikte gegevens staan na afloop onder het alias `@klantGegevens`.
       *
       * @example
       *   cy.vulAdresEnGaVerder({ city: 'Utrecht' })
       *   cy.get('@klantGegevens').then((klant) => { ... })
       */
      vulAdresEnGaVerder(aangepasteGegevens?: Partial<KlantGegevens>): Chainable<KlantGegevens>
    }
  }
}

export {};
