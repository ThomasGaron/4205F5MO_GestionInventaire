/* eslint-env mocha */

describe("Parcours de connexion", () => {
  it("permet de se connecter et d’accéder à la page inventaire", () => {
    // 1) Aller à la page de login
    cy.visit("/login");

    // 2) Remplir le formulaire
    cy.get("input[name=email]").type("admin@admin.com");
    cy.get("input[name=password]").type("admin{enter}");

    // 3) Vérifier la redirection après login -> /acceuil
    cy.location("pathname").should("eq", "/acceuil");

    // 4) Dans le Header, cliquer sur le lien "Inventaire"
    cy.get('a[href="/inventaire"]').click();

    // 5) Vérifier qu'on est sur /inventaire
    cy.location("pathname").should("eq", "/inventaire");

    // 6) Vérifier qu'on voit bien quelque chose lié à l'inventaire
    cy.contains(/inventaire/i).should("be.visible");
  });
});
