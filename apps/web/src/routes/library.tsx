import type { Id } from "@my-better-t-app/backend/convex/_generated/dataModel";

import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
  CalendarDays,
  ChevronRight,
  Library as LibraryIcon,
  Play,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState, PageContainer, PageHeader } from "@/components/page-shell";
import {
  StateBadge,
  formatDate,
  formatDuration,
} from "@/components/recording-ui";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type RecordingState =
  | "queued"
  | "recording"
  | "uploading"
  | "processing"
  | "ready"
  | "missed"
  | "failed";

const selectClassName =
  "h-10 w-full rounded-xl border border-input bg-background/75 px-3.5 text-sm text-foreground shadow-xs outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Bibliothèque — Recastly" },
      { name: "description", content: "Vos archives Twitch accessibles." },
    ],
  }),
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
  const filtered = useMemo(
    () =>
      recordings?.filter((recording) => {
        const value = `${recording.streamer?.displayName ?? ""} ${recording.title ?? ""}`.toLowerCase();
        return value.includes(search.trim().toLowerCase());
      }),
    [recordings, search],
  );

  return (
    <PageContainer className="max-w-6xl">
      <PageHeader
        eyebrow="Vos archives"
        title="Bibliothèque"
        description="Retrouvez chaque direct, suivez son traitement et lancez les parties déjà disponibles."
        actions={
          filtered && (
            <div className="rounded-full border border-border/70 bg-card px-4 py-2 text-sm shadow-xs">
              <span className="font-semibold tabular-nums">{filtered.length}</span>
              <span className="text-muted-foreground">
                {filtered.length > 1 ? " archives" : " archive"}
              </span>
            </div>
          )
        }
      />

      <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs sm:p-5">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <SlidersHorizontal className="size-3.5" /> Affiner la bibliothèque
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_190px_190px]">
          <label className="relative">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un titre ou un streamer…"
              className="pl-10"
            />
          </label>
          <select
            value={streamerId}
            onChange={(event) => setStreamerId(event.target.value)}
            className={selectClassName}
            aria-label="Filtrer par streamer"
          >
            <option value="">Tous les streamers</option>
            {streamers?.map(
              ({ followId, streamer }) =>
                streamer && (
                  <option key={followId} value={streamer._id}>
                    {streamer.displayName}
                  </option>
                ),
            )}
          </select>
          <select
            value={state}
            onChange={(event) =>
              setState(event.target.value as RecordingState | "")
            }
            className={selectClassName}
            aria-label="Filtrer par état"
          >
            <option value="">Tous les états</option>
            <option value="ready">Prêtes</option>
            <option value="recording">En capture</option>
            <option value="uploading">En envoi</option>
            <option value="processing">En traitement</option>
            <option value="queued">En attente</option>
            <option value="missed">Manquées</option>
            <option value="failed">Échecs</option>
          </select>
        </div>
      </section>

      {!filtered ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-36" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<LibraryIcon className="size-6" />}
          title="Aucune archive à afficher"
          description="Modifiez vos filtres ou attendez le prochain direct d’une chaîne suivie."
        />
      ) : (
        <section className="space-y-3">
          {filtered.map((recording) => {
            const duration = recording.parts.reduce(
              (total, part) => total + (part.durationSeconds ?? 0),
              0,
            );

            return (
              <Link
                key={recording._id}
                to="/recordings/$recordingId"
                params={{ recordingId: recording._id }}
                className="group grid gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-xs transition duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md sm:grid-cols-[88px_1fr_auto] sm:items-center sm:p-5"
              >
                <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-accent sm:aspect-square sm:w-[88px]">
                  <div className="absolute inset-0 bg-primary/5" />
                  {recording.state === "ready" ? (
                    <span className="relative flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                      <Play className="ml-0.5 size-4 fill-current" />
                    </span>
                  ) : (
                    <CalendarDays className="relative size-6 text-accent-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-semibold">
                      {recording.streamer?.displayName ?? "Streamer Twitch"}
                    </h2>
                    <StateBadge state={recording.state} />
                  </div>
                  <p className="mt-1.5 truncate text-sm text-muted-foreground">
                    {recording.title ||
                      `Live du ${formatDate(recording.twitchStartedAt)}`}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground/80">
                    {formatDate(recording.twitchStartedAt)} · {recording.parts.length}{" "}
                    partie{recording.parts.length > 1 ? "s" : ""} ·{" "}
                    {formatDuration(duration)}
                  </p>
                </div>
                <span className="hidden size-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition group-hover:bg-primary group-hover:text-primary-foreground sm:flex">
                  <ChevronRight className="size-4" />
                </span>
              </Link>
            );
          })}
        </section>
      )}
    </PageContainer>
  );
}
