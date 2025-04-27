/*
  Warnings:

  - A unique constraint covering the columns `[nombreCompet]` on the table `Competencia` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Competencia_nombreCompet_key" ON "Competencia"("nombreCompet");
