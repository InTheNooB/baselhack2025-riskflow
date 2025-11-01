"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCHF } from "@/lib/utils";

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
  // Prepare data for charts with better formatting
  const currentData = simulationResults
    ? Object.entries(simulationResults.currentOutcomes)
        .map(([name, value]) => ({
          key: name,
          name: name === "ACCEPT" ? "Accept" : 
                name === "ACCEPT_WITH_PREMIUM" ? "Accept & Premium" :
                name === "REJECT" ? "Reject" :
                name === "PENDING_INFORMATION" ? "Pending Information" :
                name
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
          name: name === "ACCEPT" ? "Accept" : 
                name === "ACCEPT_WITH_PREMIUM" ? "Accept & Premium" :
                name === "REJECT" ? "Reject" :
                name === "PENDING_INFORMATION" ? "Pending Information" :
                name
            .replace(/_/g, " ")
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" "),
          value,
        }))
        .filter((entry) => entry.value > 0) // Only show non-zero slices
    : [];

  // Chart colors matching the image
  const COLORS_MAP = {
    "Accept": "#10b981", // green
    "Accept & Premium": "#f97316", // orange
    "Reject": "#ef4444", // red
    "Pending Information": "#f59e0b", // amber
  };

  // Extract rule name for display (e.g., "BMI Rule Adjustment")
  const getRuleDisplayName = () => {
    if (proposal.ruleName) {
      return `${proposal.ruleName} Rule Adjustment`;
    }
    return "Rule Adjustment";
  };

  // Parse case context to extract question-answer pairs
  const parseCaseContext = () => {
    if (!proposal.caseContext) return [];
    const lines = proposal.caseContext.split('\n').filter(line => line.trim());
    const pairs: Array<{ question: string; answer: string }> = [];
    
    for (let i = 0; i < lines.length; i += 2) {
      if (lines[i] && lines[i + 1]) {
        pairs.push({
          question: lines[i].trim(),
          answer: lines[i + 1].trim(),
        });
      }
    }
    return pairs;
  };

  const caseExcerpts = parseCaseContext();

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Header */}
      <PageHeader
        showBackButton
        title={getRuleDisplayName()}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-7xl">
        {/* Rule Details - Top Row Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-white">
            <CardContent className="p-4 sm:p-5">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-2">Rule Type</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                {proposal.ruleType.replace(/_/g, " ")}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-4 sm:p-5">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-2">Status</p>
              <p className={`text-xl sm:text-2xl font-bold ${
                proposal.status === "pending" ? "text-red-600" :
                proposal.status === "accepted" ? "text-green-600" :
                "text-gray-900"
              }`}>
                {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-4 sm:p-5">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-2">Confidence</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {Math.round(proposal.confidence * 100)}%
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Escalation Reason */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Escalation Reason</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{proposal.chiefPrompt}</p>
              
              {caseExcerpts.length > 0 && (
                <div className="mt-4 sm:mt-6">
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 mb-3">Relevant Case Excerpt</p>
                  <div className="space-y-3 sm:space-y-2">
                    {caseExcerpts.map((pair, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                        <div className="font-medium text-gray-900 sm:w-80 flex-shrink-0">
                          {pair.question}
                        </div>
                        <div className="text-sm sm:text-base text-gray-700 break-words">
                          {pair.answer}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI-Generated Rule Adjustment Proposals */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">AI-Generated Rule Adjustment Proposals</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 space-y-4 sm:space-y-6">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-gray-900 mb-3 sm:mb-4">{proposal.ruleName}</p>
                
                <div className="space-y-3 sm:space-y-4">
                  {proposal.currentExpression && (
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Current</p>
                      <code className="block bg-gray-100 p-3 sm:p-4 rounded-md text-xs sm:text-sm font-mono text-gray-900 overflow-x-auto">
                        {proposal.currentExpression}
                      </code>
                    </div>
                  )}

                  {proposal.proposedExpression && (
                    <div className="relative">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                        <p className="text-xs sm:text-sm font-medium text-gray-700">Proposed</p>
                        <span className="text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded">
                          {Math.round(proposal.confidence * 100)}% confidence
                        </span>
                      </div>
                      <code className="block bg-blue-50 p-3 sm:p-4 rounded-md text-xs sm:text-sm font-mono text-gray-900 overflow-x-auto">
                        {proposal.proposedExpression}
                      </code>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Reasoning */}
              <div className="pt-3 sm:pt-4 border-t border-gray-200">
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {proposal.aiReasoning}
                </p>
              </div>

              <div className="flex justify-end pt-3 sm:pt-4">
                <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                  Inspect in Configuration
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Impact Simulation */}
          {simulationResults && simulationResults.totalCases > 0 && (
            <Card className="bg-white">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <CardTitle className="text-lg sm:text-xl">Impact Simulation</CardTitle>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Based on {simulationResults.totalCases} historical cases
                  </p>
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 space-y-6 sm:space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  {/* Current Outcomes */}
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Current Rule</h3>
                    <div className="w-full h-[200px] sm:h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={currentData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={false}
                        >
                          {currentData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS_MAP[entry.name as keyof typeof COLORS_MAP] || "#8884d8"}
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
                      </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 mt-4">
                      {currentData.map((entry) => {
                        const total = currentData.reduce((sum, e) => sum + e.value, 0);
                        const percent = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0';
                        const colorClass = entry.name === "Accept" ? "text-green-600" :
                                          entry.name === "Accept & Premium" ? "text-orange-600" :
                                          entry.name === "Reject" ? "text-red-600" : "text-amber-600";
                        return (
                          <div key={entry.key} className="flex items-center justify-between text-sm">
                            <span className={colorClass}>{entry.name}</span>
                            <span className="text-gray-700">
                              {entry.value > 0 ? `${entry.value} (${percent}%)` : "-"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Proposed Outcomes */}
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Proposed Rule</h3>
                    <div className="w-full h-[200px] sm:h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={proposedData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={false}
                        >
                          {proposedData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS_MAP[entry.name as keyof typeof COLORS_MAP] || "#8884d8"}
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
                      </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 mt-4">
                      {proposedData.map((entry) => {
                        const total = proposedData.reduce((sum, e) => sum + e.value, 0);
                        const percent = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0';
                        const colorClass = entry.name === "Accept" ? "text-green-600" :
                                          entry.name === "Accept & Premium" ? "text-orange-600" :
                                          entry.name === "Reject" ? "text-red-600" : "text-amber-600";
                        return (
                          <div key={entry.key} className="flex items-center justify-between text-sm">
                            <span className={colorClass}>{entry.name}</span>
                            <span className="text-gray-700">
                              {entry.value > 0 ? `${entry.value} (${percent}%)` : "-"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Summary Totals */}
                {simulationResults.totalPremiums && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pt-4 sm:pt-6 border-t border-gray-200">
                    <Card className="bg-white border border-gray-200">
                      <CardContent className="p-4 sm:p-6">
                        <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Current Total</p>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 break-words">
                          {formatCHF(simulationResults.totalPremiums.current)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-white border border-gray-200">
                      <CardContent className="p-4 sm:p-6">
                        <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Proposed Total</p>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 break-words">
                          {formatCHF(simulationResults.totalPremiums.proposed)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-white border border-gray-200 sm:col-span-2 lg:col-span-1">
                      <CardContent className="p-4 sm:p-6">
                        <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Difference</p>
                        <p className={`text-xl sm:text-2xl lg:text-3xl font-bold break-words ${
                          simulationResults.totalPremiums.difference >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}>
                          {simulationResults.totalPremiums.difference >= 0 ? "+" : ""}
                          {formatCHF(Math.abs(simulationResults.totalPremiums.difference))}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {proposal.status === "pending" && (
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Actions</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button 
                    variant="destructive" 
                    className="bg-red-600 hover:bg-red-700 text-white flex-1 sm:flex-none"
                    size="sm"
                  >
                    Reject Proposal
                  </Button>
                  <Button 
                    variant="outline" 
                    className="bg-white flex-1 sm:flex-none"
                    size="sm"
                  >
                    Modify Proposal
                  </Button>
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none"
                    size="sm"
                  >
                    Accept Proposal
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
