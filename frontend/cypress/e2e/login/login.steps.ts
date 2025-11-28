import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
/// <reference types="cypress" />

Given("je suis sur {string}", (path: string) => {
  cy.visit(path);
});

When(
  "je saisis {string} et {string} et je valide",
  (email: string, password: string) => {
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();
  }
);

// Then("je suis redirigé vers {string}", (path: string) => {
//   cy.url().should("include", path);
//   cy.url().should("include", "/acceuil", { timeout: 10000 });
// });
