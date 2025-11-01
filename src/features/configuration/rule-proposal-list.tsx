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

interface RuleProposal {
  id: string;
  ruleType: string;
  ruleName: string;
  status: string;
  confidence: number;
  createdAt: Date;
  chiefPrompt: string;
  review: {
    underwriter: {
      name: string;
      email: string;
    };
  } | null;
}

interface RuleProposalListProps {
  proposals: RuleProposal[];
}

export default function RuleProposalList({ proposals }: RuleProposalListProps) {
  const getStatusBadge = (status: string) => {
    type BadgeVariant = "default" | "destructive" | "secondary" | "outline";
    const variants: Record<string, BadgeVariant> = {
      pending: "default",
      accepted: "default",
      rejected: "destructive",
      modified: "secondary",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getRuleTypeBadge = (ruleType: string) => {
    return <Badge variant="outline">{ruleType.replace(/_/g, " ")}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Rule Adjustment Proposals</CardTitle>
      </CardHeader>
      <CardContent>
        {proposals.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No pending proposals
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map((proposal) => (
                <TableRow key={proposal.id}>
                  <TableCell>
                    <Link
                      href={`/configuration/${proposal.id}`}
                      className="font-medium hover:underline"
                    >
                      {proposal.ruleName}
                    </Link>
                  </TableCell>
                  <TableCell>{getRuleTypeBadge(proposal.ruleType)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {proposal.review?.underwriter.name || "System"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {Math.round(proposal.confidence * 100)}%
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                  <TableCell>
                    {new Date(proposal.createdAt).toLocaleDateString("en-US", {
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
