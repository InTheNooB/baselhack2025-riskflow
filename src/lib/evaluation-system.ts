import { prisma } from "@/lib/client";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { Parser } from "expr-eval";
import { z } from "zod";

// ============================================================================
// TYPES
// ============================================================================

// ApplicantData is now a flexible record to support dynamic fields
// Core required fields are still validated, but additional fields can be added dynamically
export type ApplicantData = Record<string, any> & {
  age: number;
  sex: "male" | "female";
  coverageCHF: number;
  bmi?: number | null;
  isSmoking: boolean;
  pastInjuries?: string;
};

export interface ParsedHealthData {
  severity: "minor" | "moderate" | "severe";
  status: "resolved" | "ongoing" | "unclear";
  impact: "none" | "partial" | "major";
}

export interface RiskFactorDetail {
  name: string;
  label: string;
  multiplier: number;
  explanation?: string;
}

export interface EvaluationResult {
  decision: "REJECT" | "PENDING_INFORMATION" | "ACCEPT" | "ACCEPT_WITH_PREMIUM";
  annualPremiumCHF?: number;
  basePremiumCHF?: number;
  riskAdjustedPremiumCHF?: number;
  marginPercent: number;
  totalMultiplier: number;
  healthSeverity?: string;
  healthStatus?: string;
  healthImpact?: string;
  healthTextRaw?: string;
  triggeredDeclineRule?: string;
  triggeredGatherInfoRules?: string[];
  riskFactorDetails?: RiskFactorDetail[];
  auditTrail?: string;
}

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

interface RiskFactorConfig {
  name: string;
  label: string;
  expression: string;
  description?: string | null;
  isActive: boolean;
  order: number;
}

interface DeclineRuleConfig {
  name: string;
  label: string;
  expression: string;
  description?: string | null;
  reason: string;
  isActive: boolean;
  priority: number;
}

interface MortalityRateFormulaConfig {
  sex: string;
  formula: string;
  description?: string | null;
  isActive: boolean;
}

interface GatherInfoRuleConfig {
  name: string;
  label: string;
  condition: string;
  description?: string | null;
  isActive: boolean;
  priority: number;
  questions?: Array<{ questionText: string }>;
}

let configCache: {
  riskFactors?: RiskFactorConfig[];
  declineRules?: DeclineRuleConfig[];
  gatherInfoRules?: GatherInfoRuleConfig[];
  mortalityFormulas?: Record<string, MortalityRateFormulaConfig>;
  lastUpdated?: number;
} = {};

const CACHE_TTL = 60 * 1000; // 1 minute

/**
 * Clear the config cache - useful for forcing a reload after rule changes
 */
export function clearConfigCache() {
  configCache = {};
}

async function loadConfig() {
  const now = Date.now();

  // Return cache if valid
  if (configCache.lastUpdated && now - configCache.lastUpdated < CACHE_TTL) {
    return configCache;
  }

  // Load fresh config
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
      prisma.mortalityRateFormula.findMany({ where: { isActive: true } }),
    ]);

  // Transform mortality formulas to lookup
  const mortalityLookup: Record<string, MortalityRateFormulaConfig> = {};
  mortalityFormulas.forEach((f) => {
    mortalityLookup[f.sex] = f;
  });

  configCache = {
    riskFactors,
    declineRules,
    gatherInfoRules,
    mortalityFormulas: mortalityLookup,
    lastUpdated: now,
  };

  return configCache;
}

// ============================================================================
// HEALTH TEXT NORMALIZATION (LLM)
// ============================================================================

export async function normalizeHealthText(
  pastInjuries: string
): Promise<ParsedHealthData> {
  const { object } = await generateObject({
    model: openai("gpt-4o"),
    temperature: 0, // Deterministic
    schema: z.object({
      severity: z
        .enum(["minor", "moderate", "severe"])
        .describe("How severe is the health condition?"),
      status: z
        .enum(["resolved", "ongoing", "unclear"])
        .describe("Current status of the condition"),
      impact: z
        .enum(["none", "partial", "major"])
        .describe("Impact on daily life"),
    }),
    prompt: `Classify the following health description into structured categories.

Examples:
- "Broke my wrist 4 years ago, fully healed" → severity: minor, status: resolved, impact: none
- "Lower back pain, physio 2x/mo, still hurts when lifting" → severity: moderate, status: ongoing, impact: partial
- "Lung cancer last year, still on chemo" → severity: severe, status: ongoing, impact: major
- "Had some back issues years ago, not sure if resolved" → severity: moderate, status: unclear, impact: none

Health description: ${pastInjuries || "None"}`,
  });

  return object;
}

