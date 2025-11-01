"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SurveyField } from "@/features/survey/components/SurveyField";
import {
  createCase,
  saveAnswer,
  evaluateCase,
  getCaseAnswers,
  isCaseEvaluated,
} from "@/features/survey/survey-actions";
import { toast } from "sonner";

interface Question {
  id: string;
  questionText: string;
  inputType: "TEXT" | "NUMBER" | "YESNO" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
  isRequired: boolean;
  helpText: string | null;
  order: number;
  evaluationFieldName?: string | null;
  options: Array<{
    value: string;
    label: string;
    order: number;
  }>;
}

interface SurveyFormProps {
  productId: string;
  productName: string;
  questions: Question[];
}

const STORAGE_KEY_PREFIX = "riskflow_case_";

// Default persona values for testing
const DEFAULT_VALUES: Record<string, string | number | boolean | string[]> = {
  // // Name
  // "What is your full name?": "John Doe",
  // // Age
  // age: 35,
  // "What is your age?": 35,
  // // Smoking
  // isSmoking: false,
  // "Do you currently smoke?": false,
  // // Sex - default to first option (male)
  // sex: "male",
  // "What is your biological sex?": "male",
  // // Coverage
  // coverageCHF: 100000,
  // "What coverage amount do you need? (CHF)": 100000,
  // // BMI
  // bmi: 24,
  // "What is your current BMI?": 24,
  // // Height
  // "What is your height in centimeters?": 175,
  // // Weight
  // "What is your weight in kilograms?": 75,
  // // Health conditions - user's persona
  // pastInjuries: "Broken leg 2 years ago, back pain for 3 years",
  // "Please describe any past injuries or current health conditions:": "Broken leg 2 years ago, back pain for 3 years",
};

// Get default value for a question
function getDefaultValue(
  question: Question
): string | number | boolean | string[] | null {
  console.log("🔷 [getDefaultValue] Checking question:", {
    id: question.id,
    questionText: question.questionText,
    evaluationFieldName: question.evaluationFieldName,
    inputType: question.inputType,
    hasOptions: question.options.length > 0,
  });

  // Try evaluationFieldName first
  if (
    question.evaluationFieldName &&
    DEFAULT_VALUES[question.evaluationFieldName] !== undefined
  ) {
    const value = DEFAULT_VALUES[question.evaluationFieldName];
    console.log("✅ [getDefaultValue] Found default via evaluationFieldName:", {
      evaluationFieldName: question.evaluationFieldName,
      value,
    });
    return value;
  }

  // Try question text as fallback
  if (DEFAULT_VALUES[question.questionText] !== undefined) {
    const defaultValue = DEFAULT_VALUES[question.questionText];
    console.log("✅ [getDefaultValue] Found default via questionText:", {
      questionText: question.questionText,
      defaultValue,
    });
    // For single choice, ensure the value matches an option
    if (
      question.inputType === "SINGLE_CHOICE" &&
      typeof defaultValue === "string"
    ) {
      const matchingOption = question.options.find(
        (opt) => opt.value === defaultValue
      );
      if (matchingOption) {
        console.log(
          "✅ [getDefaultValue] Matched option value:",
          matchingOption.value
        );
        return defaultValue;
      }
      // If no match, return null (no default)
      console.log("⚠️  [getDefaultValue] No match found, returning null");
      return null;
    }
    return defaultValue;
  }

  // Don't auto-select first option for SINGLE_CHOICE or YESNO - user should select explicitly
  if (
    question.inputType === "SINGLE_CHOICE" ||
    question.inputType === "YESNO"
  ) {
    console.log(
      "✅ [getDefaultValue] No default for " +
        question.inputType +
        ", returning null"
    );
    return null;
  }

  console.log(
    "❌ [getDefaultValue] No default found for question:",
    question.id
  );
  return null;
}

// Parse answer value from string based on input type
function parseAnswerValue(
  value: string | null | undefined,
  inputType: Question["inputType"]
): string | number | boolean | string[] | null {
  if (!value || value === "") return null;

  switch (inputType) {
    case "NUMBER":
      const num = parseFloat(value);
      return isNaN(num) ? null : num;

    case "YESNO":
      const lower = value.toLowerCase();
      return lower === "true" || lower === "yes" || lower === "1";

    case "MULTIPLE_CHOICE":
      return value
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v);

    case "SINGLE_CHOICE":
    case "TEXT":
    default:
      return value;
  }
}

