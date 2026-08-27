# MVP Recastly — archivage automatique de streams Twitch

## Résumé

Construire un prototype personnel permettant à un
utilisateur authentifié de suivre jusqu’à 10 streamers
Twitch. Chaque passage en direct déclenche une capture
mutualisée, limitée à deux enregistrements simultanés
sur un VPS. Les vidéos sont découpées en parties de six
heures, envoyées sur la chaîne YouTube du projet, puis
consultables depuis Recastly.

Flux retenu :

Twitch EventSub → Convex → file de jobs → worker VPS →
Streamlink/FFmpeg → YouTube → bibliothèque Recastly

Convex ne réalisera pas les captures : ses actions
expirent après 10 minutes. Le travail long sera confié à
un worker Docker dédié. Limites Convex
(https://docs.convex.dev/functions/actions)

## Architecture et données

- Conserver Better Auth, les réglages utilisateur,
  PostHog et TanStack Start.

- Remplacer les pages génériques de démonstration par le
  tableau de bord Recastly.

- Ajouter dans Convex :
  - streamers : identifiant Twitch, login, nom, avatar
    et statut EventSub ;

  - follows : relation unique utilisateur/streamer ;
  - recordings : live Twitch, état, horaires, qualité,
    lease worker et erreurs ;

  - recordingParts : numéro de partie, durée, taille,
    vidéo YouTube et traitement ;

  - recordingAccess : utilisateurs autorisés à voir
    chaque archive ;

  - eventsubSubscriptions et webhookReceipts pour la
    gestion et la déduplication.

- Utiliser des états explicites : queued, recording,
  uploading, processing, ready, missed, failed.

- Créer une seule capture par identifiant de live
  Twitch, même si plusieurs utilisateurs suivent le
  streamer.

- Capturer la liste des utilisateurs autorisés au
  démarrage du live ; un nouvel abonnement ne donne pas
  accès aux archives antérieures.

## Intégrations et worker

- Recevoir stream.online et stream.offline sur
  /twitch/eventsub, avec validation HMAC, contrôle de
  fraîcheur et déduplication. Twitch EventSub
  (https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/)

- À l’ajout d’un streamer, résoudre son login via Helix,
  créer les abonnements EventSub manquants et détecter
  immédiatement s’il est déjà en direct.

- Ajouter une réconciliation Twitch toutes les 15
  minutes pour restaurer les abonnements révoqués et
  rattraper un événement manqué.

- Créer apps/worker, exécuté avec Docker Compose et un
  volume persistant :
  - récupération des jobs via des endpoints Convex
    protégés par Authorization: Bearer
    WORKER_API_SECRET ;

  - lease renouvelée par heartbeat et récupération
    automatique après expiration ;

  - deux captures simultanées maximum ;
  - file FIFO ; avant de démarrer un job en attente,
    vérifier que le streamer est encore en ligne ;

  - Streamlink isolé derrière une interface
    StreamCaptureAdapter pour pouvoir le remplacer ;

  - sélectionner la meilleure qualité disponible
    jusqu’à 720p, avec la plus basse disponible comme
    secours sans transcodage ;

  - segmenter en MPEG-TS toutes les six heures, puis
    remuxer en MP4 sans réencodage.

- Envoyer chaque partie avec le protocole YouTube
  resumable, cinq tentatives avec backoff, puis
  supprimer le fichier local uniquement après
  confirmation de l’upload. Uploads reprenables
  (https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol)

- Conserver les fichiers en échec 48 heures et suspendre
  les nouvelles captures lorsque l’espace libre descend
  sous 20 Go.

- Nommer les vidéos Streamer — AAAA-MM-JJ HH:mm — Partie
  N, avec URL Twitch et horaires dans la description.

- Utiliser private pendant le prototype ; autoriser
  unlisted uniquement via une variable explicite après
  audit YouTube. Les projets API non audités voient
  leurs uploads forcés en privé. YouTube videos.insert
  (https://developers.google.com/youtube/v3/docs/videos/insert)

## Interface et API

- Tableau de bord : streamers en direct, captures
  actives, jobs en attente, uploads en traitement et
  derniers échecs.

- Page Streamers : ajout par login ou URL Twitch,
  validation, statut et suppression.

- Bibliothèque : filtres par streamer/statut/date,
  parties regroupées par live et lecteur YouTube pour
  les vidéos prêtes.

- Détail d’un enregistrement : chronologie des parties,
  qualité réelle, erreurs et lien YouTube.

- Toutes les queries et mutations utilisateur vérifient
  l’identité Better Auth et recordingAccess.

- Ajouter un interrupteur global CAPTURE_ENABLED et
  afficher clairement le mode private ou unlisted.

- Conserver l’accès aux anciennes archives après
  désabonnement. La suppression du compte retire ses
  accès ; lorsqu’aucun accès ne subsiste, une
  suppression YouTube est mise en file.

- Hors MVP : paiement, application native, autres
  plateformes, choix de qualité par utilisateur, chaîne
  YouTube personnelle et notifications email.

## Tests et validation

- Tests unitaires : signature/rejeu EventSub,
  transitions d’état, déduplication, leases, limite de
  concurrence et génération des commandes Streamlink/
  FFmpeg.

- Tests d’intégration avec Twitch et YouTube simulés :
  création/suppression d’abonnement, live dupliqué,
  upload repris, token expiré, quota dépassé et
  suppression différée.

- Tests UI : authentification, ajout/retrait d’un
  streamer, états vides/erreur et contrôle d’accès aux
  archives.

- Validation réelle : suivre une chaîne de test,
  capturer un live court, obtenir une vidéo privée
  lisible sur la chaîne projet, puis confirmer le
  nettoyage local.

- Ajouter bun run test au pipeline Turbo et exécuter bun
  run test, bun run check-types et bun run build.

## Hypothèses et garde-fous

- Le VPS utilise Docker, possède au moins 20 Go de marge
  disque et une bande passante adaptée à deux flux.

- La chaîne YouTube du projet est validée pour les
  vidéos longues ; le refresh token reste uniquement
  dans l’environnement du worker.

- Une vidéo non répertoriée est accessible et
  repartageable par toute personne ayant le lien ;
  Recastly ne peut pas imposer un véritable contrôle
  d’accès côté YouTube. Visibilité YouTube
  (https://support.google.com/youtube/answer/157177)

- Streamlink est une dépendance non officielle et
  potentiellement cassante ; aucun flux réservé aux
  abonnés, DRM ou mécanisme d’accès ne sera contourné.

- Le caractère éducatif ne neutralise pas Content ID ni
  les règles de droits d’auteur. Une ouverture au public
  nécessitera un audit YouTube et une réévaluation
  juridique du modèle.
