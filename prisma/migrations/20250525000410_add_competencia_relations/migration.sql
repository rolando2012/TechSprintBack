/*
  Warnings:

  - You are about to drop the `CamposObligatorios` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CompCampObl` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CompCampObl" DROP CONSTRAINT "CompCampObl_codCamp_fkey";

-- DropForeignKey
ALTER TABLE "CompCampObl" DROP CONSTRAINT "CompCampObl_codCompet_fkey";

-- DropTable
DROP TABLE "CamposObligatorios";

-- DropTable
DROP TABLE "CompCampObl";

-- CreateTable
CREATE TABLE "CompetenciaGrado" (
    "codCompet" INTEGER NOT NULL,
    "codGrado" INTEGER NOT NULL,

    CONSTRAINT "CompetenciaGrado_pkey" PRIMARY KEY ("codCompet","codGrado")
);

-- CreateTable
CREATE TABLE "CompetenciaNivelEspecial" (
    "codCompet" INTEGER NOT NULL,
    "codNivel" INTEGER NOT NULL,

    CONSTRAINT "CompetenciaNivelEspecial_pkey" PRIMARY KEY ("codCompet","codNivel")
);

-- AddForeignKey
ALTER TABLE "CompetenciaGrado" ADD CONSTRAINT "CompetenciaGrado_codCompet_fkey" FOREIGN KEY ("codCompet") REFERENCES "Competencia"("codCompet") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetenciaGrado" ADD CONSTRAINT "CompetenciaGrado_codGrado_fkey" FOREIGN KEY ("codGrado") REFERENCES "Grado"("codGrado") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetenciaNivelEspecial" ADD CONSTRAINT "CompetenciaNivelEspecial_codCompet_fkey" FOREIGN KEY ("codCompet") REFERENCES "Competencia"("codCompet") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetenciaNivelEspecial" ADD CONSTRAINT "CompetenciaNivelEspecial_codNivel_fkey" FOREIGN KEY ("codNivel") REFERENCES "NivelEspecial"("codNivel") ON DELETE RESTRICT ON UPDATE CASCADE;
