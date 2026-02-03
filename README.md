# 4205F5MO_GestionInventaire

## Description
Application web transactionnelle permettant la gestion complète d’un inventaire incluant produits, clients, commandes et génération automatisée de factures PDF.

Le projet démontre la conception d’une architecture client-serveur moderne avec API REST sécurisée et base de données relationnelle.

## Stack 
React/Vite, CSS, Fetch API/Async Await (frontend),
Node.js, Express + Supabase + JWT + Puppeteer (backend).

## Fonctionnalités
### Authentification
Authentification sécurisée avec JWT
Protection des routes API
Gestion des sessions utilisateur

### Gestion d’inventaire
CRUD complet des produits
Alertes de stock faible
Mise à jour automatique lors des commandes

### Gestion des commandes
Création et suivi de commandes
Gestion des statuts
Mise à jour dynamique du stock

### Gestion des clients
Ajout et gestion des profils clients
Association commandes ↔ clients

### Facturation
Génération automatique de factures PDF
Création à partir des commandes via Puppeteer

### Monitoring
Endpoint healthcheck pour vérifier l’état du serveur

## Endpoints clés
/api/user/*, /api/produit/*, /api/commandes/*, /api/clients, /api/invoice/from-commande/:id, /api/invoice/_test, /health.

## ENV
Backend (SUPABASE_URI, SUPABASE_SERVICE_ROLE_KEY, PORT), Frontend (VITE_BACKEND_URI).

## Démarrage typique
démarrer l’API Express (PORT=5000 par défaut), puis npm run dev côté frontend avec VITE_BACKEND_URI pointant sur l’API.

## Ce projet nous a permis de :
Concevoir une application full-stack complète
Implémenter des API REST sécurisées
Gérer l’authentification JWT
Intégrer Supabase et PostgreSQL
Générer des documents PDF côté serveur
Structurer une architecture client-serveur moderne
