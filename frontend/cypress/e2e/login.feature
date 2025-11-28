Feature: Authentification

  Scenario: Connexion réussie
    Given je suis sur "/login"
    When je saisis "antoine" et "secret" et je valide
