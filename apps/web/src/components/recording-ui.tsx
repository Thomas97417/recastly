import { AlertTriangle, CheckCircle2, CircleDashed, Clock3, Radio, UploadCloud } from "lucide-react";

const stateMeta: Record<string, { label: string; className: string; icon: typeof Radio }> = {
  queued: { label: "En attente", className: "bg-amber-500/10 text-amber-700 dark:text-amber-300", icon: Clock3 },
  recording: { label: "Capture", className: "bg-red-500/10 text-red-700 dark:text-red-300", icon: Radio },
  uploading: { label: "Envoi", className: "bg-blue-500/10 text-blue-700 dark:text-blue-300", icon: UploadCloud },
  processing: { label: "Traitement", className: "bg-violet-500/10 text-violet-700 dark:text-violet-300", icon: CircleDashed },
  ready: { label: "Prête", className: "bg-primary/10 text-primary", icon: CheckCircle2 },
  missed: { label: "Manquée", className: "bg-muted text-muted-foreground", icon: Clock3 },
  failed: { label: "Échec", className: "bg-destructive/10 text-destructive", icon: AlertTriangle },
};

export function StateBadge({ state }: { state: string }) {
  const meta = stateMeta[state] ?? stateMeta.processing!;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-medium ${meta.className}`}>
      <Icon className={state === "processing" ? "size-3 animate-spin" : "size-3"} />
      {meta.label}
    </span>
  );
}

export function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export function formatDuration(seconds?: number) {
  if (!seconds) return "—";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours} h ${String(minutes).padStart(2, "0")}` : `${minutes} min`;
}
