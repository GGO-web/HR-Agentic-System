import { useState, useEffect, useRef, useCallback } from "react"
import { useTranslation } from "react-i18next"

interface AudioRecorderProps {
  isRecording: boolean
  onStartRecording: () => void
  onStopRecording: () => void
  onRecordingComplete: (blob: Blob) => void
}

export function AudioRecorder({
  isRecording,
  onStartRecording,
  onStopRecording,
  onRecordingComplete,
}: AudioRecorderProps) {
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordingPermission, setRecordingPermission] = useState<
    boolean | null
  >(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const { t } = useTranslation()

  // Start recording function
  const startRecording = useCallback(async () => {
    try {
      audioChunksRef.current = []
      setRecordingTime(0)

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        })
        onRecordingComplete(audioBlob)

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())
      }

      // Start recording
      mediaRecorder.start()

      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1)
      }, 1000)
    } catch (error) {
      console.error("Error starting recording:", error)
    }
  }, [onRecordingComplete])

  // Stop recording function
  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop()

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  // Format recording time
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  // Request microphone permission
  useEffect(() => {
    async function requestPermission() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        })
        setRecordingPermission(true)

        // Clean up function to stop all tracks
        return () => {
          stream.getTracks().forEach((track) => track.stop())
        }
      } catch (error) {
        console.error("Error requesting microphone permission:", error)
        setRecordingPermission(false)
      }
    }

    void requestPermission()
  }, [])

  // Handle recording state changes
  useEffect(() => {
    if (!recordingPermission) return

    if (isRecording) {
      void startRecording()
    } else if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      stopRecording()
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording, recordingPermission, startRecording, stopRecording])

  // If permission is denied
  if (recordingPermission === false) {
    return (
      <div className="bg-destructive/10 text-destructive rounded-lg p-6 text-center">
        <p className="text-lg font-medium">
          {t("interview.audioRecorder.microphoneAccessDenied")}
        </p>
        <p className="mt-2">{t("interview.audioRecorder.enableMicrophone")}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <div className="border-primary mb-6 flex h-32 w-32 items-center justify-center rounded-full border-4">
        {isRecording ? (
          <div className="text-center">
            <div className="bg-destructive mx-auto mb-2 h-4 w-4 animate-pulse rounded-full"></div>
            <span className="text-xl font-bold">
              {formatTime(recordingTime)}
            </span>
          </div>
        ) : (
          <div className="text-muted-foreground text-center">
            <span>{t("interview.audioRecorder.ready")}</span>
          </div>
        )}
      </div>

      <button
        onClick={isRecording ? onStopRecording : onStartRecording}
        className={`rounded-md px-6 py-3 text-lg font-medium ${
          isRecording
            ? "bg-destructive text-destructive-foreground"
            : "bg-primary text-primary-foreground"
        }`}
        disabled={recordingPermission === null}
      >
        {isRecording
          ? t("interview.audioRecorder.stopRecording")
          : t("interview.audioRecorder.startRecording")}
      </button>

      {isRecording && (
        <p className="text-muted-foreground mt-4 text-sm">
          {t("interview.audioRecorder.stopRecordingHint")}
        </p>
      )}
    </div>
  )
}
