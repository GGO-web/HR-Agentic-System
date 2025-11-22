import { type Id, type Doc } from "@convex/_generated/dataModel";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { CheckCircle2, Plus, Sparkles, XCircle } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useAddManualQuestionMutation } from "./hooks/useAddManualQuestionMutation";
import { useApproveAllQuestionsMutation } from "./hooks/useApproveAllQuestionsMutation";
import { useApproveQuestionMutation } from "./hooks/useApproveQuestionMutation";
import { useDeleteQuestionMutation } from "./hooks/useDeleteQuestionMutation";
import { useUpdateQuestionMutation } from "./hooks/useUpdateQuestionMutation";

interface QuestionsListProps {
  questions: Doc<"interviewQuestions">[];
  jobDescriptionId: Id<"jobDescriptions">;
}

export function QuestionsList({
  questions,
  jobDescriptionId,
}: QuestionsListProps) {
  const [editingId, setEditingId] = useState<Id<"interviewQuestions"> | null>(
    null,
  );
  const [editText, setEditText] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState("");
  const { t } = useTranslation();

  const { mutateAsync: updateQuestion, isPending: isUpdating } =
    useUpdateQuestionMutation();
  const { mutateAsync: deleteQuestion, isPending: isDeleting } =
    useDeleteQuestionMutation();
  const { mutateAsync: approveQuestion, isPending: isApproving } =
    useApproveQuestionMutation();
  const { mutateAsync: approveAll, isPending: isApprovingAll } =
    useApproveAllQuestionsMutation();
  const { mutateAsync: addManualQuestion, isPending: isAddingManual } =
    useAddManualQuestionMutation();

  // Start editing a question
  const handleEdit = (question: Doc<"interviewQuestions">) => {
    setEditingId(question._id);
    setEditText(question.question_text || question.question);
  };

  // Save edited question
  const handleSave = async (id: Id<"interviewQuestions">) => {
    await updateQuestion({
      id,
      question_text: editText,
    });
    setEditingId(null);
  };

  // Delete a question
  const handleDelete = async (id: Id<"interviewQuestions">) => {
    await deleteQuestion({ id });
  };

  // Approve a question
  const handleApprove = async (id: Id<"interviewQuestions">) => {
    await approveQuestion(id);
  };

  // Approve all questions
  const handleApproveAll = async () => {
    await approveAll(jobDescriptionId);
  };

  // Add manual question
  const handleAddManualQuestion = async () => {
    if (!newQuestionText.trim()) return;
    await addManualQuestion({
      jobDescriptionId,
      question_text: newQuestionText.trim(),
      category: "custom",
      maxOrder,
    });
    setNewQuestionText("");
    setIsAddDialogOpen(false);
  };

  // Calculate max order for new questions
  const maxOrder =
    questions.length > 0
      ? Math.max(...questions.map((q) => q.order))
      : 0;

  // Sort questions by order
  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

  // Check if there are pending questions
  const hasPendingQuestions = questions.some(
    (q) => q.status === "pending" || !q.status,
  );

  return (
    <div className="-mx-4 flex flex-col gap-2 md:m-0 md:gap-4 md:border-solid">
      {/* Action Buttons */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                {t("dashboard.hr.interviewQuestions.addManual.button") ||
                  "Add Manual Question"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {t("dashboard.hr.interviewQuestions.addManual.title") ||
                    "Add Manual Question"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-question">
                    {t("dashboard.hr.interviewQuestions.addManual.label") ||
                      "Question Text"}
                  </Label>
                  <Textarea
                    id="new-question"
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    placeholder={
                      t(
                        "dashboard.hr.interviewQuestions.addManual.placeholder",
                      ) || "Enter your question..."
                    }
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    onClick={handleAddManualQuestion}
                    disabled={!newQuestionText.trim() || isAddingManual}
                  >
                    {t("common.add") || "Add"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {hasPendingQuestions && (
          <Button
            variant="default"
            size="sm"
            onClick={handleApproveAll}
            disabled={isApprovingAll}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {t("dashboard.hr.interviewQuestions.approveAll.button") ||
              "Approve & Publish All"}
          </Button>
        )}
      </div>

      {sortedQuestions.map((question) => {
        const isPending = question.status === "pending" || !question.status;
        const isApproved = question.status === "approved";

        return (
        <div
          key={question._id}
          className="bg-background md:border-border m-0 rounded-md border border-none p-4 py-2 md:py-4 md:shadow-sm"
        >
          {editingId === question._id ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="border-input bg-background w-full rounded-md border p-2 text-sm md:text-base"
                rows={3}
              />
              <div className="flex w-full justify-end gap-2 sm:w-auto">
                <Button
                  className="flex-1"
                  onClick={() => setEditingId(null)}
                  variant="outline"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleSave(question._id)}
                >
                  {t("common.save")}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                <div className="flex-1 space-y-2">
                  <p className="text-sm md:text-base">
                    {question.question_text || question.question}
                  </p>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-2">
                    {question.category && (
                      <Badge variant="secondary" className="text-xs">
                        {question.category}
                      </Badge>
                    )}
                    {question.difficulty && (
                      <Badge variant="outline" className="text-xs">
                        {question.difficulty}
                      </Badge>
                    )}
                    {question.isAIGenerated && (
                      <Badge variant="outline" className="text-xs">
                        <Sparkles className="mr-1 h-3 w-3" />
                        {t("dashboard.hr.interviewQuestions.aiGenerated") ||
                          "AI Generated"}
                      </Badge>
                    )}
                    {isPending && (
                      <Badge variant="outline" className="text-xs">
                        <XCircle className="mr-1 h-3 w-3" />
                        {t("dashboard.hr.interviewQuestions.status.pending") ||
                          "Pending"}
                      </Badge>
                    )}
                    {isApproved && (
                      <Badge variant="default" className="text-xs">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        {t("dashboard.hr.interviewQuestions.status.approved") ||
                          "Approved"}
                      </Badge>
                    )}
                  </div>

                  {/* Expected Keywords */}
                  {question.expected_keywords &&
                    question.expected_keywords.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Keywords: </span>
                        {question.expected_keywords.join(", ")}
                      </div>
                    )}
                </div>

                <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
                  {isPending && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleApprove(question._id)}
                      disabled={isApproving}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {t("dashboard.hr.interviewQuestions.approve.button") ||
                        "Approve"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(question)}
                    disabled={isUpdating}
                  >
                    {t("common.edit")}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(question._id)}
                    disabled={isDeleting}
                  >
                    {t("common.delete")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
        );
      })}
    </div>
  );
}
