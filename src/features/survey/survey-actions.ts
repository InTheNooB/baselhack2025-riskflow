"use server";

import { prisma } from "@/lib/client";
import { evaluateApplicant, type ApplicantData } from "@/lib/evaluation-system";

/**
 * Create a new case for a product
 */
export async function createCase(productId: string) {
  try {
    const newCase = await prisma.case.create({
      data: {
        productId,
        status: "submitted",
      },
      select: {
        id: true,
        productId: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      caseId: newCase.id,
      error: null,
    };
  } catch (error) {
    console.error("Error creating case:", error);
    return {
      success: false,
      caseId: null,
      error: error instanceof Error ? error.message : "Failed to create case",
    };
  }
}

/**
 * Save a single answer for a case
 */
export async function saveAnswer(
  caseId: string,
  questionId: string,
  answerValue: string | number | boolean | string[] | null
) {
  try {
    // Convert answer to string (store label for choices, join arrays)
    let answerString: string;
    if (Array.isArray(answerValue)) {
      answerString = answerValue.join(", ");
    } else {
      answerString = String(answerValue ?? "");
    }

    console.log("💾 [saveAnswer] Saving answer:", {
      caseId,
      questionId,
      answerValue,
      answerString,
      type: typeof answerValue,
    });

    await prisma.caseAnswer.upsert({
      where: {
        caseId_questionId: {
          caseId,
          questionId,
        },
      },
      create: {
        caseId,
        questionId,
        answerValue: answerString,
      },
      update: {
        answerValue: answerString,
      },
    });

    console.log(
      "✅ [saveAnswer] Successfully saved answer for question",
      questionId
    );

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("❌ [saveAnswer] Error saving answer:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save answer",
    };
  }
}

/**
 * Save multiple answers in bulk
 */
export async function saveAnswers(
  caseId: string,
  answers: Array<{
    questionId: string;
    value: string | number | boolean | null;
  }>
) {
  try {
    await Promise.all(
      answers.map(({ questionId, value }) =>
        prisma.caseAnswer.upsert({
          where: {
            caseId_questionId: {
              caseId,
              questionId,
            },
          },
          create: {
            caseId,
            questionId,
            answerValue: String(value ?? ""),
          },
          update: {
            answerValue: String(value ?? ""),
          },
        })
      )
    );

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Error saving answers:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save answers",
    };
  }
}

/**
 * Get all questions for a product
 */
export async function getProductQuestions(productId: string) {
  try {
    const questions = await prisma.surveyQuestion.findMany({
      where: {
        productId,
      },
      include: {
        options: {
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });

    console.log(
      "📋 [getProductQuestions] Fetched questions:",
      questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        evaluationFieldName: q.evaluationFieldName,
        inputType: q.inputType,
        dataType: q.dataType,
      }))
    );

    return {
      success: true,
      questions,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching questions:", error);
    return {
      success: false,
      questions: [],
      error:
        error instanceof Error ? error.message : "Failed to fetch questions",
    };
  }
}

/**
 * Get all active products
 */
export async function getProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      success: true,
      products,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      success: false,
      products: [],
      error:
        error instanceof Error ? error.message : "Failed to fetch products",
    };
  }
}

/**
 * Check if a case has been evaluated (has an assessment) or is in a final state
 */
