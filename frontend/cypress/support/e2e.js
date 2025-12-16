// Mocks backend calls so E2E/BDD specs can run fully offline in CI
const ADMIN_JWT =
  "eyJhbGciOiJub25lIn0.eyJyb2xlIjoiYWRtaW4ifQ.signature";

beforeEach(() => {
  // Inventaire dataset kept in-memory during a spec
  let items = [
    {
      id: "p-1",
      produit_nom: "Pomme",
      produit_prix: 1.5,
      produit_quantiter: 5,
      disponible: true,
    },
  ];

  cy.intercept("POST", "**/api/user/login", {
    statusCode: 200,
    body: { token: ADMIN_JWT, user: { role: "admin" } },
  }).as("loginApi");

  cy.intercept("POST", "**/api/user/signUp", (req) => {
    req.reply({
      statusCode: 200,
      body: { status: 201, message: "created", id: "u-123" },
    });
  }).as("signUpApi");

  cy.intercept("GET", "**/api/produit/faible-stock*", {
    statusCode: 200,
    body: { data: [] },
  }).as("lowStockApi");

  cy.intercept("GET", "**/api/produit/tousLesProduits", (req) => {
    req.reply({ statusCode: 200, body: { data: items } });
  }).as("produitsAllApi");

  cy.intercept("POST", "**/api/produit", (req) => {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const newItem = {
      id: `p-${Date.now()}`,
      produit_nom: body?.produit_nom || "Produit",
      produit_prix: Number(body?.produit_prix) || 0,
      produit_quantiter: Number(body?.produit_quantiter) || 0,
      disponible: Boolean(body?.disponible ?? true),
    };
    items = [...items, newItem];
    req.reply({ statusCode: 200, body: { id: newItem.id } });
  }).as("produitCreateApi");
});
