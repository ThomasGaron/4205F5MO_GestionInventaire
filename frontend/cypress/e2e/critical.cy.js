const adminJwt =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4ifQ.signature";

/**
 * Stub recurring backend calls so tests stay offline and deterministic.
 */
function stubCommonBackend() {
  cy.intercept("GET", "**/api/produit/faible-stock*", {
    statusCode: 200,
    body: { data: [] },
  }).as("lowStock");
}

describe("Parcours critiques - intégration", () => {
  beforeEach(() => {
    stubCommonBackend();
  });

  it("connexion puis accès à l'inventaire", () => {
    cy.intercept("POST", "**/api/user/login", {
      statusCode: 200,
      body: { token: adminJwt, user: { role: "admin" } },
    }).as("login");

    cy.intercept("GET", "**/api/produit/tousLesProduits", {
      statusCode: 200,
      body: {
        data: [
          {
            id: "p-1",
            produit_nom: "Pomme",
            produit_prix: 1.5,
            produit_quantiter: 5,
            disponible: true,
          },
        ],
      },
    }).as("getInventaire");

    cy.visit("/login");
    cy.get('input[name="email"]').type("admin@admin.com");
    cy.get('input[name="password"]').type("admin{enter}");

    cy.wait("@login");
    cy.contains(/Inventaire/i).click();
    cy.wait("@getInventaire");

    cy.location("pathname").should("eq", "/inventaire");
    cy.contains("Pomme").should("be.visible");
  });

  it("ajout d'un produit depuis l'inventaire", () => {
    let calls = 0;
    cy.intercept("GET", "**/api/produit/tousLesProduits", (req) => {
      calls += 1;
      const data =
        calls === 1
          ? []
          : [
              {
                id: "p-2",
                produit_nom: "Scanner",
                produit_prix: 99.99,
                produit_quantiter: 4,
                disponible: true,
              },
            ];
      req.reply({ statusCode: 200, body: { data } });
    }).as("getInventaire");

    cy.intercept("POST", "**/api/produit", {
      statusCode: 200,
      body: { id: "p-2" },
    }).as("createProduit");

    cy.visit("/inventaire", {
      onBeforeLoad(win) {
        win.localStorage.setItem("token", adminJwt);
      },
    });

    cy.wait("@getInventaire");

    cy.contains(/Ajouter un produit/i).click();
    cy.get('input[name="nom"]').clear().type("Scanner");
    cy.get('input[name="prix"]').clear().type("99.99");
    cy.get('input[name="quant"]').clear().type("4");
    cy.contains("button", /^Cr/i).click();

    cy.wait("@createProduit");
    cy.wait("@getInventaire");
    cy.contains("Scanner").should("be.visible");
  });

  it("création d'un employé via l'écran admin", () => {
    cy.intercept("POST", "**/api/user/signUp", (req) => {
      req.reply({
        statusCode: 200,
        body: { status: 201, message: "created", id: "u-123" },
      });
    }).as("signUp");

    cy.visit("/signUp", {
      onBeforeLoad(win) {
        win.localStorage.setItem("token", adminJwt);
      },
    });

    cy.get('input[name="email"]').type("nouveau@exemple.com");
    cy.get('input[name="mdp"]').type("motdepasse!");
    cy.get('input[name="confirmer_mdp"]').type("motdepasse!");
    cy.get('input[name="nom"]').type("Nouveau Employé");
    cy.get('input[value="emp"]').check();
    cy.contains(/Ajouter/i).click();

    cy.wait("@signUp")
      .its("request.body")
      .should((body) => {
        expect(body.email).to.eq("nouveau@exemple.com");
        expect(body.role).to.eq("emp");
      });

    cy.get(".auth-form__error").should("not.exist");
  });
});
