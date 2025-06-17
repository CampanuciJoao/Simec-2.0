/*
  Warnings:

  - You are about to drop the column `status` on the `alertas` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "alertas" DROP COLUMN "status";

-- DropEnum
DROP TYPE "StatusAlerta";

-- CreateTable
CREATE TABLE "alertas_lidos_por_usuario" (
    "alertaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "visto" BOOLEAN NOT NULL DEFAULT true,
    "dataVisto" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alertas_lidos_por_usuario_pkey" PRIMARY KEY ("alertaId","usuarioId")
);

-- AddForeignKey
ALTER TABLE "alertas_lidos_por_usuario" ADD CONSTRAINT "alertas_lidos_por_usuario_alertaId_fkey" FOREIGN KEY ("alertaId") REFERENCES "alertas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas_lidos_por_usuario" ADD CONSTRAINT "alertas_lidos_por_usuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
