import { useMutation } from "@tanstack/react-query";

import { ttsService, type TTSOptions } from "../services/ttsService";

// Generate speech mutation
export function useGenerateSpeech() {
  return useMutation({
    mutationFn: ({ text, options }: { text: string; options?: TTSOptions }) =>
      ttsService.generateSpeech(text, options),
    onError: (error) => {
      console.error("TTS generation failed:", error);
    },
  });
}
