import { Button } from "@workspace/ui/components/button";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface QuestionDisplayProps {
  question: string;
  questionNumber: number;
}

export function QuestionDisplay({
  question,
  questionNumber,
}: QuestionDisplayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const { t } = useTranslation();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const getVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices.filter((voice) => voice.lang === "en-US"));
        // Optional: Log voices to the console to see what's available
        // console.log("Available voices:", availableVoices);
      }
    };

    // The 'voiceschanged' event fires when the list of voices is ready
    window.speechSynthesis.onvoiceschanged = getVoices;

    // Call it once initially in case the voices are already loaded
    getVoices();

    // Cleanup the event listener when the component unmounts
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Function to speak the question using text-to-speech
  const speakQuestion = () => {
    if ("speechSynthesis" in window) {
      const speech = new SpeechSynthesisUtterance(question);

      const customVoice = voices.find((voice) => voice.name === "Aaron");

      if (customVoice) {
        speech.voice = customVoice;
      }

      speech.onstart = () => setIsPlaying(true);
      speech.onend = () => setIsPlaying(false);
      speech.onerror = () => setIsPlaying(false);

      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      window.speechSynthesis.speak(speech);
    }
  };

  return (
    <div className="border-border bg-card rounded-lg border p-6 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {t("interview.questionDisplay.question")} {questionNumber}
        </h2>
        <div className="flex gap-2">
          <Button onClick={speakQuestion} disabled={isPlaying}>
            {isPlaying
              ? t("interview.questionDisplay.speaking")
              : t("interview.questionDisplay.playQuestion")}
          </Button>
        </div>
      </div>

      <div className="bg-muted rounded-md p-4">
        <p className="text-lg">{question}</p>
      </div>
    </div>
  );
}
