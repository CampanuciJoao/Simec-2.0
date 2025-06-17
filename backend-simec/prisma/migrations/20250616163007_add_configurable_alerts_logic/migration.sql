-- AlterTable
ALTER TABLE "alertas" ADD COLUMN     "emailEnviado" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "emails_notificacao" ADD COLUMN     "diasAntecedencia" INTEGER NOT NULL DEFAULT 30;

-- CreateTable
CREATE TABLE "notificacoes_enviadas" (
    "id" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "dataEnvio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailNotificacaoId" TEXT NOT NULL,

    CONSTRAINT "notificacoes_enviadas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notificacoes_enviadas_entidade_entidadeId_emailNotificacaoI_key" ON "notificacoes_enviadas"("entidade", "entidadeId", "emailNotificacaoId");

-- AddForeignKey
ALTER TABLE "notificacoes_enviadas" ADD CONSTRAINT "notificacoes_enviadas_emailNotificacaoId_fkey" FOREIGN KEY ("emailNotificacaoId") REFERENCES "emails_notificacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
