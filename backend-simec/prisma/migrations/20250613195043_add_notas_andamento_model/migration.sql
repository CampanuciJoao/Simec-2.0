-- AlterTable
ALTER TABLE "manutencoes" ADD COLUMN     "data_fim_real" TIMESTAMP(3),
ADD COLUMN     "data_inicio_real" TIMESTAMP(3),
ALTER COLUMN "tipo_manutencao" SET DEFAULT 'Preventiva';

-- CreateTable
CREATE TABLE "notas_andamento" (
    "id" TEXT NOT NULL,
    "nota" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "origem" TEXT NOT NULL DEFAULT 'manual',
    "manutencao_id" TEXT NOT NULL,

    CONSTRAINT "notas_andamento_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "notas_andamento" ADD CONSTRAINT "notas_andamento_manutencao_id_fkey" FOREIGN KEY ("manutencao_id") REFERENCES "manutencoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
