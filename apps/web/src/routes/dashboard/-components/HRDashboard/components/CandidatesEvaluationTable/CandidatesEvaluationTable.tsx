import { api } from "@convex/_generated/api";
import { type Id } from "@convex/_generated/dataModel";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { useQuery as useConvexQuery } from "convex/react";
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "@tanstack/react-router";

interface CandidatesEvaluationTableProps {
  jobDescriptionId: Id<"jobDescriptions">;
}

type SortField =
  | "integratedScore"
  | "resumeScore"
  | "interviewScore"
  | "contentScore"
  | "confidenceScore"
  | "candidateName";
type SortDirection = "asc" | "desc";

export function CandidatesEvaluationTable({
  jobDescriptionId,
}: CandidatesEvaluationTableProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>("integratedScore");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const evaluations = useConvexQuery(api.candidateEvaluations.getByJobDescription, {
    jobDescriptionId,
  });

  // Sort evaluations
  const sortedEvaluations = useMemo(() => {
    if (!evaluations) return [];

    const sorted = [...evaluations].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case "integratedScore":
          aValue = a.integratedScore;
          bValue = b.integratedScore;
          break;
        case "resumeScore":
          aValue = a.resumeScore ?? -1;
          bValue = b.resumeScore ?? -1;
          break;
        case "interviewScore":
          aValue = a.interviewScore;
          bValue = b.interviewScore;
          break;
        case "contentScore":
          aValue = a.contentScore;
          bValue = b.contentScore;
          break;
        case "confidenceScore":
          aValue = a.confidenceScore;
          bValue = b.confidenceScore;
          break;
        case "candidateName":
          aValue = a.candidateName;
          bValue = b.candidateName;
          break;
        default:
          return 0;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === "asc"
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    return sorted;
  }, [evaluations, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getScoreColor = (score: number | null | undefined) => {
    if (score === null || score === undefined) return "text-muted-foreground";
    if (score >= 0.7) return "text-green-600 font-semibold";
    if (score >= 0.4) return "text-yellow-600 font-semibold";
    return "text-red-600 font-semibold";
  };

  const getCategoryBadge = (
    category: "strong_hire" | "potential" | "rejected",
  ) => {
    const badges = {
      strong_hire: {
        label: t("interview.results.category.strongHire") || "Strong Hire",
        className: "bg-green-100 text-green-800",
      },
      potential: {
        label: t("interview.results.category.potential") || "Potential",
        className: "bg-yellow-100 text-yellow-800",
      },
      rejected: {
        label: t("interview.results.category.rejected") || "Rejected",
        className: "bg-red-100 text-red-800",
      },
    };

    const badge = badges[category];
    return (
      <Badge variant="outline" className={badge.className}>
        {badge.label}
      </Badge>
    );
  };

  const SortButton = ({ field }: { field: SortField }) => {
    const isActive = sortField === field;
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1"
        onClick={() => handleSort(field)}
      >
        {isActive ? (
          sortDirection === "asc" ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="h-4 w-4" />
        )}
      </Button>
    );
  };

  if (!evaluations) {
    return (
      <Card className="border-border rounded-lg border p-6">
        <p className="text-muted-foreground">
          {t("dashboard.hr.candidatesEvaluation.loading") || "Loading..."}
        </p>
      </Card>
    );
  }

  if (evaluations.length === 0) {
    return (
      <Card className="border-border rounded-lg border p-6">
        <p className="text-muted-foreground">
          {t("dashboard.hr.candidatesEvaluation.noCandidates") ||
            "No completed interviews yet for this job description."}
        </p>
      </Card>
    );
  }

  return (
    <Card className="border-border rounded-lg border p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">
          {t("dashboard.hr.candidatesEvaluation.title") ||
            "Candidates Evaluation Summary"}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("dashboard.hr.candidatesEvaluation.description") ||
            "Overview of all candidates' performance across resume evaluation and interview stages"}
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">
                <div className="flex items-center gap-2">
                  {t("dashboard.hr.candidatesEvaluation.candidate") ||
                    "Candidate"}
                  <SortButton field="candidateName" />
                </div>
              </TableHead>
              <TableHead className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {t("dashboard.hr.candidatesEvaluation.resumeScore") ||
                    "Resume Score"}
                  <SortButton field="resumeScore" />
                </div>
              </TableHead>
              <TableHead className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {t("dashboard.hr.candidatesEvaluation.interviewScore") ||
                    "Interview Score"}
                  <SortButton field="interviewScore" />
                </div>
              </TableHead>
              <TableHead className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {t("dashboard.hr.candidatesEvaluation.contentScore") ||
                    "Content Score"}
                  <SortButton field="contentScore" />
                </div>
              </TableHead>
              <TableHead className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {t("dashboard.hr.candidatesEvaluation.confidenceScore") ||
                    "Confidence Score"}
                  <SortButton field="confidenceScore" />
                </div>
              </TableHead>
              <TableHead className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {t("dashboard.hr.candidatesEvaluation.integratedScore") ||
                    "Integrated Score"}
                  <SortButton field="integratedScore" />
                </div>
              </TableHead>
              <TableHead>
                {t("dashboard.hr.candidatesEvaluation.category") || "Category"}
              </TableHead>
              <TableHead className="text-right">
                {t("dashboard.hr.candidatesEvaluation.questions") || "Questions"}
              </TableHead>
              <TableHead className="w-[100px]">
                {t("dashboard.hr.candidatesEvaluation.actions") || "Actions"}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEvaluations.map((evaluation) => (
              <TableRow key={evaluation.sessionId}>
                <TableCell className="font-medium">
                  <div>
                    <div>{evaluation.candidateName}</div>
                    <div className="text-muted-foreground text-xs">
                      {evaluation.candidateEmail}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {evaluation.resumeScore !== null ? (
                    <span className={getScoreColor(evaluation.resumeScore)}>
                      {(evaluation.resumeScore * 100).toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">N/A</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <span className={getScoreColor(evaluation.interviewScore)}>
                    {(evaluation.interviewScore * 100).toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className={getScoreColor(evaluation.contentScore)}>
                    {(evaluation.contentScore * 100).toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className={getScoreColor(evaluation.confidenceScore)}>
                    {(evaluation.confidenceScore * 100).toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={getScoreColor(evaluation.integratedScore)}
                  >
                    {(evaluation.integratedScore * 100).toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell>{getCategoryBadge(evaluation.category)}</TableCell>
                <TableCell className="text-right text-sm">
                  {evaluation.questionsAnswered} / {evaluation.totalQuestions}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      void router.navigate({
                        to: "/interview/$sessionId/results",
                        params: {
                          sessionId: evaluation.sessionId,
                        },
                      });
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

