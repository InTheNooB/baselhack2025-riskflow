import { PrismaClient } from "../src/generated/prisma/client";
import { evaluateApplicant } from "../src/lib/evaluation-system";

const prisma = new PrismaClient();

// Mock data generators
const FIRST_NAMES = [
  "Alex",
  "Emma",
  "James",
  "Sophia",
  "William",
  "Olivia",
  "Michael",
  "Isabella",
  "Daniel",
  "Charlotte",
  "Matthew",
  "Amelia",
  "David",
  "Mia",
  "Joseph",
  "Harper",
  "Benjamin",
  "Evelyn",
  "John",
  "Abigail",
  "Andrew",
  "Emily",
  "Kevin",
  "Elizabeth",
  "Brian",
  "Sofia",
  "George",
  "Avery",
  "Edward",
  "Ella",
  "Ronald",
  "Scarlett",
  "Timothy",
  "Madison",
  "Jason",
  "Victoria",
  "Jeffrey",
  "Luna",
  "Ryan",
  "Grace",
  "Jacob",
  "Chloe",
  "Gary",
  "Penelope",
  "Nicholas",
  "Layla",
  "Eric",
  "Riley",
  "Jonathan",
  "Zoey",
  "Stephen",
  "Nora",
  "Larry",
  "Lily",
  "Justin",
  "Eleanor",
];

const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Thompson",
  "White",
  "Harris",
  "Sanchez",
  "Clark",
  "Ramirez",
  "Lewis",
  "Robinson",
  "Walker",
  "Young",
  "Allen",
  "King",
  "Wright",
  "Scott",
  "Torres",
  "Nguyen",
  "Hill",
  "Flores",
  "Green",
  "Adams",
  "Nelson",
  "Baker",
  "Hall",
  "Rivera",
  "Campbell",
  "Mitchell",
  "Carter",
  "Roberts",
  "Gomez",
  "Phillips",
  "Evans",
  "Turner",
  "Diaz",
  "Parker",
  "Cruz",
  "Edwards",
  "Collins",
  "Reyes",
  "Stewart",
  "Morris",
  "Morales",
  "Murphy",
  "Cook",
];

// Health condition patterns - diverse and realistic
// Each pattern maps to its classification to avoid LLM calls in seed
const HEALTH_PATTERNS: Array<{
  text: string;
  severity: "minor" | "moderate" | "severe";
  status: "resolved" | "ongoing" | "unclear";
  impact: "none" | "partial" | "major";
}> = [
  { text: "", severity: "minor", status: "resolved", impact: "none" }, // No conditions
  {
    text: "Broken arm 5 years ago, fully recovered",
    severity: "minor",
    status: "resolved",
    impact: "none",
  },
  {
    text: "Minor back strain from sports, occasional stiffness",
    severity: "minor",
    status: "ongoing",
    impact: "partial",
  },
  {
    text: "Asthma, well controlled with inhaler",
    severity: "minor",
    status: "ongoing",
    impact: "none",
  },
  {
    text: "High blood pressure, managed with medication",
    severity: "minor",
    status: "ongoing",
    impact: "none",
  },
  {
    text: "Broken leg 3 years ago, no lasting issues",
    severity: "minor",
    status: "resolved",
    impact: "none",
  },
  {
    text: "Allergies: seasonal, well managed",
    severity: "minor",
    status: "ongoing",
    impact: "none",
  },
  {
    text: "Old knee injury from running, occasional discomfort",
    severity: "moderate",
    status: "ongoing",
    impact: "partial",
  },
  {
    text: "Migraine headaches, rare occurrences",
    severity: "moderate",
    status: "ongoing",
    impact: "partial",
  },
  {
    text: "Type 2 diabetes, diet controlled, stable",
    severity: "moderate",
    status: "ongoing",
    impact: "none",
  },
  {
    text: "Chronic back pain, ongoing physical therapy",
    severity: "moderate",
    status: "ongoing",
    impact: "major",
  },
  {
    text: "Severe asthma requiring daily medication",
    severity: "moderate",
    status: "ongoing",
    impact: "major",
  },
  {
    text: "Heart condition, post-surgery recovery ongoing",
    severity: "severe",
    status: "ongoing",
    impact: "major",
  },
  {
    text: "Cancer in remission for 2 years",
    severity: "severe",
    status: "resolved",
    impact: "none",
  },
  {
    text: "Diabetes type 1, insulin dependent",
    severity: "moderate",
    status: "ongoing",
    impact: "partial",
  },
  {
    text: "Severe depression, ongoing treatment with therapy and medication",
    severity: "severe",
    status: "ongoing",
    impact: "major",
  },
];

