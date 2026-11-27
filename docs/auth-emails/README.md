# FLEXS : fiche SMTP pour Supabase Auth

Préparée le 2026-11-26 par Claude (fil « Préparer les courriels et le SMTP de FLEXS »).
Personne de notre côté ne touche à Supabase : cette fiche est pour le développeur de Matt, qui fait les collages.
Aucun secret n'est écrit ici. Chaque `«…»` est une valeur à remplir par celui qui colle.

## 1. Où c'est

- Projet Supabase : **ALKAO** (`ysghtkallwuoodwqgkjm`, région ca-central-1). C'est le projet où vit FLEXS (source : `00-FLEXS-START-HERE.md` du dépôt `takatakca/flexsca`).
- Menu : **Authentication › Emails › SMTP Settings** (activer « Enable Custom SMTP »).
- Les gabarits : **Authentication › Emails › Templates** (voir section 4).
- Règle de Matt : **SMTP seulement, Resend est refusé** pour FLEXS.

## 2. Les champs à remplir (SMTP Settings)

| Champ dans Supabase | Valeur |
| --- | --- |
| Enable Custom SMTP | Activé |
| Sender email | `no-reply@flexs.ca` (adresse déjà prévue dans le code FLEXS) |
| Sender name | `FLEXS` |
| Host | `«hôte SMTP du fournisseur»` (ex. `mail.«domaine»` ou `smtp.«fournisseur»`) |
| Port number | `465` (SSL), la même valeur que pour les avis FLEXS. Jamais 25. |
| Username | `«identifiant SMTP»` (souvent l'adresse complète `no-reply@flexs.ca`) |
| Password | `«mot de passe SMTP»` — collé directement dans Supabase, jamais dans un clavardage, un fichier ou le dépôt |
| Minimum interval between emails being sent | Laisser `60` secondes (valeur par défaut) |

Ensuite, **Authentication › Rate Limits** : « Rate limit for sending emails » passe de 2 par heure (expéditeur intégré) à 30 par heure par défaut avec un SMTP perso. Monter selon la limite du fournisseur choisi (ex. 100 par heure).

## 3. Avant de coller : le domaine flexs.ca doit autoriser l'envoi

Sans ces enregistrements DNS, les courriels FLEXS iront aux pourriels ou seront refusés par Gmail et Outlook.

| Enregistrement | Où | Contenu |
| --- | --- | --- |
| SPF (TXT sur `flexs.ca`) | Zone DNS de flexs.ca | `v=spf1 include:«valeur donnée par le fournisseur» ~all` — un seul enregistrement SPF ; s'il en existe déjà un, on y ajoute l'`include` |
| DKIM (TXT ou CNAME) | Zone DNS de flexs.ca | Nom et valeur donnés par le fournisseur |
| DMARC (TXT sur `_dmarc.flexs.ca`) | Zone DNS de flexs.ca | `v=DMARC1; p=none; rua=mailto:«adresse qui reçoit les rapports»` pour commencer |

Je n'ai pas pu lire la zone DNS de flexs.ca d'ici (accès réseau bloqué) : celui qui colle vérifie ce qui existe déjà.

## 4. Les gabarits de courriels FLEXS

Dossier : `docs/auth-emails/` (régénérés par `python3 scripts/build-auth-emails.py docs/auth-emails`). Un fichier HTML par gabarit, français d'abord puis anglais, même allure que les avis FLEXS déjà codés (`supabase/functions/_shared/emails.ts`).

| Gabarit dans Supabase | Sujet à coller | Fichier à coller dans « Message body » |
| --- | --- | --- |
| Confirm signup | `Confirmez votre adresse courriel FLEXS / Confirm your FLEXS email` | `1-confirmer-inscription.html` |
| Magic Link | `Votre lien de connexion FLEXS / Your FLEXS sign-in link` | `2-lien-de-connexion.html` |
| Reset Password | `Choisissez un nouveau mot de passe FLEXS / Choose a new FLEXS password` | `3-reinitialiser-mot-de-passe.html` |
| Change Email Address | `Confirmez votre nouvelle adresse FLEXS / Confirm your new FLEXS email` | `4-changer-adresse-courriel.html` |
| Invite user | `Vous êtes invité sur FLEXS / You are invited to FLEXS` | `5-invitation.html` |
| Reauthentication | `Votre code de vérification FLEXS / Your FLEXS verification code` | `6-code-de-verification.html` |

Notes techniques :

- Les liens utilisent `{{ .ConfirmationURL }}`. Il passe par Supabase puis renvoie vers l'adresse demandée par l'application FLEXS (`https://flexs.ca/auth/callback` ou `/auth/reset-password`), déjà dans la liste des redirections permises d'ALKAO. Aucun gabarit n'utilise `{{ .SiteURL }}`, parce que le Site URL d'ALKAO est celui de la billetterie (`billets.promohavana.ca/ops`) et ne doit pas changer.
- Pas de code à 6 chiffres dans les gabarits à lien : l'application FLEXS n'a pas d'écran pour taper un code, elle n'utilise que le lien. Seul « Reauthentication » affiche `{{ .Token }}`.
- Aucun gabarit n'annonce une durée précise : elle dépend du réglage « Email OTP Expiration » d'ALKAO.
- Les gabarits ont été affichés avec des valeurs d'essai à 390 px (téléphone) et 1000 px (ordinateur) : rien ne déborde, les liens longs se coupent.

## 5. Test après le collage (par le développeur)

1. Sur https://flexs.ca, s'inscrire avec une adresse de test : le courriel arrive de `FLEXS <no-reply@flexs.ca>`, en boîte de réception (pas en pourriels), et le bouton ouvre FLEXS connecté.
2. « Mot de passe oublié » : le bouton mène à `flexs.ca/auth/reset-password`.
3. Dans Gmail, « Afficher l'original » : SPF, DKIM et DMARC disent PASS.

## 6. Décisions (2026-11-27)

Matt a demandé le 2026-11-27 de « finaliser au complet » sans trancher lui-même ; Claude a retenu les options recommandées. Elles se changent plus tard sans toucher au code.

1. **Fournisseur SMTP : boîte courriel `no-reply@flexs.ca` chez MochaHost** (section 7). Aucun achat, aucun nouveau compte, SMTP simple comme Matt l'a demandé. Si un jour les courriels arrivent mal en boîte de réception, passer à un service SMTP à palier gratuit (ex. Brevo) en changeant seulement les valeurs.
2. **Billetterie (ALKAO partagé) : on accepte pour l'instant.** Les connexions de la billetterie sont surtout le personnel (`/ops`), peu nombreux ; ils recevraient des courriels signés FLEXS. Si ça dérange, la vraie solution est de séparer FLEXS dans son propre projet Supabase (travail du développeur), pas de rendre les gabarits neutres.
3. **Avis FLEXS** : déjà passés au SMTP par une autre session le 2026-11-26 (secrets `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, port 465). Plus de Resend nulle part.
4. Port : utiliser **465** partout (Auth et fonctions) ; les fonctions Supabase ne peuvent pas joindre 587 ni 25.

## 7. Fournisseur retenu : boîte courriel MochaHost (0 $ de plus)

Étapes pour le développeur (ou Matt) dans le cPanel MochaHost qui héberge flexs.ca :

1. **cPanel › Email Accounts › Create** : adresse `no-reply@flexs.ca`, mot de passe long et unique (gardé dans le fichier de clés sur le PC, jamais dans un clavardage).
2. **cPanel › Email Accounts › Connect Devices** pour cette adresse : noter « Outgoing Server » (souvent `mail.flexs.ca`) et le port SMTP SSL (souvent `465`).
3. **cPanel › Email Deliverability** : pour flexs.ca, installer les enregistrements SPF et DKIM proposés (un clic si la zone DNS de flexs.ca est chez MochaHost ; sinon copier les valeurs chez l'hébergeur DNS). Ajouter ensuite le DMARC de la section 3.
4. Dans Supabase (section 2) : Host = serveur noté à l'étape 2, Port = `465`, Username = `no-reply@flexs.ca`, Password = celui de l'étape 1, Sender = `no-reply@flexs.ca`, Name = `FLEXS`.
5. Rate limit Supabase : rester à 30 courriels par heure au début (les hébergements partagés limitent souvent l'envoi par heure).
6. Les mêmes valeurs servent aux avis FLEXS (fonction `send-emails`) : secrets `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, port 465 par défaut (voir `docs/GO_LIVE_CHECKLIST.md` § 2b).
7. Faire le test de la section 5.

À vérifier avant : que flexs.ca a bien un cPanel chez MochaHost avec le courriel actif (le site lui-même est maintenant chez Coolify).
