Feature: Inscription

  Scenario: Création de compte après connexion
    Given je suis sur "/login"
    When je saisis "admin@admin.com" et "admin"
    And je clique sur "Créer un compte"
    When je saisis "nouveau@exemple.com" et "motdepasse" et "motdepasse" et "nouveau exemple" et "employe"