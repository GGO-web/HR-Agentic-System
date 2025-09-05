import { api } from "@convex/_generated/api"
import { useConvexMutation } from "@convex-dev/react-query"
import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

export const useCreateUserMutation = () => {
  const { t } = useTranslation()

  return useMutation({
    mutationFn: useConvexMutation(api.users.create),
    onSuccess: () => {
      toast.success(t("auth.userCreation.actions.success"))
    },
    onError: () => {
      toast.error(t("auth.userCreation.actions.error"))
    },
  })
}
