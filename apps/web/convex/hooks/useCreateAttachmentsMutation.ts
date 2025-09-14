import { api } from "@convex/_generated/api"
import { useConvexMutation } from "@convex-dev/react-query"
import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

export const useCreateAttachmentsMutation = () => {
  const { t } = useTranslation()

  return useMutation({
    mutationFn: useConvexMutation(api.attachments.create),
    onSuccess: () => {
      toast.success(t("attachments.actions.create.success"))
    },
    onError: () => {
      toast.error(t("attachments.actions.create.error"))
    },
  })
}
