# Recastly

Recastly est un prototype personnel d’archivage automatique de lives Twitch. Un utilisateur authentifié peut suivre jusqu’à dix chaînes. Les événements Twitch créent une capture mutualisée, traitée par un worker Docker (deux jobs simultanés maximum), puis envoyée sur YouTube et rendue accessible dans la bibliothèque web.

```text
Twitch EventSub → Convex → file avec leases → worker VPS
                 → Streamlink/FFmpeg → YouTube → Recastly
```

## Applications

- `apps/web` : TanStack Start, React, Better Auth, PostHog et interface Recastly.
- `packages/backend/convex` : schéma, contrôle d’accès, EventSub, file de jobs et réconciliation Twitch.
- `apps/worker` : capture, segmentation 6 h, remux MP4 et upload YouTube reprenable.

Les fichiers vidéo ne transitent jamais par Convex. Ils restent sur le volume persistant du worker jusqu’à confirmation de l’upload, ou pendant 48 heures en cas d’échec.

## Développement

```bash
bun install
bun run dev:setup
bun run dev
```

Le frontend répond par défaut sur `http://localhost:3001`. Copiez les variables de `packages/backend/.env.example` vers `packages/backend/.env.local`, celles requises par `apps/web` vers `apps/web/.env`, et `apps/worker/.env.example` vers `apps/worker/.env`.

## Intégrations

### Twitch

Créez une application Twitch, configurez `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET` et un secret EventSub aléatoire. `TWITCH_EVENTSUB_CALLBACK_URL` doit viser l’URL HTTP publique Convex suivie de `/twitch/eventsub`.

La réconciliation Convex s’exécute toutes les quinze minutes. Elle restaure les abonnements manquants et détecte les lives qui auraient échappé à EventSub.

### Worker et YouTube

Le refresh token YouTube est uniquement stocké dans l’environnement du worker. Le secret `WORKER_API_SECRET` doit être identique côté Convex et worker.

```bash
docker compose up -d --build worker
```

Le worker nécessite au moins 20 Go libres. Sous ce seuil, il termine ses tâches actives mais ne réclame plus de nouvelles captures. Les vidéos sont privées par défaut. Le mode `unlisted` n’est accepté que lorsque ces deux variables sont présentes :

```text
YOUTUBE_PRIVACY_STATUS=unlisted
YOUTUBE_UNLISTED_AUDITED=true
```

## Garde-fous

- `CAPTURE_ENABLED=false` coupe globalement la création et la prise de nouveaux jobs.
- Une seule capture est créée par identifiant de live Twitch.
- Les droits d’accès sont figés au démarrage du live ; un nouvel abonnement ne donne aucun accès rétroactif.
- Se désabonner conserve les archives existantes.
- La suppression d’un compte retire ses accès et met en file la suppression YouTube lorsqu’aucun accès ne subsiste.
- Aucun flux DRM, réservé aux abonnés ou protégé n’est contourné.

## Validation

```bash
bun run test
bun run check-types
bun run build
```

Une validation réelle nécessite une chaîne Twitch de test, une chaîne YouTube autorisée pour les vidéos longues et un VPS disposant de Streamlink/FFmpeg (fournis par l’image Docker).
