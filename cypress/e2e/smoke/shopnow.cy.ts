describe("ShopNow Smoke & E2E Test - shopnow.squerist.nl", () => {
    beforeEach(() => {
        cy.visit("https://shopnow.squerist.nl");
    });

    it("1. Laadt de startpagina en toont alle kernonderdelen", () => {
        cy.title().should("include", "ShopNow");
        cy.contains("Alles").should("be.visible").click();
        cy.contains("Goed gekozen. Snel thuis.").should("be.visible");

        cy.get('input[placeholder*="Waar ben je naar op zoek?"]').should("be.visible");
        cy.contains("Mandje").should("be.visible").and("contain.text", "0");

        const categorieen = ["Alles", "Wonen", "Elektronica", "Keuken", "Lifestyle"];
        categorieen.forEach((categorie) => {
            cy.contains(categorie).should("be.visible");
        });

        cy.contains("De collectie wordt opgehaald...", { timeout: 10000 }).should("not.exist");
    });

    it("2. Kan navigeren tussen categorieën", () => {
        cy.contains("De collectie wordt opgehaald...", { timeout: 10000 }).should("not.exist");

        cy.contains("Elektronica").click();
        cy.contains("Goed gekozen. Snel thuis.").should("be.visible");
    });

    it("3. Kan een product zoeken via de zoekbalk", () => {
        cy.contains("De collectie wordt opgehaald...", { timeout: 10000 }).should("not.exist");

        cy.get('input[placeholder*="Waar ben je naar op zoek?"]')
            .should("be.visible")
            .type("lamp{enter}");

        cy.get("body").should("be.visible");
    });

    it("4. Volledige bestelflow: eerste product kiezen, mandje controleren, afrekenen en bevestiging verifiëren", () => {
        cy.contains("De collectie wordt opgehaald...", { timeout: 10000 }).should("not.exist");

        // 1. Open het allereerste product op de pagina
        cy.get("main")
            .find("button, a")
            .filter(':contains("Bekijk"), :contains("mandje"), :contains("Toevoegen")')
            .first()
            .click({ force: true });

        // Wacht tot de productdetailpagina geladen is
        cy.get('button[data-action="add-detail"]').should("be.visible");

        // 2. Lees de naam en prijs van het gekozen product dynamisch uit
        cy.get("main h1, main h2")
            .first()
            .invoke("text")
            .invoke("trim")
            .then((productNaam) => {
                cy.get("main")
                    .contains(/€\s*\d+,\d{2}/)
                    .invoke("text")
                    .then((prijsTekst) => {
                        const match = prijsTekst.match(/(\d+,\d{2})/);
                        const prijsAlsTekst = match ? match.at(1)! : "0,00";
                        const prijsGetal = parseFloat(prijsAlsTekst.replace(",", "."));


                        // 3. Voeg product toe aan het winkelmandje
                        cy.get('button[data-action="add-detail"]').click();

                        // Controleer dat de teller op 1 staat en open het winkelmandje
                        cy.get("#cart-count").should("be.visible").and("have.text", "1");
                        cy.get("#header-cart").should("be.visible").click();

                        // 4. Controleer het gekozen product in het winkelmandje
                        cy.contains(".cart-item", productNaam)
                            .should("be.visible")
                            .within(() => {
                                cy.get("h2").should("have.text", productNaam);
                                cy.get(".cart-item-price").should("contain.text", `${prijsAlsTekst} per stuk`);
                                cy.get(".quantity-control span").should("have.text", "1");
                                cy.get(".line-total").should("contain.text", prijsAlsTekst);
                            });

                        // 5. Lees de verzendkosten uit, bereken het verwachte totaal en ga naar afrekenen
                        cy.contains(".summary-card .summary-line", "Subtotaal producten").should(
                            "contain.text",
                            prijsAlsTekst
                        );

                        cy.contains(".summary-card .summary-line", "Verzending")
                            .invoke("text")
                            .then((verzendTekst) => {
                                const verzendMatch = verzendTekst.match(/(\d+,\d{2})/);
                                const verzendAlsTekst = verzendMatch ? verzendMatch.at(1)! : "0,00";
                                const verzendGetal = parseFloat(verzendAlsTekst.replace(",", "."));
                                const verwachtTotaal = (prijsGetal + verzendGetal).toFixed(2).replace(".", ",");

                                cy.get(".summary-card .summary-total strong").should("contain.text", verwachtTotaal);

                                // Klik op 'Verder naar adres' (buiten .within() zodat de scope schoon blijft)
                                cy.get('.summary-card button[data-action="checkout"]').should("be.visible").click();

                                // 6. Vul het adresformulier in
                                const klantGegevens = {
                                    firstName: "Jan",
                                    lastName: "de Vries",
                                    email: "jan.devries@voorbeeld.nl",
                                    street: "Hoofdstraat",
                                    houseNumber: "12",
                                    postalCode: "1012 AB",
                                    city: "Amsterdam",
                                    country: "Nederland",
                                };

                                cy.get("#address-form")
                                    .should("be.visible")
                                    .within(() => {
                                        cy.get('input[name="firstName"]').type(klantGegevens.firstName);
                                        cy.get('input[name="lastName"]').type(klantGegevens.lastName);
                                        cy.get('input[name="email"]').type(klantGegevens.email);
                                        cy.get('input[name="street"]').type(klantGegevens.street);
                                        cy.get('input[name="houseNumber"]').type(klantGegevens.houseNumber);
                                        cy.get('input[name="postalCode"]').type(klantGegevens.postalCode);
                                        cy.get('input[name="city"]').type(klantGegevens.city);
                                        cy.get('input[name="country"]').type(klantGegevens.country);

                                        cy.get('button.form-submit[type="submit"]').should("be.visible").click();
                                    });

                                // 7. Vul een kortingscode in en pas deze toe
                                cy.get("#discount-form")
                                    .should("be.visible")
                                    .within(() => {
                                        cy.get("#discount-code").clear().type("WELCOME10");
                                        cy.get('button[type="submit"]').should("be.visible").click();
                                    });

                                // Klik op de vervolgknop om naar Stap 03 (Betaling) te gaan
                                cy.contains("button", /Naar betaling|Verder naar betaling/i)
                                    .should("be.visible")
                                    .click();
                                // 8. Controleer betaalmethode, lees eindbedrag uit en klik op Betalen
                                cy.get("#payment-form", { timeout: 10000 }).should("be.visible");
                                cy.contains("#payment-form h2", "Kies je betaalmethode").should("be.visible");
                                cy.get('#payment-form input[type="radio"][name="payment"][value="iDEAL"]').should("be.checked");

                                cy.get('#payment-form button[type="submit"]')
                                    .should("be.visible")
                                    .and("contain.text", "Betalen")
                                    .invoke("text")
                                    .then((betaalKnopTekst) => {
                                        const totaalMatch = betaalKnopTekst.match(/(\d+,\d{2})/);
                                        const uiteindelijkeTotaalPrijs = totaalMatch ? totaalMatch.at(1)! : verwachtTotaal;


                                        // Klik op Betalen (buiten .within() zodat de orderbevestiging gevonden wordt)
                                        cy.get('#payment-form button[type="submit"]').click();

                                        // 9. Controleer alle gegevens op de orderbevestiging afhankelijk van het gekozen product
                                        cy.get(".confirmation-card", { timeout: 10000 })
                                            .should("be.visible")
                                            .within(() => {
                                                // Ordernummer formaat
                                                cy.contains(".confirmation-number span", "ORDERNUMMER").should("be.visible");
                                                cy.get(".confirmation-number strong")
                                                    .should("be.visible")
                                                    .invoke("text")
                                                    .invoke("trim")
                                                    .should("match", /^SN-[A-Z0-9]+$/);

                                                // Productnaam en stukprijs van het gekozen product
                                                cy.contains(".confirmation-item", productNaam)
                                                    .should("be.visible")
                                                    .within(() => {
                                                        cy.get("small")
                                                            .should("be.visible")
                                                            .and("contain.text", `× 1`)
                                                            .and("contain.text", `${prijsAlsTekst} per stuk`);
                                                        cy.get("strong").should("contain.text", prijsAlsTekst);
                                                    });

                                                // Subtotaal en verzendkosten
                                                cy.contains(".confirmation-item", "Subtotaal producten")
                                                    .find("strong")
                                                    .should("contain.text", prijsAlsTekst);

                                                cy.contains(".confirmation-item", "Verzending")
                                                    .find("strong")
                                                    .should("contain.text", verzendAlsTekst);

                                                // Betaalstatus en uiteindelijke totaalprijs
                                                cy.get(".confirmation-total")
                                                    .should("be.visible")
                                                    .within(() => {
                                                        cy.contains("span", "Totaal · betaling geslaagd").should("be.visible");
                                                        cy.get("strong").should("contain.text", uiteindelijkeTotaalPrijs);
                                                    });

                                                // Bezorgadres uit stap 6
                                                cy.get(".confirmation-address")
                                                    .should("be.visible")
                                                    .within(() => {
                                                        cy.contains("span", "BEZORGEN OP").should("be.visible");
                                                        cy.get("p")
                                                            .should("contain.text", `${klantGegevens.firstName} ${klantGegevens.lastName}`)
                                                            .and("contain.text", `${klantGegevens.street} ${klantGegevens.houseNumber}`)
                                                            .and("contain.text", `${klantGegevens.postalCode} ${klantGegevens.city}`)
                                                            .and("contain.text", klantGegevens.country)
                                                            .and("contain.text", klantGegevens.email);
                                                    });
                                            });
                                    });
                            });
                    });
            });
    });
});
