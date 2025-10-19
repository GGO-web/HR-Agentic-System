// TTS options are now handled entirely on the backend

export interface TTSResponse {
  audioBlob: Blob;
  audioUrl: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export class TTSService {
  private static instance: TTSService;
  private audioCache = new Map<string, string>();

  static getInstance(): TTSService {
    if (!TTSService.instance) {
      TTSService.instance = new TTSService();
    }
    return TTSService.instance;
  }

  async generateSpeech(text: string): Promise<TTSResponse> {
    // Check cache first
    const cacheKey = text; // Simple cache key based on text only
    if (this.audioCache.has(cacheKey)) {
      const cachedUrl = this.audioCache.get(cacheKey)!;
      return {
        audioBlob: await this.urlToBlob(cachedUrl),
        audioUrl: cachedUrl,
      };
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/tts/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text, // Only send text, let backend handle all configuration
      }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ detail: "Unknown error" }));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    // Cache the result
    this.audioCache.set(cacheKey, audioUrl);

    return { audioBlob, audioUrl };
  }

  // Cache key is now just the text since all options are handled on backend

  private async urlToBlob(url: string): Promise<Blob> {
    const response = await fetch(url);
    return response.blob();
  }

  clearCache(): void {
    // Clean up object URLs
    this.audioCache.forEach((url) => URL.revokeObjectURL(url));
    this.audioCache.clear();
  }

  // All TTS configuration is now handled on the backend
}

export const ttsService = TTSService.getInstance();
