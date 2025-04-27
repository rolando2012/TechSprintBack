-- AlterTable
ALTER TABLE "Competencia" ALTER COLUMN "nombreCompet" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "EtapaCompetencia" ALTER COLUMN "nombreEtapa" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "descripcion" SET DATA TYPE VARCHAR(255);
