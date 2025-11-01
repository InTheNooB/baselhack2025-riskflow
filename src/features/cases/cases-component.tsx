"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

interface Case {
  id: string;
  status: string;
  createdAt: Date;
  product: {
    name: string;
  };
  assessment: {
    decision: string;
    annualPremiumCHF: number | null;
  } | null;
}

interface CasesComponentProps {
  cases: Case[];
  isChief?: boolean;
}

export default function CasesComponent({ cases, isChief }: CasesComponentProps) {
  const getStatusBadge = (status: string) => {
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

  const getDecisionBadge = (decision: string | null) => {
    if (!decision) return null;

    type BadgeVariant = "default" | "destructive" | "secondary" | "outline";
    const variants: Record<string, BadgeVariant> = {
      REJECT: "destructive",
      ACCEPT: "default",
      ACCEPT_WITH_PREMIUM: "default",
      PENDING_INFORMATION: "secondary",
    };

    return (
      <Badge variant={variants[decision] || "secondary"} className="ml-2">
        {decision.replace(/_/g, " ")}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Cases</CardTitle>
      </CardHeader>
      <CardContent>
        {cases.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No cases found
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case ID</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Decision</TableHead>
                <TableHead>Premium</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((case_) => (
                <TableRow key={case_.id}>
                  <TableCell>
                    <Link
                      href={isChief ? `/reviews/${case_.id}` : `/cases/${case_.id}`}
                      className="font-medium hover:underline"
                    >
                      {case_.id.slice(0, 12)}...
                    </Link>
                  </TableCell>
                  <TableCell>{case_.product.name}</TableCell>
                  <TableCell>{getStatusBadge(case_.status)}</TableCell>
                  <TableCell>
                    {getDecisionBadge(case_.assessment?.decision || null)}
                  </TableCell>
                  <TableCell>
                    {case_.assessment?.annualPremiumCHF
                      ? `CHF ${case_.assessment.annualPremiumCHF.toLocaleString()}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {new Date(case_.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
