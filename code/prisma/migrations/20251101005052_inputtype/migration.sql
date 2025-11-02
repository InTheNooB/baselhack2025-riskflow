/*
  Warnings:

  - Changed the type of `inputType` on the `SurveyQuestion` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "InputType" AS ENUM ('TEXT', 'NUMBER', 'YESNO', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE');

-- AlterTable
ALTER TABLE "SurveyQuestion" DROP COLUMN "inputType",
ADD COLUMN     "inputType" "InputType" NOT NULL;
