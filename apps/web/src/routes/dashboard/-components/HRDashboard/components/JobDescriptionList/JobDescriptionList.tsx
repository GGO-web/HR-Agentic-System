import { type Id, type Doc } from "@convex/_generated/dataModel";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { Edit2, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DeleteJobDescriptionButton } from "../DeleteJobDescriptionButton/DeleteJobDescriptionButton";
import { InviteCandidateForm } from "../InviteCandidateForm/InviteCandidateForm";
import { JobDescriptionForm } from "../JobDescriptionForm/JobDescriptionForm";

interface JobDescriptionListProps {
  jobDescriptions: Doc<"jobDescriptions">[];
  selectedJobId: Id<"jobDescriptions"> | null;
  onSelect: (id: Id<"jobDescriptions">) => void;
  onJobDeleted?: (deletedJobId: Id<"jobDescriptions">) => void;
  onJobUpdated?: () => void;
}

export function JobDescriptionList({
  jobDescriptions,
  selectedJobId,
  onSelect,
  onJobDeleted,
  onJobUpdated,
}: JobDescriptionListProps) {
  const { t } = useTranslation();

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
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="flex-1 font-medium">{job.title}</h3>

              <div className="flex gap-3">
                <InviteCandidateForm
                  job={job}
                  onSuccess={onJobUpdated}
                  trigger={
                    <Button
                      variant="ghost"
                      className="size-7 rounded-full p-1.5 hover:bg-white"
                      title={t("dashboard.hr.inviteCandidate.button")}
                    >
                      <UserPlus className="h-full w-full" />
                    </Button>
                  }
                />

                <JobDescriptionForm
                  job={job}
                  onSuccess={onJobUpdated}
                  trigger={
                    <Button
                      variant="ghost"
                      className="size-7 rounded-full p-1.5 hover:bg-white"
                      title={t(
                        "dashboard.hr.jobDescriptions.form.buttons.edit",
                      )}
                    >
                      <Edit2 className="h-full w-full" />
                    </Button>
                  }
                />

                <DeleteJobDescriptionButton
                  triggerProps={{
                    className:
                      "size-7 rounded-full hover:bg-white p-1.5 text-red-600 hover:text-red-700",
                  }}
                  job={job}
                  onDeleted={onJobDeleted}
                />
              </div>
            </div>
            <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
              {job.description}
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              {new Date(job.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