interface QuestionMap {
  nameQuestion: { id: string };
  ageQuestion: { id: string };
  smokingQuestion: { id: string };
  sexQuestion: { id: string };
  coverageQuestion: { id: string };
  bmiQuestion: { id: string };
  heightQuestion: { id: string };
  weightQuestion: { id: string };
  healthQuestion: { id: string };
}

/**
 * Generate diverse mock historical cases for simulation testing
 */
async function generateMockCases(
  product: { id: string },
  questions: QuestionMap
) {
  const NUM_CASES = 1000;
  const BATCH_SIZE = 50; // Process in batches to avoid memory issues

  console.log(
    `Generating ${NUM_CASES} mock cases in batches of ${BATCH_SIZE}...`
  );

  for (let batchStart = 0; batchStart < NUM_CASES; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, NUM_CASES);
    const batchCases = [];

    // Generate a batch of cases
    for (let i = batchStart; i < batchEnd; i++) {
      // Generate realistic, diverse data
      const firstName =
        FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const lastName =
        LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      const fullName = `${firstName} ${lastName}`;

      // Age: Realistic distribution (more young adults, fewer elderly)
      const age = Math.floor(Math.random() * 60) + 18; // 18-77

      // Sex: 50/50 split
      const sex = Math.random() < 0.5 ? "male" : "female";

      // Smoking: 20% smokers (realistic rate)
      const isSmoking = Math.random() < 0.2;

      // Coverage: Clustered around common amounts
      const coverageMultiplier = [50000, 100000, 200000, 300000, 500000];
      const coverageCHF =
        coverageMultiplier[
          Math.floor(Math.random() * coverageMultiplier.length)
        ];

      // BMI: Realistic distribution with some outliers
      let bmi;
      if (Math.random() < 0.7) {
        // 70% in normal range (18-27)
        bmi = Math.floor(Math.random() * 9) + 18;
      } else if (Math.random() < 0.8) {
        // 24% overweight (27-35)
        bmi = Math.floor(Math.random() * 8) + 27;
      } else {
        // 6% obese or underweight (35-42 or 15-18)
        bmi =
          Math.random() < 0.5
            ? Math.floor(Math.random() * 7) + 35
            : Math.floor(Math.random() * 3) + 15;
      }

      // Calculate height/weight from BMI (approximate)
      const height = 160 + Math.floor(Math.random() * 30); // 160-189 cm
      const weight = Math.round(bmi * (height / 100) ** 2 * 10) / 10; // Weight matching BMI

      // Health conditions: Diverse patterns
      const healthPattern =
        HEALTH_PATTERNS[Math.floor(Math.random() * HEALTH_PATTERNS.length)];

      // Create case data for batch
      batchCases.push({
        applicantData: {
          age,
          sex: sex as "male" | "female",
          coverageCHF,
          bmi,
          isSmoking,
          pastInjuries: healthPattern.text,
        },
        healthData: healthPattern, // Store pre-classified health data to skip LLM calls
        answers: [
          { questionId: questions.nameQuestion.id, value: fullName },
          { questionId: questions.ageQuestion.id, value: age.toString() },
          {
            questionId: questions.smokingQuestion.id,
            value: isSmoking ? "yes" : "no",
          },
          { questionId: questions.sexQuestion.id, value: sex },
          {
            questionId: questions.coverageQuestion.id,
            value: coverageCHF.toString(),
          },
          { questionId: questions.bmiQuestion.id, value: bmi.toString() },
          { questionId: questions.heightQuestion.id, value: height.toString() },
          { questionId: questions.weightQuestion.id, value: weight.toString() },
          {
            questionId: questions.healthQuestion.id,
            value: healthPattern.text,
          },
        ],
      });
    }

    // Process batch: create cases, evaluate, and save assessments (PARALLELIZED)
    await Promise.all(
      batchCases.map(async (caseData, i) => {
        try {
          // Create case
          const newCase = await prisma.case.create({
            data: {
              productId: product.id,
              status: "submitted",
              customerName:
                caseData.answers.find(
                  (a: { questionId: string; value: string }) =>
                    a.questionId === questions.nameQuestion.id
                )?.value || "Unknown",
            },
          });

          // Save answers
          await prisma.caseAnswer.createMany({
            data: caseData.answers.map(
              (answer: { questionId: string; value: string }) => ({
                caseId: newCase.id,
                questionId: answer.questionId,
                answerValue: answer.value,
              })
            ),
          });

          // Evaluate applicant (WITHOUT LLM CALLS - using pre-classified health data)
          const evaluationResult = await evaluateApplicant(
            caseData.applicantData,
            { healthData: caseData.healthData }
          );

          // Save assessment with applicantData for simulations
          await prisma.systemAssessment.create({
            data: {
              caseId: newCase.id,
              decision: evaluationResult.decision,
              annualPremiumCHF: evaluationResult.annualPremiumCHF || null,
              basePremiumCHF: evaluationResult.basePremiumCHF || null,
              riskAdjustedPremiumCHF:
                evaluationResult.riskAdjustedPremiumCHF || null,
              marginPercent: evaluationResult.marginPercent,
              totalMultiplier: evaluationResult.totalMultiplier,
              healthSeverity: evaluationResult.healthSeverity || null,
              healthStatus: evaluationResult.healthStatus || null,
              healthImpact: evaluationResult.healthImpact || null,
              healthTextRaw: evaluationResult.healthTextRaw || null,
              triggeredDeclineRule:
                evaluationResult.triggeredDeclineRule || null,
              triggeredGatherInfoRules:
                evaluationResult.triggeredGatherInfoRules || [],
              auditTrail: JSON.stringify(evaluationResult),
              applicantData: JSON.stringify(caseData.applicantData), // Store for simulations
            },
          });

          // Save risk factor details if present
          if (
            evaluationResult.riskFactorDetails &&
            evaluationResult.riskFactorDetails.length > 0
          ) {
            const assessment = await prisma.systemAssessment.findUnique({
              where: { caseId: newCase.id },
            });

            if (assessment) {
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
          }
        } catch (error) {
          console.error(`Error creating mock case ${i}:`, error);
        }
      })
    );

    // Progress update
    console.log(`  Created batch: ${batchEnd}/${NUM_CASES} cases`);
  }

  console.log(`✅ Successfully generated ${NUM_CASES} historical mock cases`);
}

