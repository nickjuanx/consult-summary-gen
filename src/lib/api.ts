
import { ApiResponse } from "@/types";
import { supabase } from "@/integrations/supabase/client";

// Esta clase usará la API key compartida desde Supabase
export class GroqApiService {
  private apiKey: string | null = null;
  private baseUrl = "https://api.groq.com/openai/v1";

  constructor(apiKey?: string) {
    if (apiKey) {
      this.apiKey = apiKey;
    }
  }

  async fetchSharedApiKey(): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('shared_api_keys')
        .select('api_key')
        .eq('service_name', 'groq')
        .single();

      if (error) {
        console.error("Error al obtener la clave API compartida:", error);
        return null;
      }

      return data?.api_key || null;
    } catch (error) {
      console.error("Error en fetchSharedApiKey:", error);
      return null;
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
    // Si no hay API key, intentar obtenerla de Supabase
    if (!this.hasApiKey()) {
      const sharedKey = await this.fetchSharedApiKey();
      if (sharedKey) {
        this.setApiKey(sharedKey);
      } else {
        return { success: false, error: "No se pudo obtener la clave API" };
      }
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
        return { success: false, error: errorData.error?.message || "La transcripción falló" };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("Error de transcripción:", error);
      return { success: false, error: "No se pudo transcribir el audio" };
    }
  }

  // Generate summary using Groq's LLM
  async generateSummary(transcription: string): Promise<ApiResponse> {
    // Si no hay API key, intentar obtenerla de Supabase
    if (!this.hasApiKey()) {
      const sharedKey = await this.fetchSharedApiKey();
      if (sharedKey) {
        this.setApiKey(sharedKey);
      } else {
        return { success: false, error: "No se pudo obtener la clave API" };
      }
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
              content: "Eres un asistente médico. Extrae y resume la información clave de la siguiente transcripción de consulta médica. IMPORTANTE: Incluye SIEMPRE los siguientes datos personales del paciente si están mencionados: nombre completo, DNI, teléfono, correo electrónico, edad, y cualquier otra información de contacto o identificación. Además, incluye: quejas principales del paciente, síntomas, historial médico relevante, diagnóstico si se menciona, y plan de tratamiento. El resumen debe ser conciso pero completo, con énfasis especial en los datos personales mencionados. Estructura el resultado en secciones claras empezando por 'DATOS PERSONALES:' seguido de las demás secciones médicas relevantes."
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
        return { success: false, error: errorData.error?.message || "La generación del resumen falló" };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("Error en la generación del resumen:", error);
      return { success: false, error: "No se pudo generar el resumen" };
    }
  }

  // Extract patient data from the summary
  extractPatientData(summary: string): {
    dni?: string;
    phone?: string;
    age?: string;
    email?: string;
  } {
    const data: {
      dni?: string;
      phone?: string;
      age?: string;
      email?: string;
    } = {};
    
    // Extract DNI (assuming formats like "DNI: 12345678" or similar)
    const dniMatch = summary.match(/DNI:?\s*(\d{7,9}[A-Za-z]?)/i);
    if (dniMatch) data.dni = dniMatch[1];
    
    // Extract phone number (assuming formats like "phone/teléfono: 123456789" or similar)
    const phoneMatch = summary.match(/tel[eé]fono:?\s*(\+?[\d\s\-]{6,15})/i);
    if (phoneMatch) data.phone = phoneMatch[1];
    
    // Extract age (assuming formats like "age/edad: 30" or similar)
    const ageMatch = summary.match(/edad:?\s*(\d{1,3})/i);
    if (ageMatch) data.age = ageMatch[1];
    
    // Extract email (assuming standard email format)
    const emailMatch = summary.match(/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/i);
    if (emailMatch) data.email = emailMatch[0];
    
    return data;
  }
}

// Create and export a singleton instance
export const groqApi = new GroqApiService();
