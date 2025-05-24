/*
  Warnings:

  - The values [PRIMARIA,SECUNDARIA] on the enum `Ciclo` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `codSis` on the `UserN` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Ciclo_new" AS ENUM ('Primaria', 'Secundaria');
ALTER TABLE "Grado" ALTER COLUMN "ciclo" TYPE "Ciclo_new" USING ("ciclo"::text::"Ciclo_new");
ALTER TYPE "Ciclo" RENAME TO "Ciclo_old";
ALTER TYPE "Ciclo_new" RENAME TO "Ciclo";
DROP TYPE "Ciclo_old";
COMMIT;

-- AlterTable
ALTER TABLE "EtapaCompetencia" ALTER COLUMN "nombreEtapa" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "UserN" DROP COLUMN "codSis";
