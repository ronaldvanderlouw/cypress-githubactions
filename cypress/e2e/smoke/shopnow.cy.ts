import { selectors, testData, type KlantGegevens } from "../../test-data";

const { startpagina, teksten, winkelmandje, checkout } = testData;
const tag = { tags: ["@smoke"] };

describe(`ShopNow Smoke & E2E Test - ${testData.url}`, () => {
    beforeEach(() => {
        // De applicatie bewaart het mandje in localStorage ("shopnow-cart"). Zonder deze
        // reset loopt de inhoud van de vorige test door en kan een product niet meer
        // worden toegevoegd zodra de voorraad is bereikt (knop wordt dan disabled).
        cy.clearAllLocalStorage();
        cy.visit(testData.url);
        cy.contains(startpagina.laadTekst, { timeout: testData.timeouts.pagina }).should("not.exist");
    });

    it("1. Laadt de startpagina en toont alle kernonderdelen", tag, () => {
        cy.title().should("include", startpagina.titel);
        cy.contains(startpagina.heroTekst).should("be.visible");
        cy.get(selectors.zoekbalk).should("be.visible");
        cy.contains(startpagina.mandjeLabel)
            .should("be.visible")
            .and("contain.text", startpagina.mandjeAantal);

        testData.categorieen.forEach((categorie) => {
            cy.contains(categorie).should("be.visible");
        });
    });

    it("2. Kan navigeren tussen categorieën", tag, () => {
        cy.contains(testData.navigatie.categorie).click();
        cy.contains(startpagina.heroTekst).should("be.visible");
    });

    it("3. Kan een product zoeken via de zoekbalk", tag, () => {
        cy.get(selectors.zoekbalk)
            .should("be.visible")
            .type(`${testData.zoeken.term}${testData.zoeken.toets}`);

        cy.get("body").should("be.visible");
    });

    it("4. Winkelmandje: voegt product toe en berekent subtotaal en verzendkosten correct", tag, () => {
        cy.voegProductToe();
        cy.get(selectors.mandje.headerKnop).should("be.visible").click();

        // Scope vanaf #app: `cy.contains` slaat een ancestor met aria-busy/aria-hidden over,
        // en de app zet die attributen tijdens het (her)renderen van de collectie.
        cy.get("#app").should("not.have.attr", "aria-busy", "true");
        cy.get(`#app ${selectors.mandje.regel}`).should("have.length", 1);

        cy.get("@productNaam").then((productNaam) => {
            // De productnaam komt uit de productdetail-kop en moet terugkomen in de
            // <h2> van de mandje-regel.
            cy.get(`#app ${selectors.mandje.regel}`).invoke("text").should("contain", String(productNaam));
            cy.get(`#app ${selectors.mandje.regelNaam}`).should("contain.text", String(productNaam));
        });

        cy.get("@prijsTekst").then((prijsTekst) => {
            cy.get(`#app ${selectors.mandje.regelPrijs}`).should(
                "contain.text",
                `${prijsTekst} per stuk`
            );
            cy.get(`#app ${selectors.mandje.regelTotaal}`).should("contain.text", String(prijsTekst));
            cy.get(`#app ${selectors.mandje.regelAantal}`).should("have.text", "1");

            // Subtotaal = aantal x stukprijs = dezelfde prijsTekst.
            // `.contains` levert de <span> met het label; de waarde is het tweede kind.
            cy.get(`#app ${selectors.samenvatting.regel}`)
                .contains(selectors.kortingscode.label)
                .parent()
                .find(selectors.samenvatting.regelLabel)
                .last()
                .should("contain.text", String(prijsTekst));
        });

        // Verzendkosten: gratis bij een bestelwaarde boven de drempel, anders het tarief
        // (zie shippingCost() in de applicatie). Bereken het verwachte totaal mee.
        cy.get("@prijsGetal").then((prijsGetal) => {
            const prijs = Number(prijsGetal);
            const gratisVerzending = prijs > winkelmandje.verzendkostenDrempel;
            const verwachtVerzending = gratisVerzending
                ? winkelmandje.gratisVerzendingTekst
                : winkelmandje.verzendkostenTekst;
            const verwachtTotaal = gratisVerzending ? prijs : prijs + winkelmandje.verzendkostenTarief;

            cy.get(`#app ${selectors.samenvatting.regel}`)
                .contains(selectors.kortingscode.verzendLabel)
                .parent()
                .find(selectors.samenvatting.regelLabel)
                .last()
                .should("contain.text", verwachtVerzending);

            cy.get(`#app ${selectors.samenvatting.totaal}`)
                .invoke("text")
                .then((totaalTekst) => {
                    const totaal = Number(totaalTekst.replace(/[^\d,.-]/g, "").replace(",", "."));
                    expect(totaal).to.be.closeTo(verwachtTotaal, 0.01);
                });
        });
    });

    it("5. Checkout: vult adres in en past kortingscode WELCOME10 toe", tag, () => {
        cy.voegEersteProductToeAanMandje();
        cy.get(selectors.mandje.headerKnop).click();
        cy.vulAdresEnGaVerder();

        cy.get(selectors.kortingscode.formulier)
            .should("be.visible")
            .within(() => {
                cy.get(selectors.kortingscode.invoer).clear().type(checkout.kortingscode);
                cy.get(selectors.kortingscode.toepassen).should("be.visible").click();
            });

        cy.contains("button", new RegExp(teksten.naarBetaling, "i")).should("be.visible").click();
        cy.get(selectors.betaling.formulier, { timeout: testData.timeouts.element }).should("be.visible");
    });

    it("6. Betaling & bevestiging: rondt bestelling af met iDEAL", tag, () => {
        cy.voegEersteProductToeAanMandje();
        cy.get(selectors.mandje.headerKnop).click();
        cy.vulAdresEnGaVerder();

        cy.contains("button", new RegExp(teksten.naarBetaling, "i")).should("be.visible").click();

        cy.get(selectors.betaling.formulier, { timeout: testData.timeouts.element }).should("be.visible");
        cy.contains(selectors.betaling.kop, teksten.betaalmethodeKop).should("be.visible");
        cy.get(selectors.betaling.methode).should("be.checked");

        cy.get(selectors.betaling.betalen)
            .should("be.visible")
            .and("contain.text", teksten.betalenKnop)
            .click();

        // Bevestiging: de app toont "Dankjewel, <voornaam>." in de paginakop en de
        // bestelregels als `.confirmation-item` binnen `.confirmation-card`.
        cy.get(selectors.bevestiging.sectie, { timeout: testData.timeouts.element }).should("be.visible");
        cy.get(`${selectors.bevestiging.sectie} ${selectors.bevestiging.kop}`).should(
            "contain.text",
            teksten.bevestigingKop
        );

        cy.get("@klantGegevens").then((klantGegevens: KlantGegevens) => {
            cy.get(`${selectors.bevestiging.sectie} ${selectors.bevestiging.kop}`).should(
                "contain.text",
                klantGegevens.firstName
            );
        });
        cy.get("@productNaam").then((productNaam) => {
            cy.get(`${selectors.bevestiging.sectie} ${selectors.bevestiging.regel}`)
                .first()
                .should("contain.text", String(productNaam));
        });
    });
});
