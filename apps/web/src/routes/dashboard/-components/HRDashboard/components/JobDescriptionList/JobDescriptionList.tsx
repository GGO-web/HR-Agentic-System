import { type Id, type Doc } from "@convex/_generated/dataModel"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { Edit2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { DeleteJobDescriptionButton } from "../DeleteJobDescriptionButton/DeleteJobDescriptionButton"
import { JobDescriptionForm } from "../JobDescriptionForm/JobDescriptionForm"

interface JobDescriptionListProps {
  jobDescriptions: Doc<"jobDescriptions">[]
  selectedJobId: Id<"jobDescriptions"> | null
  onSelect: (id: Id<"jobDescriptions">) => void
  onJobDeleted?: (deletedJobId: Id<"jobDescriptions">) => void
  onJobUpdated?: () => void
}

export function JobDescriptionList({
  jobDescriptions,
  selectedJobId,
  onSelect,
  onJobDeleted,
  onJobUpdated,
}: JobDescriptionListProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      {jobDescriptions.map((job) => (
        <div
          key={job._id}
          className={cn(
            "group relative rounded-md p-3 transition-colors",
            selectedJobId === job._id
              ? "bg-primary/10 border-primary active border-l-4"
              : "hover:bg-muted",
          )}
        >
          <div className="cursor-pointer" onClick={() => onSelect(job._id)}>
            <h3 className="font-medium">{job.title}</h3>
            <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
              {job.description}
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              {new Date(job.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="group:opacity-100 group:has-active:opacity-100 absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="flex gap-1">
              <JobDescriptionForm
                job={job}
                onSuccess={onJobUpdated}
                trigger={
                  <Button
                    size="sm"
                    variant="ghost"
                    className="size-8 p-0"
                    title={t("jobDescription.form.buttons.edit")}
                  >
                    <Edit2 className="size-4" />
                  </Button>
                }
              />

              <DeleteJobDescriptionButton job={job} onDeleted={onJobDeleted} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