async function main() {
  console.log("🌱 Starting database seed...");

  // Clean database
  console.log("🧹 Cleaning database...");
  await prisma.ruleAdjustmentProposal.deleteMany();
  await prisma.chiefUnderwriterReview.deleteMany();
  await prisma.underwriterReview.deleteMany();
  await prisma.assessmentRiskFactor.deleteMany();
  await prisma.systemAssessment.deleteMany();
  await prisma.caseAnswer.deleteMany();
  await prisma.case.deleteMany();
  await prisma.surveyQuestion.deleteMany();
  await prisma.product.deleteMany();
  await prisma.gatherInfoQuestion.deleteMany();
  await prisma.gatherInfoRule.deleteMany();
  await prisma.declineRule.deleteMany();
  await prisma.riskFactor.deleteMany();
  await prisma.mortalityRateFormula.deleteMany();
  await prisma.configVersion.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Database cleaned");

  // Create Risk Factors (from documentation)
  await prisma.riskFactor.createMany({
    data: [
      {
        name: "bmi",
        label: "BMI loading: +2% per BMI point above 25",
        expression: "1 + max(0, (bmi - 25) * 0.02)",
        description: "Body Mass Index risk factor",
        isActive: true,
        order: 1,
      },
      {
        name: "smoking",
        label: "Smoking loading: 50% increase",
        expression: "isSmoking ? 1.5 : 1.0",
        description: "Smoking status risk factor",
        isActive: true,
        order: 2,
      },
      {
        name: "age",
        label: "Age loading: +1% per year above 30",
        expression: "1 + max(0, (age - 30) * 0.01)",
        description: "Age-based risk factor",
        isActive: true,
        order: 3,
      },
      {
        name: "health_severity",
        label: "Health Severity",
        expression:
          "severity == 'severe' ? 1.3 : (severity == 'moderate' ? 1.1 : 1.0)",
        description: "Health condition severity",
        isActive: true,
        order: 4,
      },
      {
        name: "health_status",
        label: "Health Status",
        expression: "status == 'ongoing' ? 1.2 : 1.0",
        description: "Ongoing health conditions",
        isActive: true,
        order: 5,
      },
      {
        name: "health_impact",
        label: "Health Impact",
        expression:
          "impact == 'major' ? 1.25 : (impact == 'partial' ? 1.1 : 1.0)",
        description: "Health condition impact on daily life",
        isActive: true,
        order: 6,
      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Risk factors created");

  // Create Decline Rules
  await prisma.declineRule.createMany({
    data: [
      {
        name: "severe_ongoing",
        label: "Severe Ongoing Condition",
        expression: "severity == 'severe' and status == 'ongoing'",
        description: "Decline applications with severe ongoing conditions",
        reason: "Severe ongoing conditions are not eligible for coverage.",
        isActive: true,
        priority: 1,
      },
      {
        name: "severe_major_impact",
        label: "Severe Major Impact",
        expression: "severity == 'severe' and impact == 'major'",
        description: "Decline severe conditions with major impact",
        reason:
          "Severe health conditions with major impact on daily life are not eligible.",
        isActive: true,
        priority: 2,
      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Decline rules created");

  // Create Gather Info Rules
  await prisma.gatherInfoRule.upsert({
    where: { name: "missing_bmi" },
    update: {
      condition: "bmi == 0",
    },
    create: {
      name: "missing_bmi",
      label: "Missing BMI",
      condition: "bmi == 0",
      description: "Request BMI information when missing",
      isActive: false,
      priority: 1,
      questions: {
        create: [
          {
            questionText:
              "Please provide your current weight (kg) and height (cm).",
            inputType: "text",
            isRequired: true,
            order: 1,
          },
        ],
      },
    },
  });
  console.log("✅ Gather info rules created");

  // Create Mortality Formulas
  await prisma.mortalityRateFormula.createMany({
    data: [
      {
        sex: "male",
        formula: "0.0008 + age * 0.00002",
        description: "Base mortality rate for males",
        isActive: true,
      },
      {
        sex: "female",
        formula: "0.0006 + age * 0.000015",
        description: "Base mortality rate for females",
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Mortality formulas created");

  // Create Product
  const product = await prisma.product.upsert({
    where: { name: "Term Life Insurance" },
    update: {},
    create: {
      name: "Term Life Insurance",
      description: "Standard term life insurance product",
      isActive: true,
    },
  });
  console.log("✅ Product created");

  // Create Survey Questions for the Product
  const nameQuestion = await prisma.surveyQuestion.create({
    data: {
      productId: product.id,
      questionText: "What is your full name?",
      inputType: "TEXT",
      isRequired: true,
      order: 1,
      helpText: "Enter your legal first and last name",
    },
  });

  const ageQuestion = await prisma.surveyQuestion.create({
    data: {
      productId: product.id,
      questionText: "What is your age?",
      inputType: "NUMBER",
      isRequired: true,
      order: 2,
      helpText: "You must be at least 18 years old",
      evaluationFieldName: "age",
      dataType: "number",
    },
  });

  const smokingQuestion = await prisma.surveyQuestion.create({
    data: {
      productId: product.id,
      questionText: "Do you currently smoke?",
      inputType: "YESNO",
      isRequired: true,
      order: 3,
      helpText: "This includes cigarettes, e-cigarettes, and vaping",
      evaluationFieldName: "isSmoking",
      dataType: "boolean",
    },
  });

  const sexQuestion = await prisma.surveyQuestion.create({
    data: {
      productId: product.id,
      questionText: "What is your biological sex?",
      inputType: "SINGLE_CHOICE",
      isRequired: true,
      order: 4,
      helpText: "Required for premium calculation",
      evaluationFieldName: "sex",
      dataType: "string",
      normalizationRule: JSON.stringify({
        type: "lowercase_match",
        mapping: { male: "male", female: "female" },
        fallback: "male",
      }),
      options: {
        create: [
          {
            value: "male",
            label: "Male",
            order: 1,
          },
          {
            value: "female",
            label: "Female",
            order: 2,
          },
        ],
      },
    },
  });

  const coverageQuestion = await prisma.surveyQuestion.create({
    data: {
      productId: product.id,
      questionText: "What coverage amount do you need? (CHF)",
      inputType: "NUMBER",
      isRequired: true,
      order: 5,
      helpText: "Minimum 10,000 CHF",
      evaluationFieldName: "coverageCHF",
      dataType: "number",
    },
  });

  const bmiQuestion = await prisma.surveyQuestion.create({
    data: {
      productId: product.id,
      questionText: "What is your current BMI?",
      inputType: "NUMBER",
      isRequired: false,
      order: 6,
      helpText:
        "Leave blank if you don't know - we'll calculate from height and weight",
      evaluationFieldName: "bmi",
      dataType: "number",
    },
  });

  const heightQuestion = await prisma.surveyQuestion.create({
    data: {
      productId: product.id,
      questionText: "What is your height in centimeters?",
      inputType: "NUMBER",
      isRequired: false,
      order: 7,
      helpText: "Optional - helps calculate BMI",
    },
  });

  const weightQuestion = await prisma.surveyQuestion.create({
    data: {
      productId: product.id,
      questionText: "What is your weight in kilograms?",
      inputType: "NUMBER",
      isRequired: false,
      order: 8,
      helpText: "Optional - helps calculate BMI",
    },
  });

  const healthQuestion = await prisma.surveyQuestion.create({
    data: {
      productId: product.id,
      questionText:
        "Please describe any past injuries or current health conditions:",
      inputType: "TEXT",
      isRequired: false,
      order: 9,
      helpText:
        "Be as specific as possible about dates, treatments, and current status",
      evaluationFieldName: "pastInjuries",
      dataType: "string",
    },
  });

  console.log("✅ Survey questions created");

  // Create a sample underwriter user
  await prisma.user.upsert({
    where: { email: "underwriter@riskflow.com" },
    update: {},
    create: {
      email: "underwriter@riskflow.com",
      name: "Demo Underwriter",
      role: "underwriter",
      isActive: true,
    },
  });
  console.log("✅ Sample user created");

  // Create a sample chief underwriter user
  await prisma.user.upsert({
    where: { email: "chief@riskflow.com" },
    update: {},
    create: {
      email: "chief@riskflow.com",
      name: "Chief Underwriter",
      role: "chief_underwriter",
      isActive: true,
    },
  });
  console.log("✅ Chief underwriter created");

  // Create config version
  await prisma.configVersion.upsert({
    where: { version: "2025-01-31" },
    update: {},
    create: {
      version: "2025-01-31",
      description: "Initial seed data for RiskFlow POC",
    },
  });
  console.log("✅ Config version created");

  // Generate historical mock cases for simulation
  console.log("\n📊 Generating historical mock cases...");
  await generateMockCases(product, {
    nameQuestion,
    ageQuestion,
    smokingQuestion,
    sexQuestion,
    coverageQuestion,
    bmiQuestion,
    heightQuestion,
    weightQuestion,
    healthQuestion,
  });
  console.log("✅ Mock cases created");

  console.log("\n🎉 Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
