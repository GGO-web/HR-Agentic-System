import { type Id, type Doc } from "@convex/_generated/dataModel"

interface JobDescriptionListProps {
  jobDescriptions: Doc<"jobDescriptions">[]
  selectedJobId: Id<"jobDescriptions"> | null
  onSelect: (id: Id<"jobDescriptions">) => void
}

export function JobDescriptionList({
  jobDescriptions,
  selectedJobId,
  onSelect,
}: JobDescriptionListProps) {
  return (
    <div className="space-y-2">
      {jobDescriptions.map((job) => (
        <div
          key={job._id}
          className={`cursor-pointer rounded-md p-3 transition-colors ${
            selectedJobId === job._id
              ? "bg-primary/10 border-primary border-l-4"
              : "hover:bg-muted"
          }`}
          onClick={() => onSelect(job._id)}
        >
          <h3 className="font-medium">{job.title}</h3>
          <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
            {job.description}
          </p>
          <p className="text-muted-foreground mt-2 text-xs">
            {new Date(job.createdAt).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  )
}
