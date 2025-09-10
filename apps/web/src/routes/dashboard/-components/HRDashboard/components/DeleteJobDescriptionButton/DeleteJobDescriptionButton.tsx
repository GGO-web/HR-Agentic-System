import { type Id, type Doc } from "@convex/_generated/dataModel"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"
import { Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { useDeleteJobDescriptionMutation } from "../../hooks/useDeleteJobDescriptionMutation"

interface DeleteJobDescriptionButtonProps {
  job: Doc<"jobDescriptions">
  onDeleted?: (deletedJobId: Id<"jobDescriptions">) => void
}

export function DeleteJobDescriptionButton({
  job,
  onDeleted,
}: DeleteJobDescriptionButtonProps) {
  const { t } = useTranslation()
  const { mutateAsync: deleteJobDescription, isPending: isDeleting } =
    useDeleteJobDescriptionMutation(job._id)

  const handleDelete = async () => {
    await deleteJobDescription({ id: job._id })
    onDeleted?.(job._id)
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          title={t("dashboard.hr.jobDescriptions.actions.delete")}
          disabled={isDeleting}
          onClick={(e) => e.stopPropagation()}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("dashboard.hr.jobDescriptions.actions.deleteConfirm")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("dashboard.hr.jobDescriptions.actions.deleteDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => void handleDelete()}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? t("common.deleting") : t("common.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
