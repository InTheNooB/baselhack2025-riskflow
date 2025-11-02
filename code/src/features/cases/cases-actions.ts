"use server";

import { evaluateCase } from "@/features/survey/survey-actions";
import { prisma } from "@/lib/client";
import { generateRuleProposals } from "./generate-rule-proposals";

/**
 * Get all cases with pagination and filtering
 */
export async function getAllCases(options?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const where: { status?: string } = {};
    if (options?.status) {
      where.status = options.status;
    }

    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        where,
        include: {
          product: true,
          assessment: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      prisma.case.count({ where }),
    ]);

    return {
      success: true,
      cases,
      total,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching cases:", error);
    return {
      success: false,
      cases: [],
      total: 0,
      error: error instanceof Error ? error.message : "Failed to fetch cases",
    };
  }
}

/**
 * Get detailed case information with all answers and assessment
 */
export async function getCaseDetail(caseId: string) {
  try {
    const case_ = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        product: {
          include: {
            questions: {
              include: {
                options: true,
              },
              orderBy: {
                order: "asc",
              },
            },
          },
        },
        answers: true,
        assessment: {
          include: {
            riskFactorDetails: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
        review: {
          include: {
            underwriter: true,
            chiefReview: {
              include: {
                chiefUnderwriter: true,
              },
            },
            proposals: true, // Include rule proposals
          },
        },
      },
    });

    if (!case_) {
      return {
        success: false,
        case: null,
        error: "Case not found",
      };
    }

    // Build answers map for easy lookup
    const answersMap = new Map(case_.answers.map((a) => [a.questionId, a]));

    // Combine questions with answers
    const questionsWithAnswers = case_.product.questions.map((question) => {
      const answer = answersMap.get(question.id);
      return {
        ...question,
        answer: answer?.answerValue || null,
      };
    });

    return {
      success: true,
      case: {
        ...case_,
        questionsWithAnswers,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error fetching case detail:", error);
    return {
      success: false,
      case: null,
      error: error instanceof Error ? error.message : "Failed to fetch case",
    };
  }
}

/**
 * Get or create the demo underwriter user
 */
async function getDemoUnderwriter() {
  const demoUser = await prisma.user.findUnique({
    where: { email: "underwriter@riskflow.com" },
  });

  if (!demoUser) {
    throw new Error(
      "Demo underwriter user not found. Please run database seed."
    );
  }

  return demoUser;
}

/**
 * Confirm the system assessment (underwriter agrees)
 */
export async function confirmAssessment(
  caseId: string,
  underwriterId?: string
) {
  try {
    const case_ = await prisma.case.findUnique({
      where: { id: caseId },
      include: { assessment: true },
    });

    if (!case_ || !case_.assessment) {
      return {
        success: false,
        error: "Case or assessment not found",
      };
    }

    // Get underwriter ID (use provided or demo user)
    const actualUnderwriterId =
      underwriterId || (await getDemoUnderwriter()).id;

    // Create or update review
    await prisma.underwriterReview.upsert({
      where: { caseId },
      create: {
        caseId,
        underwriterId: actualUnderwriterId,
        decision: "CONFIRM",
        confirmedDecision: case_.assessment.decision,
        status: "completed",
        reviewedAt: new Date(),
      },
      update: {
        decision: "CONFIRM",
        confirmedDecision: case_.assessment.decision,
        status: "completed",
        reviewedAt: new Date(),
      },
    });

    // Update case status
    if (case_.assessment.decision === "REJECT") {
      await prisma.case.update({
        where: { id: caseId },
        data: { status: "rejected" },
      });
    } else {
      await prisma.case.update({
        where: { id: caseId },
        data: { status: "approved" },
      });
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Error confirming assessment:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to confirm assessment",
    };
  }
}

/**
 * Review with reason (escalates to chief underwriter)
 */
export async function reviewAssessment(
  caseId: string,
  reason: string,
  underwriterId?: string
) {
  try {
    // Get underwriter ID (use provided or demo user)
    const actualUnderwriterId =
      underwriterId || (await getDemoUnderwriter()).id;

    // Create or update review with escalation
    const review = await prisma.underwriterReview.upsert({
      where: { caseId },
      create: {
        caseId,
        underwriterId: actualUnderwriterId,
        decision: "ESCALATE",
        escalationReason: reason,
        status: "pending",
      },
      update: {
        decision: "ESCALATE",
        escalationReason: reason,
        status: "pending",
      },
    });

    // Update case status
    await prisma.case.update({
      where: { id: caseId },
      data: { status: "escalated" },
    });

    // Generate rule proposals based on escalation reason
    await generateRuleProposals(caseId, review.id, reason);

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Error reviewing assessment:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to review assessment",
    };
  }
}

/**
 * Adjust the assessment (underwriter overrides)
 */
export async function adjustAssessment(
  caseId: string,
  adjustedDecision: "ACCEPT" | "ACCEPT_WITH_PREMIUM" | "REJECT",
  adjustedPremium?: number,
  adjustmentReason?: string,
  adjustmentNotes?: string,
  underwriterId?: string
) {
  try {
    // Get underwriter ID (use provided or demo user)
    const actualUnderwriterId =
      underwriterId || (await getDemoUnderwriter()).id;

    // Create or update review with adjustment
    await prisma.underwriterReview.upsert({
      where: { caseId },
      create: {
        caseId,
        underwriterId: actualUnderwriterId,
        decision: "ADJUST",
        adjustedDecision,
        adjustedPremiumCHF: adjustedPremium,
        adjustmentReason,
        adjustmentNotes,
        status: "completed",
        reviewedAt: new Date(),
      },
      update: {
        decision: "ADJUST",
        adjustedDecision,
        adjustedPremiumCHF: adjustedPremium,
        adjustmentReason,
        adjustmentNotes,
        status: "completed",
        reviewedAt: new Date(),
      },
    });

    // Update case status
    const newStatus = adjustedDecision === "REJECT" ? "rejected" : "approved";

    await prisma.case.update({
      where: { id: caseId },
      data: { status: newStatus },
    });

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Error adjusting assessment:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to adjust assessment",
    };
  }
}

/**
 * Re-run evaluation for a case (after questions updated)
 */
export async function reevaluateCase(caseId: string) {
  try {
    const result = await evaluateCase(caseId);
    return result;
  } catch (error) {
    console.error("Error re-evaluating case:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to re-evaluate case",
    };
  }
}
