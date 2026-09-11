import type { MeetingSession, ProviderStatus } from "../shared/types";

interface MeetingCopilotApi {
  startSession(): Promise<MeetingSession>;
  stopSession(id: string): Promise<MeetingSession>;
  appendTranscript(id: string, text: string, source?: "whisper" | "manual"): Promise<MeetingSession>;
  listRecent(limit?: number): Promise<MeetingSession[]>;
  clearSessions(): Promise<void>;
  providerStatus(): Promise<ProviderStatus>;
}

declare global {
  interface Window {
    meetingCopilot: MeetingCopilotApi;
  }
}

export {};
