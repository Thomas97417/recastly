import { mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";

export interface CaptureResult {
  quality: string;
  segments: string[];
}

export interface StreamCaptureAdapter {
  capture(twitchLogin: string, outputDir: string): Promise<CaptureResult>;
  remux(inputPath: string, outputPath: string): Promise<void>;
  duration(inputPath: string): Promise<number | undefined>;
}

export function selectQuality(available: string[]): string {
  const candidates = available
    .map((name) => ({ name, height: Number(name.match(/(\d{3,4})p/)?.[1]) }))
    .filter((item) => Number.isFinite(item.height));
  const capped = candidates
    .filter((item) => item.height <= 720)
    .sort((a, b) => b.height - a.height)[0];
  if (capped) return capped.name;
  const lowest = candidates.sort((a, b) => a.height - b.height)[0];
  return lowest?.name ?? "worst";
}

export function buildStreamlinkCommand(url: string, quality: string): string[] {
  return [
    "streamlink",
    "--stdout",
    "--retry-streams",
    "10",
    "--retry-max",
    "30",
    url,
    quality,
  ];
}

export function buildSegmentCommand(outputPattern: string): string[] {
  return [
    "ffmpeg",
    "-hide_banner",
    "-loglevel",
    "warning",
    "-i",
    "pipe:0",
    "-map",
    "0",
    "-c",
    "copy",
    "-f",
    "segment",
    "-segment_time",
    "21600",
    "-reset_timestamps",
    "1",
    outputPattern,
  ];
}

export function buildRemuxCommand(inputPath: string, outputPath: string): string[] {
  return [
    "ffmpeg",
    "-y",
    "-hide_banner",
    "-loglevel",
    "warning",
    "-i",
    inputPath,
    "-map",
    "0",
    "-c",
    "copy",
    "-movflags",
    "+faststart",
    outputPath,
  ];
}

async function run(command: string[]) {
  const process = Bun.spawn(command, { stdout: "pipe", stderr: "pipe" });
  const [exitCode, stderr] = await Promise.all([
    process.exited,
    new Response(process.stderr).text(),
  ]);
  if (exitCode !== 0) throw new Error(`${command[0]} failed (${exitCode}): ${stderr.slice(-1000)}`);
  return new Response(process.stdout).text();
}

export class StreamlinkCaptureAdapter implements StreamCaptureAdapter {
  private async qualities(url: string): Promise<string[]> {
    try {
      const output = await run(["streamlink", "--json", url]);
      const data = JSON.parse(await output) as { streams?: Record<string, unknown> };
      return Object.keys(data.streams ?? {});
    } catch {
      return ["worst"];
    }
  }

  async capture(twitchLogin: string, outputDir: string): Promise<CaptureResult> {
    await mkdir(outputDir, { recursive: true });
    const url = `https://www.twitch.tv/${twitchLogin}`;
    const quality = selectQuality(await this.qualities(url));
    const outputPattern = join(outputDir, "part-%03d.ts");
    const streamlink = Bun.spawn(buildStreamlinkCommand(url, quality), {
      stdout: "pipe",
      stderr: "inherit",
    });
    const ffmpeg = Bun.spawn(buildSegmentCommand(outputPattern), {
      stdin: streamlink.stdout,
      stdout: "inherit",
      stderr: "inherit",
    });
    const [streamlinkCode, ffmpegCode] = await Promise.all([
      streamlink.exited,
      ffmpeg.exited,
    ]);
    if (streamlinkCode !== 0 && ffmpegCode !== 0) {
      throw new Error(`Capture failed: streamlink=${streamlinkCode}, ffmpeg=${ffmpegCode}`);
    }
    const segments = (await readdir(outputDir))
      .filter((name) => /^part-\d+\.ts$/.test(name))
      .sort()
      .map((name) => join(outputDir, name));
    if (segments.length === 0) throw new Error("Capture ended without a media segment");
    return { quality, segments };
  }

  async remux(inputPath: string, outputPath: string): Promise<void> {
    await run(buildRemuxCommand(inputPath, outputPath));
  }

  async duration(inputPath: string): Promise<number | undefined> {
    try {
      const output = await run([
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        inputPath,
      ]);
      const value = Number((await output).trim());
      return Number.isFinite(value) ? value : undefined;
    } catch {
      return undefined;
    }
  }
}
