/*
  Warnings:

  - Added the required column `codArea` to the `Tutor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Tutor" ADD COLUMN     "codArea" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Tutor" ADD CONSTRAINT "Tutor_codArea_fkey" FOREIGN KEY ("codArea") REFERENCES "Area"("codArea") ON DELETE RESTRICT ON UPDATE CASCADE;
