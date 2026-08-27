import { readdir, rm, stat, statfs } from "node:fs/promises";
import { join } from "node:path";

export async function hasEnoughFreeSpace(
  path: string,
  minimumFreeBytes: number,
): Promise<boolean> {
  const filesystem = await statfs(path);
  return filesystem.bavail * filesystem.bsize >= minimumFreeBytes;
}

export async function markFailed(directory: string): Promise<void> {
  await Bun.write(join(directory, ".failed-at"), String(Date.now()));
}

export async function cleanupExpiredFailures(
  dataDir: string,
  retentionMs = 48 * 60 * 60 * 1000,
): Promise<number> {
  let removed = 0;
  const entries = await readdir(dataDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const directory = join(dataDir, entry.name);
    try {
      const marker = await stat(join(directory, ".failed-at"));
      if (Date.now() - marker.mtimeMs >= retentionMs) {
        await rm(directory, { recursive: true });
        removed += 1;
      }
    } catch {
      // A directory without a failure marker is active or already cleaned.
    }
  }
  return removed;
}
