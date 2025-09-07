import { type Doc, type Id } from "@convex/_generated/dataModel"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Building2, Edit } from "lucide-react"
import { useTranslation } from "react-i18next"

interface CompanyProfileProps {
  companyId?: Id<"companies">
  companyData?: Doc<"companies"> | null
  onEdit: () => void
}

export function CompanyProfile({ companyData, onEdit }: CompanyProfileProps) {
  const { t } = useTranslation()

  if (!companyData) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Building2 className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-medium">
            {t("company.profile.noProfile")}
          </h3>
          <p className="text-muted-foreground mb-4">
            {t("company.profile.noProfileDescription")}
          </p>
          <Button
            onClick={onEdit}
            className="bg-primary text-primary-foreground"
          >
            {t("company.profile.createProfile")}
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-lg">
            <Building2 className="text-muted-foreground h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{companyData.name}</h2>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={onEdit}
          className="flex items-center gap-2"
        >
          <Edit className="h-4 w-4" />
          {t("company.profile.editProfile")}
        </Button>
      </div>

      {companyData.description && (
        <div className="mb-6">
          <h3 className="mb-2 text-lg font-semibold">
            {t("company.profile.about")}
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            {companyData.description}
          </p>
        </div>
      )}
    </Card>
  )
}