// ============================================================================
// DECISION GATES
// ============================================================================

// Context type for expr-eval - using Record to allow flexible property access
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EvaluationContext = any;

/**
 * Build dynamic evaluation context from applicant data and health data
 * Includes all fields from data dynamically, plus helper functions
 */
export function buildEvaluationContext(
  data: ApplicantData,
  health: ParsedHealthData
): EvaluationContext {
  // Start with all fields from data (includes dynamic fields)
  const context: EvaluationContext = {
    ...data,
    // Override with explicit health fields
    severity: health.severity,
    status: health.status,
    impact: health.impact,
    // Math helpers
    max: Math.max,
    min: Math.min,
    isNaN: isNaN,
    // Array/object helpers for expr-eval
    includes: (arr: any[] | null | undefined, value: any): boolean => {
      if (!arr || !Array.isArray(arr)) return false;
      return arr.includes(value);
    },
    some: (arr: any[] | null | undefined, fn: string): boolean => {
      if (!arr || !Array.isArray(arr)) return false;
      // Simple some check - for complex cases, rules should flatten data first
      return arr.length > 0;
    },
    length: (arr: any[] | null | undefined): number => {
      if (!arr || !Array.isArray(arr)) return 0;
      return arr.length;
    },
    has: (obj: Record<string, any> | null | undefined, key: string): boolean => {
      if (!obj || typeof obj !== "object") return false;
      return key in obj;
    },
    // Helper to check if array contains string matching pattern
    contains: (arr: any[] | string | null | undefined, pattern: string): boolean => {
      if (!arr) return false;
      if (typeof arr === "string") return arr.toLowerCase().includes(pattern.toLowerCase());
      if (Array.isArray(arr)) {
        return arr.some((item) =>
          String(item).toLowerCase().includes(pattern.toLowerCase())
        );
      }
      return false;
    },
  };

  // Ensure bmi has a default value for evaluation (0 if null)
  if (context.bmi === null || context.bmi === undefined) {
    context.bmi = 0;
  }

  return context;
}

async function shouldDecline(
  data: ApplicantData,
  health: ParsedHealthData
): Promise<{ should: boolean; rule?: DeclineRuleConfig; reason?: string }> {
  const config = await loadConfig();
  const parser = new Parser();

  // Build dynamic evaluation context
  const context = buildEvaluationContext(data, health);

  // Check each decline rule
  for (const rule of config.declineRules || []) {
    try {
      const expr = parser.parse(rule.expression);
      const triggered = expr.evaluate(context);

      if (triggered) {
        return { should: true, rule, reason: rule.reason };
      }
    } catch (error) {
      console.error(`Error evaluating decline rule ${rule.name}:`, error);
    }
  }

  return { should: false };
}

async function shouldGatherInfo(
  data: ApplicantData,
  health: ParsedHealthData
): Promise<{ should: boolean; questions: string[]; triggeredRules: string[] }> {
  const config = await loadConfig();
  const parser = new Parser();

  // Build dynamic evaluation context
  const context = buildEvaluationContext(data, health);

  const questions: string[] = [];
  const triggeredRules: string[] = [];

  for (const rule of config.gatherInfoRules || []) {
    try {
      const expr = parser.parse(rule.condition);
      const triggered = expr.evaluate(context);

      if (triggered) {
        triggeredRules.push(rule.name);
        if (rule.questions && rule.questions.length > 0) {
          questions.push(...rule.questions.map((q) => q.questionText));
        }
      }
    } catch (error) {
      console.error(`Error evaluating gather info rule ${rule.name}:`, error);
    }
  }

  return {
    should: questions.length > 0,
    questions,
    triggeredRules,
  };
}

// ============================================================================
// RISK FACTOR EVALUATION
// ============================================================================

async function evaluateRiskFactors(
  data: ApplicantData,
  health: ParsedHealthData
): Promise<{
  totalMultiplier: number;
  riskFactorDetails: RiskFactorDetail[];
}> {
  const config = await loadConfig();
  const parser = new Parser();

  // Build dynamic evaluation context
  const context = buildEvaluationContext(data, health);

  const details: RiskFactorDetail[] = [];
  let totalMultiplier = 1.0;

  for (const factor of config.riskFactors || []) {
    try {
      const expr = parser.parse(factor.expression);
      const multiplier = expr.evaluate(context);
      totalMultiplier *= multiplier;

      details.push({
        name: factor.name,
        label: factor.label,
        multiplier,
        explanation: factor.description ?? undefined,
      });
    } catch (error) {
      console.error(`Error evaluating risk factor ${factor.name}:`, error);
    }
  }

  return { totalMultiplier, riskFactorDetails: details };
}

