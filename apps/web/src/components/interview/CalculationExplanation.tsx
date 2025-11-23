import { Button } from "@workspace/ui/components/button";
import { ChevronDown, Info } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface CalculationExplanationProps {
  integratedScore: {
    integratedScore: number;
    resumeScore: number | null;
    interviewScore: number;
    category: "strong_hire" | "potential" | "rejected";
  } | null;
  overallStats: {
    weightedFinalScore: number;
    weightedContentScore: number;
    weightedConfidenceScore: number;
    totalQuestions: number;
  } | null;
}

export function CalculationExplanation({
  integratedScore,
  overallStats,
}: CalculationExplanationProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  if (!overallStats) return null;

  return (
    <div className="mb-6">
      <Button
        variant="outline"
        className="w-full justify-between"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          <span>
            {t("interview.results.calculation.title") ||
              "How Scores Are Calculated"}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </Button>
      {isOpen && (
        <div className="border-border bg-muted/50 mt-4 rounded-lg border p-6">
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="mb-2 font-medium">
                {t("interview.results.calculation.complexityWeights.title") ||
                  "1. Question Complexity Weights (λ)"}
              </h3>
              <ul className="text-muted-foreground list-inside list-disc space-y-1">
                <li>
                  <strong>Low Complexity (λ=1):</strong>{" "}
                  {t("interview.results.calculation.complexityWeights.low") ||
                    "Intro, Motivation questions"}
                </li>
                <li>
                  <strong>Medium Complexity (λ=2):</strong>{" "}
                  {t(
                    "interview.results.calculation.complexityWeights.medium",
                  ) || "Standard technical questions"}
                </li>
                <li>
                  <strong>High Complexity (λ=3):</strong>{" "}
                  {t("interview.results.calculation.complexityWeights.high") ||
                    "Problem Solving and Architecture questions"}
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-2 font-medium">
                {t("interview.results.calculation.interviewScore.title") ||
                  "2. Weighted Interview Score"}
              </h3>
              <p className="text-muted-foreground mb-2">
                {t(
                  "interview.results.calculation.interviewScore.description",
                ) ||
                  "Each question's score is multiplied by its complexity weight, then averaged:"}
              </p>
              <div className="bg-background rounded-md border p-3 font-mono text-xs">
                S_interview = Σ(Score_i × λ_i) / Σ(λ_i)
              </div>
              <p className="text-muted-foreground mt-2 text-xs">
                {t("interview.results.calculation.interviewScore.note") ||
                  "This means a high score on a complex question (λ=3) affects the final rating 3x more than an intro question (λ=1)."}
              </p>
            </div>

            {integratedScore && integratedScore.resumeScore !== null && (
              <div>
                <h3 className="mb-2 font-medium">
                  {t("interview.results.calculation.integratedScore.title") ||
                    "3. Integrated Final Score"}
                </h3>
                <p className="text-muted-foreground mb-2">
                  {t(
                    "interview.results.calculation.integratedScore.description",
                  ) ||
                    "Combines resume evaluation (30%) and interview performance (70%):"}
                </p>
                <div className="bg-background rounded-md border p-3 font-mono text-xs">
                  Score_final = (S_resume × 0.3) + (S_interview × 0.7)
                </div>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="text-muted-foreground">
                    <strong>Resume Score:</strong>{" "}
                    {(integratedScore.resumeScore * 100).toFixed(1)}% × 0.3 ={" "}
                    {(integratedScore.resumeScore * 0.3 * 100).toFixed(1)}%
                  </div>
                  <div className="text-muted-foreground">
                    <strong>Interview Score:</strong>{" "}
                    {(integratedScore.interviewScore * 100).toFixed(1)}% × 0.7 ={" "}
                    {(integratedScore.interviewScore * 0.7 * 100).toFixed(1)}%
                  </div>
                  <div className="font-medium">
                    <strong>Final Score:</strong>{" "}
                    {(integratedScore.integratedScore * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            )}

            <div>
              <h3 className="mb-2 font-medium">
                {t("interview.results.calculation.category.title") ||
                  "4. Candidate Classification"}
              </h3>
              <ul className="text-muted-foreground list-inside list-disc space-y-1">
                <li>
                  <strong>Strong Hire (≥85%):</strong>{" "}
                  {t("interview.results.calculation.category.strongHire") ||
                    "Candidate demonstrates deep knowledge and high confidence. Recommended for immediate offer or final interview with CTO."}
                </li>
                <li>
                  <strong>Potential / Qualified (60-85%):</strong>{" "}
                  {t("interview.results.calculation.category.potential") ||
                    "Candidate meets basic requirements but has some gaps. Requires additional verification of specific skills."}
                </li>
                <li>
                  <strong>Weak / Rejected (&lt;60%):</strong>{" "}
                  {t("interview.results.calculation.category.rejected") ||
                    "Knowledge level insufficient for the position or critical mismatches detected (Veto mechanism triggered)."}
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-2 font-medium">
                {t("interview.results.calculation.veto.title") ||
                  "5. Veto Mechanism (Threshold Logic)"}
              </h3>
              <p className="text-muted-foreground mb-2">
                {t("interview.results.calculation.veto.description") ||
                  "If content validity score (S_content) is below 0.4, the final score for that question is automatically set to 0, regardless of confidence level:"}
              </p>
              <div className="bg-background rounded-md border p-3 font-mono text-xs">
                Score = 0, if S_content &lt; 0.4
                <br />
                Score = 0.8 × S_content + 0.2 × S_confidence, if S_content ≥ 0.4
              </div>
              <p className="text-muted-foreground mt-2 text-xs">
                {t("interview.results.calculation.veto.note") ||
                  "This prevents candidates from scoring high on confidence alone when they give incorrect answers."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
