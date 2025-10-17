import { type Id, type Doc } from "@convex/_generated/dataModel";
import { Button } from "@workspace/ui/components/button";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useDeleteQuestionMutation } from "./hooks/useDeleteQuestionMutation";
import { useUpdateQuestionMutation } from "./hooks/useUpdateQuestionMutation";

interface QuestionsListProps {
  questions: Doc<"interviewQuestions">[];
}

export function QuestionsList({ questions }: QuestionsListProps) {
  const [editingId, setEditingId] = useState<Id<"interviewQuestions"> | null>(
    null,
  );
  const [editText, setEditText] = useState("");
  const { t } = useTranslation();

  const { mutateAsync: updateQuestion, isPending: isUpdating } =
    useUpdateQuestionMutation();
  const { mutateAsync: deleteQuestion, isPending: isDeleting } =
    useDeleteQuestionMutation();

  // Start editing a question
  const handleEdit = (question: Doc<"interviewQuestions">) => {
    setEditingId(question._id);
    setEditText(question.question);
  };

  // Save edited question
  const handleSave = async (id: Id<"interviewQuestions">) => {
    await updateQuestion({
      id,
      question: editText,
    });
    setEditingId(null);
  };

  // Delete a question
  const handleDelete = async (id: Id<"interviewQuestions">) => {
    await deleteQuestion({ id });
  };

  // Sort questions by order
  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

  return (
    <div className="-mx-4 flex flex-col gap-2 md:m-0 md:gap-4 md:border-solid">
      {sortedQuestions.map((question) => (
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
                <p className="flex-1 text-sm md:text-base">
                  {question.question}
                </p>

                <div className="flex w-full justify-end gap-2 sm:w-auto">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleEdit(question)}
                    disabled={isUpdating}
                  >
                    {t("common.edit")}
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleDelete(question._id)}
                    disabled={isDeleting}
                  >
                    {t("common.delete")}
                  </Button>
                </div>
              </div>

              {question.isAIGenerated && (
                <span className="bg-secondary/20 mt-2 inline-block rounded-full px-2 py-0.5 text-xs">
                  {t("dashboard.hr.interviewQuestions.aiGenerated")}
                </span>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
