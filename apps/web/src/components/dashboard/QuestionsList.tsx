import { api } from "@convex/_generated/api"
import { type Id, type Doc } from "@convex/_generated/dataModel"
import { useMutation } from "convex/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

interface QuestionsListProps {
  questions: Doc<"interviewQuestions">[]
}

export function QuestionsList({ questions }: QuestionsListProps) {
  const [editingId, setEditingId] = useState<Id<"interviewQuestions"> | null>(
    null,
  )
  const [editText, setEditText] = useState("")
  const { t } = useTranslation()

  const updateQuestion = useMutation(api.interviewQuestions.update)
  const deleteQuestion = useMutation(api.interviewQuestions.remove)

  // Start editing a question
  const handleEdit = (question: Doc<"interviewQuestions">) => {
    setEditingId(question._id)
    setEditText(question.question)
  }

  // Save edited question
  const handleSave = async (id: Id<"interviewQuestions">) => {
    await updateQuestion({
      id,
      question: editText,
    })
    setEditingId(null)
  }

  // Delete a question
  const handleDelete = async (id: Id<"interviewQuestions">) => {
    if (confirm(t("common.confirm"))) {
      await deleteQuestion({ id })
    }
  }

  // Sort questions by order
  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-4">
      {sortedQuestions.map((question) => (
        <div
          key={question._id}
          className="border-border bg-background rounded-md border p-4 shadow-sm"
        >
          {editingId === question._id ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="border-input bg-background w-full rounded-md border p-2"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingId(null)}
                  className="bg-muted rounded px-3 py-1 text-sm"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={() => handleSave(question._id)}
                  className="bg-primary text-primary-foreground rounded px-3 py-1 text-sm"
                >
                  {t("common.save")}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between">
                <p className="text-lg">{question.question}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(question)}
                    className="bg-muted rounded px-2 py-1 text-xs"
                  >
                    {t("common.edit")}
                  </button>
                  <button
                    onClick={() => handleDelete(question._id)}
                    className="bg-destructive text-destructive-foreground rounded px-2 py-1 text-xs"
                  >
                    {t("common.delete")}
                  </button>
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
  )
}
