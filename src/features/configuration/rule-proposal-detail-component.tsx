"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface RuleProposalDetailProps {
  proposal: {
    id: string;
    ruleType: string;
    ruleName: string;
    chiefPrompt: string;
    caseContext: string;
    currentExpression: string | null;
    proposedExpression: string | null;
    aiReasoning: string;
    confidence: number;
    status: string;
    createdAt: Date;
    review: {
      underwriter: {
        name: string;
        email: string;
      };
    } | null;
  };
  simulationResults?: {
    currentOutcomes: {
      REJECT: number;
      PENDING_INFORMATION: number;
      ACCEPT: number;
      ACCEPT_WITH_PREMIUM: number;
    };
    proposedOutcomes: {
      REJECT: number;
      PENDING_INFORMATION: number;
      ACCEPT: number;
      ACCEPT_WITH_PREMIUM: number;
    };
    totalCases: number;
    totalPremiums: {
      current: number;
      proposed: number;
      difference: number;
    };
  } | null;
}

export default function ConfigurationDetailComponent({
  proposal,
  simulationResults,
}: RuleProposalDetailProps) {
  const router = useRouter();

  // Chart colors
  const COLORS = {
    REJECT: "#ef4444",
    PENDING_INFORMATION: "#f59e0b",
    ACCEPT: "#10b981",
    ACCEPT_WITH_PREMIUM: "#3b82f6",
  };

  // Prepare data for charts with better formatting
  const currentData = simulationResults
    ? Object.entries(simulationResults.currentOutcomes)
        .map(([name, value]) => ({
          key: name,
          name: name
            .replace(/_/g, " ")
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" "),
          value,
        }))
        .filter((entry) => entry.value > 0) // Only show non-zero slices
    : [];

  const proposedData = simulationResults
    ? Object.entries(simulationResults.proposedOutcomes)
        .map(([name, value]) => ({
          key: name,
          name: name
            .replace(/_/g, " ")
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" "),
          value,
        }))
        .filter((entry) => entry.value > 0) // Only show non-zero slices
    : [];

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Rule Adjustment Proposal</h1>
        <p className="text-muted-foreground mt-2">
          Review AI-suggested rule changes
        </p>
      </div>

      <div className="space-y-6">
        {/* Proposal Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Proposal Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Rule Name</p>
                <p className="text-lg font-semibold">{proposal.ruleName}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Rule Type</p>
                <Badge variant="outline" className="mt-1">
                  {proposal.ruleType.replace(/_/g, " ")}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Confidence</p>
                <Badge variant="secondary" className="mt-1">
                  {Math.round(proposal.confidence * 100)}% confident
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                <Badge
                  variant={
                    proposal.status === "pending"
                      ? "default"
                      : proposal.status === "accepted"
                        ? "default"
                        : "destructive"
                  }
                  className="mt-1"
                >
                  {proposal.status.charAt(0).toUpperCase() +
                    proposal.status.slice(1)}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm">
                  {new Date(proposal.createdAt).toLocaleString("en-US")}
                </p>
              </div>
              {proposal.review && (
                <div>
                  <p className="text-sm font-medium">Source</p>
                  <p className="text-sm">
                    {proposal.review.underwriter.name}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Case Context */}
        <Card>
          <CardHeader>
            <CardTitle>Case Context</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">Escalation Reason</p>
                <p className="text-sm bg-muted p-3 rounded-md">
                  {proposal.chiefPrompt}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Case Summary</p>
                <p className="text-sm">{proposal.caseContext}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rule Changes */}
        <Card>
          <CardHeader>
            <CardTitle>Proposed Rule Changes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {proposal.currentExpression && (
              <div>
                <p className="text-sm font-medium mb-2">Current Expression</p>
                <code className="block bg-muted p-4 rounded-md text-sm font-mono">
                  {proposal.currentExpression}
                </code>
              </div>
            )}

            {proposal.proposedExpression && (
              <div>
                <p className="text-sm font-medium mb-2">Proposed Expression</p>
                <code className="block bg-blue-50 dark:bg-blue-950 p-4 rounded-md text-sm font-mono">
                  {proposal.proposedExpression}
                </code>
              </div>
            )}

            {!proposal.currentExpression && !proposal.proposedExpression && (
              <p className="text-sm text-muted-foreground italic">
                No expression changes proposed
              </p>
            )}
          </CardContent>
        </Card>

        {/* AI Reasoning */}
        <Card>
          <CardHeader>
            <CardTitle>AI Reasoning</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{proposal.aiReasoning}</p>
          </CardContent>
        </Card>

        {/* Impact Simulation */}
        {simulationResults && simulationResults.totalCases > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Impact Simulation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center text-sm text-muted-foreground">
                Analyzing {simulationResults.totalCases} historical cases
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Current Outcomes */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Current Rule</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={currentData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={false}
                      >
                        {currentData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[entry.key as keyof typeof COLORS]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          const entry = currentData.find((d) => d.name === name);
                          const total = currentData.reduce((sum, e) => sum + e.value, 0);
                          const percent = entry && total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0';
                          return `${value} (${percent}%)`;
                        }}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: "20px" }}
                        formatter={(value: string) => {
                          const entry = currentData.find((d) => d.name === value);
                          const total = currentData.reduce((sum, e) => sum + e.value, 0);
                          const percent = entry && total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0';
                          return `${value}: ${entry?.value || 0} (${percent}%)`;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Proposed Outcomes */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Proposed Rule</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={proposedData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={false}
                      >
                        {proposedData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[entry.key as keyof typeof COLORS]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          const entry = proposedData.find((d) => d.name === name);
                          const total = proposedData.reduce((sum, e) => sum + e.value, 0);
                          const percent = entry && total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0';
                          return `${value} (${percent}%)`;
                        }}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: "20px" }}
                        formatter={(value: string) => {
                          const entry = proposedData.find((d) => d.name === value);
                          const total = proposedData.reduce((sum, e) => sum + e.value, 0);
                          const percent = entry && total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0';
                          return `${value}: ${entry?.value || 0} (${percent}%)`;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Financial Impact */}
              {simulationResults.totalPremiums && (
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">Financial Impact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Current Total</p>
                      <p className="text-2xl font-bold mt-1">
                        CHF {simulationResults.totalPremiums.current.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Proposed Total</p>
                      <p className="text-2xl font-bold mt-1">
                        CHF {simulationResults.totalPremiums.proposed.toLocaleString()}
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg ${
                      simulationResults.totalPremiums.difference >= 0
                        ? "bg-green-50 dark:bg-green-950"
                        : "bg-red-50 dark:bg-red-950"
                    }`}>
                      <p className="text-sm text-muted-foreground">Difference</p>
                      <p className={`text-2xl font-bold mt-1 ${
                        simulationResults.totalPremiums.difference >= 0
                          ? "text-green-700 dark:text-green-300"
                          : "text-red-700 dark:text-red-300"
                      }`}>
                        {simulationResults.totalPremiums.difference >= 0 ? "+" : ""}
                        CHF {simulationResults.totalPremiums.difference.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {simulationResults.totalPremiums.difference >= 0
                          ? "More revenue"
                          : "Less revenue"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {proposal.status === "pending" && (
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button variant="default">Accept Proposal</Button>
                <Button variant="destructive">Reject Proposal</Button>
                <Button variant="outline">Modify Proposal</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
