import { app, BrowserWindow, ipcMain } from "electron";
import { join } from "node:path";
import { getProvider } from "./providers";
import { MeetingStore } from "./store";

let window: BrowserWindow | null = null;
let store: MeetingStore;

const registerIpc = (): void => {
  ipcMain.handle("meeting:start", () => store.start());
  ipcMain.handle("meeting:stop", (_event, id: unknown) => {
    if (typeof id !== "string") throw new Error("A session id is required");
    return store.stop(id);
  });
  ipcMain.handle("meeting:append-transcript", (_event, id: unknown, text: unknown, source: unknown) => {
    if (typeof id !== "string" || typeof text !== "string") throw new Error("A session id and transcript text are required");
    const transcriptSource = source === "manual" ? "manual" : "whisper";
    return store.appendTranscript(id, text, transcriptSource);
  });
  ipcMain.handle("meeting:list-recent", (_event, limit: unknown) => store.recent(typeof limit === "number" ? limit : 10));
  ipcMain.handle("meeting:clear", () => store.clear());
  ipcMain.handle("provider:status", () => getProvider().status());
};

const createWindow = (): void => {
  window = new BrowserWindow({
    width: 440,
    height: 680,
    minWidth: 360,
    minHeight: 480,
    webPreferences: { preload: join(__dirname, "../preload/preload.js"), contextIsolation: true, nodeIntegration: false }
  });
  void window.loadFile(join(__dirname, "../renderer/index.html"));
  window.on("closed", () => { window = null; });
};

app.whenReady().then(() => {
  store = new MeetingStore();
  registerIpc();
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
}).catch((error: unknown) => {
  console.error("Unable to start meeting copilot:", error);
  app.quit();
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
