import { Button } from "@workspace/ui/components/button";
import { Volume2, VolumeX, Loader2, AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useGenerateSpeech } from "../../hooks/useTTSMutations";

interface QuestionDisplayProps {
  question: string;
  questionNumber: number;
}

export function QuestionDisplay({
  question,
  questionNumber,
}: QuestionDisplayProps) {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioElement = useRef<HTMLAudioElement>(null);

  const generateSpeechMutation = useGenerateSpeech();

  // Clean up audio URL when component unmounts
  useEffect(() => {
    return () => {
      if (currentAudioUrl) {
        URL.revokeObjectURL(currentAudioUrl);
      }
    };
  }, [currentAudioUrl]);

  // Reset audio state when question changes
  useEffect(() => {
    // Clean up previous audio URL
    if (currentAudioUrl) {
      URL.revokeObjectURL(currentAudioUrl);
    }

    // Reset state for new question
    setCurrentAudioUrl(null);
    setIsPlaying(false);
    setError(null);
  }, [question]);

  // Function to speak the question using VoxCPM TTS
  const speakQuestion = async () => {
    setError(null);

    try {
      // If we already have audio for this question, just play it
      if (currentAudioUrl) {
        playAudio(currentAudioUrl);
        return;
      }

      // Generate new audio using VoxCPM
      const result = await generateSpeechMutation.mutateAsync({
        text: question,
        options: {
          cfgValue: 2.0,
          inferenceTimesteps: 10,
          normalize: true,
          denoise: true,
        },
      });

      setCurrentAudioUrl(result.audioUrl);
      playAudio(result.audioUrl);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate speech";

      // If VoxCPM fails, fall back to browser TTS
      if (
        errorMessage.includes("503") ||
        errorMessage.includes("TTS service is not available")
      ) {
        console.warn("VoxCPM TTS unavailable, falling back to browser TTS");
        fallbackToBrowserTTS();
      } else {
        setError(errorMessage);
        console.error("Failed to generate speech:", err);
      }
    }
  };

  // Fallback to browser TTS
  const fallbackToBrowserTTS = () => {
    if ("speechSynthesis" in window) {
      const speech = new SpeechSynthesisUtterance(question);

      // Try to find a good English voice
      const voices = window.speechSynthesis.getVoices();
      const englishVoice =
        voices.find(
          (voice) =>
            voice.lang.startsWith("en") && voice.name.includes("Google"),
        ) || voices.find((voice) => voice.lang.startsWith("en"));

      if (englishVoice) {
        speech.voice = englishVoice;
      }

      speech.onstart = () => setIsPlaying(true);
      speech.onend = () => setIsPlaying(false);
      speech.onerror = () => {
        setIsPlaying(false);
        setError("Browser TTS also failed. Please check your audio settings.");
      };

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(speech);
    } else {
      setError("Text-to-speech is not supported in this browser.");
    }
  };

  // Function to play audio
  const playAudio = (audioUrl: string) => {
    audioElement.current = new Audio(audioUrl);

    setIsPlaying(true);

    audioElement.current.onended = () => {
      setIsPlaying(false);
    };

    audioElement.current.onerror = () => {
      setIsPlaying(false);
      setError("Failed to play audio");
    };

    audioElement.current.play().catch((error) => {
      setIsPlaying(false);
      setError(`Playback failed: ${error.message}`);
    });
  };

  // Function to stop audio playback
  const handleStopAudio = () => {
    // Stop all audio elements
    if (audioElement.current) {
      audioElement.current.pause();
      audioElement.current.currentTime = 0;
    }

    setIsPlaying(false);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <div className="border-border bg-card rounded-lg border p-6 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {t("interview.questionDisplay.question")} {questionNumber}
        </h2>
        <div className="flex gap-2">
          {isPlaying ? (
            <Button onClick={handleStopAudio} variant="outline">
              <VolumeX className="mr-2 h-4 w-4" />
              {t("interview.questionDisplay.stop")}
            </Button>
          ) : (
            <Button
              onClick={speakQuestion}
              disabled={generateSpeechMutation.isPending}
              variant="outline"
            >
              {generateSpeechMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("interview.questionDisplay.generating")}
                </>
              ) : (
                <>
                  <Volume2 className="mr-2 h-4 w-4" />
                  {t("interview.questionDisplay.playQuestion")}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
          <Button
            onClick={clearError}
            variant="ghost"
            size="sm"
            className="ml-auto h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
      )}

      <div className="bg-muted rounded-md p-4">
        <p className="text-lg">{question}</p>
      </div>
    </div>
  );
}
