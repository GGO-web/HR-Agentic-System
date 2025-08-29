import { api } from "@convex/_generated/api"
import { type Id, type Doc } from "@convex/_generated/dataModel"
import { useMutation } from "convex/react"
import { useState } from "react"

interface QuestionsListProps {
  questions: Doc<"interviewQuestions">[]
}

export function QuestionsList({ questions }: QuestionsListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")

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
    if (confirm("Are you sure you want to delete this question?")) {
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
                  Cancel
                </button>
                <button
                  onClick={() => handleSave(question._id)}
                  className="bg-primary text-primary-foreground rounded px-3 py-1 text-sm"
                >
                  Save
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
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(question._id)}
                    className="bg-destructive text-destructive-foreground rounded px-2 py-1 text-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {question.isAIGenerated && (
                <span className="bg-secondary/20 mt-2 inline-block rounded-full px-2 py-0.5 text-xs">
                  AI Generated
                </span>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  )
}
