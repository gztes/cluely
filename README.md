# Local meeting copilot MVP

This is a bounded, local-first Electron meeting copilot. It stores meeting metadata and transcript entries as JSON in Electron's `userData` directory and uses a local Ollama-compatible HTTP endpoint by default.

## Development

```bash
npm install
npm run typecheck
npm run build
npm start
```

Copy `.env.example` to `.env` when running through a process that loads environment variables. Electron itself reads the process environment; the app does not read or upload secrets from disk. Keep `.env` out of release packages.

## Windows packaging

Build the TypeScript app and create both a Windows NSIS installer and a portable x64 executable:

```bash
npm install
npm run typecheck
npm run build
npm run package:win
```

The generated files are written to `release/`:

- `Local Meeting Copilot Setup 0.1.0.exe` — interactive NSIS installer
- `Local Meeting Copilot 0.1.0.exe` — portable executable

Installers can be run normally on Windows. The portable executable can be launched directly without installation. To run the app from source during development, use `npm start`; installed builds do not require Node.js or npm. The packaging configuration includes only compiled `dist/` assets and the production manifest, excludes `.env` files, and stores release artifacts in the ignored `release/` directory.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `OLLAMA_BASE_URL` | `http://127.0.0.1:11434` | Ollama-compatible API base URL |
| `OLLAMA_MODEL` | `llama3.2` | Local model used by the Ollama provider |
| `MEETING_PROVIDER` | `ollama` | `ollama` or optional `claude` |
| `ANTHROPIC_API_KEY` | unset | Required only for the optional Claude provider |
| `CLAUDE_MODEL` | `claude-3-5-sonnet-latest` | Optional Claude model |

The panel reports whether the selected provider is configured and reachable. Session JSON is written to:

```text
app.getPath("userData")/meeting-sessions.json
```

## Scope and privacy

- Meeting sessions and completed transcript entries remain local in the Electron user data directory.
- The default provider sends prompts only to the configured local Ollama endpoint.
- Claude is an explicit optional path and sends requests to Anthropic when configured.
- There is no calendar integration, system-audio capture, background recording, cloud transcript sync, or automatic upload.
- A completed local Whisper transcript can be appended to the active session through the existing preload API.
- This MVP does not include authentication, encryption at rest, multi-user storage, or retention scheduling. Protect the host account and user data directory accordingly.
