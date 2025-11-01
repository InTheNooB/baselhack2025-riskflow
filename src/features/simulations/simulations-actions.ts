"use server";

import { prisma } from "@/lib/client";
import {
  clearConfigCache,
  evaluateApplicant,
  type ApplicantData,
} from "@/lib/evaluation-system";

/**
 * Rule change for simulation
 */
export interface RuleChange {
  ruleType: "risk_factor" | "decline_rule" | "gather_info_rule" | "mortality_formula";
  ruleId: string;
  ruleName: string;
  originalExpression: string;
  proposedExpression: string;
}

/**
 * Simulate the impact of custom rule changes on historical cases
 */
export async function runSimulation(ruleChanges: RuleChange[]) {
  try {
    if (ruleChanges.length === 0) {
      return {
        success: false,
        results: null,
        error: "No rule changes provided",
      };
    }

    // Get historical cases with assessments
    // Limit to 200 cases for performance
    const cases = await prisma.case.findMany({
      include: {
        assessment: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 200,
    });

    console.log(
      `📊 [runSimulation] Analyzing ${cases.length} historical cases with ${ruleChanges.length} rule change(s)...`
    );

    // Store original expressions
    const originalExpressions: Array<{
      ruleType: string;
      ruleId: string;
      expression: string;
    }> = [];

    // Temporarily update all rules ONCE
    for (const change of ruleChanges) {
      let originalExpression = "";
      
      if (change.ruleType === "risk_factor") {
        const rule = await prisma.riskFactor.findUnique({
          where: { id: change.ruleId },
        });
        if (!rule) {
          return {
            success: false,
            results: null,
            error: `Risk factor ${change.ruleName} not found`,
          };
        }
        originalExpression = rule.expression;
        originalExpressions.push({
          ruleType: change.ruleType,
          ruleId: change.ruleId,
          expression: originalExpression,
        });
        await prisma.riskFactor.update({
          where: { id: change.ruleId },
          data: { expression: change.proposedExpression },
        });
      } else if (change.ruleType === "decline_rule") {
        const rule = await prisma.declineRule.findUnique({
          where: { id: change.ruleId },
        });
        if (!rule) {
          return {
            success: false,
            results: null,
            error: `Decline rule ${change.ruleName} not found`,
          };
        }
        originalExpression = rule.expression;
        originalExpressions.push({
          ruleType: change.ruleType,
          ruleId: change.ruleId,
          expression: originalExpression,
        });
        await prisma.declineRule.update({
          where: { id: change.ruleId },
          data: { expression: change.proposedExpression },
        });
      } else if (change.ruleType === "gather_info_rule") {
        const rule = await prisma.gatherInfoRule.findUnique({
          where: { id: change.ruleId },
        });
        if (!rule) {
          return {
            success: false,
            results: null,
            error: `Gather info rule ${change.ruleName} not found`,
          };
        }
        originalExpression = rule.condition;
        originalExpressions.push({
          ruleType: change.ruleType,
          ruleId: change.ruleId,
          expression: originalExpression,
        });
        await prisma.gatherInfoRule.update({
          where: { id: change.ruleId },
          data: { condition: change.proposedExpression },
        });
      } else if (change.ruleType === "mortality_formula") {
        const rule = await prisma.mortalityRateFormula.findUnique({
          where: { id: change.ruleId },
        });
        if (!rule) {
          return {
            success: false,
            results: null,
            error: `Mortality formula ${change.ruleName} not found`,
          };
        }
        originalExpression = rule.formula;
        originalExpressions.push({
          ruleType: change.ruleType,
          ruleId: change.ruleId,
          expression: originalExpression,
        });
        await prisma.mortalityRateFormula.update({
          where: { id: change.ruleId },
          data: { formula: change.proposedExpression },
        });
      }
    }

    // Clear cache ONCE before batch evaluation
    clearConfigCache();

    // Aggregate current outcomes and calculate total premiums
    const currentOutcomes = {
      REJECT: 0,
      PENDING_INFORMATION: 0,
      ACCEPT: 0,
      ACCEPT_WITH_PREMIUM: 0,
    };

    const simulatedOutcomes = {
      REJECT: 0,
      PENDING_INFORMATION: 0,
      ACCEPT: 0,
      ACCEPT_WITH_PREMIUM: 0,
    };

    let currentTotalPremiums = 0;
    let simulatedTotalPremiums = 0;

    try {
      // Process all cases in parallel
      const results = await Promise.all(
        cases.map(async (case_) => {
          if (!case_.assessment?.applicantData) {
            return {
              currentDecision: null as string | null,
              currentPremium: 0,
              simulatedDecision: null as string | null,
              simulatedPremium: 0,
            };
          }

          // Parse the stored applicant data
          let applicantData: ApplicantData;
          try {
            applicantData = JSON.parse(case_.assessment.applicantData);
          } catch (error) {
            console.error(
              `Failed to parse applicantData for case ${case_.id}:`,
              error
            );
            return {
              currentDecision: null,
              currentPremium: 0,
              simulatedDecision: null,
              simulatedPremium: 0,
            };
          }

          // Track current outcomes
          const currentDecision = case_.assessment.decision || null;
          const currentPremium = case_.assessment.annualPremiumCHF || 0;

          // Build health data from stored assessment
          const healthData =
            case_.assessment.healthSeverity &&
            case_.assessment.healthStatus &&
            case_.assessment.healthImpact
              ? {
                  severity: case_.assessment.healthSeverity as
                    | "minor"
                    | "moderate"
                    | "severe",
                  status: case_.assessment.healthStatus as
                    | "resolved"
                    | "ongoing"
                    | "unclear",
                  impact: case_.assessment.healthImpact as
                    | "none"
                    | "partial"
                    | "major",
                }
              : undefined;

          // Re-evaluate with new rules (WITHOUT LLM CALLS!)
          try {
            const simulatedResult = await evaluateApplicant(applicantData, {
              healthData,
            });

            return {
              currentDecision,
              currentPremium,
              simulatedDecision: simulatedResult.decision,
              simulatedPremium: simulatedResult.annualPremiumCHF || 0,
            };
          } catch (error) {
            console.error(`Failed to re-evaluate case ${case_.id}:`, error);
            // Fallback to current values
            return {
              currentDecision,
              currentPremium,
              simulatedDecision: currentDecision,
              simulatedPremium: currentPremium,
            };
          }
        })
      );

      // Aggregate results
      for (const result of results) {
        // Current outcomes
        if (result.currentDecision) {
          const decision = result.currentDecision;
          if (decision in currentOutcomes) {
            currentOutcomes[decision as keyof typeof currentOutcomes]++;
          }
        }
        currentTotalPremiums += result.currentPremium;

        // Simulated outcomes
        if (result.simulatedDecision) {
          const decision = result.simulatedDecision;
          if (decision in simulatedOutcomes) {
            simulatedOutcomes[decision as keyof typeof simulatedOutcomes]++;
          }
        }
        simulatedTotalPremiums += result.simulatedPremium;
      }
    } finally {
      // Restore all original expressions
      for (const original of originalExpressions) {
        if (original.ruleType === "risk_factor") {
          await prisma.riskFactor.update({
            where: { id: original.ruleId },
            data: { expression: original.expression },
          });
        } else if (original.ruleType === "decline_rule") {
          await prisma.declineRule.update({
            where: { id: original.ruleId },
            data: { expression: original.expression },
          });
        } else if (original.ruleType === "gather_info_rule") {
          await prisma.gatherInfoRule.update({
            where: { id: original.ruleId },
            data: { condition: original.expression },
          });
        } else if (original.ruleType === "mortality_formula") {
          await prisma.mortalityRateFormula.update({
            where: { id: original.ruleId },
            data: { formula: original.expression },
          });
        }
      }

      // Clear cache ONCE after restoration
      clearConfigCache();
    }

    const totalCases = cases.length;

    return {
      success: true,
      results: {
        currentOutcomes: {
          REJECT: currentOutcomes.REJECT,
          PENDING_INFORMATION: currentOutcomes.PENDING_INFORMATION,
          ACCEPT: currentOutcomes.ACCEPT,
          ACCEPT_WITH_PREMIUM: currentOutcomes.ACCEPT_WITH_PREMIUM,
        },
        simulatedOutcomes: {
          REJECT: simulatedOutcomes.REJECT,
          PENDING_INFORMATION: simulatedOutcomes.PENDING_INFORMATION,
          ACCEPT: simulatedOutcomes.ACCEPT,
          ACCEPT_WITH_PREMIUM: simulatedOutcomes.ACCEPT_WITH_PREMIUM,
        },
        totalCases,
        totalPremiums: {
          current: currentTotalPremiums,
          simulated: simulatedTotalPremiums,
          difference: simulatedTotalPremiums - currentTotalPremiums,
        },
      },
      error: null,
    };
  } catch (error) {
    console.error("Error running simulation:", error);
    return {
      success: false,
      results: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to run simulation",
    };
  }
}

/**
 * Get all active configuration rules (for simulation UI)
 */
export async function getAllSimulationRules() {
  try {
    const [riskFactors, declineRules, gatherInfoRules, mortalityFormulas] =
      await Promise.all([
        prisma.riskFactor.findMany({
          where: { isActive: true },
          orderBy: { order: "asc" },
        }),
        prisma.declineRule.findMany({
          where: { isActive: true },
          orderBy: { priority: "asc" },
        }),
        prisma.gatherInfoRule.findMany({
          where: { isActive: true },
          orderBy: { priority: "asc" },
          include: { questions: true },
        }),
        prisma.mortalityRateFormula.findMany({
          where: { isActive: true },
        }),
      ]);

    return {
      success: true,
      rules: {
        riskFactors,
        declineRules,
        gatherInfoRules,
        mortalityFormulas,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error fetching simulation rules:", error);
    return {
      success: false,
      rules: {
        riskFactors: [],
        declineRules: [],
        gatherInfoRules: [],
        mortalityFormulas: [],
      },
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch simulation rules",
    };
  }
}

