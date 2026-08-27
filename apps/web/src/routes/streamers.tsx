import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { ExternalLink, Loader2, Plus, Radio, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/streamers")({
  head: () => ({ meta: [{ title: "Streamers — Recastly" }, { name: "description", content: "Gérez les chaînes Twitch suivies." }] }),
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

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!input.trim()) return;
    setAdding(true);
    try {
      await addStreamer({ input });
      setInput("");
      toast.success("Chaîne ajoutée. La surveillance EventSub est active.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d’ajouter cette chaîne.");
    } finally {
      setAdding(false);
    }
  }

  async function remove(streamerId: NonNullable<NonNullable<typeof follows>[number]["streamer"]>["_id"]) {
    try {
      await removeFollow({ streamerId });
      toast.success("Chaîne retirée. Vos anciennes archives restent accessibles.");
    } catch {
      toast.error("Impossible de retirer cette chaîne.");
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-5 lg:p-8">
      <section>
        <p className="text-sm text-muted-foreground">Surveillance Twitch</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Vos streamers</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Ajoutez jusqu’à dix chaînes. Recastly mutualise automatiquement une capture lorsqu’un streamer est suivi par plusieurs personnes.</p>
      </section>

      <Card>
        <CardHeader><CardTitle>Ajouter une chaîne</CardTitle><CardDescription>Collez un login, @login ou une URL twitch.tv.</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
            <Input value={input} onChange={(event) => setInput(event.target.value)} placeholder="twitch.tv/nomdelachaine" aria-label="Login ou URL Twitch" disabled={adding || (follows?.length ?? 0) >= 10} />
            <Button type="submit" disabled={adding || !input.trim() || (follows?.length ?? 0) >= 10} className="shrink-0">
              {adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Ajouter
            </Button>
          </form>
          <div className="mt-3 flex justify-between text-xs text-muted-foreground"><span>Les archives antérieures ne sont jamais accordées rétroactivement.</span><span>{follows?.length ?? 0}/10</span></div>
        </CardContent>
      </Card>

      {!follows ? <div className="grid gap-3 sm:grid-cols-2">{[0, 1].map((item) => <Skeleton key={item} className="h-28" />)}</div> : follows.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center"><Users className="mx-auto size-8 text-muted-foreground/50" /><h2 className="mt-4 font-medium">Aucune chaîne suivie</h2><p className="mt-1 text-sm text-muted-foreground">Ajoutez un streamer pour commencer la surveillance.</p></div>
      ) : (
        <section className="grid gap-3 sm:grid-cols-2">
          {follows.map(({ followId, streamer }) => streamer && (
            <article key={followId} className="flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm">
              {streamer.avatarUrl ? <img src={streamer.avatarUrl} alt="" className="size-12 rounded-full object-cover" /> : <div className="flex size-12 items-center justify-center rounded-full bg-muted"><Users className="size-5" /></div>}
              <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate font-medium">{streamer.displayName}</p>{streamer.isLive && <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[0.65rem] font-medium text-red-600"><Radio className="size-3" /> LIVE</span>}</div><p className="mt-0.5 text-xs text-muted-foreground">@{streamer.login} · EventSub {streamer.eventSubStatus}</p></div>
              <a href={`https://www.twitch.tv/${streamer.login}`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground" aria-label={`Ouvrir ${streamer.displayName} sur Twitch`}><ExternalLink className="size-4" /></a>
              <Button variant="ghost" size="icon-sm" onClick={() => void remove(streamer._id)} aria-label={`Ne plus suivre ${streamer.displayName}`}><Trash2 className="size-4" /></Button>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
