"use server";

import { prisma } from "@/lib/client";
import {
  clearConfigCache,
  evaluateApplicant,
  type ApplicantData,
} from "@/lib/evaluation-system";

/**
 * Update a rule's expression in the database
 */
export async function updateRuleExpression(
  ruleType: string,
  ruleId: string,
  newExpression: string
) {
  try {
    if (ruleType === "risk_factor") {
      await prisma.riskFactor.update({
        where: { id: ruleId },
        data: { expression: newExpression },
      });
    } else if (ruleType === "decline_rule") {
      await prisma.declineRule.update({
        where: { id: ruleId },
        data: { expression: newExpression },
      });
    } else if (ruleType === "gather_info_rule") {
      await prisma.gatherInfoRule.update({
        where: { id: ruleId },
        data: { condition: newExpression },
      });
    } else if (ruleType === "mortality_formula") {
      await prisma.mortalityRateFormula.update({
        where: { id: ruleId },
        data: { formula: newExpression },
      });
    } else {
      return {
        success: false,
        error: "Invalid rule type",
      };
    }

    // Clear cache to reload config
    clearConfigCache();

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Error updating rule expression:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update rule expression",
    };
  }
}

/**
 * Get all active configuration rules (for diagram visualization)
 */
export async function getAllConfigurationRules() {
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
    console.error("Error fetching configuration rules:", error);
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
          : "Failed to fetch configuration rules",
    };
  }
}

/**
 * Get all pending rule adjustment proposals
 */
export async function getAllRuleProposals(options?: {
  status?: string;
  ruleType?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const where: { status?: string; ruleType?: string } = {};
    if (options?.status) {
      where.status = options.status;
    }
    if (options?.ruleType) {
      where.ruleType = options.ruleType;
    }

    const [proposals, total] = await Promise.all([
      prisma.ruleAdjustmentProposal.findMany({
        where,
        include: {
          review: {
            include: {
              underwriter: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      prisma.ruleAdjustmentProposal.count({ where }),
    ]);

    return {
      success: true,
      proposals,
      total,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching rule proposals:", error);
    return {
      success: false,
      proposals: [],
      total: 0,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch rule proposals",
    };
  }
}

/**
 * Get a specific rule adjustment proposal by ID
 */
export async function getRuleProposalDetail(proposalId: string) {
  try {
    const proposal = await prisma.ruleAdjustmentProposal.findUnique({
      where: { id: proposalId },
      include: {
        review: {
          include: {
            underwriter: true,
          },
        },
      },
    });

    if (!proposal) {
      return {
        success: false,
        proposal: null,
        error: "Proposal not found",
      };
    }

    return {
      success: true,
      proposal,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching rule proposal:", error);
    return {
      success: false,
      proposal: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch rule proposal",
    };
  }
}

/**
 * Simulate the impact of a proposed rule change on historical cases
 */
export async function simulateRuleChange(proposalId: string) {
  try {
    // Get the proposal details
    const proposal = await prisma.ruleAdjustmentProposal.findUnique({
      where: { id: proposalId },
    });

    if (
      !proposal ||
      !proposal.currentExpression ||
      !proposal.proposedExpression
    ) {
      return {
        success: false,
        results: null,
        error: "Proposal not found or missing expressions",
      };
    }

    // Get historical cases with assessments - we only need applicantData now
    // Limit to 100 cases for performance
    const cases = await prisma.case.findMany({
      include: {
        assessment: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    console.log(
      `📊 [simulateRuleChange] Analyzing ${cases.length} historical cases...`
    );

    // Check if risk factor exists ONCE before processing all cases
    const riskFactor = await prisma.riskFactor.findUnique({
      where: { name: proposal.ruleName },
    });

    if (!riskFactor) {
      console.warn(
        `Risk factor ${proposal.ruleName} not found, cannot simulate`
      );
      return {
        success: false,
        results: null,
        error: "Risk factor not found",
      };
    }

    // Aggregate current outcomes and calculate total premiums
    const currentOutcomes = {
      REJECT: 0,
      PENDING_INFORMATION: 0,
      ACCEPT: 0,
      ACCEPT_WITH_PREMIUM: 0,
    };

    const proposedOutcomes = {
      REJECT: 0,
      PENDING_INFORMATION: 0,
      ACCEPT: 0,
      ACCEPT_WITH_PREMIUM: 0,
    };

    let currentTotalPremiums = 0;
    let proposedTotalPremiums = 0;

    // BATCH PROCESSING: Update DB once, evaluate all, restore once
    // Temporarily update the risk factor expression ONCE
    await prisma.riskFactor.update({
      where: { name: proposal.ruleName },
      data: { expression: proposal.proposedExpression },
    });

    // Clear cache ONCE before batch evaluation
    clearConfigCache();

    try {
      // Process all cases in parallel for maximum performance
      const results = await Promise.all(
        cases.map(async (case_) => {
          if (!case_.assessment?.applicantData) {
            return {
              currentDecision: null as string | null,
              currentPremium: 0,
              proposedDecision: null as string | null,
              proposedPremium: 0,
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
              proposedDecision: null,
              proposedPremium: 0,
            };
          }

          // Track current outcomes
          const currentDecision = case_.assessment.decision || null;
          const currentPremium = case_.assessment.annualPremiumCHF || 0;

          // Build health data from stored assessment (AVOID LLM CALLS!)
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

          // Now re-evaluate (WITHOUT LLM CALLS!)
          try {
            const proposedResult = await evaluateApplicant(applicantData, {
              healthData,
            });

            return {
              currentDecision,
              currentPremium,
              proposedDecision: proposedResult.decision,
              proposedPremium: proposedResult.annualPremiumCHF || 0,
            };
          } catch (error) {
            console.error(`Failed to re-evaluate case ${case_.id}:`, error);
            // Fallback to current values
            return {
              currentDecision,
              currentPremium,
              proposedDecision: currentDecision,
              proposedPremium: currentPremium,
            };
          }
        })
      );

      // Aggregate results (avoid race conditions in parallel execution)
      for (const result of results) {
        // Current outcomes
        if (result.currentDecision) {
          const decision = result.currentDecision;
          if (decision in currentOutcomes) {
            currentOutcomes[decision as keyof typeof currentOutcomes]++;
          }
        }
        currentTotalPremiums += result.currentPremium;

        // Proposed outcomes
        if (result.proposedDecision) {
          const decision = result.proposedDecision;
          if (decision in proposedOutcomes) {
            proposedOutcomes[decision as keyof typeof proposedOutcomes]++;
          }
        }
        proposedTotalPremiums += result.proposedPremium;
      }
    } finally {
      // Restore the original expression ONCE after batch evaluation
      await prisma.riskFactor.update({
        where: { name: proposal.ruleName },
        data: { expression: proposal.currentExpression },
      });

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
        proposedOutcomes: {
          REJECT: proposedOutcomes.REJECT,
          PENDING_INFORMATION: proposedOutcomes.PENDING_INFORMATION,
          ACCEPT: proposedOutcomes.ACCEPT,
          ACCEPT_WITH_PREMIUM: proposedOutcomes.ACCEPT_WITH_PREMIUM,
        },
        totalCases,
        totalPremiums: {
          current: currentTotalPremiums,
          proposed: proposedTotalPremiums,
          difference: proposedTotalPremiums - currentTotalPremiums,
        },
      },
      error: null,
    };
  } catch (error) {
    console.error("Error simulating rule change:", error);
    return {
      success: false,
      results: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to simulate rule change",
    };
  }
}
