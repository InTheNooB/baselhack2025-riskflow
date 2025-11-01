import { prisma } from "@/lib/client";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, CheckCircle, XCircle, Mail, Phone } from "lucide-react";
import Link from "next/link";

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
    },
  });

  if (!case_) {
    notFound();
  }

  // Status-based display information
  const getStatusDisplay = () => {
    switch (case_.status) {
      case "submitted":
        return {
          icon: Clock,
          title: "Application Received",
          subtitle: "Thank you for your submission",
          message:
            "We have successfully received your insurance application. Our underwriting team will review it shortly.",
          nextSteps:
            "You will receive an email confirmation shortly with your application reference number and next steps.",
          iconBgColor: "bg-[#f8faf8]",
          iconColor: "text-[#22c55e]",
          borderColor: "border-[#e5e7eb]",
        };
      case "under_review":
        return {
          icon: Clock,
          title: "Application Under Review",
          subtitle: "We're reviewing your application",
          message:
            "Your application is currently being reviewed by our experienced underwriting team.",
          nextSteps:
            "We typically complete reviews within 2-3 business days. You will receive an email notification once a decision has been made.",
          iconBgColor: "bg-yellow-50",
          iconColor: "text-yellow-600",
          borderColor: "border-yellow-200",
        };
      case "approved":
        const hasPremium = case_.assessment?.annualPremiumCHF;
        return {
          icon: CheckCircle,
          title: "Application Approved",
          subtitle: "Congratulations! Your application has been approved",
          message: hasPremium
            ? `Your application has been approved. Your annual premium is CHF ${case_.assessment?.annualPremiumCHF?.toLocaleString()}.`
            : "Your application has been approved. We will contact you shortly with further details.",
          nextSteps:
            "A detailed policy document and payment information will be sent to your email address within the next business day.",
          iconBgColor: "bg-green-50",
          iconColor: "text-green-600",
          borderColor: "border-green-200",
          premium: hasPremium ? case_.assessment?.annualPremiumCHF : null,
        };
      case "rejected":
        return {
          icon: XCircle,
          title: "Application Update",
          subtitle: "Application decision",
          message:
            "After careful review, we are unable to proceed with your application at this time.",
          nextSteps:
            "We will contact you via email within the next business day with more information about this decision. If you have any questions, please don't hesitate to reach out to our customer service team.",
          iconBgColor: "bg-red-50",
          iconColor: "text-red-600",
          borderColor: "border-red-200",
        };
      case "escalated":
        return {
          icon: Clock,
          title: "Under Senior Review",
          subtitle: "Additional review in progress",
          message:
            "Your application is being reviewed by our senior underwriting team to ensure the best possible evaluation.",
          nextSteps:
            "This process may take a few additional business days. We will contact you via email as soon as we have an update.",
          iconBgColor: "bg-orange-50",
          iconColor: "text-orange-600",
          borderColor: "border-orange-200",
        };
      default:
        return {
          icon: Clock,
          title: "Application Processing",
          subtitle: "We're working on your application",
          message: "Your application is being processed by our team.",
          nextSteps:
            "You will receive an email notification once your application has been reviewed.",
          iconBgColor: "bg-gray-50",
          iconColor: "text-gray-600",
          borderColor: "border-gray-200",
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-6 py-4 max-w-4xl">
          <div className="flex items-center gap-2">
            <span className="text-[#22c55e] font-semibold text-xl">.Pax</span>
            <span className="text-gray-900 font-semibold text-xl">
              RiskFlow
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Application Status
          </h1>
          <p className="text-sm text-gray-600">
            Reference:{" "}
            <span className="font-mono">
              {caseId.slice(0, 8).toUpperCase()}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Status Card - Takes 2 columns */}
          <div className="lg:col-span-2">
            <Card className={`border-2 ${statusDisplay.borderColor} bg-white`}>
              <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-lg ${statusDisplay.iconBgColor}`}
                  >
                    <StatusIcon
                      className={`h-8 w-8 ${statusDisplay.iconColor}`}
                    />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl font-semibold text-gray-900 mb-1">
                      {statusDisplay.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      {statusDisplay.subtitle}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {statusDisplay.message}
                </p>
                {statusDisplay.premium && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 font-medium">
                        Annual Premium
                      </span>
                      <span className="text-xl font-semibold text-gray-900">
                        CHF {statusDisplay.premium.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
                <div className="bg-[#f8faf8] border border-[#e5e7eb] rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 text-[#22c55e] mt-0.5" />
                    <p className="text-xs text-gray-700 leading-relaxed">
                      <span className="font-medium">Next:</span>{" "}
                      {statusDisplay.nextSteps}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Application Details & Contact */}
          <div className="space-y-6">
            {/* Application Details */}
            <Card className="border border-gray-200 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900">
                  Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-0.5">
                    Product
                  </p>
                  <p className="text-gray-900">{case_.product.name}</p>
                </div>
                {case_.customerName && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-0.5">
                      Applicant
                    </p>
                    <p className="text-gray-900">{case_.customerName}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-0.5">
                    Submitted
                  </p>
                  <p className="text-gray-900">
                    {new Date(case_.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="border border-gray-200 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900">
                  Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="h-4 w-4 text-gray-600" />
                    <p className="text-xs font-medium text-gray-900">Email</p>
                  </div>
                  <p className="text-gray-700">support@riskflow.com</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="h-4 w-4 text-gray-600" />
                    <p className="text-xs font-medium text-gray-900">Phone</p>
                  </div>
                  <p className="text-gray-700">+41 XX XXX XX XX</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Mon-Fri, 9AM-5PM CET
                  </p>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    Include reference{" "}
                    <span className="font-mono">
                      {caseId.slice(0, 8).toUpperCase()}
                    </span>{" "}
                    when contacting us.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
