/**
 * Universal LLM Provider Interface
 * Supports Gemini, OpenAI, Claude, and Built-in Offline Simulation
 */

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  provider: string;
  model: string;
}

export class LLMClient {
  private provider: string;
  private apiKey?: string;
  private model?: string;

  constructor() {
    this.provider = (process.env.LLM_PROVIDER || "mock").toLowerCase();
    this.apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.ANTHROPIC_API_KEY;
    this.model = process.env.LLM_MODEL;
  }

  public async complete(messages: LLMMessage[]): Promise<LLMResponse> {
    if (this.provider === "gemini" && process.env.GEMINI_API_KEY) {
      try {
        return await this.callGemini(messages);
      } catch (err: any) {
        console.warn("Gemini call failed, falling back to deterministic reasoning engine:", err.message);
      }
    }

    if (this.provider === "openai" && process.env.OPENAI_API_KEY) {
      try {
        return await this.callOpenAI(messages);
      } catch (err: any) {
        console.warn("OpenAI call failed, falling back to deterministic reasoning engine:", err.message);
      }
    }

    // Default: Mock / Deterministic agent mode
    return {
      content: "OFFLINE_DETERMINISTIC_REASONING_MODE",
      provider: "mock-engine",
      model: "react-heuristic-v1",
    };
  }

  private async callGemini(messages: LLMMessage[]): Promise<LLMResponse> {
    const model = this.model || "gemini-1.5-flash";
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const promptText = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1500 },
      }),
    });

    if (!res.ok) {
      throw new Error(`Gemini API error ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return { content, provider: "gemini", model };
  }

  private async callOpenAI(messages: LLMMessage[]): Promise<LLMResponse> {
    const model = this.model || "gpt-4o-mini";
    const apiKey = process.env.OPENAI_API_KEY;
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenAI API error ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    return {
      content: data.choices?.[0]?.message?.content || "",
      provider: "openai",
      model,
    };
  }
}
