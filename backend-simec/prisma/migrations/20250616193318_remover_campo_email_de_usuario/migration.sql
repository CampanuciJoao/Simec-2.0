/*
  Warnings:

  - Added the required column `updatedAt` to the `emails_notificacao` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "equipamentos" DROP CONSTRAINT "equipamentos_unidadeId_fkey";

-- DropForeignKey
ALTER TABLE "log_auditoria" DROP CONSTRAINT "log_auditoria_autor_id_fkey";

-- DropForeignKey
ALTER TABLE "notas_andamento" DROP CONSTRAINT "notas_andamento_autor_id_fkey";

-- DropForeignKey
ALTER TABLE "seguros" DROP CONSTRAINT "seguros_equipamento_id_fkey";

-- AlterTable
ALTER TABLE "emails_notificacao" ADD COLUMN     "recebeAlertasContrato" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "recebeAlertasManutencao" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recebeAlertasSeguro" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "seguros" ADD COLUMN     "cobertura" TEXT;

-- AddForeignKey
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguros" ADD CONSTRAINT "seguros_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_auditoria" ADD CONSTRAINT "log_auditoria_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_andamento" ADD CONSTRAINT "notas_andamento_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
