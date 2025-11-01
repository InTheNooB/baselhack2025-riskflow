import { prisma } from "@/lib/client";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, XCircle } from "lucide-react";

interface CasePageProps {
  params: Promise<{ caseId: string }>;
}

export default async function CasePage({ params }: CasePageProps) {
  const { caseId } = await params;

  // Fetch case with related data
  const case_ = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      product: true,
      assessment: true,
      review: {
        include: {
          underwriter: true,
        },
      },
    },
  });

  if (!case_) {
    notFound();
  }

  // Status-based icons and text
  const getStatusDisplay = () => {
    switch (case_.status) {
      case "submitted":
        return {
          icon: Clock,
          title: "Application Submitted",
          description: "Your application is being processed. Our team will review it shortly.",
          iconColor: "text-blue-500",
        };
      case "under_review":
        return {
          icon: Clock,
          title: "Under Review",
          description: "An underwriter is currently reviewing your application.",
          iconColor: "text-yellow-500",
        };
      case "approved":
        if (case_.assessment) {
          return {
            icon: CheckCircle,
            title: "Application Approved!",
            description: `Your application has been approved. Annual premium: CHF ${case_.assessment.annualPremiumCHF?.toLocaleString()}`,
            iconColor: "text-green-500",
          };
        }
        return {
          icon: CheckCircle,
          title: "Application Approved",
          description: "Your application has been approved.",
          iconColor: "text-green-500",
        };
      case "rejected":
        return {
          icon: XCircle,
          title: "Application Not Approved",
          description: "Unfortunately, we cannot approve your application at this time.",
          iconColor: "text-red-500",
        };
      case "escalated":
        return {
          icon: Clock,
          title: "Under Senior Review",
          description: "Your application has been escalated to a chief underwriter for review.",
          iconColor: "text-orange-500",
        };
      default:
        return {
          icon: Clock,
          title: "Processing",
          description: "Your application is being processed.",
          iconColor: "text-gray-500",
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  return (
    <div className="container mx-auto py-12 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Application Status</h1>
        <p className="text-muted-foreground mt-2">
          Case ID: {caseId.slice(0, 12)}...
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <StatusIcon className={`h-12 w-12 ${statusDisplay.iconColor}`} />
            <div>
              <CardTitle className="text-2xl">{statusDisplay.title}</CardTitle>
              <p className="text-muted-foreground mt-1">
                {statusDisplay.description}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Product</h3>
            <p className="text-muted-foreground">{case_.product.name}</p>
          </div>

          {case_.customerName && (
            <div>
              <h3 className="font-semibold mb-2">Applicant</h3>
              <p className="text-muted-foreground">{case_.customerName}</p>
            </div>
          )}

          {case_.assessment && (
            <div>
              <h3 className="font-semibold mb-2">Assessment Details</h3>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Decision:</span>
                  <span className="font-medium">{case_.assessment.decision}</span>
                </div>
                {case_.assessment.annualPremiumCHF && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Annual Premium:</span>
                    <span className="font-medium">
                      CHF {case_.assessment.annualPremiumCHF.toLocaleString()}
                    </span>
                  </div>
                )}
                {case_.assessment.totalMultiplier && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk Multiplier:</span>
                    <span className="font-medium">
                      {case_.assessment.totalMultiplier.toFixed(2)}x
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {case_.review && case_.review.decision !== "CONFIRM" && (
            <div>
              <h3 className="font-semibold mb-2">Review Notes</h3>
              <p className="text-muted-foreground">
                {case_.review.adjustmentReason || case_.review.escalationReason || "No additional notes"}
              </p>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            Submitted: {new Date(case_.createdAt).toLocaleString()}
            {case_.updatedAt.getTime() !== case_.createdAt.getTime() && (
              <> • Last updated: {new Date(case_.updatedAt).toLocaleString()}</>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

