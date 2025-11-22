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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";
import { useQuery } from "convex/react";
import { Search, Sparkles, User, FileText, Download, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import {
  useFindMatchesMutation,
  type SearchResult,
} from "../../hooks/useFindMatchesMutation";
import { useGetSanitizedResumeQuery } from "../../hooks/useGetSanitizedResumeQuery";

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
  const [searchType, setSearchType] = useState<"hybrid" | "vector" | "keyword">(
    "hybrid",
  );
  const [results, setResults] = useState<SearchResult[] | null>(null);
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

    try {
      const response = await findMatches({
        job_description: query,
        k: 10,
        search_type: searchType,
      });
      setResults(response.results);
    } catch (error) {
      console.error("Failed to find matches:", error);
      setResults([]);
    }
  };

  const getSearchTypeLabel = (type: string) => {
    switch (type) {
      case "hybrid":
        return t("dashboard.hr.resumeMatching.searchTypes.hybrid");
      case "vector":
        return t("dashboard.hr.resumeMatching.searchTypes.vector");
      case "keyword":
        return t("dashboard.hr.resumeMatching.searchTypes.keyword");
      default:
        return type;
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
                    <div className="flex items-center gap-2">
                      <FileText className="text-muted-foreground h-4 w-4" />
                      <a
                        href={item.resumeAttachment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary text-sm hover:underline"
                        title="Download original resume"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCandidateId(item.candidate._id);
                            }}
                            className="text-primary text-sm hover:underline"
                            title="View sanitized resume"
                          >
                            <Eye className="h-4 w-4" />
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

          <div className="space-y-2">
            <Label htmlFor="search-type">Search Type</Label>
            <Select
              value={searchType}
              onValueChange={(value) =>
                setSearchType(value as "hybrid" | "vector" | "keyword")
              }
            >
              <SelectTrigger id="search-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hybrid">
                  {t("dashboard.hr.resumeMatching.searchTypes.hybrid")}
                </SelectItem>
                <SelectItem value="vector">
                  {t("dashboard.hr.resumeMatching.searchTypes.vector")}
                </SelectItem>
                <SelectItem value="keyword">
                  {t("dashboard.hr.resumeMatching.searchTypes.keyword")}
                </SelectItem>
              </SelectContent>
            </Select>
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
                {results.map((result, index) => (
                  <Card
                    key={index}
                    className="border-border bg-muted/50 rounded-lg border p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {t(
                            "dashboard.hr.resumeMatching.findMatches.results.score",
                          )}
                          : {(result.score * 100).toFixed(1)}%
                        </Badge>
                        <Badge variant="outline">
                          {getSearchTypeLabel(result.search_type)}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-muted-foreground mb-2 text-sm">
                      {result.content.substring(0, 300)}
                      {result.content.length > 300 ? "..." : ""}
                    </p>

                    {result.metadata &&
                      Object.keys(result.metadata).length > 0 && (
                        <div className="mt-2 text-xs">
                          <span className="text-muted-foreground font-medium">
                            {t(
                              "dashboard.hr.resumeMatching.findMatches.results.metadata",
                            )}
                            :
                          </span>
                          <pre className="text-muted-foreground mt-1 break-words whitespace-pre-wrap">
                            {JSON.stringify(result.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
