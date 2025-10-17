import { type Id, type Doc } from "@convex/_generated/dataModel";
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
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useDeleteJobDescriptionMutation } from "../JobDescriptionForm/hooks/useDeleteJobDescriptionMutation";

interface DeleteJobDescriptionButtonProps {
  job: Doc<"jobDescriptions">;
  onDeleted?: (deletedJobId: Id<"jobDescriptions">) => void;
  triggerProps?: React.ComponentProps<typeof Button>;
}

export function DeleteJobDescriptionButton({
  triggerProps,
  job,
  onDeleted,
}: DeleteJobDescriptionButtonProps) {
  const { t } = useTranslation();
  const { mutateAsync: deleteJobDescription, isPending: isDeleting } =
    useDeleteJobDescriptionMutation(job._id);

  const handleDelete = async () => {
    await deleteJobDescription({ id: job._id });
    onDeleted?.(job._id);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          title={t("dashboard.hr.jobDescriptions.actions.delete")}
          disabled={isDeleting}
          {...triggerProps}
        >
          <Trash2 className="h-full w-full" />
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
  );
}
