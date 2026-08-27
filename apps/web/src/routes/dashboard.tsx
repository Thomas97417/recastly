import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { AlertTriangle, ArrowRight, Clock3, Library, Radio, UploadCloud, Users } from "lucide-react";

import { StateBadge, formatDate } from "@/components/recording-ui";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Vue d’ensemble — Recastly" }, { name: "description", content: "État de vos captures Twitch." }] }),
  beforeLoad: async ({ context }) => {
    if (!context.isAuthenticated) throw redirect({ to: "/sign-in" });
  },
  component: DashboardPage,
});

function DashboardPage() {
  const user = useCurrentUser();
  const data = useQuery(api.recordings.dashboard);

  if (!data) {
    return <div className="mx-auto max-w-7xl space-y-6 p-5 lg:p-8"><Skeleton className="h-20 w-full" /><Skeleton className="h-36 w-full" /><Skeleton className="h-72 w-full" /></div>;
  }

  const stats = [
    { label: "En direct", value: data.liveStreamers.length, icon: Radio, color: "text-red-500" },
    { label: "Captures actives", value: data.active.length, icon: Radio, color: "text-primary" },
    { label: "En attente", value: data.queued.length, icon: Clock3, color: "text-amber-500" },
    { label: "En traitement", value: data.processing.length, icon: UploadCloud, color: "text-blue-500" },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-8 p-5 lg:p-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Bonjour {user?.name?.split(" ")[0] ?? ""}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Tout est sous contrôle.</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full px-3 py-1.5 ${data.config.captureEnabled ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-destructive/10 text-destructive"}`}>
            Capture {data.config.captureEnabled ? "activée" : "désactivée"}
          </span>
          <span className="rounded-full border px-3 py-1.5">YouTube · {data.config.youtubePrivacy}</span>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="gap-3 py-5">
            <CardContent className="flex items-center justify-between px-5">
              <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p></div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-muted"><Icon className={`size-5 ${color}`} /></div>
            </CardContent>
          </Card>
        ))}
      </section>

      {data.followedCount === 0 ? (
        <section className="rounded-2xl border border-dashed p-10 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Users className="size-6" /></div>
          <h2 className="mt-4 text-lg font-medium">Ajoutez votre premier streamer</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Dès son prochain passage en direct, Recastly créera une archive et vous la retrouverez ici.</p>
          <Link to="/streamers" className={buttonVariants({ className: "mt-5" })}>Choisir une chaîne <ArrowRight className="size-4" /></Link>
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <Card>
            <CardHeader className="flex-row items-center justify-between"><CardTitle>Activité en cours</CardTitle><Link to="/library" className={buttonVariants({ variant: "ghost", size: "sm" })}>Bibliothèque <ArrowRight className="size-3.5" /></Link></CardHeader>
            <CardContent className="space-y-2">
              {[...data.active, ...data.queued, ...data.processing].length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground"><Library className="mx-auto mb-3 size-6 opacity-50" />Aucune capture en cours pour le moment.</div>
              ) : [...data.active, ...data.queued, ...data.processing].map((recording) => (
                <Link key={recording._id} to="/recordings/$recordingId" params={{ recordingId: recording._id }} className="flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/50">
                  <div className="min-w-0"><p className="truncate text-sm font-medium">{recording.streamer?.displayName}</p><p className="mt-1 truncate text-xs text-muted-foreground">{recording.title || formatDate(recording.twitchStartedAt)}</p></div>
                  <StateBadge state={recording.state} />
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Derniers incidents</CardTitle></CardHeader>
            <CardContent>
              {data.failures.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Aucun échec récent.</p> : (
                <div className="space-y-3">{data.failures.map((recording) => <div key={recording._id} className="rounded-xl bg-destructive/5 p-3"><div className="flex items-center gap-2 text-sm font-medium text-destructive"><AlertTriangle className="size-4" />{recording.streamer?.displayName}</div><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{recording.error}</p></div>)}</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
