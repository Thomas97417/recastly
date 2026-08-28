import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  Library,
  Radio,
  Sparkles,
  UploadCloud,
  Users,
} from "lucide-react";

import { EmptyState, PageContainer, PageHeader } from "@/components/page-shell";
import { StateBadge, formatDate } from "@/components/recording-ui";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Vue d’ensemble — Recastly" },
      { name: "description", content: "État de vos captures Twitch." },
    ],
  }),
  beforeLoad: async ({ context }) => {
    if (!context.isAuthenticated) throw redirect({ to: "/sign-in" });
  },
  component: DashboardPage,
});

function DashboardPage() {
  const user = useCurrentUser();
  const data = useQuery(api.recordings.dashboard);

  if (!data) {
    return (
      <PageContainer>
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80 w-full" />
      </PageContainer>
    );
  }

  const stats = [
    {
      label: "En direct",
      value: data.liveStreamers.length,
      icon: Radio,
      style: "bg-red-500/10 text-red-600 dark:text-red-300",
    },
    {
      label: "Captures actives",
      value: data.active.length,
      icon: Sparkles,
      style: "bg-primary/10 text-primary",
    },
    {
      label: "En attente",
      value: data.queued.length,
      icon: Clock3,
      style: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    },
    {
      label: "En traitement",
      value: data.processing.length,
      icon: UploadCloud,
      style: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    },
  ];
  const currentActivity = [...data.active, ...data.queued, ...data.processing];

  return (
    <PageContainer>
      <PageHeader
        eyebrow={`Bonjour ${user?.name?.split(" ")[0] ?? ""}`}
        title="Tout est sous contrôle."
        description="Suivez l’activité de vos captures, les traitements en cours et la santé de votre bibliothèque."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold ${
                data.config.captureEnabled
                  ? "bg-primary/10 text-primary"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              <span className="size-1.5 rounded-full bg-current" />
              Capture {data.config.captureEnabled ? "activée" : "désactivée"}
            </span>
            <span className="rounded-full border border-border/70 bg-card px-3.5 py-2 text-xs font-medium text-muted-foreground shadow-xs">
              YouTube · {data.config.youtubePrivacy}
            </span>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, style }) => (
          <Card key={label} className="relative overflow-hidden py-5">
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-4xl font-semibold tracking-[-0.04em] tabular-nums">
                  {value}
                </p>
              </div>
              <div className={`flex size-12 items-center justify-center rounded-2xl ${style}`}>
                <Icon className="size-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {data.followedCount === 0 ? (
        <EmptyState
          icon={<Users className="size-6" />}
          title="Ajoutez votre premier streamer"
          description="Dès son prochain passage en direct, Recastly créera une archive et la rangera automatiquement dans votre bibliothèque."
          action={
            <Link to="/streamers" className={buttonVariants()}>
              Choisir une chaîne <ArrowRight />
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.45fr_0.75fr]">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Activité en cours</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Captures et traitements qui demandent encore de l’attention.
                </p>
              </div>
              <Link
                to="/library"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Tout voir <ArrowRight />
              </Link>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {currentActivity.length === 0 ? (
                <div className="rounded-2xl bg-muted/45 py-12 text-center text-sm text-muted-foreground">
                  <Library className="mx-auto mb-3 size-6 opacity-50" />
                  Aucune capture en cours pour le moment.
                </div>
              ) : (
                currentActivity.map((recording) => (
                  <Link
                    key={recording._id}
                    to="/recordings/$recordingId"
                    params={{ recordingId: recording._id }}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-border/65 bg-background/45 p-4 transition hover:border-primary/20 hover:bg-accent/35"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                        <Radio className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {recording.streamer?.displayName}
                        </p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {recording.title || formatDate(recording.twitchStartedAt)}
                        </p>
                      </div>
                    </div>
                    <StateBadge state={recording.state} />
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Derniers incidents</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Les erreurs récentes du pipeline.
              </p>
            </CardHeader>
            <CardContent>
              {data.failures.length === 0 ? (
                <div className="rounded-2xl bg-muted/45 px-4 py-12 text-center text-sm text-muted-foreground">
                  Aucun échec récent.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.failures.map((recording) => (
                    <div
                      key={recording._id}
                      className="rounded-2xl border border-destructive/15 bg-destructive/5 p-4"
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                        <AlertTriangle className="size-4" />
                        {recording.streamer?.displayName}
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {recording.error}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
