"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Info,
  TrendingUp,
  ExternalLink,
} from "lucide-react";
import { formatCHF } from "@/lib/utils";

interface Case {
  id: string;
  status: string;
  createdAt: Date;
  customerName: string | null;
  product: {
    name: string;
  };
  assessment: {
    decision: string;
    annualPremiumCHF: number | null;
    basePremiumCHF: number | null;
  } | null;
}

interface CasesComponentProps {
  cases: Case[];
  isChief?: boolean;
}

export default function CasesComponent({
  cases,
  isChief,
}: CasesComponentProps) {
  const formatDate = (date: Date) => {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${month}.${day}.${year}`;
  };

  const formatId = (id: string) => {
    return id.slice(0, 8);
  };

  const getDecisionDisplay = (decision: string | null) => {
    if (!decision) {
      return {
        icon: Info,
        label: "Incomplete",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      };
    }

    switch (decision) {
      case "ACCEPT":
        return {
          icon: CheckCircle2,
          label: "Accepted",
          color: "text-green-600",
          bgColor: "bg-green-50",
        };
      case "ACCEPT_WITH_PREMIUM":
        return {
          icon: CheckCircle2,
          label: "Accepted",
          color: "text-green-600",
          bgColor: "bg-green-50",
        };
      case "REJECT":
        return {
          icon: XCircle,
          label: "Rejected",
          color: "text-red-600",
          bgColor: "bg-red-50",
        };
      case "PENDING_INFORMATION":
        return {
          icon: Info,
          label: "Incomplete",
          color: "text-blue-600",
          bgColor: "bg-blue-50",
        };
      default:
        return {
          icon: Info,
          label: decision.replace(/_/g, " "),
          color: "text-gray-600",
          bgColor: "bg-gray-50",
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
      // If final is significantly higher than base * 1.1, it's increased due to risk factors
      // If final is close to or lower than base * 1.1, it's reduced or standard
      const baseWithMargin = basePremium * 1.1; // Expected final with standard margin
      const ratio = premium / baseWithMargin;

      // Increased: premium is >15% above base (accounting for margin + risk loading)
      if (ratio > 1.15) {
        return {
          icon: TrendingUp,
          label: "Increased",
          color: "text-orange-600",
          bgColor: "bg-orange-50",
        };
      }
      // Reduced: premium is <5% above base (very low risk loading, essentially standard)
      // Note: In practice, "Reduced" should only appear if there's a discount applied
      // Since we don't have discounts, we'll only show "Increased" for significantly loaded premiums
      // This prevents most cases from showing as "Reduced"
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {cases.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No cases found</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200 bg-gray-50/50 hover:bg-gray-50/50">
              <TableHead className="font-semibold text-gray-900 py-4">
                ID
              </TableHead>
              <TableHead className="font-semibold text-gray-900 py-4">
                Name
              </TableHead>
              <TableHead className="font-semibold text-gray-900 py-4">
                Amount
              </TableHead>
              <TableHead className="font-semibold text-gray-900 py-4">
                AI Decision
              </TableHead>
              <TableHead className="font-semibold text-gray-900 py-4">
                Submitted
              </TableHead>
              <TableHead className="font-semibold text-gray-900 py-4">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.map((case_, index) => {
              const decisionDisplay = getDecisionDisplay(
                case_.assessment?.decision || null
              );
              const premiumChange = getPremiumChange(
                case_.assessment?.decision || null,
                case_.assessment?.annualPremiumCHF || null,
                case_.assessment?.basePremiumCHF || null
              );
              const display = premiumChange || decisionDisplay;
              const Icon = display.icon;

              return (
                <TableRow
                  key={case_.id}
                  className={`border-b border-gray-100 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                  } hover:bg-gray-100/50`}
                >
                  <TableCell className="py-4 text-gray-900">
                    {formatId(case_.id)}
                  </TableCell>
                  <TableCell className="py-4 text-gray-900">
                    {case_.customerName || "N/A"}
                  </TableCell>
                  <TableCell className="py-4 text-gray-900">
                    {formatCHF(case_.assessment?.annualPremiumCHF)}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${display.color}`} />
                      <span className={`text-sm font-medium ${display.color}`}>
                        {display.label}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-gray-900">
                    {formatDate(case_.createdAt)}
                  </TableCell>
                  <TableCell className="py-4">
                    <Link
                      href={
                        isChief ? `/reviews/${case_.id}` : `/cases/${case_.id}`
                      }
                      className="flex items-center gap-1.5 text-gray-900 hover:text-gray-700 font-medium text-sm transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
