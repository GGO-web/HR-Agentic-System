import { api } from "@convex/_generated/api";
import { type Id } from "@convex/_generated/dataModel";
import { useConversation } from "@elevenlabs/react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { LoadingSpinner } from "@workspace/ui/components/shared/loading-spinner";
import { useQuery, useMutation } from "convex/react";
import { Mic, Volume2, Phone, PhoneOff } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

interface InterviewFlowProps {
  sessionId: Id<"interviewSessions">;
}

export function InterviewFlow({ sessionId }: InterviewFlowProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const { t } = useTranslation();

  // ElevenLabs state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch interview session
  const session = useQuery(api.interviewSessions.getById, { id: sessionId });

  // Fetch job description
  const jobDescription = useQuery(
    api.jobDescriptions.getById,
    session ? { id: session.jobDescriptionId } : "skip",
  );

  // Fetch questions for the job description
  const questions = useQuery(
    api.interviewQuestions.getByJobDescription,
    session ? { jobDescriptionId: session.jobDescriptionId } : "skip",
  );

  // Mutations
  const startSession = useMutation(api.interviewSessions.startSession);
  const completeSession = useMutation(api.interviewSessions.completeSession);

  // Initialize ElevenLabs conversation
  const conversation = useConversation({
    onConnect: () => {
      setIsConnected(true);
      setIsConnecting(false);
      toast.success(t("interview.elevenlabs.connected"));
    },
    onDisconnect: () => {
      setIsConnected(false);
      toast.info(t("interview.elevenlabs.disconnected"));
    },
    onError: (error) => {
      console.error("ElevenLabs conversation error:", error);
      toast.error(t("interview.elevenlabs.error"));
      setIsConnecting(false);
    },
    onStatusChange: (status) => {
      if (status.status === "connected") {
        setIsConnected(true);
        setIsConnecting(false);
      } else if (status.status === "disconnected") {
        setIsConnected(false);
        setIsConnecting(false);
      } else if (status.status === "disconnecting") {
        setIsConnected(false);
      }
    },
    serverLocation: "us",
  });

  // Start the session if it's not already started
  useEffect(() => {
    if (session && session.status === "scheduled") {
      void startSession({ id: sessionId });
    }
  }, [session, sessionId, startSession]);

  // ElevenLabs conversation functions
  const startElevenLabsConversation = useCallback(async () => {
    if (!import.meta.env.VITE_ELEVENLABS_AGENT_ID) {
      toast.error(t("interview.elevenlabs.noAgentId"));
      return;
    }

    setIsConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: import.meta.env.VITE_ELEVENLABS_AGENT_ID,
        connectionType: "websocket",
        userId: session?.candidateEmail || "anonymous",
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast.error(t("interview.elevenlabs.startFailed"));
      setIsConnecting(false);
    }
  }, [conversation, session, t]);

  const endElevenLabsConversation = useCallback(async () => {
    try {
      await conversation.endSession();
      setIsConnected(false);
      await completeSession({ id: sessionId });
      toast.success(t("interview.elevenlabs.completed"));
      await navigate({ to: router.routesByPath["/dashboard"].fullPath });
    } catch (error) {
      console.error("Failed to end conversation:", error);
      toast.error(t("interview.elevenlabs.endFailed"));
    }
  }, [conversation, sessionId, completeSession, navigate, router, t]);

  // Loading state
  if (!session || !jobDescription || !questions) {
    return <LoadingSpinner fullScreen text={t("interview.flow.loading")} />;
  }

  return (
    <div className="container mx-auto flex min-h-screen flex-col p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {jobDescription.title} {t("interview.flow.interview")}
        </h1>
      </div>

      {/* ElevenLabs Interview Interface */}
      <div className="flex flex-1 flex-col items-center justify-center">
        {!isConnected && !isConnecting && (
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-semibold">
              {t("interview.elevenlabs.readyToStart")}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t("interview.elevenlabs.description")}
            </p>
            <Button
              onClick={startElevenLabsConversation}
              size="lg"
              className="bg-primary hover:bg-primary/90"
            >
              <Phone className="mr-2 h-5 w-5" />
              {t("interview.elevenlabs.startInterview")}
            </Button>
          </div>
        )}

        {isConnecting && (
          <div className="text-center">
            <LoadingSpinner text={t("interview.elevenlabs.connecting")} />
            <p className="text-muted-foreground mt-4">
              {t("interview.elevenlabs.connectingDescription")}
            </p>
          </div>
        )}

        {isConnected && (
          <div className="w-full max-w-md text-center">
            {/* Status Indicator */}
            <div className="mb-6">
              <div className="inline-flex items-center rounded-full bg-green-100 px-4 py-2 text-green-800">
                <div className="mr-2 h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
                {t("interview.elevenlabs.connected")}
              </div>
            </div>

            {/* Agent Status */}
            <div className="mb-6">
              {conversation.isSpeaking ? (
                <div className="flex items-center justify-center text-blue-600">
                  <Volume2 className="mr-2 h-5 w-5 animate-pulse" />
                  {t("interview.elevenlabs.agentSpeaking")}
                </div>
              ) : (
                <div className="flex items-center justify-center text-green-600">
                  <Mic className="mr-2 h-5 w-5" />
                  {t("interview.elevenlabs.listening")}
                </div>
              )}
            </div>

            {/* End Interview Button */}
            <Button
              onClick={endElevenLabsConversation}
              variant="destructive"
              size="lg"
            >
              <PhoneOff className="mr-2 h-5 w-5" />
              {t("interview.elevenlabs.endInterview")}
            </Button>

            {/* Instructions */}
            <div className="text-muted-foreground mt-6 text-sm">
              <p>{t("interview.elevenlabs.instructions")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
