import { type Doc, type Id } from "@convex/_generated/dataModel";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Building2, Edit } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CompanyProfileProps {
  companyId?: Id<"companies">;
  companyData?: Doc<"companies"> | null;
  onEdit: () => void;
}

export function CompanyProfile({ companyData, onEdit }: CompanyProfileProps) {
  const { t } = useTranslation();

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
    );
  }

  return (
    <Card className="flex flex-col items-start justify-between gap-3 p-6 md:flex-row">
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="bg-muted flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg">
          {companyData.logoUrl ? (
            <img
              src={companyData.logoUrl}
              alt={`${companyData.name} logo`}
              className="w-full object-cover"
            />
          ) : (
            <Building2 className="text-muted-foreground h-8 w-8" />
          )}
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold">{companyData.name}</h2>

          <p className="text-muted-foreground m-0 line-clamp-5 text-sm leading-relaxed md:line-clamp-none md:text-base">
            {companyData.description}
          </p>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={onEdit}
        className="flex items-center gap-2"
        type="button"
      >
        <Edit className="h-4 w-4" />
        {t("company.profile.editProfile")}
      </Button>
    </Card>
  );
}
