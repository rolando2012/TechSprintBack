/*
  Warnings:

  - Added the required column `gradoRange` to the `NivelEspecial` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "NivelEspecial" ADD COLUMN     "gradoRange" VARCHAR(30) NOT NULL;
