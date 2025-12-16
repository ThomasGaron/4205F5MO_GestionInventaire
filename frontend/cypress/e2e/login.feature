Feature: Authentification

  Scenario: Connexion réussie
    Given je suis sur "/login"
    When je saisis "admin@admin.com" et "admin" et je valide
