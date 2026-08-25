# Politique de confidentialité — Bundly

> **Brouillon.** Ce document couvre les traitements de données identifiés dans le code actuel de l'app.
> Il doit être relu par un juriste avant publication, et les champs entre crochets `[...]` doivent être complétés.
> Dernière mise à jour : [date].

## 1. Qui sommes-nous

Bundly est éditée par [nom de l'entité ou, à défaut, ton nom + statut (auto-entrepreneur, etc.)],
contact : [adresse e-mail de contact dédiée à l'app — éviter une adresse Gmail personnelle si possible].

## 2. Données que nous collectons

Bundly est une app de couple ; certaines données sont partagées avec ton/ta partenaire au sein du même
compte couple. Selon les fonctionnalités que tu utilises, nous traitons :

| Catégorie                                 | Exemples                                                            | Fonctionnalité                                        |
| ----------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------- |
| Compte                                    | e-mail, mot de passe (haché)                                        | Authentification                                      |
| Données de santé (catégorie particulière) | dates de règles, symptômes, sévérité                                | Menstruation                                          |
| Données de santé                          | traitements, posologie                                              | Treatments                                            |
| Données personnelles sensibles            | humeur, notes émotionnelles                                         | Emotions                                              |
| Activité physique                         | type, durée, calories                                               | Fitness                                               |
| Alimentation                              | repas, produits scannés                                             | Nutrition                                             |
| Contenu utilisateur                       | photos                                                              | Photos                                                |
| Vie quotidienne                           | tâches, courses, abonnements, véhicules, animaux, dates importantes | Tasks, Shopping, Subscriptions, Vehicles, Pets, Dates |

Les données de santé (règles, symptômes, traitements) sont des **données sensibles** au sens de
l'article 9 du RGPD. Elles ne sont collectées qu'avec ton consentement explicite, donné en utilisant
ces fonctionnalités, et tu peux les supprimer à tout moment (voir §5).

## 3. Pourquoi nous les traitons

- Fournir les fonctionnalités que tu utilises (suivi de cycle, tâches partagées, etc.) ;
- Synchroniser les données entre les deux membres d'un couple ;
- [Si applicable] Fonctionnalités d'assistance basées sur l'IA — voir §4.

Nous ne vendons aucune donnée et ne faisons pas de publicité ciblée.

## 4. Sous-traitants et hébergement

- **Supabase** (base de données, authentification, stockage) — hébergement : [région du projet Supabase].
- [Si la fonctionnalité IA est activée] **Anthropic** (API Claude) pour [décrire l'usage précis, ex. suggestions
  de repas] — les appels passent par notre backend, aucune clé n'est exposée dans l'app.

Un accord de sous-traitance (DPA) est en place avec chacun de ces prestataires. [à confirmer]

## 5. Tes droits

Conformément au RGPD, tu peux à tout moment :

- accéder à tes données, les rectifier ou les supprimer depuis l'app ou en nous contactant ;
- demander la portabilité de tes données (export) ;
- retirer ton consentement pour les données de santé, ce qui entraîne la suppression des entrées
  concernées ;
- t'opposer à un traitement ou demander sa limitation.

Pour exercer ces droits : [e-mail de contact]. Tu peux aussi introduire une réclamation auprès de la CNIL
(cnil.fr).

## 6. Conservation des données

[À définir : ex. les données sont conservées tant que le compte est actif, et supprimées dans les
[X] jours suivant sa clôture.]

## 7. Sécurité

L'accès aux données est protégé par l'authentification Supabase et des règles de sécurité au niveau
des lignes (Row Level Security), garantissant que seuls les membres d'un couple accèdent à leurs
propres données.

## 8. Mineurs

Bundly n'est pas destinée aux personnes de moins de [16/18] ans.

## 9. Modifications

Cette politique peut être mise à jour ; toute modification substantielle te sera notifiée dans l'app.

## 10. Contact

[e-mail de contact] — [adresse postale si personne morale].
