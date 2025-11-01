-- CreateTable
CREATE TABLE "RiskFactor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "expression" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeclineRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "expression" TEXT NOT NULL,
    "description" TEXT,
    "reason" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeclineRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GatherInfoRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GatherInfoRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GatherInfoQuestion" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "inputType" TEXT NOT NULL DEFAULT 'text',
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GatherInfoQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MortalityRate" (
    "id" TEXT NOT NULL,
    "sex" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "baseRate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MortalityRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MortalityRateFormula" (
    "id" TEXT NOT NULL,
    "sex" TEXT NOT NULL,
    "formula" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MortalityRateFormula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigVersion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConfigVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyQuestion" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "inputType" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "helpText" TEXT,
    "conditionalLogic" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SurveyQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseAnswer" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answerValue" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemAssessment" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "annualPremiumCHF" DOUBLE PRECISION,
    "basePremiumCHF" DOUBLE PRECISION,
    "riskAdjustedPremiumCHF" DOUBLE PRECISION,
    "marginPercent" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "totalMultiplier" DOUBLE PRECISION NOT NULL,
    "healthSeverity" TEXT,
    "healthStatus" TEXT,
    "healthImpact" TEXT,
    "healthTextRaw" TEXT,
    "evaluationVersion" TEXT,
    "triggeredDeclineRule" TEXT,
    "triggeredGatherInfoRules" TEXT[],
    "auditTrail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentRiskFactor" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "factorName" TEXT NOT NULL,
    "factorLabel" TEXT NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentRiskFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnderwriterReview" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "underwriterId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "confirmedDecision" TEXT,
    "adjustedDecision" TEXT,
    "adjustedPremiumCHF" DOUBLE PRECISION,
    "adjustmentReason" TEXT,
    "adjustmentNotes" TEXT,
    "escalationReason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnderwriterReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChiefUnderwriterReview" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "chiefUnderwriterId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "finalPremiumCHF" DOUBLE PRECISION,
    "decisionReason" TEXT,
    "feedbackNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChiefUnderwriterReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleAdjustmentProposal" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "currentRuleName" TEXT NOT NULL,
    "proposedChange" TEXT NOT NULL,
    "currentExpression" TEXT,
    "proposedExpression" TEXT,
    "aiReasoning" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "affectedCasesCount" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "responseNotes" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuleAdjustmentProposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RiskFactor_name_key" ON "RiskFactor"("name");

-- CreateIndex
CREATE INDEX "RiskFactor_isActive_order_idx" ON "RiskFactor"("isActive", "order");

-- CreateIndex
CREATE UNIQUE INDEX "DeclineRule_name_key" ON "DeclineRule"("name");

-- CreateIndex
CREATE INDEX "DeclineRule_isActive_priority_idx" ON "DeclineRule"("isActive", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "GatherInfoRule_name_key" ON "GatherInfoRule"("name");

-- CreateIndex
CREATE INDEX "GatherInfoRule_isActive_priority_idx" ON "GatherInfoRule"("isActive", "priority");

-- CreateIndex
CREATE INDEX "GatherInfoQuestion_ruleId_order_idx" ON "GatherInfoQuestion"("ruleId", "order");

-- CreateIndex
CREATE INDEX "MortalityRate_sex_age_idx" ON "MortalityRate"("sex", "age");

-- CreateIndex
CREATE UNIQUE INDEX "MortalityRate_sex_age_key" ON "MortalityRate"("sex", "age");

-- CreateIndex
CREATE UNIQUE INDEX "MortalityRateFormula_sex_key" ON "MortalityRateFormula"("sex");

-- CreateIndex
CREATE INDEX "MortalityRateFormula_sex_isActive_idx" ON "MortalityRateFormula"("sex", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_key_key" ON "system_config"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ConfigVersion_version_key" ON "ConfigVersion"("version");

-- CreateIndex
CREATE INDEX "ConfigVersion_createdAt_idx" ON "ConfigVersion"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Product_name_key" ON "Product"("name");

-- CreateIndex
CREATE INDEX "Product_isActive_idx" ON "Product"("isActive");

-- CreateIndex
CREATE INDEX "SurveyQuestion_productId_order_idx" ON "SurveyQuestion"("productId", "order");

-- CreateIndex
CREATE INDEX "QuestionOption_questionId_order_idx" ON "QuestionOption"("questionId", "order");

-- CreateIndex
CREATE INDEX "Case_productId_status_idx" ON "Case"("productId", "status");

-- CreateIndex
CREATE INDEX "Case_createdAt_idx" ON "Case"("createdAt");

-- CreateIndex
CREATE INDEX "CaseAnswer_caseId_idx" ON "CaseAnswer"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "CaseAnswer_caseId_questionId_key" ON "CaseAnswer"("caseId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemAssessment_caseId_key" ON "SystemAssessment"("caseId");

-- CreateIndex
CREATE INDEX "SystemAssessment_caseId_idx" ON "SystemAssessment"("caseId");

-- CreateIndex
CREATE INDEX "SystemAssessment_decision_idx" ON "SystemAssessment"("decision");

-- CreateIndex
CREATE INDEX "AssessmentRiskFactor_assessmentId_idx" ON "AssessmentRiskFactor"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_isActive_idx" ON "User"("role", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "UnderwriterReview_caseId_key" ON "UnderwriterReview"("caseId");

-- CreateIndex
CREATE INDEX "UnderwriterReview_caseId_idx" ON "UnderwriterReview"("caseId");

-- CreateIndex
CREATE INDEX "UnderwriterReview_underwriterId_status_idx" ON "UnderwriterReview"("underwriterId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ChiefUnderwriterReview_reviewId_key" ON "ChiefUnderwriterReview"("reviewId");

-- CreateIndex
CREATE INDEX "ChiefUnderwriterReview_reviewId_idx" ON "ChiefUnderwriterReview"("reviewId");

-- CreateIndex
CREATE INDEX "ChiefUnderwriterReview_chiefUnderwriterId_status_idx" ON "ChiefUnderwriterReview"("chiefUnderwriterId", "status");

-- CreateIndex
CREATE INDEX "RuleAdjustmentProposal_reviewId_status_idx" ON "RuleAdjustmentProposal"("reviewId", "status");

-- CreateIndex
CREATE INDEX "RuleAdjustmentProposal_ruleType_status_idx" ON "RuleAdjustmentProposal"("ruleType", "status");

-- AddForeignKey
ALTER TABLE "GatherInfoQuestion" ADD CONSTRAINT "GatherInfoQuestion_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "GatherInfoRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyQuestion" ADD CONSTRAINT "SurveyQuestion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseAnswer" ADD CONSTRAINT "CaseAnswer_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemAssessment" ADD CONSTRAINT "SystemAssessment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentRiskFactor" ADD CONSTRAINT "AssessmentRiskFactor_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "SystemAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnderwriterReview" ADD CONSTRAINT "UnderwriterReview_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnderwriterReview" ADD CONSTRAINT "UnderwriterReview_underwriterId_fkey" FOREIGN KEY ("underwriterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChiefUnderwriterReview" ADD CONSTRAINT "ChiefUnderwriterReview_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "UnderwriterReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChiefUnderwriterReview" ADD CONSTRAINT "ChiefUnderwriterReview_chiefUnderwriterId_fkey" FOREIGN KEY ("chiefUnderwriterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleAdjustmentProposal" ADD CONSTRAINT "RuleAdjustmentProposal_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "UnderwriterReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
