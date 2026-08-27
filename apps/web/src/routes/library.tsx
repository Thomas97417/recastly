import { useMemo, useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import type { Id } from "@my-better-t-app/backend/convex/_generated/dataModel";
import { CalendarDays, ChevronRight, Library as LibraryIcon, Play, Search } from "lucide-react";

import { StateBadge, formatDate, formatDuration } from "@/components/recording-ui";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type RecordingState = "queued" | "recording" | "uploading" | "processing" | "ready" | "missed" | "failed";

export const Route = createFileRoute("/library")({
  head: () => ({ meta: [{ title: "Bibliothèque — Recastly" }, { name: "description", content: "Vos archives Twitch accessibles." }] }),
  beforeLoad: async ({ context }) => {
    if (!context.isAuthenticated) throw redirect({ to: "/sign-in" });
  },
  component: LibraryPage,
});

function LibraryPage() {
  const streamers = useQuery(api.streamers.listMine);
  const [state, setState] = useState<RecordingState | "">("");
  const [streamerId, setStreamerId] = useState("");
  const [search, setSearch] = useState("");
  const recordings = useQuery(api.recordings.listLibrary, {
    state: state || undefined,
    streamerId: streamerId ? (streamerId as Id<"streamers">) : undefined,
  });
  const filtered = useMemo(() => recordings?.filter((recording) => {
    const value = `${recording.streamer?.displayName ?? ""} ${recording.title ?? ""}`.toLowerCase();
    return value.includes(search.trim().toLowerCase());
  }), [recordings, search]);

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-5 lg:p-8">
      <section><p className="text-sm text-muted-foreground">Vos archives</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Bibliothèque</h1><p className="mt-2 text-sm text-muted-foreground">Les parties prêtes sont lues depuis la chaîne YouTube du projet.</p></section>
      <section className="grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-[1fr_180px_180px]">
        <label className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un titre…" className="pl-9" /></label>
        <select value={streamerId} onChange={(event) => setStreamerId(event.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="">Tous les streamers</option>{streamers?.map(({ followId, streamer }) => streamer && <option key={followId} value={streamer._id}>{streamer.displayName}</option>)}</select>
        <select value={state} onChange={(event) => setState(event.target.value as RecordingState | "")} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="">Tous les états</option><option value="ready">Prêtes</option><option value="recording">En capture</option><option value="uploading">En envoi</option><option value="processing">En traitement</option><option value="queued">En attente</option><option value="missed">Manquées</option><option value="failed">Échecs</option></select>
      </section>

      {!filtered ? <div className="space-y-3">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-36" />)}</div> : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-14 text-center"><LibraryIcon className="mx-auto size-9 text-muted-foreground/50" /><h2 className="mt-4 font-medium">Aucune archive à afficher</h2><p className="mt-1 text-sm text-muted-foreground">Les nouveaux lives apparaîtront ici dès leur détection.</p></div>
      ) : <section className="space-y-3">{filtered.map((recording) => (
        <Link key={recording._id} to="/recordings/$recordingId" params={{ recordingId: recording._id }} className="group grid gap-4 rounded-2xl border bg-card p-5 shadow-sm transition hover:border-primary/30 hover:shadow-md sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted">{recording.state === "ready" ? <Play className="size-5 text-primary" /> : <CalendarDays className="size-5 text-muted-foreground" />}</div>
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-medium">{recording.streamer?.displayName ?? "Streamer Twitch"}</h2><StateBadge state={recording.state} /></div><p className="mt-1 truncate text-sm text-muted-foreground">{recording.title || `Live du ${formatDate(recording.twitchStartedAt)}`}</p><p className="mt-2 text-xs text-muted-foreground">{formatDate(recording.twitchStartedAt)} · {recording.parts.length} partie{recording.parts.length > 1 ? "s" : ""} · {formatDuration(recording.parts.reduce((total, part) => total + (part.durationSeconds ?? 0), 0))}</p></div>
          <ChevronRight className="hidden size-5 text-muted-foreground transition-transform group-hover:translate-x-1 sm:block" />
        </Link>
      ))}</section>}
    </main>
  );
}
