"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Play,
  X,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Plus,
  RefreshCw,
} from "lucide-react";
import { runSimulation, type RuleChange } from "./simulations-actions";
import { toast } from "sonner";
import { formatCHF } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

interface SimulationRules {
  riskFactors: Array<{
    id: string;
    name: string;
    label: string;
    expression: string;
    description: string | null;
    order: number;
  }>;
  declineRules: Array<{
    id: string;
    name: string;
    label: string;
    expression: string;
    description: string | null;
    priority: number;
  }>;
  gatherInfoRules: Array<{
    id: string;
    name: string;
    label: string;
    condition: string;
    description: string | null;
    priority: number;
  }>;
  mortalityFormulas: Array<{
    id: string;
    sex: string;
    formula: string;
    description: string | null;
  }>;
}

interface SimulationResults {
  currentOutcomes: {
    REJECT: number;
    PENDING_INFORMATION: number;
    ACCEPT: number;
    ACCEPT_WITH_PREMIUM: number;
  };
  simulatedOutcomes: {
    REJECT: number;
    PENDING_INFORMATION: number;
    ACCEPT: number;
    ACCEPT_WITH_PREMIUM: number;
  };
  totalCases: number;
  totalPremiums: {
    current: number;
    simulated: number;
    difference: number;
  };
}

interface SimulationsComponentProps {
  rules: SimulationRules;
}

const COLORS_MAP: Record<string, string> = {
  Accept: "#22c55e",
  "Accept & Premium": "#f59e0b",
  Reject: "#ef4444",
  "Pending Information": "#f59e0b",
};

