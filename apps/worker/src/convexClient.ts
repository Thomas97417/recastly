import type { PartUpdate, RecordingJob, RecordingState } from "./types";

export class ConvexWorkerClient {
  constructor(
    private readonly baseUrl: string,
    private readonly secret: string,
    readonly workerId: string,
  ) {}

  private async post<T>(path: string, body: unknown = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`Convex worker API ${path}: ${response.status} ${await response.text()}`);
    }
    return (await response.json()) as T;
  }

  async claim(): Promise<RecordingJob | null> {
    const { job } = await this.post<{ job: RecordingJob | null }>("/worker/jobs/claim", {
      workerId: this.workerId,
    });
    return job;
  }

  async heartbeat(recordingId: string): Promise<boolean> {
    const { ok } = await this.post<{ ok: boolean }>("/worker/jobs/heartbeat", {
      recordingId,
      workerId: this.workerId,
    });
    return ok;
  }

  async updateJob(
    recordingId: string,
    state: RecordingState,
    details: { actualQuality?: string; error?: string } = {},
  ): Promise<void> {
    await this.post("/worker/jobs/update", {
      recordingId,
      workerId: this.workerId,
      state,
      ...details,
    });
  }

  async upsertPart(part: Omit<PartUpdate, "workerId">): Promise<void> {
    await this.post("/worker/parts/upsert", { ...part, workerId: this.workerId });
  }

  async claimDeletion(): Promise<{ deletionId: string; youtubeVideoId: string } | null> {
    const { job } = await this.post<{
      job: { deletionId: string; youtubeVideoId: string } | null;
    }>("/worker/deletions/claim");
    return job;
  }

  async completeDeletion(
    deletionId: string,
    success: boolean,
    error?: string,
  ): Promise<void> {
    await this.post("/worker/deletions/complete", { deletionId, success, error });
  }
}
