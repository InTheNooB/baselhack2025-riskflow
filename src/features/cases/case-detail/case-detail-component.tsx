"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { confirmAssessment, reviewAssessment } from "../cases-actions";
import {
  approveEscalatedCase,
  rejectEscalatedCase,
  acceptWithPremiumEscalatedCase,
  gatherInfoEscalatedCase,
} from "@/features/chief-reviews/chief-reviews-actions";

interface CaseDetailProps {
  isChief?: boolean;
  caseData: {
    id: string;
    status: string;
    customerName: string | null;
    customerEmail: string | null;
    createdAt: Date;
    updatedAt: Date;
    product: {
      name: string;
      description: string | null;
    };
    questionsWithAnswers: Array<{
      id: string;
      questionText: string;
      inputType: string;
      answer: string | null;
    }>;
    assessment: {
      decision: string;
      annualPremiumCHF: number | null;
      basePremiumCHF: number | null;
      riskAdjustedPremiumCHF: number | null;
      marginPercent: number;
      totalMultiplier: number;
      healthSeverity: string | null;
      healthStatus: string | null;
      healthImpact: string | null;
      triggeredDeclineRule: string | null;
      triggeredGatherInfoRules: string[];
      riskFactorDetails: Array<{
        factorName: string;
        factorLabel: string;
        multiplier: number;
        explanation: string | null;
      }>;
    } | null;
    review: {
      decision: string;
      confirmedDecision: string | null;
      adjustedDecision: string | null;
      adjustedPremiumCHF: number | null;
      adjustmentReason: string | null;
      adjustmentNotes: string | null;
      escalationReason: string | null;
      underwriter: {
        name: string;
        email: string;
      };
      chiefReview?: {
        decision: string;
        finalPremiumCHF: number | null;
        decisionReason: string | null;
        feedbackNotes: string | null;
        chiefUnderwriter: {
          name: string;
          email: string;
        };
      } | null;
      proposals?: Array<{
        id: string;
        ruleType: string;
        ruleName: string;
        currentExpression: string | null;
        proposedExpression: string | null;
        caseContext: string;
        aiReasoning: string;
        confidence: number;
        status: string;
      }>;
    } | null;
  };
}