export default function SimulationsComponent({
  rules: initialRules,
}: SimulationsComponentProps) {
  const [selectedRules, setSelectedRules] = useState<RuleChange[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<SimulationResults | null>(null);

  const addRuleChange = (
    ruleType: RuleChange["ruleType"],
    ruleId: string,
    ruleName: string,
    originalExpression: string
  ) => {
    // Check if already selected
    if (selectedRules.some((r) => r.ruleId === ruleId && r.ruleType === ruleType)) {
      toast.error("Rule already selected");
      return;
    }

    setSelectedRules((prev) => [
      ...prev,
      {
        ruleType,
        ruleId,
        ruleName,
        originalExpression,
        proposedExpression: originalExpression,
      },
    ]);
  };

  const removeRuleChange = (ruleId: string, ruleType: RuleChange["ruleType"]) => {
    setSelectedRules((prev) =>
      prev.filter((r) => !(r.ruleId === ruleId && r.ruleType === ruleType))
    );
  };

  const updateRuleExpression = (
    ruleId: string,
    ruleType: RuleChange["ruleType"],
    newExpression: string
  ) => {
    setSelectedRules((prev) =>
      prev.map((r) =>
        r.ruleId === ruleId && r.ruleType === ruleType
          ? { ...r, proposedExpression: newExpression }
          : r
      )
    );
  };

  const handleRunSimulation = async () => {
    if (selectedRules.length === 0) {
      toast.error("Please select at least one rule to modify");
      return;
    }

    // Validate that at least one rule has been modified
    const hasChanges = selectedRules.some(
      (r) => r.proposedExpression !== r.originalExpression
    );
    if (!hasChanges) {
      toast.error("Please modify at least one rule expression");
      return;
    }

    setIsRunning(true);
    try {
      const { success, results: simulationResults, error } =
        await runSimulation(selectedRules);

      if (success && simulationResults) {
        setResults(simulationResults);
        toast.success(
          `Simulation completed! Analyzed ${simulationResults.totalCases} cases.`
        );
      } else {
        toast.error(error || "Failed to run simulation");
      }
    } catch (error) {
      console.error("Error running simulation:", error);
      toast.error("Failed to run simulation");
    } finally {
      setIsRunning(false);
    }
  };

  const clearSimulation = () => {
    setSelectedRules([]);
    setResults(null);
  };

  // Prepare chart data
  const currentData = results
    ? Object.entries(results.currentOutcomes)
        .map(([key, value]) => ({
          name:
            key === "ACCEPT"
              ? "Accept"
              : key === "ACCEPT_WITH_PREMIUM"
                ? "Accept & Premium"
                : key === "REJECT"
                  ? "Reject"
                  : "Pending Information",
          value,
          key,
        }))
        .filter((d) => d.value > 0)
    : [];

  const simulatedData = results
    ? Object.entries(results.simulatedOutcomes)
        .map(([key, value]) => ({
          name:
            key === "ACCEPT"
              ? "Accept"
              : key === "ACCEPT_WITH_PREMIUM"
                ? "Accept & Premium"
                : key === "REJECT"
                  ? "Reject"
                  : "Pending Information",
          value,
          key,
        }))
        .filter((d) => d.value > 0)
    : [];

  // Comparison data for bar chart
  const comparisonData = results
    ? [
        {
          outcome: "Accept",
          current: results.currentOutcomes.ACCEPT,
          simulated: results.simulatedOutcomes.ACCEPT,
        },
        {
          outcome: "Accept & Premium",
          current: results.currentOutcomes.ACCEPT_WITH_PREMIUM,
          simulated: results.simulatedOutcomes.ACCEPT_WITH_PREMIUM,
        },
        {
          outcome: "Reject",
          current: results.currentOutcomes.REJECT,
          simulated: results.simulatedOutcomes.REJECT,
        },
        {
          outcome: "Pending Info",
          current: results.currentOutcomes.PENDING_INFORMATION,
          simulated: results.simulatedOutcomes.PENDING_INFORMATION,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="setup" className="w-full">
        <TabsList>
          <TabsTrigger value="setup">
            Setup Simulation ({selectedRules.length})
          </TabsTrigger>
          <TabsTrigger value="results" disabled={!results}>
            Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="mt-6 space-y-6">
          {/* Selected Rules */}
          {selectedRules.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Selected Rules ({selectedRules.length})</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSimulation}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Clear
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedRules.map((rule) => {
                  const hasChanges =
                    rule.proposedExpression !== rule.originalExpression;
                  return (
                    <div
                      key={`${rule.ruleType}-${rule.ruleId}`}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{rule.ruleName}</span>
                            <Badge variant="outline">{rule.ruleType}</Badge>
                            {hasChanges && (
                              <Badge variant="default" className="bg-orange-500">
                                Modified
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            removeRuleChange(rule.ruleId, rule.ruleType)
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-500">
                            Current Expression
                          </Label>
                          <Textarea
                            value={rule.originalExpression}
                            readOnly
                            className="font-mono text-sm bg-gray-50"
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-500">
                            Proposed Expression
                          </Label>
                          <Textarea
                            value={rule.proposedExpression}
                            onChange={(e) =>
                              updateRuleExpression(
                                rule.ruleId,
                                rule.ruleType,
                                e.target.value
                              )
                            }
                            className="font-mono text-sm"
                            rows={3}
                            placeholder="Enter new expression..."
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
                <Button
                  onClick={handleRunSimulation}
                  disabled={isRunning || selectedRules.length === 0}
                  className="w-full gap-2"
                  size="lg"
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Running Simulation...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Run Simulation
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Available Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Available Rules</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Select rules to modify and see the impact on historical cases
              </p>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="risk_factors" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="risk_factors">
                    Risk Factors ({initialRules.riskFactors.length})
                  </TabsTrigger>
                  <TabsTrigger value="decline_rules">
                    Decline Rules ({initialRules.declineRules.length})
                  </TabsTrigger>
                  <TabsTrigger value="gather_info_rules">
                    Gather Info ({initialRules.gatherInfoRules.length})
                  </TabsTrigger>
                  <TabsTrigger value="mortality_formulas">
                    Mortality ({initialRules.mortalityFormulas.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="risk_factors" className="mt-4">
                  <div className="space-y-3">
                    {initialRules.riskFactors.map((rule) => (
                      <div
                        key={rule.id}
                        className="border rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">{rule.label}</span>
                            <Badge variant="outline" className="text-xs">
                              {rule.name}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {rule.description || "No description"}
                          </p>
                          <div className="text-xs font-mono text-gray-500 bg-gray-50 p-2 rounded">
                            {rule.expression}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            addRuleChange(
                              "risk_factor",
                              rule.id,
                              rule.name,
                              rule.expression
                            )
                          }
                          disabled={selectedRules.some(
                            (r) => r.ruleId === rule.id && r.ruleType === "risk_factor"
                          )}
                          className="ml-4 gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="decline_rules" className="mt-4">
                  <div className="space-y-3">
                    {initialRules.declineRules.map((rule) => (
                      <div
                        key={rule.id}
                        className="border rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">{rule.label}</span>
                            <Badge variant="outline" className="text-xs">
                              {rule.name}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {rule.description || "No description"}
                          </p>
                          <div className="text-xs font-mono text-gray-500 bg-gray-50 p-2 rounded">
                            {rule.expression}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            addRuleChange(
                              "decline_rule",
                              rule.id,
                              rule.name,
                              rule.expression
                            )
                          }
                          disabled={selectedRules.some(
                            (r) =>
                              r.ruleId === rule.id && r.ruleType === "decline_rule"
                          )}
                          className="ml-4 gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="gather_info_rules" className="mt-4">
                  <div className="space-y-3">
                    {initialRules.gatherInfoRules.map((rule) => (
                      <div
                        key={rule.id}
                        className="border rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">{rule.label}</span>
                            <Badge variant="outline" className="text-xs">
                              {rule.name}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {rule.description || "No description"}
                          </p>
                          <div className="text-xs font-mono text-gray-500 bg-gray-50 p-2 rounded">
                            {rule.condition}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            addRuleChange(
                              "gather_info_rule",
                              rule.id,
                              rule.name,
                              rule.condition
                            )
                          }
                          disabled={selectedRules.some(
                            (r) =>
                              r.ruleId === rule.id &&
                              r.ruleType === "gather_info_rule"
                          )}
                          className="ml-4 gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="mortality_formulas" className="mt-4">
                  <div className="space-y-3">
                    {initialRules.mortalityFormulas.map((rule) => (
                      <div
                        key={rule.id}
                        className="border rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">
                              {rule.sex.charAt(0).toUpperCase() +
                                rule.sex.slice(1)}{" "}
                              Mortality Formula
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {rule.sex}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {rule.description || "No description"}
                          </p>
                          <div className="text-xs font-mono text-gray-500 bg-gray-50 p-2 rounded">
                            {rule.formula}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            addRuleChange(
                              "mortality_formula",
                              rule.id,
                              rule.sex,
                              rule.formula
                            )
                          }
                          disabled={selectedRules.some(
                            (r) =>
                              r.ruleId === rule.id &&
                              r.ruleType === "mortality_formula"
                          )}
                          className="ml-4 gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          {results && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Total Cases Analyzed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-gray-900">
                      {results.totalCases}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Current Premiums
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCHF(results.totalPremiums.current)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Simulated Premiums
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCHF(results.totalPremiums.simulated)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Premium Difference
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {results.totalPremiums.difference >= 0 ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                      <p
                        className={`text-2xl font-bold ${
                          results.totalPremiums.difference >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {results.totalPremiums.difference >= 0 ? "+" : ""}
                        {formatCHF(Math.abs(results.totalPremiums.difference))}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Outcome Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Outcomes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
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
                              fill={
                                COLORS_MAP[entry.name] ||
                                `#${Math.floor(Math.random() * 16777215).toString(16)}`
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string) => {
                            const entry = currentData.find((d) => d.name === name);
                            const total = currentData.reduce(
                              (sum, e) => sum + e.value,
                              0
                            );
                            const percent =
                              entry && total > 0
                                ? ((entry.value / total) * 100).toFixed(1)
                                : "0";
                            return `${value} (${percent}%)`;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-4">
                      {currentData.map((entry) => {
                        const total = currentData.reduce(
                          (sum, e) => sum + e.value,
                          0
                        );
                        const percent =
                          total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0";
                        return (
                          <div
                            key={entry.key}
                            className="flex items-center justify-between text-sm"
                          >
                            <span>{entry.name}</span>
                            <span className="text-gray-700">
                              {entry.value > 0 ? `${entry.value} (${percent}%)` : "-"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Simulated Outcomes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={simulatedData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={false}
                        >
                          {simulatedData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                COLORS_MAP[entry.name] ||
                                `#${Math.floor(Math.random() * 16777215).toString(16)}`
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string) => {
                            const entry = simulatedData.find((d) => d.name === name);
                            const total = simulatedData.reduce(
                              (sum, e) => sum + e.value,
                              0
                            );
                            const percent =
                              entry && total > 0
                                ? ((entry.value / total) * 100).toFixed(1)
                                : "0";
                            return `${value} (${percent}%)`;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-4">
                      {simulatedData.map((entry) => {
                        const total = simulatedData.reduce(
                          (sum, e) => sum + e.value,
                          0
                        );
                        const percent =
                          total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0";
                        return (
                          <div
                            key={entry.key}
                            className="flex items-center justify-between text-sm"
                          >
                            <span>{entry.name}</span>
                            <span className="text-gray-700">
                              {entry.value > 0 ? `${entry.value} (${percent}%)` : "-"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Comparison Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Outcome Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="outcome" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="current" fill="#8884d8" name="Current" />
                      <Bar dataKey="simulated" fill="#22c55e" name="Simulated" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

