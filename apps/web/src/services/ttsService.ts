export interface TTSOptions {
  cfgValue?: number;
  inferenceTimesteps?: number;
  normalize?: boolean;
  denoise?: boolean;
  retryBadcase?: boolean;
  retryBadcaseMaxTimes?: number;
  retryBadcaseRatioThreshold?: number;
}

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

  async generateSpeech(
    text: string,
    options: TTSOptions = {},
  ): Promise<TTSResponse> {
    // Check cache first
    const cacheKey = this.getCacheKey(text, options);
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
        text,
        cfg_value: options.cfgValue ?? 2.0,
        inference_timesteps: options.inferenceTimesteps ?? 10,
        normalize: options.normalize ?? true,
        denoise: options.denoise ?? true,
        retry_badcase: options.retryBadcase ?? true,
        retry_badcase_max_times: options.retryBadcaseMaxTimes ?? 3,
        retry_badcase_ratio_threshold:
          options.retryBadcaseRatioThreshold ?? 6.0,
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

  private getCacheKey(text: string, options: TTSOptions): string {
    const sortedOptions = Object.keys(options).sort((a, b) =>
      a.localeCompare(b),
    );
    return `${text}-${JSON.stringify(sortedOptions)}`;
  }

  private async urlToBlob(url: string): Promise<Blob> {
    const response = await fetch(url);
    return response.blob();
  }

  clearCache(): void {
    // Clean up object URLs
    this.audioCache.forEach((url) => URL.revokeObjectURL(url));
    this.audioCache.clear();
  }
}

export const ttsService = TTSService.getInstance();
