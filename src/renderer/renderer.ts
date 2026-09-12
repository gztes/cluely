import type { MeetingSession } from "../shared/types";

const status = document.querySelector<HTMLParagraphElement>("#status");
const provider = document.querySelector<HTMLParagraphElement>("#provider");
const active = document.querySelector<HTMLPreElement>("#active");
const history = document.querySelector<HTMLDivElement>("#history");
const startButton = document.querySelector<HTMLButtonElement>("#start");
const stopButton = document.querySelector<HTMLButtonElement>("#stop");
const transcript = document.querySelector<HTMLTextAreaElement>("#transcript");
const appendButton = document.querySelector<HTMLButtonElement>("#append");
const clearButton = document.querySelector<HTMLButtonElement>("#clear");

let activeSession: MeetingSession | null = null;

const showError = (error: unknown): void => {
  const message = error instanceof Error ? error.message : String(error);
  if (status) status.textContent = `Error: ${message}`;
};

const renderSession = (session: MeetingSession | null): void => {
  if (!active) return;
  if (!session) {
    active.textContent = "No active session.";
    return;
  }
  const entries = session.transcript.map((entry) => `[${new Date(entry.createdAt).toLocaleTimeString()}] ${entry.text}`).join("\n");
  active.textContent = `Started ${new Date(session.startedAt).toLocaleString()}\n${entries || "Waiting for a completed local Whisper transcript..."}`;
};

const refreshHistory = async (): Promise<void> => {
  const sessions = await window.meetingCopilot.listRecent();
  if (history) history.innerHTML = sessions.map((session) => `<article><strong>${new Date(session.startedAt).toLocaleString()}</strong><span>${session.transcript.length} transcript entr${session.transcript.length === 1 ? "y" : "ies"}${session.endedAt ? " · ended" : " · active"}</span></article>`).join("") || "<p>No saved sessions.</p>";
};

const refreshProvider = async (): Promise<void> => {
  const result = await window.meetingCopilot.providerStatus();
  if (provider) provider.textContent = `${result.provider}: ${result.configured ? (result.reachable ? "configured and reachable" : `configured, unavailable (${result.message})`) : result.message}`;
};

startButton?.addEventListener("click", async () => {
  try {
    activeSession = await window.meetingCopilot.startSession();
    renderSession(activeSession);
    startButton.disabled = true;
    stopButton && (stopButton.disabled = false);
    appendButton && (appendButton.disabled = false);
    if (status) status.textContent = "Session active. Local transcription can be appended.";
    await refreshHistory();
  } catch (error) { showError(error); }
});

stopButton?.addEventListener("click", async () => {
  if (!activeSession) return;
  try {
    activeSession = await window.meetingCopilot.stopSession(activeSession.id);
    renderSession(activeSession);
    startButton && (startButton.disabled = false);
    stopButton.disabled = true;
    appendButton && (appendButton.disabled = true);
    if (status) status.textContent = "Session stopped and saved locally.";
    await refreshHistory();
  } catch (error) { showError(error); }
});

appendButton?.addEventListener("click", async () => {
  if (!activeSession || !transcript) return;
  try {
    activeSession = await window.meetingCopilot.appendTranscript(activeSession.id, transcript.value, "whisper");
    transcript.value = "";
    renderSession(activeSession);
    await refreshHistory();
  } catch (error) { showError(error); }
});

clearButton?.addEventListener("click", async () => {
  try {
    await window.meetingCopilot.clearSessions();
    activeSession = null;
    renderSession(null);
    await refreshHistory();
    if (status) status.textContent = "Local session history cleared.";
  } catch (error) { showError(error); }
});

renderSession(null);
void Promise.all([refreshHistory(), refreshProvider()]).catch(showError);
