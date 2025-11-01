"use server";

import { prisma } from "@/lib/client";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

/**
 * Schema for AI-generated rule proposals
 */
const RuleProposalSchema = z.object({
  caseContext: z
    .string()
    .describe(
      "A concise text summary of the case details and why it was escalated"
    ),
  proposedChanges: z.array(
    z.object({
      ruleType: z.enum([
        "risk_factor",
        "decline_rule",
        "gather_info_rule",
        "mortality_formula",
      ]),
      ruleName: z.string(),
      currentExpression: z.string().optional(),
      proposedExpression: z.string().optional(),
      reasoning: z
        .string()
        .describe("Why this rule should be changed based on the escalation"),
      confidence: z.number().min(0).max(1),
    })
  ),
});

/**
 * Generate rule adjustment proposals based on an escalated case
 */
export async function generateRuleProposals(
  caseId: string,
  reviewId: string,
  escalationReason: string
) {
  try {
    // Fetch full case data
    const case_ = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        product: true,
        answers: true,
        assessment: {
          include: {
            riskFactorDetails: true,
          },
        },
      },
    });

    if (!case_ || !case_.assessment) {
      return {
        success: false,
        error: "Case or assessment not found",
      };
    }

    // Fetch all current rules
    const [riskFactors, declineRules, mortalityFormulas] = await Promise.all([
      prisma.riskFactor.findMany({ where: { isActive: true } }),
      prisma.declineRule.findMany({ where: { isActive: true } }),
      prisma.mortalityRateFormula.findMany({ where: { isActive: true } }),
    ]);

    // Extract answer values for context
    const answerMap = new Map(
      case_.answers.map((a) => [a.questionId, a.answerValue])
    );

    // Build case context string
    const caseDetails = Array.from(answerMap.values())
      .filter((v) => v && v !== "")
      .join(", ");

    // Build the prompt for AI
    const prompt = `An insurance case has been escalated by an underwriter with the following reason: "${escalationReason}"

CASE DETAILS:
${caseDetails}

ASSESSMENT RESULTS:
- Decision: ${case_.assessment.decision}
- Premium: ${case_.assessment.annualPremiumCHF || "N/A"} CHF
- Total Multiplier: ${case_.assessment.totalMultiplier}x
- Health: ${case_.assessment.healthSeverity || "N/A"} severity, ${
      case_.assessment.healthStatus || "N/A"
    } status, ${case_.assessment.healthImpact || "N/A"} impact
${
  case_.assessment.triggeredDeclineRule
    ? `- Triggered Decline Rule: ${case_.assessment.triggeredDeclineRule}`
    : ""
}
${
  case_.assessment.riskFactorDetails &&
  case_.assessment.riskFactorDetails.length > 0
    ? `- Risk Factors Applied: ${case_.assessment.riskFactorDetails
        .map((r) => `${r.factorLabel} (${r.multiplier}x)`)
        .join(", ")}`
    : ""
}

CURRENT RULES:
Risk Factors:
${riskFactors
  .map((r) => `- ${r.name}: ${r.expression} (${r.label})`)
  .join("\n")}

Decline Rules:
${declineRules
  .map((r) => `- ${r.name}: ${r.expression} (${r.label})`)
  .join("\n")}

Mortality Formulas:
${mortalityFormulas.map((m) => `- ${m.sex}: ${m.formula}`).join("\n")}

Based on the escalation reason and case details, generate specific rule adjustment proposals. Focus on what would have made the assessment more appropriate for this case.`;

    // Call AI to generate proposals
    const { object: proposals } = await generateObject({
      model: openai("gpt-4o"),
      schema: RuleProposalSchema,
      prompt,
      temperature: 0.3, // Lower temperature for more consistent, logical proposals
    });

    // Save proposals to database
    const savedProposals = [];
    for (const proposal of proposals.proposedChanges) {
      const saved = await prisma.ruleAdjustmentProposal.create({
        data: {
          reviewId,
          sourceCaseId: caseId,
          chiefPrompt: escalationReason,
          caseContext: proposals.caseContext,
          ruleType: proposal.ruleType,
          ruleName: proposal.ruleName,
          currentExpression: proposal.currentExpression || null,
          proposedExpression: proposal.proposedExpression || null,
          aiReasoning: proposal.reasoning,
          confidence: proposal.confidence,
          status: "pending",
        },
      });
      savedProposals.push(saved);
    }

    return {
      success: true,
      proposals: savedProposals,
      error: null,
    };
  } catch (error) {
    console.error("Error generating rule proposals:", error);
    return {
      success: false,
      proposals: [],
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate rule proposals",
    };
  }
}
