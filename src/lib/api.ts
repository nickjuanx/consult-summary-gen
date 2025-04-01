
import { ApiResponse } from "@/types";

// This class would need the actual API key from Groq
export class GroqApiService {
  private apiKey: string | null = null;
  private baseUrl = "https://api.groq.com/openai/v1";

  constructor(apiKey?: string) {
    if (apiKey) {
      this.apiKey = apiKey;
    }
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  getApiKey(): string | null {
    return this.apiKey;
  }

  hasApiKey(): boolean {
    return this.apiKey !== null && this.apiKey.trim() !== '';
  }

  // Transcribe audio using Whisper
  async transcribeAudio(audioBlob: Blob): Promise<ApiResponse> {
    if (!this.hasApiKey()) {
      return { success: false, error: "API key not set" };
    }

    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");
      formData.append("model", "whisper-large-v3");

      const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          // No Content-Type header for FormData
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error?.message || "Transcription failed" };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("Transcription error:", error);
      return { success: false, error: "Failed to transcribe audio" };
    }
  }

  // Generate summary using Groq's LLM
  async generateSummary(transcription: string): Promise<ApiResponse> {
    if (!this.hasApiKey()) {
      return { success: false, error: "API key not set" };
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [
            {
              role: "system",
              content: "You are a medical assistant. Extract and summarize the key medical information from the following consultation transcript. Include: patient's main complaints, symptoms, relevant medical history, diagnosis if mentioned, and treatment plan. Be concise but thorough with medical details."
            },
            {
              role: "user",
              content: transcription
            }
          ],
          temperature: 0.3,
          max_tokens: 1024
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error?.message || "Summary generation failed" };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("Summary generation error:", error);
      return { success: false, error: "Failed to generate summary" };
    }
  }
}

// Create and export a singleton instance
export const groqApi = new GroqApiService();
