import { contextBridge, ipcRenderer } from "electron";
import type { MeetingSession, ProviderStatus } from "../shared/types";

const api = {
  startSession: (): Promise<MeetingSession> => ipcRenderer.invoke("meeting:start"),
  stopSession: (id: string): Promise<MeetingSession> => ipcRenderer.invoke("meeting:stop", id),
  appendTranscript: (id: string, text: string, source: "whisper" | "manual" = "whisper"): Promise<MeetingSession> => ipcRenderer.invoke("meeting:append-transcript", id, text, source),
  listRecent: (limit = 10): Promise<MeetingSession[]> => ipcRenderer.invoke("meeting:list-recent", limit),
  clearSessions: (): Promise<void> => ipcRenderer.invoke("meeting:clear"),
  providerStatus: (): Promise<ProviderStatus> => ipcRenderer.invoke("provider:status")
};

contextBridge.exposeInMainWorld("meetingCopilot", api);
