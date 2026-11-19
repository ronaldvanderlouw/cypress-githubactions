/**
 * Centrale plek voor alle testdata.
 *
 * De gegevens staan in JSON-bestanden zodat ze ook buiten TypeScript te lezen en
 * aan te passen zijn:
 *   - `shopnow.json`   : URLs, teksten, categorieen, klantgegevens, kortingscode, timeouts
 *   - `selectors.json` : CSS-selectors van de ShopNow-applicatie
 *
 * Deze module typt de JSON en is de enige plek waar de tests importeren,
 * zodat een typefout in de testdata meteen door `tsc` wordt opgemerkt.
 *
 * Waarom een import en geen `cy.fixture`?
 * `cy.fixture` is asynchroon: je moet hem in elke test eerst `then()`-en voordat de
 * data beschikbaar is. Daardoor kun je de standaard klantgegevens niet netjes
 * synchronisch als default-parameter gebruiken in `vulAdresEnGaVerder()`. Een
 * JSON-import wordt door de webpack-preprocessor van Cypress ingebakken en is
 * direct beschikbaar.
 */
import shopnowJson from "./shopnow.json";
import selectorsJson from "./selectors.json";

/** Klantgegevens die in het checkout-adresformulier worden ingevuld. */
export interface KlantGegevens {
    firstName: string;
    lastName: string;
    email: string;
    street: string;
    houseNumber: string;
    postalCode: string;
    city: string;
    country: string;
}

export interface Timeouts {
    pagina: number;
    element: number;
}

export interface StartpaginaData {
    titel: string;
    heroTekst: string;
    zoekbalkPlaceholder: string;
    mandjeLabel: string;
    mandjeAantal: string;
    laadTekst: string;
}

export interface NavigatieData {
    categorie: string;
}

export interface ZoekenData {
    term: string;
    toets: string;
}

export interface WinkelmandjeData {
    leegAantal: string;
    verzendkostenDrempel: number;
    verzendkostenTarief: number;
    gratisVerzendingTekst: string;
    verzendkostenTekst: string;
}

export interface CheckoutData {
    klantGegevens: KlantGegevens;
    kortingscode: string;
    betaalmethode: string;
}

export interface TekstenData {
    naarBetaling: string;
    betaalmethodeKop: string;
    betalenKnop: string;
    bevestigingKop: string;
}

export interface ShopNowTestData {
    url: string;
    timeouts: Timeouts;
    startpagina: StartpaginaData;
    categorieen: string[];
    navigatie: NavigatieData;
    zoeken: ZoekenData;
    winkelmandje: WinkelmandjeData;
    checkout: CheckoutData;
    teksten: TekstenData;
}

/** Alle testdata voor de ShopNow smoke- en E2E-tests. */
export const testData: ShopNowTestData = shopnowJson;

/** Alleen de selectors, voor leesbare aanroepen in de specs. */
export const selectors = selectorsJson;
