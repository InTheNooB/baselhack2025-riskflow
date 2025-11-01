"use client";

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
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
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
import {
  CheckCircle2,
  XCircle,
  Info,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { formatCHF } from "@/lib/utils";

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

export default function CaseDetailComponent({
  caseData,
  isChief,
}: CaseDetailProps) {
  const router = useRouter();
  const [isReviewing, setIsReviewing] = React.useState(false);
  const [reviewReason, setReviewReason] = React.useState(
    caseData.review?.escalationReason || ""
  );
  const [isActioning, setIsActioning] = React.useState(false);
  const [actionType, setActionType] = React.useState<
    "approve" | "reject" | "accept-premium" | "gather-info" | null
  >(null);
  const [decisionReason, setDecisionReason] = React.useState("");
  const [feedbackNotes, setFeedbackNotes] = React.useState("");
  const [finalPremium, setFinalPremium] = React.useState<number | undefined>(
    caseData.assessment?.annualPremiumCHF || undefined
  );

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear()).slice(-2);
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = d.getHours() >= 12 ? "PM" : "AM";
    const hours12 = d.getHours() % 12 || 12;
    return `${day}.${month}.${year}, ${hours12}:${minutes} ${ampm}`;
  };

  const formatCaseId = (id: string) => {
    return `#${id.slice(0, 4)}`;
  };

  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      submitted: { label: "Unresolved", color: "text-red-600" },
      under_review: { label: "Unresolved", color: "text-red-600" },
      approved: { label: "Approved", color: "text-green-600" },
      rejected: { label: "Rejected", color: "text-red-600" },
      escalated: { label: "Escalated", color: "text-orange-600" },
    };
    return (
      statusMap[status] || {
        label: status.charAt(0).toUpperCase() + status.slice(1),
        color: "text-gray-600",
      }
    );
  };

  const getDecisionDisplay = (decision: string | null) => {
    if (!decision) {
      return {
        icon: Info,
        label: "Incomplete",
        color: "text-blue-600",
      };
    }

    switch (decision) {
      case "ACCEPT":
        return {
          icon: CheckCircle2,
          label: "Accepted",
          color: "text-green-600",
        };
      case "ACCEPT_WITH_PREMIUM":
        return {
          icon: CheckCircle2,
          label: "Accepted",
          color: "text-green-600",
        };
      case "REJECT":
        return {
          icon: XCircle,
          label: "Rejected",
          color: "text-red-600",
        };
      case "PENDING_INFORMATION":
        return {
          icon: Info,
          label: "Incomplete",
          color: "text-blue-600",
        };
      default:
        return {
          icon: Info,
          label: decision.replace(/_/g, " "),
          color: "text-gray-600",
        };
    }
  };

  // Determine if premium was increased or reduced by comparing final premium to base premium
  const getPremiumChange = (
    decision: string | null,
    premium: number | null,
    basePremium: number | null
  ) => {
    // Only show Increased/Reduced for ACCEPT_WITH_PREMIUM cases with valid premiums
    if (
      decision === "ACCEPT_WITH_PREMIUM" &&
      premium &&
      basePremium &&
      basePremium > 0
    ) {
      // Calculate the ratio (final includes 10% margin)
      const baseWithMargin = basePremium * 1.1; // Expected final with standard margin
      const ratio = premium / baseWithMargin;

      // Increased: premium is >15% above base (accounting for margin + risk loading)
      if (ratio > 1.15) {
        return {
          icon: TrendingUp,
          label: "Increased",
          color: "text-orange-600",
        };
      }
    }
    return null;
  };

  const generateExplanation = () => {
    if (!caseData.assessment) return "";

    const decision = caseData.assessment.decision;
    const multiplier = caseData.assessment.totalMultiplier;
    const riskFactors = caseData.assessment.riskFactorDetails || [];

    if (decision === "REJECT") {
      return caseData.assessment.triggeredDeclineRule
        ? `Application rejected due to: ${caseData.assessment.triggeredDeclineRule}`
        : "Application rejected based on risk assessment.";
    }

    if (decision === "PENDING_INFORMATION") {
      return "Additional information required before a decision can be made.";
    }

    // Calculate premium increase percentage
    const premiumIncrease =
      multiplier > 1.0 ? Math.round((multiplier - 1.0) * 100) : 0;

    // Build explanation with risk factors
    const activeFactors = riskFactors.filter((f) => f.multiplier !== 1.0);
    const factorDescriptions = activeFactors.map((f) =>
      f.factorLabel.toLowerCase()
    );

    let explanation = `Based on the provided health information, the system would accept`;
    if (premiumIncrease > 0) {
      explanation += `, with a premium increase of ${premiumIncrease}%`;
    }
    explanation += ".";

    if (factorDescriptions.length > 0) {
      explanation += ` This is influenced by ${factorDescriptions.join(", ")}${
        caseData.assessment.healthSeverity === "moderate" ||
        caseData.assessment.healthSeverity === "severe"
          ? `, and pre-existing conditions${
              caseData.assessment.healthStatus === "ongoing"
                ? ", such as " +
                  (caseData.assessment.healthStatus
                    ?.toLowerCase()
                    .includes("back pain")
                    ? "back pain for 3+ years"
                    : "ongoing health conditions")
                : ""
            }`
          : ""
      }.`;
    }

    return explanation;
  };

  const handleConfirm = async () => {
    try {
      toast.loading("Confirming assessment...", { id: "confirm" });
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
      toast.loading("Requesting additional information...", {
        id: "chief-action",
      });

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
      toast.error("Failed to request additional information", {
        id: "chief-action",
      });
    }
  };

  const statusDisplay = getStatusDisplay(caseData.status);
  const decisionDisplay = getDecisionDisplay(
    caseData.assessment?.decision || null
  );
  const premiumChange = getPremiumChange(
    caseData.assessment?.decision || null,
    caseData.assessment?.annualPremiumCHF || null,
    caseData.assessment?.basePremiumCHF || null
  );
  // Use premium change display if available, otherwise use decision display
  const display = premiumChange || decisionDisplay;
  const DisplayIcon = display.icon;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <PageHeader
        showBackButton
        title={`${formatCaseId(caseData.id)} ${
          caseData.customerName || "Unknown"
        }`}
      />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6 max-w-7xl">
        {/* Top Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-50">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Product</p>
              <p className="text-xl font-bold text-gray-900">
                {caseData.product.name}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gray-50">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Status</p>
              <p className={`text-xl font-bold ${statusDisplay.color}`}>
                {statusDisplay.label}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gray-50">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Created</p>
              <p className="text-xl font-bold text-gray-900">
                {formatDate(caseData.createdAt)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Application Answers */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Application Answers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {caseData.questionsWithAnswers.map((qa) => (
                <div
                  key={qa.id}
                  className="flex gap-8 py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="w-80 font-medium text-gray-900">
                    {qa.questionText}
                  </div>
                  <div className="flex-1 text-gray-700">
                    {qa.answer || (
                      <span className="text-gray-400 italic">No answer</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Recommendation Section */}
        {caseData.assessment && (
          <div className="relative mb-8 border-2 border-purple-200/50 rounded-2xl p-6 bg-gradient-to-br from-purple-50/30 via-blue-50/30 to-indigo-50/30 shadow-lg">
            {/* AI Banner */}
            <div className="relative bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 rounded-xl p-4 border border-purple-200/50 shadow-sm mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Sparkles className="h-5 w-5 text-purple-600 animate-pulse" />
                  <div className="absolute inset-0 bg-purple-400 rounded-full blur-sm opacity-30 animate-ping" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    AI-Generated
                  </span>
                  <span className="text-xs text-gray-600">
                    This recommendation requires manual review by an
                    underwriter.
                  </span>
                </div>
                <div className="absolute top-1 right-1 w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              </div>
            </div>

            {/* System Recommendation Cards */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    System Recommendation
                  </p>
                  <div className="flex items-center gap-2">
                    {DisplayIcon && (
                      <DisplayIcon className={`h-5 w-5 ${display.color}`} />
                    )}
                    <p className={`text-lg font-semibold ${display.color}`}>
                      {display.label}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Annual Premium
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCHF(caseData.assessment.annualPremiumCHF)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Explanation */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Explanation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {generateExplanation()}
                </p>
              </CardContent>
            </Card>

            {/* Risk Factor Breakdown */}
            {caseData.assessment.riskFactorDetails &&
              caseData.assessment.riskFactorDetails.length > 0 && (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>Risk Factor Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-gray-200">
                          <TableHead className="font-semibold text-gray-900">
                            Factor
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900">
                            Multiplier
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900">
                            Explanation
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {caseData.assessment.riskFactorDetails.map((detail) => (
                          <TableRow
                            key={detail.factorName}
                            className="border-b border-gray-100"
                          >
                            <TableCell className="text-gray-900">
                              {detail.factorLabel}
                            </TableCell>
                            <TableCell className="text-gray-900">
                              {detail.multiplier.toFixed(3)}x
                            </TableCell>
                            <TableCell className="text-gray-700">
                              {detail.explanation || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
          </div>
        )}

        {/* Action Buttons (Underwriter) */}
        {!isChief && caseData.status !== "escalated" && !caseData.review && (
          <div className="flex gap-4 mb-8">
            <Button
              variant="outline"
              onClick={() => setIsReviewing(true)}
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              Escalate to Chief
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-[#22c55e] hover:bg-[#20b755] text-white"
            >
              Confirm
            </Button>
          </div>
        )}

        {/* Escalation Reason Section */}
        {isReviewing && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Reason for escalated review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
                placeholder="Enter reason for escalation..."
                className="min-h-[120px] resize-none"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleReview}
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white border-gray-900"
                >
                  Submit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsReviewing(false);
                    setReviewReason(caseData.review?.escalationReason || "");
                  }}
                  className="flex-1"
                >
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chief Underwriter Actions */}
        {isChief &&
          caseData.status === "escalated" &&
          !caseData.review?.chiefReview && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Chief Underwriter Decision</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isActioning ? (
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => {
                        setActionType("approve");
                        setIsActioning(true);
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setActionType("reject");
                        setIsActioning(true);
                      }}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setActionType("accept-premium");
                        setIsActioning(true);
                      }}
                    >
                      Accept + Premium
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setActionType("gather-info");
                        setIsActioning(true);
                      }}
                    >
                      Gather Info
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Reason for {actionType?.replace(/_/g, " ")}
                      </label>
                      <Textarea
                        value={decisionReason}
                        onChange={(e) => setDecisionReason(e.target.value)}
                        className="min-h-[100px] resize-none"
                        placeholder={`Explain why you are ${actionType?.replace(
                          /_/g,
                          " "
                        )} this case...`}
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
                          onChange={(e) =>
                            setFinalPremium(
                              parseFloat(e.target.value) || undefined
                            )
                          }
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
                        <Textarea
                          value={feedbackNotes}
                          onChange={(e) => setFeedbackNotes(e.target.value)}
                          className="min-h-[80px] resize-none"
                          placeholder="Provide additional information..."
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={
                          actionType === "approve"
                            ? handleApprove
                            : actionType === "reject"
                            ? handleReject
                            : actionType === "accept-premium"
                            ? handleAcceptWithPremium
                            : handleGatherInfo
                        }
                      >
                        Submit {actionType?.replace(/-/g, " ")}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsActioning(false);
                          setActionType(null);
                          setDecisionReason("");
                          setFeedbackNotes("");
                          setFinalPremium(
                            caseData.assessment?.annualPremiumCHF || undefined
                          );
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
      </main>
    </div>
  );
}
