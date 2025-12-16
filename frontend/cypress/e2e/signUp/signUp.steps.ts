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
  "je saisis {string} et {string} et {string} et {string} et {string}",
  (
    email: string,
    password: string,
    confirmPassword: string,
    fullName: string,
    role: string
  ) => {
    cy.url().should("include", "/signUp");
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="mdp"]').type(password);
    cy.get('input[name="confirmer_mdp"]').type(confirmPassword);
    cy.get('input[name="nom"]').type(fullName);
    cy.get('input[value="emp"]').check();
    cy.get('button[type="submit"]').click();
  }
);
