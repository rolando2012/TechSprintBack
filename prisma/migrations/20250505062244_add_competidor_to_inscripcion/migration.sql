/*
  Warnings:

  - Added the required column `codComp` to the `Inscripcion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Inscripcion" ADD COLUMN     "codComp" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "Inscripcion_codComp_idx" ON "Inscripcion"("codComp");

-- AddForeignKey
ALTER TABLE "Inscripcion" ADD CONSTRAINT "Inscripcion_codComp_fkey" FOREIGN KEY ("codComp") REFERENCES "Competidor"("codComp") ON DELETE RESTRICT ON UPDATE CASCADE;
