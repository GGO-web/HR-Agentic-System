import { Button } from "@workspace/ui/components/button";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface QuestionDisplayProps {
  question: string;
  questionNumber: number;
}

export function QuestionDisplay({
  question,
  questionNumber,
}: QuestionDisplayProps) {
  const [isTextVisible, setIsTextVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const { t } = useTranslation();

  // Function to speak the question using text-to-speech
  const speakQuestion = () => {
    if ("speechSynthesis" in window) {
      const speech = new SpeechSynthesisUtterance(question);
      speech.lang = "en-US";
      speech.rate = 0.9;
      speech.pitch = 1;

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
          <Button onClick={() => setIsTextVisible(!isTextVisible)}>
            {isTextVisible
              ? t("interview.questionDisplay.hideText")
              : t("interview.questionDisplay.showText")}
          </Button>
        </div>
      </div>

      {isTextVisible && (
        <div className="bg-muted rounded-md p-4">
          <p className="text-lg">{question}</p>
        </div>
      )}

      {!isTextVisible && (
        <div className="bg-muted flex h-20 items-center justify-center rounded-md">
          <p className="text-muted-foreground">
            {t("interview.questionDisplay.clickToReveal")}
          </p>
        </div>
      )}
    </div>
  );
}