// ============================================================================
// PREMIUM CALCULATION
// ============================================================================

async function calculatePremium(
  age: number,
  sex: "male" | "female",
  coverageCHF: number,
  totalMultiplier: number
): Promise<{
  basePremiumCHF: number;
  loadedPremiumCHF: number;
  finalPremiumCHF: number;
  marginPercent: number;
}> {
  const config = await loadConfig();
  const parser = new Parser();

  // Get mortality formula
  const formula = config.mortalityFormulas?.[sex];
  let mortalityRate: number;

  if (formula) {
    try {
      const expr = parser.parse(formula.formula);
      mortalityRate = expr.evaluate({ age });
    } catch (error) {
      console.error(`Error evaluating mortality formula:`, error);
      // Fallback
      mortalityRate =
        sex === "male" ? 0.0008 + age * 0.00002 : 0.0006 + age * 0.000015;
    }
  } else {
    // Fallback if no formula found
    mortalityRate =
      sex === "male" ? 0.0008 + age * 0.00002 : 0.0006 + age * 0.000015;
  }

  // Calculate premiums
  const basePremiumCHF = coverageCHF * mortalityRate;
  const loadedPremiumCHF = basePremiumCHF * totalMultiplier;
  const marginPercent = 10;
  const finalPremiumCHF = loadedPremiumCHF * (1 + marginPercent / 100);

  return {
    basePremiumCHF,
    loadedPremiumCHF,
    finalPremiumCHF,
    marginPercent,
  };
}

// ============================================================================
// MAIN EVALUATION FUNCTION
// ============================================================================

export async function evaluateApplicant(
  data: ApplicantData,
  options?: { 
    skipHealthNormalization?: boolean;
    healthData?: ParsedHealthData;
  }
): Promise<EvaluationResult> {
  // Step 1: Normalize health text (use provided or normalize)
  const health = options?.healthData || 
    (options?.skipHealthNormalization
      ? { severity: "minor" as const, status: "resolved" as const, impact: "none" as const }
      : await normalizeHealthText(data.pastInjuries || ""));

  // Step 2: Check decline gate
  const declineCheck = await shouldDecline(data, health);
  if (declineCheck.should && declineCheck.rule) {
    return {
      decision: "REJECT",
      triggeredDeclineRule: declineCheck.rule.name,
      totalMultiplier: 1.0,
      marginPercent: 10,
      healthSeverity: health.severity,
      healthStatus: health.status,
      healthImpact: health.impact,
      healthTextRaw: data.pastInjuries,
    };
  }

  // Step 3: Check gather info gate
  const gatherCheck = await shouldGatherInfo(data, health);
  if (gatherCheck.should) {
    return {
      decision: "PENDING_INFORMATION",
      triggeredGatherInfoRules: gatherCheck.triggeredRules,
      totalMultiplier: 1.0,
      marginPercent: 10,
      healthSeverity: health.severity,
      healthStatus: health.status,
      healthImpact: health.impact,
      healthTextRaw: data.pastInjuries,
    };
  }

  // Step 4: Evaluate risk factors
  const { totalMultiplier, riskFactorDetails } = await evaluateRiskFactors(
    data,
    health
  );

  // Step 5: Calculate premium
  const { basePremiumCHF, loadedPremiumCHF, finalPremiumCHF, marginPercent } =
    await calculatePremium(
      data.age,
      data.sex,
      data.coverageCHF,
      totalMultiplier
    );

  // Step 6: Classify decision
  const decision = totalMultiplier === 1.0 ? "ACCEPT" : "ACCEPT_WITH_PREMIUM";

  // Return complete result
  return {
    decision,
    annualPremiumCHF: finalPremiumCHF,
    basePremiumCHF,
    riskAdjustedPremiumCHF: loadedPremiumCHF,
    marginPercent,
    totalMultiplier,
    healthSeverity: health.severity,
    healthStatus: health.status,
    healthImpact: health.impact,
    healthTextRaw: data.pastInjuries,
    riskFactorDetails,
  };
}
