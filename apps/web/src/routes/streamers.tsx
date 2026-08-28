import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  ExternalLink,
  Loader2,
  Plus,
  Radio,
  Trash2,
  Twitch,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState, PageContainer, PageHeader } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/streamers")({
  head: () => ({
    meta: [
      { title: "Streamers — Recastly" },
      { name: "description", content: "Gérez les chaînes Twitch suivies." },
    ],
  }),
  beforeLoad: async ({ context }) => {
    if (!context.isAuthenticated) throw redirect({ to: "/sign-in" });
  },
  component: StreamersPage,
});

function StreamersPage() {
  const follows = useQuery(api.streamers.listMine);
  const addStreamer = useAction(api.twitch.addStreamer);
  const removeFollow = useMutation(api.streamers.removeFollow);
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);
  const followedCount = follows?.length ?? 0;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!input.trim()) return;
    setAdding(true);
    try {
      await addStreamer({ input });
      setInput("");
      toast.success("Chaîne ajoutée. La surveillance EventSub est active.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible d’ajouter cette chaîne.",
      );
    } finally {
      setAdding(false);
    }
  }

  async function remove(
    streamerId: NonNullable<
      NonNullable<typeof follows>[number]["streamer"]
    >["_id"],
  ) {
    try {
      await removeFollow({ streamerId });
      toast.success(
        "Chaîne retirée. Vos anciennes archives restent accessibles.",
      );
    } catch {
      toast.error("Impossible de retirer cette chaîne.");
    }
  }

  return (
    <PageContainer className="max-w-6xl">
      <PageHeader
        eyebrow="Surveillance Twitch"
        title="Vos streamers"
        description="Ajoutez les chaînes qui comptent pour vous. Recastly détecte leurs directs et mutualise automatiquement les captures."
        actions={
          <div className="rounded-full border border-border/70 bg-card px-4 py-2 text-sm shadow-xs">
            <span className="font-semibold tabular-nums">{followedCount}</span>
            <span className="text-muted-foreground"> / 10 chaînes</span>
          </div>
        }
      />

      <Card className="border-primary/15 bg-card/90">
        <div className="grid gap-2 lg:grid-cols-[0.65fr_1.35fr] lg:items-center">
          <CardHeader>
            <span className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <Twitch className="size-5" />
            </span>
            <CardTitle>Ajouter une chaîne</CardTitle>
            <CardDescription>
              Collez un login, @login ou une URL twitch.tv.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="twitch.tv/nomdelachaine"
                aria-label="Login ou URL Twitch"
                disabled={adding || followedCount >= 10}
              />
              <Button
                type="submit"
                disabled={adding || !input.trim() || followedCount >= 10}
                className="shrink-0"
              >
                {adding ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Ajouter
              </Button>
            </form>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Les archives antérieures ne sont jamais accordées rétroactivement.
            </p>
          </CardContent>
        </div>
      </Card>

      {!follows ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((item) => (
            <Skeleton key={item} className="h-32" />
          ))}
        </div>
      ) : follows.length === 0 ? (
        <EmptyState
          icon={<Users className="size-6" />}
          title="Aucune chaîne suivie"
          description="Ajoutez un streamer ci-dessus pour commencer la surveillance automatique de ses directs."
        />
      ) : (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Chaînes surveillées</h2>
            <p className="text-xs text-muted-foreground">
              La détection continue même lorsque vous êtes déconnecté.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {follows.map(
              ({ followId, streamer }) =>
                streamer && (
                  <article
                    key={followId}
                    className="group flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-xs transition hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
                  >
                    <div className="relative shrink-0">
                      {streamer.avatarUrl ? (
                        <img
                          src={streamer.avatarUrl}
                          alt=""
                          className="size-14 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                          <Users className="size-5" />
                        </div>
                      )}
                      {streamer.isLive && (
                        <span className="absolute -bottom-1 -right-1 size-4 rounded-full border-[3px] border-card bg-red-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">
                          {streamer.displayName}
                        </p>
                        {streamer.isLive && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[0.62rem] font-bold text-red-600 dark:text-red-300">
                            <Radio className="size-2.5" /> LIVE
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        @{streamer.login}
                      </p>
                      <p className="mt-1.5 text-[0.68rem] text-muted-foreground/75">
                        EventSub · {streamer.eventSubStatus}
                      </p>
                    </div>
                    <a
                      href={`https://www.twitch.tv/${streamer.login}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
                      aria-label={`Ouvrir ${streamer.displayName} sur Twitch`}
                    >
                      <ExternalLink className="size-4" />
                    </a>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => void remove(streamer._id)}
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Ne plus suivre ${streamer.displayName}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </article>
                ),
            )}
          </div>
        </section>
      )}
    </PageContainer>
  );
}
