-- AlterTable
ALTER TABLE "notas_andamento" ADD COLUMN     "autor_id" TEXT;

-- AddForeignKey
ALTER TABLE "notas_andamento" ADD CONSTRAINT "notas_andamento_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
