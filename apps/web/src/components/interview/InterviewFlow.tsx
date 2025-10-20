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

import { END_INTERVIEW_MARKER } from "@/components/interview/-constants";

interface InterviewFlowProps {
  sessionId: Id<"interviewSessions">;
}

export function InterviewFlow({ sessionId }: InterviewFlowProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const { t } = useTranslation();

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [endRequested, setEndRequested] = useState(false);

  const session = useQuery(api.interviewSessions.getById, { id: sessionId });

  const jobDescription = useQuery(
    api.jobDescriptions.getById,
    session ? { id: session.jobDescriptionId } : "skip",
  );

  const questions = useQuery(
    api.interviewQuestions.getByJobDescription,
    session ? { jobDescriptionId: session.jobDescriptionId } : "skip",
  );

  const startSession = useMutation(api.interviewSessions.startSession);
  const completeSession = useMutation(api.interviewSessions.completeSession);

  const conversation = useConversation({
    overrides: {
      agent: {
        prompt: {
          prompt: `You are conducting a professional interview for the position: ${jobDescription?.title}.
            Hello ${session?.candidateEmail?.split("@")[0]}! I'm your AI interviewer for the ${jobDescription?.title} position. 
            I'll be asking you several specific questions today. Please speak clearly and take your time with each response.

            IMPORTANT: You must ask ONLY these specific questions in order. Do NOT ask about resume, experience, or any other topics not listed below. Do NOT make assumptions about the candidate's background.

            Here are the exact questions you must ask:

            ${questions
              ?.sort((a, b) => a.order - b.order)
              .map((q) => `${q.question}`)
              .join("\n")},

            Instructions:
            - Ask each question one at a time
            - Wait for the candidates complete response before moving to the next question
            - Do not ask follow-up questions unless the candidates response is unclear
            - Keep the interview focused and professional
            - Do not ask about resume, previous jobs, or experience unless specifically mentioned in the questions above

            When you have asked the LAST question and acknowledged the candidate's final response and user have no other questions for the conversation, end with exactly this marker on a new line: ${END_INTERVIEW_MARKER}
            `,
        },
        firstMessage: `Hello ${session?.candidateEmail?.split("@")[0]}! I'm your AI interviewer for the ${jobDescription?.title} position. 
I'll be asking you several specific questions today. Please speak clearly and take your time with each response. Let's begin with the first question!`,
        language: "en",
      },
    },
    onConnect: () => {
      setIsConnected(true);
      setIsConnecting(false);
      toast.success(t("interview.elevenlabs.connected"));
    },
    onDisconnect: () => {
      setIsConnected(false);
      toast.info(t("interview.elevenlabs.disconnected"));
    },
    onError: () => {
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
    onMessage: (message) => {
      if (endRequested) return;
      if (message.source !== "user" && typeof message.message === "string") {
        if (message.message.includes(END_INTERVIEW_MARKER)) {
          setEndRequested(true);
          void disconnectConversation();
        }
      }
    },
    serverLocation: "us",
  });

  const startConversation = useCallback(async () => {
    try {
      setIsConnecting(true);

      await navigator.mediaDevices.getUserMedia({ audio: true });

      await conversation.startSession({
        agentId: import.meta.env.VITE_ELEVENLABS_AGENT_ID,
        connectionType: "websocket",
        userId: session?.candidateEmail || "anonymous",
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast.error(t("interview.elevenlabs.startFailed"));
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, session, t]);

  const disconnectConversation = useCallback(async () => {
    try {
      await conversation.endSession();

      await completeSession({ id: sessionId });
      toast.success(t("interview.elevenlabs.completed"));

      await navigate({ to: router.routesByPath["/dashboard"].fullPath });
    } catch (error) {
      console.error("Failed to end conversation:", error);
      toast.error(t("interview.elevenlabs.endFailed"));
    } finally {
      setIsConnected(false);
    }
  }, [conversation, sessionId, completeSession, navigate, router, t]);

  useEffect(() => {
    if (session && session.status === "scheduled") {
      void startSession({ id: sessionId });
    }
  }, [session, sessionId, startSession]);

  // Loading state
  if (!session || !jobDescription || !questions) {
    return <LoadingSpinner fullScreen text={t("interview.flow.loading")} />;
  }

  return (
    <div className="container mx-auto flex flex-1 flex-col p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {jobDescription.title} {t("interview.flow.interview")}
        </h1>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        {!isConnected && !isConnecting && (
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-semibold">
              {t("interview.elevenlabs.readyToStart")}
            </h2>

            <p className="text-muted-foreground mb-6">
              {t("interview.elevenlabs.description")}
            </p>

            <Button onClick={startConversation} size="lg">
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
            <div className="mb-6">
              <div className="inline-flex items-center rounded-full bg-green-100 px-4 py-2 text-green-800">
                <div className="mr-2 h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
                {t("interview.elevenlabs.connected")}
              </div>
            </div>

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

            <Button
              onClick={disconnectConversation}
              variant="destructive"
              size="lg"
            >
              <PhoneOff className="mr-2 h-5 w-5" />
              {t("interview.elevenlabs.endInterview")}
            </Button>

            <div className="text-muted-foreground mt-6 text-sm">
              <p>{t("interview.elevenlabs.instructions")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