export default function CaseDetailComponent({ caseData, isChief }: CaseDetailProps) {
  const router = useRouter();
  const [isReviewing, setIsReviewing] = React.useState(false);
  const [reviewReason, setReviewReason] = React.useState("");
  const [isActioning, setIsActioning] = React.useState(false);
  const [actionType, setActionType] = React.useState<
    "approve" | "reject" | "accept-premium" | "gather-info" | null
  >(null);
  const [decisionReason, setDecisionReason] = React.useState("");
  const [feedbackNotes, setFeedbackNotes] = React.useState("");
  const [finalPremium, setFinalPremium] = React.useState<number | undefined>(
    caseData.assessment?.annualPremiumCHF || undefined
  );

  const handleConfirm = async () => {
    try {
      toast.loading("Confirming assessment...", { id: "confirm" });

      // TODO: Get current user ID
      const { success, error } = await confirmAssessment(caseData.id);

      if (success) {
        toast.success("Assessment confirmed", { id: "confirm" });
        router.refresh();
      } else {
        toast.error(error || "Failed to confirm", { id: "confirm" });
      }
    } catch {
      toast.error("Failed to confirm assessment", { id: "confirm" });
    }
  };

  const handleReview = async () => {
    if (!reviewReason.trim()) {
      toast.error("Please provide a reason for the review");
      return;
    }

    try {
      toast.loading("Submitting review...", { id: "review" });

      // TODO: Get current user ID
      const { success, error } = await reviewAssessment(
        caseData.id,
        reviewReason
      );

      if (success) {
        toast.success("Case escalated to chief underwriter", { id: "review" });
        setIsReviewing(false);
        router.refresh();
      } else {
        toast.error(error || "Failed to submit review", { id: "review" });
      }
    } catch {
      toast.error("Failed to submit review", { id: "review" });
    }
  };

  const handleApprove = async () => {
    if (!decisionReason.trim()) {
      toast.error("Please provide a decision reason");
      return;
    }

    try {
      toast.loading("Approving case...", { id: "chief-action" });

      const { success, error } = await approveEscalatedCase(
        caseData.id,
        finalPremium,
        decisionReason
      );

      if (success) {
        toast.success("Case approved", { id: "chief-action" });
        setIsActioning(false);
        router.refresh();
      } else {
        toast.error(error || "Failed to approve case", { id: "chief-action" });
      }
    } catch {
      toast.error("Failed to approve case", { id: "chief-action" });
    }
  };

  const handleReject = async () => {
    if (!decisionReason.trim()) {
      toast.error("Please provide a decision reason");
      return;
    }

    try {
      toast.loading("Rejecting case...", { id: "chief-action" });

      const { success, error } = await rejectEscalatedCase(
        caseData.id,
        decisionReason
      );

      if (success) {
        toast.success("Case rejected", { id: "chief-action" });
        setIsActioning(false);
        router.refresh();
      } else {
        toast.error(error || "Failed to reject case", { id: "chief-action" });
      }
    } catch {
      toast.error("Failed to reject case", { id: "chief-action" });
    }
  };

  const handleAcceptWithPremium = async () => {
    if (!finalPremium) {
      toast.error("Please provide a premium amount");
      return;
    }

    try {
      toast.loading("Accepting with premium...", { id: "chief-action" });

      const { success, error } = await acceptWithPremiumEscalatedCase(
        caseData.id,
        finalPremium,
        decisionReason || undefined
      );

      if (success) {
        toast.success("Case accepted with premium", {
          id: "chief-action",
        });
        setIsActioning(false);
        router.refresh();
      } else {
        toast.error(error || "Failed to accept with premium", {
          id: "chief-action",
        });
      }
    } catch {
      toast.error("Failed to accept with premium", { id: "chief-action" });
    }
  };

  const handleGatherInfo = async () => {
    try {
      toast.loading("Requesting additional information...", { id: "chief-action" });

      const { success, error } = await gatherInfoEscalatedCase(
        caseData.id,
        decisionReason || undefined,
        feedbackNotes || undefined
      );

      if (success) {
        toast.success("Additional information requested", {
          id: "chief-action",
        });
        setIsActioning(false);
        router.refresh();
      } else {
        toast.error(error || "Failed to request additional information", {
          id: "chief-action",
        });
      }
    } catch {
      toast.error("Failed to request additional information", { id: "chief-action" });
    }
  };

  const getDecisionDisplay = (decision: string) => {
    type BadgeVariant = "default" | "destructive" | "secondary" | "outline";
    const variants: Record<string, BadgeVariant> = {
      REJECT: "destructive",
      ACCEPT: "default",
      ACCEPT_WITH_PREMIUM: "default",
      PENDING_INFORMATION: "secondary",
    };

    return (
      <Badge variant={variants[decision] || "secondary"}>
        {decision.replace(/_/g, " ")}
      </Badge>
    );
  };

  const getStatusDisplay = (status: string) => {
    type BadgeVariant = "default" | "destructive" | "secondary" | "outline";
    const variants: Record<string, BadgeVariant> = {
      submitted: "default",
      approved: "default",
      rejected: "destructive",
      escalated: "destructive",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Case Details</h1>
        <p className="text-muted-foreground mt-2">Case ID: {caseData.id}</p>
      </div>

      <div className="space-y-6">
        {/* Escalation Notice for Chief */}
        {isChief && caseData.status === "escalated" && (
          <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <CardHeader>
              <CardTitle className="text-orange-900 dark:text-orange-100">
                Escalated for Chief Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-900 dark:text-orange-100">
                This case was escalated by{" "}
                {caseData.review?.underwriter.name || "an underwriter"} for your
                review.
              </p>
              {caseData.review?.escalationReason && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                    Underwriter&apos;s Reason for Escalation:
                  </p>
                  <p className="text-orange-800 dark:text-orange-200">
                    {caseData.review.escalationReason}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Case Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Product</p>
                <p className="text-muted-foreground">{caseData.product.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                {getStatusDisplay(caseData.status)}
              </div>
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-muted-foreground">
                  {new Date(caseData.createdAt).toLocaleString("en-US", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-muted-foreground">
                  {new Date(caseData.updatedAt).toLocaleString("en-US", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Answers */}
        <Card>
          <CardHeader>
            <CardTitle>Application Answers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {caseData.questionsWithAnswers.map((qa) => (
                  <TableRow key={qa.id}>
                    <TableHead className="w-[300px]">
                      {qa.questionText}
                    </TableHead>
                    <TableCell>
                      {qa.answer || (
                        <span className="text-muted-foreground italic">
                          No answer
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Assessment Results */}
        {caseData.assessment && (
          <Card>
            <CardHeader>
              <CardTitle>System Recommendation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                  This is an AI-generated recommendation and requires manual
                  review by an underwriter.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Recommended Decision</p>
                <div className="mt-2">
                  {getDecisionDisplay(caseData.assessment.decision)}
                </div>
              </div>

              {caseData.assessment.annualPremiumCHF && (
                <div>
                  <p className="text-sm font-medium">Annual Premium</p>
                  <p className="text-2xl font-bold">
                    CHF {caseData.assessment.annualPremiumCHF.toLocaleString()}
                  </p>
                </div>
              )}

              {caseData.assessment.riskFactorDetails &&
                caseData.assessment.riskFactorDetails.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">
                      Risk Factor Breakdown
                    </p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Factor</TableHead>
                          <TableHead>Multiplier</TableHead>
                          <TableHead>Explanation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {caseData.assessment.riskFactorDetails.map((detail) => (
                          <TableRow key={detail.factorName}>
                            <TableCell>{detail.factorLabel}</TableCell>
                            <TableCell>
                              {detail.multiplier.toFixed(3)}x
                            </TableCell>
                            <TableCell>{detail.explanation || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <p className="text-sm text-muted-foreground mt-2">
                      Total Multiplier:{" "}
                      {caseData.assessment.totalMultiplier.toFixed(3)}x
                    </p>
                  </div>
                )}

              {caseData.assessment.triggeredDeclineRule && (
                <div>
                  <p className="text-sm font-medium">Decline Rule Triggered</p>
                  <p className="text-destructive">
                    {caseData.assessment.triggeredDeclineRule}
                  </p>
                </div>
              )}

              {caseData.assessment.healthSeverity && (
                <div>
                  <p className="text-sm font-medium">Health Classification</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">
                      Severity: {caseData.assessment.healthSeverity}
                    </Badge>
                    <Badge variant="secondary">
                      Status: {caseData.assessment.healthStatus}
                    </Badge>
                    <Badge variant="secondary">
                      Impact: {caseData.assessment.healthImpact}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Rule Adjustment Proposals */}
        {isChief && caseData.review?.proposals && caseData.review.proposals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Rule Adjustment Proposals</CardTitle>
              <p className="text-sm text-muted-foreground">
                Based on the escalation reason, AI has suggested the following rule changes
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {caseData.review.proposals.map((proposal) => (
                <div key={proposal.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">{proposal.ruleName}</h4>
                      <p className="text-xs text-muted-foreground">{proposal.ruleType.replace(/_/g, " ")}</p>
                    </div>
                    <Badge variant="secondary">
                      {Math.round(proposal.confidence * 100)}% confidence
                    </Badge>
                  </div>
                  
                  {proposal.currentExpression && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Current:</p>
                      <code className="text-xs bg-muted px-2 py-1 rounded block">
                        {proposal.currentExpression}
                      </code>
                    </div>
                  )}
                  
                  {proposal.proposedExpression && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Proposed:</p>
                      <code className="text-xs bg-blue-50 dark:bg-blue-950 px-2 py-1 rounded block">
                        {proposal.proposedExpression}
                      </code>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">AI Reasoning:</p>
                    <p className="text-sm">{proposal.aiReasoning}</p>
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full">
                    View in Configuration →
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Chief Underwriter Actions */}
        {isChief && caseData.status === "escalated" && !caseData.review?.chiefReview && (
          <Card>
            <CardHeader>
              <CardTitle>Chief Underwriter Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isActioning ? (
                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={() => {
                    setActionType("approve");
                    setIsActioning(true);
                  }}>Approve</Button>
                  <Button variant="destructive" onClick={() => {
                    setActionType("reject");
                    setIsActioning(true);
                  }}>Reject</Button>
                  <Button variant="outline" onClick={() => {
                    setActionType("accept-premium");
                    setIsActioning(true);
                  }}>Accept + Premium</Button>
                  <Button variant="outline" onClick={() => {
                    setActionType("gather-info");
                    setIsActioning(true);
                  }}>Gather Info</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Reason for {actionType?.replace(/_/g, " ")}
                    </label>
                    <textarea
                      value={decisionReason}
                      onChange={(e) => setDecisionReason(e.target.value)}
                      className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                      placeholder={`Explain why you are ${actionType?.replace(/_/g, " ")} this case...`}
                    />
                  </div>
                  {actionType === "accept-premium" && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Final Premium (CHF)
                      </label>
                      <input
                        type="number"
                        value={finalPremium}
                        onChange={(e) => setFinalPremium(parseFloat(e.target.value) || undefined)}
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="Enter final premium"
                      />
                    </div>
                  )}
                  {actionType === "gather-info" && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Additional Notes (Optional)
                      </label>
                      <textarea
                        value={feedbackNotes}
                        onChange={(e) => setFeedbackNotes(e.target.value)}
                        className="w-full min-h-[80px] px-3 py-2 border rounded-md"
                        placeholder="Provide additional information..."
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button onClick={
                      actionType === "approve"
                        ? handleApprove
                        : actionType === "reject"
                          ? handleReject
                          : actionType === "accept-premium"
                            ? handleAcceptWithPremium
                            : handleGatherInfo
                    }>
                      Submit {actionType?.replace(/-/g, " ")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsActioning(false);
                        setActionType(null);
                        setDecisionReason("");
                        setFeedbackNotes("");
                        setFinalPremium(caseData.assessment?.annualPremiumCHF || undefined);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Underwriter Review Section (non-chief) */}
        {!isChief && caseData.status !== "escalated" && !caseData.review && (
          <Card>
            <CardHeader>
              <CardTitle>Underwriter Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isReviewing ? (
                <div className="flex gap-4">
                  <Button onClick={handleConfirm}>
                    Confirm Recommendation
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsReviewing(true)}
                  >
                    Escalate to Chief
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Reason for Escalation
                    </label>
                    <textarea
                      value={reviewReason}
                      onChange={(e) => setReviewReason(e.target.value)}
                      className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                      placeholder="Explain why you are escalating this case..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleReview}>Submit Review</Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsReviewing(false);
                        setReviewReason("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Existing Review */}
        {caseData.review && (
          <Card>
            <CardHeader>
              <CardTitle>Review Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Decision</p>
                <p className="capitalize">{caseData.review.decision}</p>
              </div>
              {caseData.review.escalationReason && (
                <div>
                  <p className="text-sm font-medium">Escalation Reason</p>
                  <p className="text-muted-foreground">
                    {caseData.review.escalationReason}
                  </p>
                </div>
              )}
              {caseData.review.adjustedDecision && (
                <div>
                  <p className="text-sm font-medium">Adjusted Decision</p>
                  <p className="capitalize">
                    {caseData.review.adjustedDecision}
                  </p>
                </div>
              )}
              {caseData.review.adjustmentReason && (
                <div>
                  <p className="text-sm font-medium">Adjustment Reason</p>
                  <p className="text-muted-foreground">
                    {caseData.review.adjustmentReason}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium">Reviewed By</p>
                <p className="text-muted-foreground">
                  {caseData.review.underwriter.name} (
                  {caseData.review.underwriter.email})
                </p>
              </div>
              {caseData.review.chiefReview && (
                <div className="ml-4 mt-4 p-4 border-l-2 border-gray-200">
                  <h3 className="text-lg font-semibold">Chief Underwriter Decision</h3>
                  <p>
                    Reviewed by:{" "}
                    <span className="font-medium">
                      {caseData.review.chiefReview.chiefUnderwriter.name}
                    </span>{" "}
                    ({caseData.review.chiefReview.chiefUnderwriter.email})
                  </p>
                  <p>
                    Decision:{" "}
                    <span className="font-medium">
                      {caseData.review.chiefReview.decision}
                    </span>
                  </p>
                  {caseData.review.chiefReview.decisionReason && (
                    <p>
                      Reason:{" "}
                      <span className="font-medium">
                        {caseData.review.chiefReview.decisionReason}
                      </span>
                    </p>
                  )}
                  {caseData.review.chiefReview.finalPremiumCHF && (
                    <p>
                      Final Premium:{" "}
                      <span className="font-medium">
                        CHF {caseData.review.chiefReview.finalPremiumCHF.toLocaleString()}
                      </span>
                    </p>
                  )}
                  {caseData.review.chiefReview.feedbackNotes && (
                    <p>
                      Feedback:{" "}
                      <span className="font-medium">
                        {caseData.review.chiefReview.feedbackNotes}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
