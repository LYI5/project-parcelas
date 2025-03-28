/*
  Warnings:

  - A unique constraint covering the columns `[idParcela]` on the table `Parcelas` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Parcelas_idParcela_key` ON `Parcelas`(`idParcela`);
