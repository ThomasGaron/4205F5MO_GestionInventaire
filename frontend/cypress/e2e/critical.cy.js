const adminJwt =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4ifQ.signature";

describe("Parcours critiques - intégration", () => {
  // Support intercepts (cypress/support/e2e.js) stub all backend calls offline.

  it("connexion puis accès à l'inventaire", () => {
    cy.visit("/login");
    cy.get('input[name="email"]').type("admin@admin.com");
    cy.get('input[name="password"]').type("admin{enter}");

    cy.contains(/Inventaire/i).click();

    cy.location("pathname").should("eq", "/inventaire");
    cy.contains("Pomme").should("be.visible");
  });

  it("ajout d'un produit depuis l'inventaire", () => {
    cy.visit("/inventaire", {
      onBeforeLoad(win) {
        win.localStorage.setItem("token", adminJwt);
      },
    });

    cy.contains(/Ajouter un produit/i).click();
    cy.get('input[name="nom"]').clear().type("Scanner");
    cy.get('input[name="prix"]').clear().type("99.99");
    cy.get('input[name="quant"]').clear().type("4");
    cy.contains("button", /^Cr/i).click();

    cy.contains("Scanner").should("be.visible");
  });

  it("création d'un employé via l'écran admin", () => {
    cy.visit("/signUp", {
      onBeforeLoad(win) {
        win.localStorage.setItem("token", adminJwt);
      },
    });

    cy.location("pathname").should("eq", "/signUp");
    cy.get('input[name="email"]').type("nouveau@exemple.com");
    cy.get('input[name="mdp"]').type("motdepasse!");
    cy.get('input[name="confirmer_mdp"]').type("motdepasse!");
    cy.get('input[name="nom"]').type("Nouveau Employé");
    cy.get('input[value="emp"]').check();
    cy.contains(/Ajouter/i).click();

    cy.get(".auth-form__error").should("not.exist");
  });
});
