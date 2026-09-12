export type ProviderName = "ollama" | "claude";

export interface TranscriptEntry {
  id: string;
  text: string;
  createdAt: string;
  source: "whisper" | "manual";
}

export interface MeetingSession {
  id: string;
  startedAt: string;
  endedAt: string | null;
  transcript: TranscriptEntry[];
}

export interface ProviderStatus {
  provider: ProviderName;
  configured: boolean;
  reachable: boolean;
  message: string;
}
