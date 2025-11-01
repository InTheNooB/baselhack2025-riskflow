"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SurveyField } from "@/features/survey/components/SurveyField";
import { createCase, saveAnswer, evaluateCase, getCaseAnswers } from "@/features/survey/survey-actions";
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
  questions: Question[];
}

const STORAGE_KEY_PREFIX = "riskflow_case_";

// Default persona values for testing
const DEFAULT_VALUES: Record<string, string | number | boolean | string[]> = {
  // Name
  "What is your full name?": "John Doe",
  // Age
  age: 35,
  "What is your age?": 35,
  // Smoking
  isSmoking: false,
  "Do you currently smoke?": false,
  // Sex - default to first option (male)
  sex: "male",
  "What is your biological sex?": "male",
  // Coverage
  coverageCHF: 100000,
  "What coverage amount do you need? (CHF)": 100000,
  // BMI
  bmi: 24,
  "What is your current BMI?": 24,
  // Height
  "What is your height in centimeters?": 175,
  // Weight
  "What is your weight in kilograms?": 75,
  // Health conditions - user's persona
  pastInjuries: "Broken leg 2 years ago, back pain for 3 years",
  "Please describe any past injuries or current health conditions:": "Broken leg 2 years ago, back pain for 3 years",
};

// Get default value for a question
function getDefaultValue(question: Question): string | number | boolean | string[] | null {
  console.log("🔷 [getDefaultValue] Checking question:", {
    id: question.id,
    questionText: question.questionText,
    evaluationFieldName: question.evaluationFieldName,
    inputType: question.inputType,
    hasOptions: question.options.length > 0,
  });

  // Try evaluationFieldName first
  if (question.evaluationFieldName && DEFAULT_VALUES[question.evaluationFieldName] !== undefined) {
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
    if (question.inputType === "SINGLE_CHOICE" && typeof defaultValue === "string") {
      const matchingOption = question.options.find(opt => opt.value === defaultValue);
      if (matchingOption) {
        console.log("✅ [getDefaultValue] Matched option value:", matchingOption.value);
        return defaultValue;
      }
      // If no match, return first option
      const firstOption = question.options[0]?.value ?? null;
      console.log("⚠️  [getDefaultValue] No match, using first option:", firstOption);
      return firstOption;
    }
    return defaultValue;
  }
  
  // For single choice with options, return first option
  if (question.inputType === "SINGLE_CHOICE" && question.options.length > 0) {
    const firstOption = question.options[0].value;
    console.log("✅ [getDefaultValue] Using first option for single choice:", firstOption);
    return firstOption;
  }
  
  console.log("❌ [getDefaultValue] No default found for question:", question.id);
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
      return value.split(",").map(v => v.trim()).filter(v => v);
    
    case "SINGLE_CHOICE":
    case "TEXT":
    default:
      return value;
  }
}

export default function SurveyForm({ productId, questions }: SurveyFormProps) {
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
          // Case exists, load existing answers
          setCaseId(storedCaseId);
          const { success, answers: existingAnswers } = await getCaseAnswers(storedCaseId);
          
          if (success && existingAnswers) {
            // Parse and populate answers from database
            const parsedAnswers = new Map<string, string | number | boolean | string[] | null>();
            
            for (const question of questions) {
              const answerString = existingAnswers.get(question.id);
              if (answerString !== undefined) {
                const parsedValue = parseAnswerValue(answerString, question.inputType);
                parsedAnswers.set(question.id, parsedValue);
              } else {
                // If no answer exists, use default
                const defaultValue = getDefaultValue(question);
                if (defaultValue !== null) {
                  parsedAnswers.set(question.id, defaultValue);
                  // Save default to backend
                  await saveAnswer(storedCaseId, question.id, defaultValue);
                }
              }
            }
            
            setAnswers(parsedAnswers);
          }
          
          setIsInitializing(false);
          return;
        }

        // Create new case
        const { success, caseId: newCaseId, error } = await createCase(productId);

        if (success && newCaseId) {
          setCaseId(newCaseId);
          localStorage.setItem(`${STORAGE_KEY_PREFIX}${productId}`, newCaseId);
          
          // Populate default values for testing
          const defaultAnswers = new Map<string, string | number | boolean | string[] | null>();
          const savePromises: Promise<void>[] = [];
          
          console.log("🔵 [SurveyForm] Setting default values for", questions.length, "questions");
          for (const question of questions) {
            const defaultValue = getDefaultValue(question);
            console.log(`🔵 [SurveyForm] Question: "${question.questionText}"`, {
              id: question.id,
              evaluationFieldName: question.evaluationFieldName,
              inputType: question.inputType,
              defaultValue,
              hasDefault: defaultValue !== null,
            });
            if (defaultValue !== null) {
              defaultAnswers.set(question.id, defaultValue);
              // Save to backend
              savePromises.push(
                saveAnswer(newCaseId, question.id, defaultValue).then(() => {
                  console.log(`✅ [SurveyForm] Saved default for question ${question.id}:`, defaultValue);
                })
              );
            }
          }
          
          console.log("🔵 [SurveyForm] Total default answers:", defaultAnswers.size);
          console.log("🔵 [SurveyForm] Default answers map:", Array.from(defaultAnswers.entries()));
          
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
          const { success, error } = await saveAnswer(caseId, questionId, value);

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
        `Please fill in all required fields: ${missingFields.map((q) => q.questionText).join(", ")}`
      );
      return;
    }

    setIsLoading(true);

    try {
      // Trigger evaluation
      toast.loading("Evaluating your application...", { id: "evaluating" });
      
      const { success, error } = await evaluateCase(caseId);
      
      if (!success) {
        toast.error(error || "Failed to evaluate application", { id: "evaluating" });
        return;
      }
      
      toast.success("Application submitted successfully!", { id: "evaluating" });
      
      // Navigate to results page
      router.push(`/survey/case/${caseId}`);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to submit application", { id: "evaluating" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing your application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Application Form</h1>
        <p className="text-muted-foreground mt-2">
          Please fill out all required fields
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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

        <div className="flex gap-4 pt-4">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? "Submitting..." : "Submit Application"}
          </Button>
        </div>
      </form>
    </div>
  );
}

