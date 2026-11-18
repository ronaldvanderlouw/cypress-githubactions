describe("My First Cypress Test", () => {
  it("Should open a web page", () => {
    cy.visit("https://storedemo.testdino.com/");
   cy.get('[data-testid="header-logo"]').should('exist')
  });
});