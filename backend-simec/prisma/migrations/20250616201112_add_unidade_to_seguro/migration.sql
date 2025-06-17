-- DropForeignKey
ALTER TABLE "seguros" DROP CONSTRAINT "seguros_equipamento_id_fkey";

-- AlterTable
ALTER TABLE "seguros" ADD COLUMN     "unidade_id" TEXT;

-- AddForeignKey
ALTER TABLE "seguros" ADD CONSTRAINT "seguros_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguros" ADD CONSTRAINT "seguros_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "unidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;
