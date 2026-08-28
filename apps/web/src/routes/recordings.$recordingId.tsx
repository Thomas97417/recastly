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
import { PageContainer } from "@/components/page-shell";
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
      <PageContainer className="max-w-6xl">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-96" />
      </PageContainer>
    );

  return (
    <PageContainer className="max-w-6xl">
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
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-6 shadow-xs sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Archive Twitch
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
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
        </div>
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
        <div className="flex gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-5 text-sm shadow-xs">
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
            <div className="space-y-6">
              {recording.parts.map((part, index) => (
                <article
                  key={part._id}
                  className="relative grid gap-5 rounded-2xl bg-muted/30 p-5 pl-11 lg:grid-cols-[0.8fr_1.4fr]"
                >
                  <div className="absolute left-5 top-6 size-3 rounded-full border-2 border-background bg-primary ring-2 ring-primary/15" />
                  {index < recording.parts.length - 1 && (
                    <div className="absolute -bottom-6 left-[1.58rem] top-9 w-px bg-border" />
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
                        <div className="aspect-video overflow-hidden rounded-2xl border border-border/70 bg-black shadow-md">
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
                      <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed bg-background/55 px-6 text-center text-sm text-muted-foreground">
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
    </PageContainer>
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
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs">
      <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        <Icon className="size-4" />
      </span>
      <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-medium">{value}</p>
    </div>
  );
}
