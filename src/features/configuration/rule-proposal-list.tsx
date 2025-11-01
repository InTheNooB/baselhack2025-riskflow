"use client";

import { Badge } from "@/components/ui/badge";
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

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${month}.${day}.${year}`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {proposals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No pending proposals</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200 bg-gray-50/50 hover:bg-gray-50/50">
              <TableHead className="font-semibold text-gray-900 py-4">
                Rule
              </TableHead>
              <TableHead className="font-semibold text-gray-900 py-4">
                Type
              </TableHead>
              <TableHead className="font-semibold text-gray-900 py-4">
                Source
              </TableHead>
              <TableHead className="font-semibold text-gray-900 py-4">
                Confidence
              </TableHead>
              <TableHead className="font-semibold text-gray-900 py-4">
                Status
              </TableHead>
              <TableHead className="font-semibold text-gray-900 py-4">
                Created
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proposals.map((proposal, index) => (
              <TableRow
                key={proposal.id}
                className={`border-b border-gray-100 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                } hover:bg-gray-100/50`}
              >
                <TableCell className="py-4">
                  <Link
                    href={`/configuration/${proposal.id}`}
                    className="font-medium text-gray-900 hover:text-gray-700 transition-colors"
                  >
                    {proposal.ruleName}
                  </Link>
                </TableCell>
                <TableCell className="py-4">{getRuleTypeBadge(proposal.ruleType)}</TableCell>
                <TableCell className="py-4 text-gray-900">
                  {proposal.review?.underwriter.name || "System"}
                </TableCell>
                <TableCell className="py-4">
                  <Badge variant="secondary">
                    {Math.round(proposal.confidence * 100)}%
                  </Badge>
                </TableCell>
                <TableCell className="py-4">{getStatusBadge(proposal.status)}</TableCell>
                <TableCell className="py-4 text-gray-900">
                  {formatDate(proposal.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
