import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
/// <reference types="cypress" />

Given("je suis sur {string}", (path: string) => {
  cy.visit(path);
});

When("je saisis {string} et {string}", (email: string, password: string) => {
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should("include", "/acceuil");
});

When("je clique sur {string}", (label: string) => {
  cy.contains(label).click();
});

When(
  "je saisis {string} et {string} et {string}",
  (nom: string, prix: string, quant: string) => {
    cy.get('input[name="nom"]').type(nom);
    cy.get('input[name="prix"]').type(prix);
    cy.get('input[name="quant"]').type(quant);
    cy.get('button[type="submit"]').click();
  }
);
