"use server";

import { prisma } from "@/lib/client";

/**
 * Get all escalated cases for chief underwriter review
 */
export async function getEscalatedCases() {
  try {
    const cases = await prisma.case.findMany({
      where: {
        status: "escalated",
      },
      include: {
        product: true,
        assessment: {
          include: {
            riskFactorDetails: true,
          },
        },
        review: {
          include: {
            underwriter: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return {
      success: true,
      cases,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching escalated cases:", error);
    return {
      success: false,
      cases: [],
      error: error instanceof Error ? error.message : "Failed to fetch escalated cases",
    };
  }
}

/**
 * Get detailed escalated case information
 */
export async function getEscalatedCaseDetail(caseId: string) {
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
            proposals: true, // Include rule proposals
            chiefReview: {
              include: {
                chiefUnderwriter: true,
              },
            },
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
    console.error("Error fetching escalated case detail:", error);
    return {
      success: false,
      case: null,
      error: error instanceof Error ? error.message : "Failed to fetch escalated case",
    };
  }
}

/**
 * Get or create the demo chief underwriter user
 */
async function getDemoChiefUnderwriter() {
  const demoUser = await prisma.user.findUnique({
    where: { email: "chief@riskflow.com" },
  });
  
  if (!demoUser) {
    throw new Error("Demo chief underwriter user not found. Please run database seed.");
  }
  
  return demoUser;
}

/**
 * Chief underwriter approves the escalated case
 */
export async function approveEscalatedCase(
  caseId: string,
  finalPremium?: number,
  decisionReason?: string,
  feedbackNotes?: string
) {
  try {
    // Get review
    const review = await prisma.underwriterReview.findUnique({
      where: { caseId },
    });

    if (!review) {
      return {
        success: false,
        error: "Review not found",
      };
    }

    // Get chief underwriter ID
    const chiefUnderwriterId = (await getDemoChiefUnderwriter()).id;

    // Create chief review
    await prisma.chiefUnderwriterReview.upsert({
      where: { reviewId: review.id },
      create: {
        reviewId: review.id,
        chiefUnderwriterId,
        decision: "APPROVE",
        finalPremiumCHF: finalPremium,
        decisionReason,
        feedbackNotes,
        sourceCaseId: caseId,
        status: "completed",
        reviewedAt: new Date(),
      },
      update: {
        decision: "APPROVE",
        finalPremiumCHF: finalPremium,
        decisionReason,
        feedbackNotes,
        sourceCaseId: caseId,
        status: "completed",
        reviewedAt: new Date(),
      },
    });

    // Update case status
    await prisma.case.update({
      where: { id: caseId },
      data: { status: "approved" },
    });

    // Update underwriter review status
    await prisma.underwriterReview.update({
      where: { id: review.id },
      data: { status: "completed", reviewedAt: new Date() },
    });

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Error approving escalated case:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve case",
    };
  }
}

/**
 * Chief underwriter rejects the escalated case
 */
export async function rejectEscalatedCase(
  caseId: string,
  decisionReason?: string,
  feedbackNotes?: string,
  ruleAdjustmentPrompt?: string
) {
  try {
    // Get review
    const review = await prisma.underwriterReview.findUnique({
      where: { caseId },
    });

    if (!review) {
      return {
        success: false,
        error: "Review not found",
      };
    }

    // Get chief underwriter ID
    const chiefUnderwriterId = (await getDemoChiefUnderwriter()).id;

    // Create chief review
    await prisma.chiefUnderwriterReview.upsert({
      where: { reviewId: review.id },
      create: {
        reviewId: review.id,
        chiefUnderwriterId,
        decision: "REJECT",
        decisionReason,
        feedbackNotes,
        sourceCaseId: caseId,
        status: "completed",
        reviewedAt: new Date(),
      },
      update: {
        decision: "REJECT",
        decisionReason,
        feedbackNotes,
        sourceCaseId: caseId,
        status: "completed",
        reviewedAt: new Date(),
      },
    });

    // Update case status
    await prisma.case.update({
      where: { id: caseId },
      data: { status: "rejected" },
    });

    // Update underwriter review status
    await prisma.underwriterReview.update({
      where: { id: review.id },
      data: { status: "completed", reviewedAt: new Date() },
    });

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Error rejecting escalated case:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reject case",
    };
  }
}

/**
 * Chief underwriter accepts with premium
 */
export async function acceptWithPremiumEscalatedCase(
  caseId: string,
  finalPremium: number,
  decisionReason?: string
) {
  try {
    // Get review
    const review = await prisma.underwriterReview.findUnique({
      where: { caseId },
    });

    if (!review) {
      return {
        success: false,
        error: "Review not found",
      };
    }

    // Get chief underwriter ID
    const chiefUnderwriterId = (await getDemoChiefUnderwriter()).id;

    // Create chief review
    await prisma.chiefUnderwriterReview.upsert({
      where: { reviewId: review.id },
      create: {
        reviewId: review.id,
        chiefUnderwriterId,
        decision: "ACCEPT_WITH_PREMIUM",
        finalPremiumCHF: finalPremium,
        decisionReason,
        sourceCaseId: caseId,
        status: "completed",
        reviewedAt: new Date(),
      },
      update: {
        decision: "ACCEPT_WITH_PREMIUM",
        finalPremiumCHF: finalPremium,
        decisionReason,
        sourceCaseId: caseId,
        status: "completed",
        reviewedAt: new Date(),
      },
    });

    // Update case status to approved
    await prisma.case.update({
      where: { id: caseId },
      data: { status: "approved" },
    });

    // Update underwriter review status
    await prisma.underwriterReview.update({
      where: { id: review.id },
      data: { status: "completed", reviewedAt: new Date() },
    });

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Error accepting with premium:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to accept with premium",
    };
  }
}

/**
 * Chief underwriter requests additional information (GATHER_INFO)
 */
export async function gatherInfoEscalatedCase(
  caseId: string,
  decisionReason?: string,
  feedbackNotes?: string
) {
  try {
    // Get review
    const review = await prisma.underwriterReview.findUnique({
      where: { caseId },
    });

    if (!review) {
      return {
        success: false,
        error: "Review not found",
      };
    }

    // Get chief underwriter ID
    const chiefUnderwriterId = (await getDemoChiefUnderwriter()).id;

    // Create chief review
    await prisma.chiefUnderwriterReview.upsert({
      where: { reviewId: review.id },
      create: {
        reviewId: review.id,
        chiefUnderwriterId,
        decision: "GATHER_INFO",
        decisionReason,
        feedbackNotes,
        sourceCaseId: caseId,
        status: "completed",
        reviewedAt: new Date(),
      },
      update: {
        decision: "GATHER_INFO",
        decisionReason,
        feedbackNotes,
        sourceCaseId: caseId,
        status: "completed",
        reviewedAt: new Date(),
      },
    });

    // Update case status to gather_info (or keep as approved if info already gathered)
    // For now, setting to a custom status
    await prisma.case.update({
      where: { id: caseId },
      data: { status: "gather_info" },
    });

    // Update underwriter review status
    await prisma.underwriterReview.update({
      where: { id: review.id },
      data: { status: "completed", reviewedAt: new Date() },
    });

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Error requesting gather info:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to request gather info",
    };
  }
}

