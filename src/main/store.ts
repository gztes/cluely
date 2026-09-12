import { app } from "electron";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { MeetingSession, TranscriptEntry } from "../shared/types";

const emptyStore = (): MeetingSession[] => [];

export class MeetingStore {
  private readonly filePath = join(app.getPath("userData"), "meeting-sessions.json");

  private async read(): Promise<MeetingSession[]> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error("meeting-sessions.json must contain an array");
      return parsed as MeetingSession[];
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") return emptyStore();
      throw new Error(`Unable to read meeting sessions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async write(sessions: MeetingSession[]): Promise<void> {
    await mkdir(app.getPath("userData"), { recursive: true });
    const tempPath = `${this.filePath}.tmp`;
    await writeFile(tempPath, JSON.stringify(sessions, null, 2), "utf8");
    await rename(tempPath, this.filePath);
  }

  async start(): Promise<MeetingSession> {
    const sessions = await this.read();
    const session: MeetingSession = { id: crypto.randomUUID(), startedAt: new Date().toISOString(), endedAt: null, transcript: [] };
    await this.write([session, ...sessions]);
    return session;
  }

  async stop(id: string): Promise<MeetingSession> {
    const sessions = await this.read();
    const session = sessions.find((item) => item.id === id);
    if (!session) throw new Error("Meeting session not found");
    if (!session.endedAt) session.endedAt = new Date().toISOString();
    await this.write(sessions);
    return session;
  }

  async appendTranscript(id: string, text: string, source: TranscriptEntry["source"] = "whisper"): Promise<MeetingSession> {
    const normalized = text.trim();
    if (!normalized) throw new Error("Transcript text cannot be empty");
    const sessions = await this.read();
    const session = sessions.find((item) => item.id === id);
    if (!session) throw new Error("Meeting session not found");
    if (session.endedAt) throw new Error("Cannot append to an ended meeting session");
    session.transcript.push({ id: crypto.randomUUID(), text: normalized, createdAt: new Date().toISOString(), source });
    await this.write(sessions);
    return session;
  }

  async recent(limit = 10): Promise<MeetingSession[]> {
    return (await this.read()).slice(0, Math.max(1, Math.min(limit, 100)));
  }

  async clear(): Promise<void> {
    await this.write([]);
  }
}
