/*
  Warnings:

  - You are about to drop the column `campo` on the `CompetenciaArea` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "idx_competenciaarea_campo";

-- AlterTable
ALTER TABLE "Competencia" ALTER COLUMN "nombreCompet" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "CompetenciaArea" DROP COLUMN "campo";

-- AlterTable
ALTER TABLE "EtapaCompetencia" ALTER COLUMN "nombreEtapa" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "descripcion" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "Rol" ALTER COLUMN "nombreRol" SET DATA TYPE VARCHAR(20);

-- AlterTable
ALTER TABLE "UserN" ALTER COLUMN "passwUser" SET DATA TYPE VARCHAR(60);
