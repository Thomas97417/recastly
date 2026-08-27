export const RECORDING_STATES = [
  "queued",
  "recording",
  "uploading",
  "processing",
  "ready",
  "missed",
  "failed",
] as const;

export type RecordingState = (typeof RECORDING_STATES)[number];

const transitions: Record<RecordingState, readonly RecordingState[]> = {
  queued: ["recording", "missed", "failed"],
  recording: ["uploading", "processing", "failed"],
  uploading: ["processing", "ready", "failed"],
  processing: ["uploading", "ready", "failed"],
  ready: [],
  missed: [],
  failed: ["queued"],
};

export function canTransition(
  from: RecordingState,
  to: RecordingState,
): boolean {
  return from === to || transitions[from].includes(to);
}

export function assertTransition(
  from: RecordingState,
  to: RecordingState,
): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid recording transition: ${from} -> ${to}`);
  }
}

export function normalizeTwitchLogin(input: string): string {
  const value = input.trim().toLowerCase();
  const match = value.match(
    /^(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([a-z0-9_]{4,25})(?:[/?#].*)?$/,
  );
  const login = match?.[1] ?? value.replace(/^@/, "");
  if (!/^[a-z0-9_]{4,25}$/.test(login)) {
    throw new Error("Saisissez un login Twitch ou une URL de chaîne valide.");
  }
  return login;
}

export function leaseIsAvailable(
  state: RecordingState,
  leaseExpiresAt: number | undefined,
  now: number,
): boolean {
  return state === "queued" ||
    ((state === "recording" || state === "uploading" || state === "processing") &&
      leaseExpiresAt !== undefined &&
      leaseExpiresAt <= now);
}

export function captureSlotAvailable(activeLeases: number, limit = 2): boolean {
  return activeLeases < limit;
}
