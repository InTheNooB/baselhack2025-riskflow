"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, AlertCircle } from "lucide-react";
import RuleProposalList from "./rule-proposal-list";
import ConfigurationDiagram from "./configuration-diagram";
import ConfigurationChat from "./configuration-chat";
import { updateRuleExpression } from "./configuration-actions";
import { toast } from "sonner";

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

interface ConfigurationRules {
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

interface ConfigurationPageClientProps {
  proposals: RuleProposal[];
  rules: ConfigurationRules;
}

export default function ConfigurationPageClient({
  proposals,
  rules: initialRules,
}: ConfigurationPageClientProps) {
  const [rules, setRules] = useState(initialRules);
  // Track saved rules state (baseline for comparison)
  const [savedRules, setSavedRules] = useState(initialRules);
  const [unsavedChanges, setUnsavedChanges] = useState<Array<{
    ruleType: string;
    ruleName: string;
    ruleId: string;
    newExpression: string;
    oldExpression: string;
  }>>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Check if there are any differences from saved rules
  const hasUnsavedChanges = useMemo(() => {
    return unsavedChanges.length > 0;
  }, [unsavedChanges]);

  const handleRuleUpdate = (
    ruleType: string,
    ruleName: string,
    newExpression: string
  ) => {
    // Find the saved expression (baseline for comparison)
    let savedExpression = "";
    let ruleId = "";

    if (ruleType === "risk_factor") {
      const rule = savedRules.riskFactors.find((r) => r.name === ruleName);
      savedExpression = rule?.expression || "";
      ruleId = rule?.id || "";
    } else if (ruleType === "decline_rule") {
      const rule = savedRules.declineRules.find((r) => r.name === ruleName);
      savedExpression = rule?.expression || "";
      ruleId = rule?.id || "";
    } else if (ruleType === "gather_info_rule") {
      const rule = savedRules.gatherInfoRules.find((r) => r.name === ruleName);
      savedExpression = rule?.condition || "";
      ruleId = rule?.id || "";
    } else if (ruleType === "mortality_formula") {
      const rule = savedRules.mortalityFormulas.find((r) => r.sex === ruleName);
      savedExpression = rule?.formula || "";
      ruleId = rule?.id || "";
    }

    // Only add to unsaved changes if it's different from saved state
    if (savedExpression !== newExpression) {
      setUnsavedChanges((prev) => {
        // Remove existing change for this rule if any
        const filtered = prev.filter((c) => !(c.ruleType === ruleType && c.ruleName === ruleName));
        // Add new change
        return [
          ...filtered,
          {
            ruleType,
            ruleName,
            ruleId,
            newExpression,
            oldExpression: savedExpression,
          },
        ];
      });
    } else {
      // If reverted to saved state, remove from unsaved changes
      setUnsavedChanges((prev) =>
        prev.filter((c) => !(c.ruleType === ruleType && c.ruleName === ruleName))
      );
    }

    // Update rules state for immediate visualization
    setRules((prev) => {
      const updated = { ...prev };
      
      if (ruleType === "risk_factor") {
        updated.riskFactors = prev.riskFactors.map((r) =>
          r.name === ruleName ? { ...r, expression: newExpression } : r
        );
      } else if (ruleType === "decline_rule") {
        updated.declineRules = prev.declineRules.map((r) =>
          r.name === ruleName ? { ...r, expression: newExpression } : r
        );
      } else if (ruleType === "gather_info_rule") {
        updated.gatherInfoRules = prev.gatherInfoRules.map((r) =>
          r.name === ruleName ? { ...r, condition: newExpression } : r
        );
      } else if (ruleType === "mortality_formula") {
        updated.mortalityFormulas = prev.mortalityFormulas.map((r) =>
          r.sex === ruleName ? { ...r, formula: newExpression } : r
        );
      }
      
      return updated;
    });
  };

  const handleSaveChanges = async () => {
    if (unsavedChanges.length === 0) return;

    setIsSaving(true);
    const changesCount = unsavedChanges.length;
    let successCount = 0;
    let failCount = 0;

    try {
      for (const change of unsavedChanges) {
        const result = await updateRuleExpression(
          change.ruleType,
          change.ruleId,
          change.newExpression
        );
        if (result.success) {
          successCount++;
          // Update both current rules and saved rules state to reflect saved changes
          setRules((prev) => {
            const updated = { ...prev };
            if (change.ruleType === "risk_factor") {
              updated.riskFactors = prev.riskFactors.map((r) =>
                r.id === change.ruleId ? { ...r, expression: change.newExpression } : r
              );
            } else if (change.ruleType === "decline_rule") {
              updated.declineRules = prev.declineRules.map((r) =>
                r.id === change.ruleId ? { ...r, expression: change.newExpression } : r
              );
            } else if (change.ruleType === "gather_info_rule") {
              updated.gatherInfoRules = prev.gatherInfoRules.map((r) =>
                r.id === change.ruleId ? { ...r, condition: change.newExpression } : r
              );
            } else if (change.ruleType === "mortality_formula") {
              updated.mortalityFormulas = prev.mortalityFormulas.map((r) =>
                r.id === change.ruleId ? { ...r, formula: change.newExpression } : r
              );
            }
            return updated;
          });
          setSavedRules((prev) => {
            const updated = { ...prev };
            if (change.ruleType === "risk_factor") {
              updated.riskFactors = prev.riskFactors.map((r) =>
                r.id === change.ruleId ? { ...r, expression: change.newExpression } : r
              );
            } else if (change.ruleType === "decline_rule") {
              updated.declineRules = prev.declineRules.map((r) =>
                r.id === change.ruleId ? { ...r, expression: change.newExpression } : r
              );
            } else if (change.ruleType === "gather_info_rule") {
              updated.gatherInfoRules = prev.gatherInfoRules.map((r) =>
                r.id === change.ruleId ? { ...r, condition: change.newExpression } : r
              );
            } else if (change.ruleType === "mortality_formula") {
              updated.mortalityFormulas = prev.mortalityFormulas.map((r) =>
                r.id === change.ruleId ? { ...r, formula: change.newExpression } : r
              );
            }
            return updated;
          });
        } else {
          failCount++;
          toast.error(`Failed to save ${change.ruleName}: ${result.error}`);
        }
      }
      
      // Clear unsaved changes after successful saves
      setUnsavedChanges([]);
      
      if (failCount === 0) {
        toast.success(`Saved ${successCount} change(s) successfully`);
      } else if (successCount > 0) {
        toast.warning(`Saved ${successCount} change(s), ${failCount} failed`);
      }
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="proposals" className="w-full">
        <TabsList>
          <TabsTrigger value="proposals">Proposals ({proposals.length})</TabsTrigger>
          <TabsTrigger value="diagram">Rule Flow Diagram</TabsTrigger>
        </TabsList>

        <TabsContent value="proposals" className="mt-6">
          <RuleProposalList proposals={proposals} />
        </TabsContent>

        <TabsContent value="diagram" className="mt-6">
          <div className="space-y-4">
            {/* Header with save button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">Configuration Flow</h2>
                <p className="text-sm text-muted-foreground">
                  Visual representation of how rules are evaluated in the underwriting process
                </p>
              </div>
              {hasUnsavedChanges && (
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="flex items-center gap-2">
                    <AlertCircle className="h-3 w-3" />
                    {unsavedChanges.length} unsaved change{unsavedChanges.length !== 1 ? "s" : ""}
                  </Badge>
                  <Button
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}
            </div>

            {/* Side by side layout with equal height */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[800px]">
              <div className="lg:col-span-2 h-full">
                <ConfigurationDiagram rules={rules} />
              </div>
              <div className="h-full">
                <ConfigurationChat rules={rules} onRuleUpdate={handleRuleUpdate} />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

