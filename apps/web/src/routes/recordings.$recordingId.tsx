import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import type { Id } from "@my-better-t-app/backend/convex/_generated/dataModel";
import {
  AlertTriangle,
  ArrowLeft,
  Clock3,
  ExternalLink,
  HardDrive,
  Radio,
  Video,
} from "lucide-react";

import {
  StateBadge,
  formatDate,
  formatDuration,
} from "@/components/recording-ui";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/recordings/$recordingId")({
  head: () => ({
    meta: [
      { title: "Archive — Recastly" },
      { name: "description", content: "Détail d’une archive Twitch." },
    ],
  }),
  beforeLoad: async ({ context }) => {
    if (!context.isAuthenticated) throw redirect({ to: "/sign-in" });
  },
  component: RecordingDetailPage,
});

function RecordingDetailPage() {
  const { recordingId } = Route.useParams();
  const recording = useQuery(api.recordings.getDetail, {
    recordingId: recordingId as Id<"recordings">,
  });
  if (!recording)
    return (
      <main className="mx-auto max-w-6xl space-y-5 p-5 lg:p-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-96" />
      </main>
    );

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-5 lg:p-8">
      <Link
        to="/library"
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "-ml-2",
        })}
      >
        <ArrowLeft className="size-4" /> Bibliothèque
      </Link>
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              {recording.streamer?.displayName ?? "Archive Twitch"}
            </h1>
            <StateBadge state={recording.state} />
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {recording.title ||
              `Live du ${formatDate(recording.twitchStartedAt)}`}
          </p>
        </div>
        {recording.streamer && (
          <a
            href={`https://www.twitch.tv/${recording.streamer.login}`}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Twitch <ExternalLink className="size-3.5" />
          </a>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Info
          icon={Clock3}
          label="Début"
          value={formatDate(recording.twitchStartedAt)}
        />
        <Info
          icon={Radio}
          label="Fin"
          value={
            recording.twitchEndedAt
              ? formatDate(recording.twitchEndedAt)
              : "Live en cours"
          }
        />
        <Info
          icon={Video}
          label="Qualité réelle"
          value={recording.actualQuality ?? "En attente"}
        />
        <Info
          icon={HardDrive}
          label="Parties"
          value={String(recording.parts.length)}
        />
      </section>

      {recording.error && (
        <div className="flex gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-destructive">
              Incident de traitement
            </p>
            <p className="mt-1 text-muted-foreground">{recording.error}</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Chronologie des parties</CardTitle>
        </CardHeader>
        <CardContent>
          {recording.parts.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Aucune partie n’a encore été produite.
            </div>
          ) : (
            <div className="space-y-8">
              {recording.parts.map((part, index) => (
                <article
                  key={part._id}
                  className="relative grid gap-4 pl-8 lg:grid-cols-[1fr_1.4fr]"
                >
                  <div className="absolute left-1.5 top-1 size-3 rounded-full border-2 border-background bg-primary ring-1 ring-border" />
                  {index < recording.parts.length - 1 && (
                    <div className="absolute bottom-8 left-[0.7rem] top-4 w-px bg-border" />
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-medium">Partie {part.partNumber}</h2>
                      <StateBadge state={part.state} />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDate(part.startedAt)} ·{" "}
                      {formatDuration(part.durationSeconds)}
                      {part.sizeBytes
                        ? ` · ${(part.sizeBytes / 1024 ** 3).toFixed(2)} Go`
                        : ""}
                    </p>
                    {part.actualQuality && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Qualité : {part.actualQuality}
                      </p>
                    )}
                    {part.error && (
                      <p className="mt-2 text-xs text-destructive">
                        {part.error}
                      </p>
                    )}
                  </div>
                  <div>
                    {part.youtubeVideoId && part.state === "ready" ? (
                      <div>
                        <div className="aspect-video overflow-hidden rounded-xl border bg-black">
                          <iframe
                            src={`https://www.youtube-nocookie.com/embed/${part.youtubeVideoId}`}
                            title={`${recording.streamer?.displayName ?? "Archive"} — Partie ${part.partNumber}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="size-full"
                          />
                        </div>
                        {part.youtubeUrl && (
                          <a
                            href={part.youtubeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            Ouvrir sur YouTube{" "}
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed bg-muted/30 text-sm text-muted-foreground">
                        Vidéo indisponible pendant le traitement
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <Icon className="size-4 text-muted-foreground" />
      <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-medium">{value}</p>
    </div>
  );
}
