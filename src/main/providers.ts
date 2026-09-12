import type { ProviderName, ProviderStatus } from "../shared/types";

export interface ChatProvider {
  readonly name: ProviderName;
  chat(prompt: string): Promise<string>;
  status(): Promise<ProviderStatus>;
}

const trimBaseUrl = (value: string): string => value.replace(/\/+$/, "");

class OllamaProvider implements ChatProvider {
  readonly name = "ollama" as const;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor() {
    this.baseUrl = trimBaseUrl(process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434");
    this.model = process.env.OLLAMA_MODEL || "llama3.2";
  }

  async chat(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: this.model, messages: [{ role: "user", content: prompt }], stream: false })
    });
    if (!response.ok) throw new Error(`Ollama request failed (${response.status})`);
    const body = (await response.json()) as { message?: { content?: string } };
    if (!body.message?.content) throw new Error("Ollama returned no message content");
    return body.message.content;
  }

  async status(): Promise<ProviderStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return { provider: this.name, configured: true, reachable: response.ok, message: response.ok ? `Connected (${this.model})` : `HTTP ${response.status}` };
    } catch (error) {
      return { provider: this.name, configured: true, reachable: false, message: error instanceof Error ? error.message : "Unable to reach Ollama" };
    }
  }
}

class ClaudeProvider implements ChatProvider {
  readonly name = "claude" as const;
  private readonly apiKey = process.env.ANTHROPIC_API_KEY || "";
  private readonly model = process.env.CLAUDE_MODEL || "claude-3-5-sonnet-latest";

  async chat(prompt: string): Promise<string> {
    if (!this.apiKey) throw new Error("ANTHROPIC_API_KEY is required for the Claude provider");
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": this.apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: this.model, max_tokens: 1024, messages: [{ role: "user", content: prompt }] })
    });
    if (!response.ok) throw new Error(`Claude request failed (${response.status})`);
    const body = (await response.json()) as { content?: Array<{ text?: string }> };
    const text = body.content?.map((part) => part.text || "").join("").trim();
    if (!text) throw new Error("Claude returned no message content");
    return text;
  }

  async status(): Promise<ProviderStatus> {
    return { provider: this.name, configured: Boolean(this.apiKey), reachable: false, message: this.apiKey ? "Configured (reachability checked on request)" : "ANTHROPIC_API_KEY is not set" };
  }
}

export const getProvider = (): ChatProvider => process.env.MEETING_PROVIDER === "claude" ? new ClaudeProvider() : new OllamaProvider();
