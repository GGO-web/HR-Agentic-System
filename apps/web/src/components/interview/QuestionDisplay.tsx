import { useState } from "react"

interface QuestionDisplayProps {
  question: string
  questionNumber: number
}

export function QuestionDisplay({
  question,
  questionNumber,
}: QuestionDisplayProps) {
  const [isTextVisible, setIsTextVisible] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  // Function to speak the question using text-to-speech
  const speakQuestion = () => {
    if ("speechSynthesis" in window) {
      const speech = new SpeechSynthesisUtterance(question)
      speech.lang = "en-US"
      speech.rate = 0.9
      speech.pitch = 1

      speech.onstart = () => setIsPlaying(true)
      speech.onend = () => setIsPlaying(false)
      speech.onerror = () => setIsPlaying(false)

      window.speechSynthesis.cancel() // Cancel any ongoing speech
      window.speechSynthesis.speak(speech)
    }
  }

  return (
    <div className="border-border bg-card rounded-lg border p-6 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Question {questionNumber}</h2>
        <div className="flex gap-2">
          <button
            onClick={speakQuestion}
            className="bg-secondary text-secondary-foreground flex items-center rounded-md px-3 py-1 text-sm"
            disabled={isPlaying}
          >
            {isPlaying ? "Speaking..." : "Play Question"}
          </button>
          <button
            onClick={() => setIsTextVisible(!isTextVisible)}
            className="bg-muted rounded-md px-3 py-1 text-sm"
          >
            {isTextVisible ? "Hide Text" : "Show Text"}
          </button>
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
            Click "Show Text" to reveal the question or "Play Question" to hear
            it.
          </p>
        </div>
      )}
    </div>
  )
}
