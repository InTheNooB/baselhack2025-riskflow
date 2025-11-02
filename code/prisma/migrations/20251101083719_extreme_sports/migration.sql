-- AlterTable
ALTER TABLE "SurveyQuestion" ADD COLUMN     "dataType" TEXT,
ADD COLUMN     "evaluationFieldName" TEXT,
ADD COLUMN     "normalizationRule" TEXT;

-- CreateIndex
CREATE INDEX "SurveyQuestion_evaluationFieldName_idx" ON "SurveyQuestion"("evaluationFieldName");