export async function isCaseEvaluated(caseId: string) {
  try {
    const case_ = await prisma.case.findUnique({
      where: { id: caseId },
      select: {
        id: true,
        status: true,
        assessment: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!case_) {
      return { isEvaluated: true, exists: false };
    }

    // Case is evaluated if it has an assessment OR is in a final state
    const isEvaluated =
      !!case_.assessment ||
      case_.status === "approved" ||
      case_.status === "rejected" ||
      case_.status === "under_review" ||
      case_.status === "escalated";

    return {
      isEvaluated,
      exists: true,
      status: case_.status,
    };
  } catch (error) {
    console.error("Error checking case status:", error);
    return {
      isEvaluated: true, // Assume evaluated on error to be safe
      exists: false,
    };
  }
}

/**
 * Get existing answers for a case
 */
export async function getCaseAnswers(caseId: string) {
  try {
    const answers = await prisma.caseAnswer.findMany({
      where: {
        caseId,
      },
    });

    // Convert to a map for easy lookup
    const answerMap = new Map<string, string>();
    answers.forEach((answer) => {
      answerMap.set(answer.questionId, answer.answerValue);
    });

    return {
      success: true,
      answers: answerMap,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching answers:", error);
    return {
      success: false,
      answers: new Map(),
      error: error instanceof Error ? error.message : "Failed to fetch answers",
    };
  }
}

/**
 * Run evaluation and save assessment for a case
 */
export async function evaluateCase(caseId: string) {
  try {
    // Get case with answers and product
    const case_ = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        answers: true,
        product: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!case_) {
      return {
        success: false,
        error: "Case not found",
      };
    }

    // Get questions and answers
    const questions = case_.product.questions;
    const answers = case_.answers;

    console.log("🔍 [evaluateCase] Starting evaluation for case", caseId);
    console.log("🔍 [evaluateCase] Total questions:", questions.length);
    console.log("🔍 [evaluateCase] Total answers:", answers.length);

    // Log ALL questions with their full details
    console.log(
      "🔍 [evaluateCase] ALL QUESTIONS:",
      questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        evaluationFieldName: q.evaluationFieldName,
        inputType: q.inputType,
        dataType: q.dataType,
        hasEvaluationFieldName: !!q.evaluationFieldName,
      }))
    );

    console.log(
      "🔍 [evaluateCase] Questions with evaluationFieldName:",
      questions
        .filter((q) => q.evaluationFieldName)
        .map((q) => ({
          id: q.id,
          evaluationFieldName: q.evaluationFieldName,
          questionText: q.questionText,
          inputType: q.inputType,
          dataType: q.dataType,
        }))
    );

    // Build answer map
    const answerMap = new Map<string, string>();
    answers.forEach((answer) => {
      answerMap.set(answer.questionId, answer.answerValue);
      console.log("🔍 [evaluateCase] Answer found:", {
        questionId: answer.questionId,
        answerValue: answer.answerValue,
        answerValueType: typeof answer.answerValue,
      });
    });

    console.log("🔍 [evaluateCase] Answer map size:", answerMap.size);
    console.log(
      "🔍 [evaluateCase] Answer map entries:",
      Array.from(answerMap.entries())
    );

    /**
     * Parse answer value based on dataType
     */
    const parseAnswerValue = (
      value: string | null,
      dataType: string | null,
      inputType: string
    ): any => {
      if (!value || value === "") return null;

      // Try to parse as JSON first (for arrays/objects)
      if (dataType === "array" || dataType === "object") {
        try {
          return JSON.parse(value);
        } catch {
          // If JSON parse fails, try to split by comma for arrays
          if (dataType === "array") {
            return value
              .split(",")
              .map((v) => v.trim())
              .filter((v) => v);
          }
          return null;
        }
      }

      // Parse based on dataType or inputType
      if (dataType === "number" || inputType === "NUMBER") {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
      }

      if (dataType === "boolean" || inputType === "YESNO") {
        const lower = value.toLowerCase();
        if (lower === "true" || lower === "yes" || lower === "1") {
          return true;
        }
        if (lower === "false" || lower === "no" || lower === "0") {
          return false;
        }
        // Default to false for unrecognized boolean values
        return false;
      }

      // Default to string
      return value;
    };

    /**
     * Apply normalization rule to a value
     */
    const applyNormalization = (value: any, rule: string | null): any => {
      if (!rule || !value) return value;

      try {
        const ruleObj = JSON.parse(rule);
        if (ruleObj.type === "lowercase_match" && ruleObj.mapping) {
          const lowerValue = String(value).toLowerCase();
          // Check direct match
          if (ruleObj.mapping[lowerValue]) {
            return ruleObj.mapping[lowerValue];
          }
          // Check if value contains any key
          for (const [key, mappedValue] of Object.entries(ruleObj.mapping)) {
            if (lowerValue.includes(key.toLowerCase())) {
              return mappedValue;
            }
          }
          return ruleObj.fallback || value;
        }
        return value;
      } catch {
        return value;
      }
    };

    /**
     * Fallback mapping from question text to evaluation field name
     * Used when evaluationFieldName is not set in the database
     */
    const questionTextToFieldMap: Record<string, string> = {
      "What is your age?": "age",
      "Do you currently smoke?": "isSmoking",
      "What is your biological sex?": "sex",
      "What coverage amount do you need? (CHF)": "coverageCHF",
      "What is your current BMI?": "bmi",
      "Please describe any past injuries or current health conditions:":
        "pastInjuries",
    };

    /**
     * Dynamically extract evaluation data from answers
     */
    const evaluationData: Record<string, any> = {};

    console.log("🔍 [evaluateCase] Extracting evaluation data...");
    for (const question of questions) {
      // Try to get evaluationFieldName from question or fallback to question text mapping
      let evaluationFieldName = question.evaluationFieldName;

      if (
        !evaluationFieldName &&
        questionTextToFieldMap[question.questionText]
      ) {
        evaluationFieldName = questionTextToFieldMap[question.questionText];
        console.log("🔄 [evaluateCase] Using fallback mapping for question:", {
          questionText: question.questionText,
          evaluationFieldName,
        });
      }

      if (!evaluationFieldName) {
        console.log(
          "⏭️  [evaluateCase] Skipping question without evaluationFieldName:",
          {
            id: question.id,
            questionText: question.questionText,
          }
        );
        continue;
      }

      const rawValue = answerMap.get(question.id);
      console.log("🔍 [evaluateCase] Processing question:", {
        id: question.id,
        questionText: question.questionText,
        evaluationFieldName: evaluationFieldName,
        originalEvaluationFieldName: question.evaluationFieldName,
        rawValue,
        rawValueType: typeof rawValue,
        dataType: question.dataType,
        inputType: question.inputType,
      });

      const parsedValue = parseAnswerValue(
        rawValue || null,
        question.dataType || null,
        question.inputType
      );

      console.log("🔍 [evaluateCase] Parsed value:", {
        evaluationFieldName: question.evaluationFieldName,
        rawValue,
        parsedValue,
        parsedValueType: typeof parsedValue,
      });

      if (parsedValue === null && parsedValue !== 0 && parsedValue !== false) {
        console.log(
          "⏭️  [evaluateCase] Skipping null/undefined value for:",
          question.evaluationFieldName
        );
        continue; // Skip null/undefined values
      }

      // Apply normalization if rule exists
      const normalizedValue = applyNormalization(
        parsedValue,
        question.normalizationRule || null
      );

      console.log("✅ [evaluateCase] Setting evaluation data:", {
        field: evaluationFieldName,
        value: normalizedValue,
        valueType: typeof normalizedValue,
      });

      evaluationData[evaluationFieldName] = normalizedValue;
    }

    console.log("🔍 [evaluateCase] Final evaluation data:", evaluationData);
    console.log("🔍 [evaluateCase] Checking required fields:", {
      age: evaluationData.age,
      sex: evaluationData.sex,
      coverageCHF: evaluationData.coverageCHF,
      isSmoking: evaluationData.isSmoking,
    });

    // Validate required core fields
    if (
      !evaluationData.age ||
      !evaluationData.sex ||
      !evaluationData.coverageCHF ||
      evaluationData.isSmoking === undefined
    ) {
      console.error("❌ [evaluateCase] Missing required fields:", {
        hasAge: !!evaluationData.age,
        hasSex: !!evaluationData.sex,
        hasCoverageCHF: !!evaluationData.coverageCHF,
        hasIsSmoking: evaluationData.isSmoking !== undefined,
        evaluationData,
      });
      return {
        success: false,
        error: "Missing required fields for evaluation",
      };
    }

    // Ensure sex is "male" or "female"
    const normalizedSex = String(evaluationData.sex || "")
      .toLowerCase()
      .includes("male")
      ? "male"
      : "female";

    // Build applicant data with all dynamic fields
    const applicantData: ApplicantData = {
      age: evaluationData.age,
      sex: normalizedSex as "male" | "female",
      coverageCHF: evaluationData.coverageCHF,
      bmi: evaluationData.bmi ?? null,
      isSmoking: !!evaluationData.isSmoking,
      pastInjuries: evaluationData.pastInjuries || "",
      // Include all other dynamic fields
      ...Object.fromEntries(
        Object.entries(evaluationData).filter(
          ([key]) =>
            ![
              "age",
              "sex",
              "coverageCHF",
              "bmi",
              "isSmoking",
              "pastInjuries",
            ].includes(key)
        )
      ),
    };

    // Extract customer name from answers
    // Look for question with "name" in the text or evaluationFieldName "customerName"
    const nameQuestion = questions.find(
      (q) =>
        q.evaluationFieldName === "customerName" ||
        q.questionText.toLowerCase().includes("name")
    );

    let customerName: string | null = null;
    if (nameQuestion) {
      const nameAnswer = answerMap.get(nameQuestion.id);
      if (nameAnswer) {
        customerName = nameAnswer.trim();
      }
    }

    // Update case with customer name if found
    if (customerName) {
      await prisma.case.update({
        where: { id: caseId },
        data: { customerName },
      });
    }

    // Run evaluation
    const evaluationResult = await evaluateApplicant(applicantData);

    // Save assessment
    const assessment = await prisma.systemAssessment.create({
      data: {
        caseId,
        decision: evaluationResult.decision,
        annualPremiumCHF: evaluationResult.annualPremiumCHF || null,
        basePremiumCHF: evaluationResult.basePremiumCHF || null,
        riskAdjustedPremiumCHF: evaluationResult.riskAdjustedPremiumCHF || null,
        marginPercent: evaluationResult.marginPercent,
        totalMultiplier: evaluationResult.totalMultiplier,
        healthSeverity: evaluationResult.healthSeverity || null,
        healthStatus: evaluationResult.healthStatus || null,
        healthImpact: evaluationResult.healthImpact || null,
        healthTextRaw: evaluationResult.healthTextRaw || null,
        triggeredDeclineRule: evaluationResult.triggeredDeclineRule || null,
        triggeredGatherInfoRules:
          evaluationResult.triggeredGatherInfoRules || [],
        auditTrail: JSON.stringify(evaluationResult),
        applicantData: JSON.stringify(applicantData), // Store raw applicant data for simulations
      },
    });

    // Save risk factor details
    if (
      evaluationResult.riskFactorDetails &&
      evaluationResult.riskFactorDetails.length > 0
    ) {
      await prisma.assessmentRiskFactor.createMany({
        data: evaluationResult.riskFactorDetails.map((detail) => ({
          assessmentId: assessment.id,
          factorName: detail.name,
          factorLabel: detail.label,
          multiplier: detail.multiplier,
          explanation: detail.explanation,
        })),
      });
    }

    // Don't update case status - it stays as "submitted" until underwriter reviews
    // The assessment is only a recommendation, not a final decision

    return {
      success: true,
      assessment,
      error: null,
    };
  } catch (error) {
    console.error("Error evaluating case:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to evaluate case",
    };
  }
}
