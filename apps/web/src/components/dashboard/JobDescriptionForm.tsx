import { api } from "@convex/_generated/api"
import { type Id } from "@convex/_generated/dataModel"
import { useMutation } from "convex/react"
import { useState } from "react"

interface JobDescriptionFormProps {
  companyId?: Id<"companies">
  userId?: Id<"users">
  onClose: () => void
}

export function JobDescriptionForm({
  companyId,
  userId,
  onClose,
}: JobDescriptionFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createJobDescription = useMutation(api.jobDescriptions.create)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!companyId || !userId) {
      return
    }

    setIsSubmitting(true)

    try {
      await createJobDescription({
        title,
        description,
        companyId,
        createdBy: userId,
      })

      onClose()
    } catch (error) {
      console.error("Failed to create job description:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background w-full max-w-lg rounded-lg p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-semibold">Add New Job Description</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="mb-1 block text-sm font-medium">
              Job Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-input bg-background w-full rounded-md border px-3 py-2"
              required
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="description"
              className="mb-1 block text-sm font-medium"
            >
              Job Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border-input bg-background h-40 w-full rounded-md border px-3 py-2"
              required
            />
            <p className="text-muted-foreground mt-1 text-xs">
              Provide a detailed job description. This will be used to generate
              interview questions.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="border-input bg-background rounded-md border px-4 py-2 text-sm"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
