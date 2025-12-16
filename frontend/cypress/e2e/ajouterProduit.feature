Feature: Ajouter produit

  Scenario: ajouter produit
    Given je suis sur "/login"
    When je saisis "admin@admin.com" et "admin"
    And je clique sur "Inventaire"
    And je clique sur "Ajouter un produit"
    When je saisis "test" et "12" et "3"