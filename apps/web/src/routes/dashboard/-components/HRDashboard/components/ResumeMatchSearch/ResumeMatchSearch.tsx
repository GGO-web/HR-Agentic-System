import { api } from "@convex/_generated/api";
import { type Id } from "@convex/_generated/dataModel";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { useQuery } from "convex/react";
import { Search, Sparkles, User, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import {
  useFindMatchesMutation,
  type CandidateMatchResult,
} from "../../hooks/useFindMatchesMutation";
import { useGetSanitizedResumeQuery } from "../../hooks/useGetSanitizedResumeQuery";
import { useGetResumeEvaluationQuery } from "../../hooks/useGetResumeEvaluationQuery";

interface ResumeMatchSearchProps {
  jobId: Id<"jobDescriptions">;
  jobDescription?: string;
  jobTitle?: string;
}

export function ResumeMatchSearch({
  jobId,
  jobDescription = "",
  jobTitle = "",
}: ResumeMatchSearchProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(jobDescription);
  const [results, setResults] = useState<CandidateMatchResult[] | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] =
    useState<Id<"users"> | null>(null);

  // Get candidates with resumes for this job
  const candidatesWithResumes = useQuery(
    api.jobDescriptions.getCandidatesWithResumes,
    {
      jobDescriptionId: jobId,
    },
  );

  const { mutateAsync: findMatches, isPending: isSearching } =
    useFindMatchesMutation();

  // Check for cached evaluation results
  const { data: cachedResults } = useGetResumeEvaluationQuery(jobId, query);

  // Load cached results if available on mount or when query changes
  useEffect(() => {
    if (cachedResults && cachedResults.results && !results) {
      setResults(cachedResults.results);
    }
  }, [cachedResults, query]);

  // Component for viewing sanitized resume
  const SanitizedResumeView = ({
    candidateId,
  }: {
    candidateId: Id<"users">;
  }) => {
    const { data: sanitizedResume, isLoading: isLoadingSanitized } =
      useGetSanitizedResumeQuery(String(candidateId));

    if (isLoadingSanitized) {
      return (
        <p className="text-muted-foreground">
          {t("dashboard.hr.resumeMatching.sanitizedResume.loading")}
        </p>
      );
    }

    if (!sanitizedResume) {
      return (
        <p className="text-muted-foreground">
          {t("dashboard.hr.resumeMatching.sanitizedResume.notFound")}
        </p>
      );
    }

    return (
      <div className="space-y-4">
        <div className="bg-muted rounded-lg p-4">
          <p className="text-muted-foreground mb-2 text-sm">
            {t("dashboard.hr.resumeMatching.sanitizedResume.description")}
          </p>
          <pre className="font-mono text-sm whitespace-pre-wrap">
            {sanitizedResume.sanitized_content}
          </pre>
        </div>
      </div>
    );
  };

  // Update query when job description changes
  useEffect(() => {
    if (jobDescription) {
      setQuery(jobDescription);
    }
  }, [jobDescription]);

  const handleSearch = async () => {
    if (!query.trim()) {
      return;
    }

    // Check for cached results first (already loaded via useGetResumeEvaluationQuery)
    if (cachedResults && cachedResults.results) {
      setResults(cachedResults.results);
      return;
    }

    try {
      const response = await findMatches({
        job_description: query,
        jobDescriptionId: jobId,
        k: 10,
      });
      setResults(response.results);
    } catch (error) {
      console.error("Failed to find matches:", error);
      setResults([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Candidates List Section */}
      <Card className="border-border bg-card rounded-lg border p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          <h3 className="text-lg font-semibold">
            {t("dashboard.hr.resumeMatching.candidates.title")}
          </h3>
        </div>

        <p className="text-muted-foreground mb-4 text-sm">
          {t("dashboard.hr.resumeMatching.candidates.description")}
        </p>

        {!candidatesWithResumes || candidatesWithResumes.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {t("dashboard.hr.resumeMatching.candidates.noCandidates")}
          </p>
        ) : (
          <div className="space-y-3">
            {candidatesWithResumes.map((item) => (
              <Card
                key={item.candidate._id}
                className={`border-border cursor-pointer rounded-lg border p-3 transition-colors ${
                  selectedCandidateId === item.candidate._id
                    ? "bg-primary/10 border-primary"
                    : "bg-muted/50 hover:bg-muted"
                }`}
                onClick={() => setSelectedCandidateId(item.candidate._id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                      <User className="text-primary h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{item.candidate.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {item.candidate.email}
                      </p>
                    </div>
                  </div>
                  {item.resumeAttachment && (
                    <div className="mt-3 flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCandidateId(item.candidate._id);
                            }}
                            className="text-primary flex items-center gap-1 text-sm hover:underline"
                            title="View sanitized resume"
                          >
                            <Eye className="h-4 w-4" />
                            {t(
                              "dashboard.hr.resumeMatching.candidates.viewSanitized",
                            )}
                          </button>
                        </DialogTrigger>
                        <DialogContent className="h-[80vh] max-w-4xl overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              {t(
                                "dashboard.hr.resumeMatching.sanitizedResume.title",
                              )}{" "}
                              - {item.candidate.name}
                            </DialogTitle>
                          </DialogHeader>
                          <SanitizedResumeView
                            candidateId={item.candidate._id}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Search Section */}
      <Card className="border-border bg-card rounded-lg border p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Search className="h-5 w-5" />
          <h3 className="text-lg font-semibold">
            {t("dashboard.hr.resumeMatching.findMatches.title")}
          </h3>
        </div>

        <p className="text-muted-foreground mb-4 text-sm">
          {t("dashboard.hr.resumeMatching.findMatches.description")}
        </p>

        <div className="mb-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="job-description">
              {jobTitle ? `${jobTitle} - Job Description` : "Job Description"}
            </Label>
            <Textarea
              id="job-description"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter job description to search for matching resumes..."
              className="min-h-[120px]"
            />
          </div>

          <Button
            onClick={handleSearch}
            disabled={!query.trim() || isSearching}
            className="w-full"
          >
            {isSearching ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                {t("dashboard.hr.resumeMatching.findMatches.searching")}
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                {t("dashboard.hr.resumeMatching.findMatches.button")}
              </>
            )}
          </Button>
        </div>

        {results !== null && (
          <div className="mt-6 space-y-4">
            <h4 className="text-md font-semibold">
              {t("dashboard.hr.resumeMatching.findMatches.results.title")} (
              {results.length})
            </h4>

            {results.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {t("dashboard.hr.resumeMatching.findMatches.noResults")}
              </p>
            ) : (
              <div className="space-y-4">
                {results.map((result) => {
                  // Find candidate info from candidatesWithResumes
                  const candidateInfo = candidatesWithResumes?.find(
                    (item) => item.candidate._id === result.candidate_id,
                  );

                  return (
                    <Card
                      key={result.candidate_id}
                      className="border-border bg-muted/50 rounded-lg border p-4"
                    >
                      <div className="mb-4 space-y-3">
                        {/* Candidate Info */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <User className="text-muted-foreground h-5 w-5" />
                            <div>
                              <h5 className="font-semibold">
                                {candidateInfo?.candidate.name ||
                                  "Unknown Candidate"}
                              </h5>
                              <p className="text-muted-foreground text-xs">
                                Candidate ID: {result.candidate_id}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary">
                            Hybrid Score:{" "}
                            {(result.scores.hybrid_score * 100).toFixed(1)}%
                          </Badge>
                        </div>

                        {/* Three hybrid search scores */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-background rounded-md border p-3">
                            <div className="text-muted-foreground mb-1 text-xs font-medium">
                              Vector Score
                            </div>
                            <div className="mb-2 text-2xl font-bold">
                              {(result.scores.vector_score * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div className="bg-background rounded-md border p-3">
                            <div className="text-muted-foreground mb-1 text-xs font-medium">
                              BM25 Score
                            </div>
                            <div className="mb-2 text-2xl font-bold">
                              {(result.scores.bm25_score * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div className="bg-background rounded-md border p-3">
                            <div className="text-muted-foreground mb-1 text-xs font-medium">
                              Final Hybrid Score
                            </div>
                            <div className="mb-2 text-2xl font-bold">
                              {(result.scores.hybrid_score * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>

                        {/* Analysis Report */}
                        {result.report && (
                          <div className="bg-muted/50 space-y-3 rounded-md border p-4">
                            <div className="flex items-center justify-between">
                              <h6 className="text-sm font-semibold">
                                Analysis Report
                              </h6>
                              <Badge
                                variant={
                                  result.report.fit_category === "Excellent"
                                    ? "default"
                                    : result.report.fit_category === "Good"
                                      ? "secondary"
                                      : result.report.fit_category === "Fair"
                                        ? "outline"
                                        : "destructive"
                                }
                              >
                                {result.report.fit_category} (
                                {result.report.overall_score}/100)
                              </Badge>
                            </div>

                            <div>
                              <p className="text-sm">
                                {result.report.explanation}
                              </p>
                            </div>

                            {result.report.strengths.length > 0 && (
                              <div>
                                <p className="text-muted-foreground mb-1 text-xs font-medium">
                                  Strengths:
                                </p>
                                <ul className="list-inside list-disc space-y-1 text-sm">
                                  {result.report.strengths.map(
                                    (strength, idx) => (
                                      <li key={idx}>{strength}</li>
                                    ),
                                  )}
                                </ul>
                              </div>
                            )}

                            {result.report.weaknesses.length > 0 && (
                              <div>
                                <p className="text-muted-foreground mb-1 text-xs font-medium">
                                  Weaknesses:
                                </p>
                                <ul className="list-inside list-disc space-y-1 text-sm">
                                  {result.report.weaknesses.map(
                                    (weakness, idx) => (
                                      <li key={idx}>{weakness}</li>
                                    ),
                                  )}
                                </ul>
                              </div>
                            )}

                            {result.report.missing_skills.length > 0 && (
                              <div>
                                <p className="text-muted-foreground mb-1 text-xs font-medium">
                                  Missing Skills:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {result.report.missing_skills.map(
                                    (skill, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {skill}
                                      </Badge>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
