# Accès administrateur

- Entrée unique : `/admin/`
- Adresse administrateur choisie : `admin@annabid.com`
- Aucun mot de passe de démonstration ni identifiant de secours.

Les variantes `/fr/admin/`, `/en/admin/`, `/ar/admin/` et `/admin/login/` redirigent vers `/admin/`. Les rubriques restent sous `/admin/...` et les paramètres de requête sont conservés. La vérification du compte utilise le parcours de sécurité partagé ; elle ne crée pas une seconde interface d’administration.

## Activer le compte dans la base concernée

Configurer la connexion PostgreSQL, `AUTH_SECRET`, l’envoi des e-mails et l’origine du site conformément à [SECURITY-REMEDIATION.md](SECURITY-REMEDIATION.md). Appliquer les migrations de sécurité. Fournir `ADMIN_PASSWORD` via le gestionnaire de secrets, puis lancer `npm run security:admin`. L’adresse par défaut est celle indiquée ci-dessus.

La première connexion exige la vérification de l’adresse e-mail et l’activation TOTP. Le script préserve un second facteur existant. Les mots de passe ne sont pas récupérables depuis leurs empreintes.

La modification du dépôt ne crée pas à elle seule un compte dans la base hébergée. Aucun compte de production n’a été créé, supprimé ou réinitialisé pendant cette intervention, faute de connexion PostgreSQL configurée.