export default function SurveyForm({
  productId,
  productName,
  questions,
}: SurveyFormProps) {
  const router = useRouter();
  const [caseId, setCaseId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isInitializing, setIsInitializing] = React.useState(true);

  // Form state - map questionId to answer value
  const [answers, setAnswers] = React.useState<
    Map<string, string | number | boolean | string[] | null>
  >(new Map());

  // Initialize case from localStorage or create new one
  React.useEffect(() => {
    const initializeCase = async () => {
      try {
        // Check localStorage first
        const storedCaseId = localStorage.getItem(
          `${STORAGE_KEY_PREFIX}${productId}`
        );

        if (storedCaseId) {
          // Check if the case has been evaluated
          const { isEvaluated } = await isCaseEvaluated(storedCaseId);

          if (isEvaluated) {
            // Case has been evaluated/submitted, create a new one
            console.log("Case already evaluated, creating new case");
            localStorage.removeItem(`${STORAGE_KEY_PREFIX}${productId}`);
            // Continue to create new case below
          } else {
            // Case exists and hasn't been evaluated, load existing answers
            setCaseId(storedCaseId);
            const { success, answers: existingAnswers } = await getCaseAnswers(
              storedCaseId
            );

            if (success && existingAnswers) {
              // Parse and populate answers from database
              const parsedAnswers = new Map<
                string,
                string | number | boolean | string[] | null
              >();

              for (const question of questions) {
                const answerString = existingAnswers.get(question.id);
                if (answerString !== undefined) {
                  const parsedValue = parseAnswerValue(
                    answerString,
                    question.inputType
                  );
                  parsedAnswers.set(question.id, parsedValue);
                } else {
                  // If no answer exists, only use default for non-YESNO/non-SINGLE_CHOICE questions
                  if (
                    question.inputType !== "YESNO" &&
                    question.inputType !== "SINGLE_CHOICE"
                  ) {
                    const defaultValue = getDefaultValue(question);
                    if (defaultValue !== null) {
                      parsedAnswers.set(question.id, defaultValue);
                      // Save default to backend
                      await saveAnswer(storedCaseId, question.id, defaultValue);
                    }
                  }
                  // YESNO and SINGLE_CHOICE remain null/unselected
                }
              }

              setAnswers(parsedAnswers);
            }

            setIsInitializing(false);
            return;
          }
        }

        // Create new case
        const {
          success,
          caseId: newCaseId,
          error,
        } = await createCase(productId);

        if (success && newCaseId) {
          setCaseId(newCaseId);
          localStorage.setItem(`${STORAGE_KEY_PREFIX}${productId}`, newCaseId);

          // Populate default values for testing
          const defaultAnswers = new Map<
            string,
            string | number | boolean | string[] | null
          >();
          const savePromises: Promise<void>[] = [];

          console.log(
            "🔵 [SurveyForm] Setting default values for",
            questions.length,
            "questions"
          );
          for (const question of questions) {
            // Skip YESNO and SINGLE_CHOICE - they should start with no selection
            if (
              question.inputType === "YESNO" ||
              question.inputType === "SINGLE_CHOICE"
            ) {
              console.log(
                `⏭️  [SurveyForm] Skipping default for ${question.inputType}: "${question.questionText}"`
              );
              continue;
            }

            const defaultValue = getDefaultValue(question);
            console.log(
              `🔵 [SurveyForm] Question: "${question.questionText}"`,
              {
                id: question.id,
                evaluationFieldName: question.evaluationFieldName,
                inputType: question.inputType,
                defaultValue,
                hasDefault: defaultValue !== null,
              }
            );
            if (defaultValue !== null) {
              defaultAnswers.set(question.id, defaultValue);
              // Save to backend
              savePromises.push(
                saveAnswer(newCaseId, question.id, defaultValue).then(() => {
                  console.log(
                    `✅ [SurveyForm] Saved default for question ${question.id}:`,
                    defaultValue
                  );
                })
              );
            }
          }

          console.log(
            "🔵 [SurveyForm] Total default answers:",
            defaultAnswers.size
          );
          console.log(
            "🔵 [SurveyForm] Default answers map:",
            Array.from(defaultAnswers.entries())
          );

          // Set answers state
          setAnswers(defaultAnswers);

          // Save all defaults to backend
          await Promise.all(savePromises);
          console.log("🔵 [SurveyForm] All defaults saved to backend");

          toast.success("Application started");
        } else {
          toast.error(error || "Failed to create application");
        }
      } catch (error) {
        console.error("Error initializing case:", error);
        toast.error("Failed to initialize application");
      } finally {
        setIsInitializing(false);
      }
    };

    initializeCase();
  }, [productId, questions]);

  // Group questions into logical sections - MUST be before any conditional returns
  const groupedQuestions = React.useMemo(() => {
    const personalInfo: Question[] = [];
    const healthInfo: Question[] = [];
    const coverageInfo: Question[] = [];
    const other: Question[] = [];

    questions.forEach((question) => {
      const text = question.questionText.toLowerCase();
      const fieldName = question.evaluationFieldName?.toLowerCase() || "";

      if (
        text.includes("name") ||
        text.includes("age") ||
        fieldName === "age" ||
        fieldName === "sex"
      ) {
        personalInfo.push(question);
      } else if (
        text.includes("smoke") ||
        text.includes("health") ||
        text.includes("injur") ||
        text.includes("bmi") ||
        text.includes("height") ||
        text.includes("weight") ||
        fieldName === "bmi" ||
        fieldName === "issmoking"
      ) {
        healthInfo.push(question);
      } else if (text.includes("coverage") || fieldName === "coveragechf") {
        coverageInfo.push(question);
      } else {
        other.push(question);
      }
    });

    return {
      personalInfo,
      healthInfo,
      coverageInfo,
      other,
    };
  }, [questions]);

  // Handle answer changes with optimistic updates
  const handleAnswerChange = React.useCallback(
    async (
      questionId: string,
      value: string | number | boolean | string[] | null
    ) => {
      // Optimistic update
      setAnswers((prev) => {
        const updated = new Map(prev);
        updated.set(questionId, value);
        return updated;
      });

      // Save to backend
      if (caseId) {
        try {
          const { success, error } = await saveAnswer(
            caseId,
            questionId,
            value
          );

          if (!success) {
            // Revert on error
            setAnswers((prev) => {
              const updated = new Map(prev);
              updated.delete(questionId);
              return updated;
            });
            toast.error(error || "Failed to save answer");
          }
        } catch (error) {
          console.error("Error saving answer:", error);
          setAnswers((prev) => {
            const updated = new Map(prev);
            updated.delete(questionId);
            return updated;
          });
          toast.error("Failed to save answer");
        }
      }
    },
    [caseId]
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!caseId) {
      toast.error("Application not initialized");
      return;
    }

    // Validate required fields
    const missingFields = questions.filter(
      (q) => q.isRequired && !answers.has(q.id)
    );

    if (missingFields.length > 0) {
      toast.error(
        `Please fill in all required fields: ${missingFields
          .map((q) => q.questionText)
          .join(", ")}`
      );
      return;
    }

    setIsLoading(true);

    try {
      // Trigger evaluation
      toast.loading("Evaluating your application...", { id: "evaluating" });

      const { success, error } = await evaluateCase(caseId);

      if (!success) {
        toast.error(error || "Failed to evaluate application", {
          id: "evaluating",
        });
        return;
      }

      toast.success("Application submitted successfully!", {
        id: "evaluating",
      });

      // Navigate to results page
      router.push(`/survey/case/${caseId}`);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to submit application", { id: "evaluating" });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate progress
  const totalQuestions = questions.length;
  const answeredQuestions = Array.from(answers.values()).filter(
    (v) => v !== null && v !== undefined && v !== ""
  ).length;
  const progressPercentage =
    totalQuestions > 0
      ? Math.round((answeredQuestions / totalQuestions) * 100)
      : 0;

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Initializing your application...
          </p>
        </div>
      </div>
    );
  }

  // Render a section of questions
  const renderSection = (
    title: string,
    questions: Question[],
    description?: string
  ) => {
    if (questions.length === 0) return null;

    return (
      <Card className="border border-gray-200 bg-white">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-900">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-sm text-gray-600 mt-1">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {questions.map((question) => (
              <SurveyField
                key={question.id}
                questionId={question.id}
                type={question.inputType}
                label={question.questionText}
                value={answers.get(question.id) ?? null}
                onChange={(value) => handleAnswerChange(question.id, value)}
                required={question.isRequired}
                helpText={question.helpText || undefined}
                options={question.options.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                }))}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4 max-w-4xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[#22c55e] font-semibold">.Pax</span>
                <span className="text-gray-900 font-semibold">RiskFlow</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                {productName}
              </h1>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">
                Application Progress
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {progressPercentage}%
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#22c55e] transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Insurance Application
          </h2>
          <p className="text-gray-600">
            Please provide accurate information to help us evaluate your
            application. Fields marked with{" "}
            <span className="text-red-500">*</span> are required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {renderSection(
            "Personal Information",
            groupedQuestions.personalInfo,
            "Basic details about yourself"
          )}

          {renderSection(
            "Health Information",
            groupedQuestions.healthInfo,
            "Details about your health and lifestyle"
          )}

          {renderSection(
            "Coverage Details",
            groupedQuestions.coverageInfo,
            "Specify your insurance coverage requirements"
          )}

          {renderSection(
            "Additional Information",
            groupedQuestions.other,
            "Any additional details relevant to your application"
          )}

          {/* Submit Section */}
          <Card className="border-2 border-gray-200 bg-white">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="text-[#f8faf8] mt-0.5">ℹ️</div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      By submitting this application, you confirm that all
                      information provided is accurate and complete. Your
                      application will be reviewed by our underwriting team.
                    </p>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-base font-medium"
                  size="lg"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      Submitting Application...
                    </span>
                  ) : (
                    "Submit Application"
                  )}
                </Button>
                <p className="text-xs text-center text-gray-500 mt-2">
                  You can save your progress and return later if needed
                </p>
              </div>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  );
}
