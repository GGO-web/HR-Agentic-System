import { api } from "@convex/_generated/api";
import { type Id } from "@convex/_generated/dataModel";
import { useConversation } from "@elevenlabs/react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { LoadingSpinner } from "@workspace/ui/components/shared/loading-spinner";
import { useQuery, useMutation } from "convex/react";
import { Mic, Volume2, Phone, PhoneOff } from "lucide-react";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { END_INTERVIEW_MARKER } from "@/components/interview/-constants";
import { useAnalyzeInterviewMutation } from "@/components/interview/hooks/useAnalyzeInterviewMutation";
import { uploadFileToS3 } from "@/services/s3Service";

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
  const messagesRef = useRef<
    Array<{ source: string; message: string; at: string }>
  >(new Array<{ source: string; message: string; at: string }>());

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
  const sendSessionForReview = useMutation(
    api.interviewSessions.sendSessionForReview,
  );
  const analyzeInterview = useAnalyzeInterviewMutation();

  // Restricted phrases that the agent must avoid
  const restrictedPhrases = [
    "resume",
    "CV",
    "curriculum vitae",
    "previous job",
    "last job",
    "former employer",
    "previous employer",
    "work history",
    "employment history",
    "background check",
    "salary",
    "compensation",
    "pay",
    "benefits",
    "personal information",
    "age",
    "marital status",
    "family",
    "religion",
    "political views",
  ];

  // Filter and format approved questions for the prompt
  // Only use questions that are approved (status === "approved" or no status for backward compatibility)
  const approvedQuestions = useMemo(
    () =>
      questions
        ?.filter(
          (q) => q.status === "approved" || !q.status, // Backward compatibility: if no status, assume approved
        )
        .sort((a, b) => a.order - b.order) || [],
    [questions],
  );

  // Format questions for the prompt
  const dynamicQuestions = useMemo(
    () =>
      approvedQuestions
        .map((q, index) => `${index + 1}. ${q.question_text || q.question}`)
        .join("\n"),
    [approvedQuestions],
  );

  const conversation = useConversation({
    overrides: {
      agent: {
        prompt: {
          prompt: `# Personality

You are an experienced HR specialist named Sarah, skilled in conducting structured interviews to assess candidate suitability for various roles. You are professional, attentive, and focused on gathering relevant information.

# Environment

You are conducting a remote interview over a voice call. The questions you ask are provided dynamically. You have access to a list of restricted phrases that you must avoid during the interview.

# Tone

Your tone is professional, clear, and objective. You speak in a neutral and unbiased manner, ensuring a fair and consistent interview experience for all candidates. You use clear and concise language, avoiding jargon or technical terms unless necessary and explained.

# Goal

Your primary goal is to conduct a thorough and unbiased interview using the provided questions ({{dynamic_question}}). You must adhere to the following process:

1. **Introduction:** Start by introducing yourself and the purpose of the interview.

2. **Questioning:** Ask the questions provided in the {{dynamic_question}} variable, one at a time, and listen attentively to the candidate's responses.

3. **Probing:** Ask follow-up questions to clarify answers and gather more detailed information, but remain within the scope of the initial question.

4. **Restricted Phrases:** Ensure that you DO NOT use any of the phrases provided in the restricted phrases list ({{restricted_phrases}}).

5. **Note-Taking:** Summarize the candidate's answers and key points for later evaluation.

6. **Conclusion:** Thank the candidate for their time and explain the next steps in the hiring process.

# Guardrails

* You must not offer personal opinions or advice.
* You must not ask questions that are discriminatory or illegal.
* You must not deviate from the provided questions unless clarification is needed.
* You must not disclose confidential company information.
* You must not use any of the restricted phrases ({{restricted_phrases}}). If a question requires you to use a restricted phrase, rephrase the question.
* You must not engage in small talk or irrelevant conversation.

# Tools

None

# Dynamic Variables

The following questions ({{dynamic_question}}) must be asked in order:
${dynamicQuestions}

The following phrases ({{restricted_phrases}}) must be avoided:
${restrictedPhrases.join(", ")}

# Interview Context

Position: ${jobDescription?.title || "Not specified"}
Candidate: ${session?.candidateEmail?.split("@")[0] || "Candidate"}

# Instructions

- Ask each question from {{dynamic_question}} one at a time, in the order provided
- Wait for the candidate's complete response before moving to the next question
- Ask follow-up questions only to clarify unclear answers, staying within the scope of the original question
- Keep the interview focused and professional
- Do not ask more than 1 question at a time
- Do not repeat the same question if the candidate has already answered it
- When you have asked the LAST question and acknowledged the candidate's final response, and the candidate has no other questions, end with exactly this marker on a new line: ${END_INTERVIEW_MARKER}
`,
        },
        firstMessage: `Hello ${session?.candidateEmail?.split("@")[0]}! My name is Sarah, and I'm an HR specialist conducting your interview for the ${jobDescription?.title} position today. 

I'll be asking you several structured questions to assess your suitability for this role. Please speak clearly and take your time with each response. 

Let's begin with the first question.`,
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
      if (typeof message.message === "string") {
        messagesRef.current.push({
          source: String(message.source),
          message: message.message,
          at: new Date().toISOString(),
        });
      }

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

      const conversationId = await conversation.startSession({
        agentId: import.meta.env.VITE_ELEVENLABS_AGENT_ID,
        connectionType: "websocket",
        userId: session?.candidateEmail || "anonymous",
      });

      await startSession({
        id: sessionId,
        elevenlabsConversationId: conversationId,
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast.error(t("interview.elevenlabs.startFailed"));
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, session, sessionId, startSession, t]);

  const uploadTranscript = useCallback(async () => {
    try {
      const payload = {
        sessionId,
        candidateEmail: session?.candidateEmail,
        jobTitle: jobDescription?.title,
        questions:
          approvedQuestions.map((q) => ({
            id: q._id,
            order: q.order,
            question: q.question_text || q.question,
          })) ?? [],
        messages: messagesRef.current,
        endedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });

      const fileName = `interviews/${String(sessionId)}-${Date.now()}.json`;
      const file = new File([blob], fileName, { type: "application/json" });
      const upload = await uploadFileToS3(file);

      return upload.success ? upload.url : undefined;
    } catch (e) {
      console.error("Transcript upload error:", e);
      return undefined;
    }
  }, [
    sessionId,
    session?.candidateEmail,
    jobDescription?.title,
    approvedQuestions,
  ]);

  const disconnectConversation = useCallback(async () => {
    try {
      await conversation.endSession();

      // Upload transcript to S3 (best-effort)
      const transcriptUrl = await uploadTranscript();

      // Save transcript URL (status will be updated after analysis completes)
      if (transcriptUrl) {
        await sendSessionForReview({ id: sessionId, transcriptUrl });
      }
      toast.success(t("interview.elevenlabs.completed"));

      // Get conversation_id from session
      const conversationId = session?.elevenlabsConversationId;

      // Trigger analysis asynchronously (fire and forget)
      // Status will be updated to "in_review" after successful analysis
      if (conversationId && approvedQuestions.length > 0) {
        toast.info(t("interview.analysis.starting") || "Starting analysis...");
        // Don't await - let it run in background
        analyzeInterview.mutate({
          conversationId,
          interviewSessionId: sessionId,
          questions: approvedQuestions,
        });
      }

      await navigate({ to: router.routesByPath["/dashboard"].fullPath });
    } catch (error) {
      console.error("Failed to end conversation:", error);
      toast.error(t("interview.elevenlabs.endFailed"));
    } finally {
      setIsConnected(false);
    }
  }, [
    conversation,
    sessionId,
    session,
    sendSessionForReview,
    navigate,
    router,
    t,
    approvedQuestions,
    uploadTranscript,
    analyzeInterview,
  ]);

  // Note: Session status update is now handled in startConversation callback
  // This effect is kept for backward compatibility but session start is triggered by user action

  // Redirect to results if interview is completed or in review
  useEffect(() => {
    if (
      session &&
      (session.status === "completed" || session.status === "in_review")
    ) {
      void navigate({
        to: `/interview/${sessionId}/results`,
      });
    }
  }, [session, sessionId, navigate]);

  // Loading state
  if (!session || !jobDescription || !questions) {
    return <LoadingSpinner fullScreen text={t("interview.flow.loading")} />;
  }

  // Show message if interview is already completed or in review
  if (session.status === "completed" || session.status === "in_review") {
    return (
      <div className="container mx-auto flex flex-1 flex-col items-center justify-center p-6">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-semibold">
            {session.status === "completed"
              ? t("interview.flow.alreadyCompleted")
              : t("interview.flow.inReview")}
          </h2>
          <p className="text-muted-foreground mb-6">
            {session.status === "completed"
              ? t("interview.flow.alreadyCompletedDescription")
              : t("interview.flow.inReviewDescription")}
          </p>
          <Button
            onClick={() => navigate({ to: `/interview/${sessionId}/results` })}
            size="lg"
          >
            {t("interview.flow.viewResults")}
          </Button>
        </div>
      </div>
    );
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
