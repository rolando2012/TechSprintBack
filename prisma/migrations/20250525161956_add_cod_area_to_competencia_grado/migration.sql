/*
  Warnings:

  - The primary key for the `CompetenciaGrado` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `codArea` to the `CompetenciaGrado` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Persona_carnet_key";

-- AlterTable
ALTER TABLE "CompetenciaGrado" DROP CONSTRAINT "CompetenciaGrado_pkey",
ADD COLUMN     "codArea" INTEGER NOT NULL,
ADD CONSTRAINT "CompetenciaGrado_pkey" PRIMARY KEY ("codCompet", "codArea", "codGrado");

-- AddForeignKey
ALTER TABLE "CompetenciaGrado" ADD CONSTRAINT "CompetenciaGrado_codArea_fkey" FOREIGN KEY ("codArea") REFERENCES "Area"("codArea") ON DELETE RESTRICT ON UPDATE CASCADE;
