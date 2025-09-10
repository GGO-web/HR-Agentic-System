import { type Id, type Doc } from "@convex/_generated/dataModel"
import { Button } from "@workspace/ui/components/button"
import { Edit2 } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { DeleteJobDescriptionButton } from "../DeleteJobDescriptionButton/DeleteJobDescriptionButton"
import { EditJobDescriptionForm } from "../EditJobDescriptionForm/EditJobDescriptionForm"

interface JobDescriptionListProps {
  jobDescriptions: Doc<"jobDescriptions">[]
  selectedJobId: Id<"jobDescriptions"> | null
  onSelect: (id: Id<"jobDescriptions">) => void
  onJobDeleted?: (deletedJobId: Id<"jobDescriptions">) => void
}

export function JobDescriptionList({
  jobDescriptions,
  selectedJobId,
  onSelect,
  onJobDeleted,
}: JobDescriptionListProps) {
  const { t } = useTranslation()
  const [editingJobId, setEditingJobId] =
    useState<Id<"jobDescriptions"> | null>(null)

  const handleStartEdit = (job: Doc<"jobDescriptions">) => {
    setEditingJobId(job._id)
  }

  const handleCancelEdit = () => {
    setEditingJobId(null)
  }

  return (
    <div className="space-y-2">
      {jobDescriptions.map((job) => (
        <div
          key={job._id}
          className={`group relative rounded-md p-3 transition-colors ${
            selectedJobId === job._id
              ? "bg-primary/10 border-primary border-l-4"
              : "hover:bg-muted"
          }`}
        >
          {/* Main content area - clickable for selection */}
          {editingJobId === job._id ? (
            <EditJobDescriptionForm
              job={job}
              onCancel={handleCancelEdit}
              onSuccess={handleCancelEdit}
            />
          ) : (
            <div className="cursor-pointer" onClick={() => onSelect(job._id)}>
              <h3 className="font-medium">{job.title}</h3>
              <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                {job.description}
              </p>
              <p className="text-muted-foreground mt-2 text-xs">
                {new Date(job.createdAt).toLocaleDateString()}
              </p>
            </div>
          )}

          {/* Action buttons - only show on hover or when selected */}
          {!editingJobId && (
            <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleStartEdit(job)}
                  className="h-8 w-8 p-0"
                  title={t("dashboard.hr.jobDescriptions.actions.edit")}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>

                <DeleteJobDescriptionButton
                  job={job}
                  onDeleted={onJobDeleted}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
