describe("Apex E-Commerce platform", () => {
  it("Should open a web page", () => {
    cy.visit("https://playwrightpad.com/sandbox/ecommerce");
   cy.get('.badge-unique').should('contain.text', 'E-commerce Sandbox Platform');
  });
});