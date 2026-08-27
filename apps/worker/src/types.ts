export type RecordingState =
  | "queued"
  | "recording"
  | "uploading"
  | "processing"
  | "ready"
  | "missed"
  | "failed";

export interface RecordingJob {
  recordingId: string;
  twitchLiveId: string;
  twitchStartedAt: number;
  title?: string;
  state: RecordingState;
  streamer: {
    twitchUserId: string;
    login: string;
    displayName: string;
  };
}

export interface PartUpdate {
  recordingId: string;
  workerId: string;
  partNumber: number;
  state: "recording" | "uploading" | "processing" | "ready" | "failed";
  startedAt: number;
  endedAt?: number;
  durationSeconds?: number;
  sizeBytes?: number;
  actualQuality?: string;
  youtubeVideoId?: string;
  youtubeUrl?: string;
  youtubePrivacy?: "private" | "unlisted";
  localFileName?: string;
  error?: string;
}
