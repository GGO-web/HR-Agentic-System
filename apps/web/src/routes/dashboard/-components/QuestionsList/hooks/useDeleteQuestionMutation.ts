import { api } from "@convex/_generated/api"
import { useConvexMutation } from "@convex-dev/react-query"
import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

export const useDeleteQuestionMutation = () => {
  const { t } = useTranslation()

  return useMutation({
    mutationFn: useConvexMutation(api.interviewQuestions.remove),
    onSuccess: () => {
      toast.success(t("dashboard.questionsList.actions.delete.success"))
    },
    onError: () => {
      toast.error(t("dashboard.questionsList.actions.delete.error"))
    },
  })
}
