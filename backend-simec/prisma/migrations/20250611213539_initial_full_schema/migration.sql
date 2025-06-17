-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'user');

-- CreateEnum
CREATE TYPE "StatusEquipamento" AS ENUM ('Ativo', 'EmManutencao', 'Inativo', 'Descontinuado', 'PendenteInstalacao');

-- CreateEnum
CREATE TYPE "StatusContrato" AS ENUM ('Ativo', 'Expirado', 'Cancelado');

-- CreateEnum
CREATE TYPE "TipoManutencao" AS ENUM ('Preventiva', 'Corretiva', 'Calibracao', 'Inspecao');

-- CreateEnum
CREATE TYPE "StatusManutencao" AS ENUM ('Agendada', 'EmAndamento', 'Concluida', 'Cancelada', 'Pendente', 'AguardandoConfirmacao');

-- CreateEnum
CREATE TYPE "StatusAlerta" AS ENUM ('Visto', 'NaoVisto');

-- CreateEnum
CREATE TYPE "Prioridade" AS ENUM ('Baixa', 'Media', 'Alta');

-- CreateTable
CREATE TABLE "unidades" (
    "id" TEXT NOT NULL,
    "nomeSistema" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "cnpj" TEXT,
    "logradouro" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "cep" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipamentos" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "tipo" TEXT,
    "setor" TEXT,
    "fabricante" TEXT,
    "ano_fabricacao" TEXT,
    "data_instalacao" TIMESTAMP(3),
    "status" "StatusEquipamento" NOT NULL DEFAULT 'Ativo',
    "numero_patrimonio" TEXT,
    "registro_anvisa" TEXT,
    "observacoes" TEXT,
    "unidadeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contratos" (
    "id" TEXT NOT NULL,
    "numeroContrato" TEXT NOT NULL,
    "categoria" TEXT,
    "fornecedor" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "status" "StatusContrato" NOT NULL DEFAULT 'Ativo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manutencoes" (
    "id" TEXT NOT NULL,
    "numero_os" TEXT NOT NULL,
    "tipo_manutencao" "TipoManutencao" NOT NULL,
    "status" "StatusManutencao" NOT NULL DEFAULT 'Agendada',
    "descricao_problema_servico" TEXT NOT NULL,
    "tecnico_responsavel" TEXT,
    "data_hora_agendamento_inicio" TIMESTAMP(3) NOT NULL,
    "data_conclusao" TIMESTAMP(3),
    "custo_total" DOUBLE PRECISION,
    "equipamento_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manutencoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acessorios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "numero_serie" TEXT,
    "descricao" TEXT,
    "equipamento_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acessorios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguros" (
    "id" TEXT NOT NULL,
    "apolice_numero" TEXT NOT NULL,
    "seguradora" TEXT NOT NULL,
    "data_inicio" TIMESTAMP(3) NOT NULL,
    "data_fim" TIMESTAMP(3) NOT NULL,
    "equipamento_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seguros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alertas" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "subtitulo" TEXT,
    "data" TIMESTAMP(3) NOT NULL,
    "prioridade" "Prioridade" NOT NULL,
    "tipo" TEXT NOT NULL,
    "status" "StatusAlerta" NOT NULL DEFAULT 'NaoVisto',
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alertas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_auditoria" (
    "id" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidade_id" TEXT NOT NULL,
    "detalhes" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autor_id" TEXT NOT NULL,

    CONSTRAINT "log_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anexos" (
    "id" TEXT NOT NULL,
    "nome_original" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "tipo_mime" TEXT NOT NULL,
    "unidade_id" TEXT,
    "equipamento_id" TEXT,
    "manutencao_id" TEXT,
    "seguro_id" TEXT,
    "contrato_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anexos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ContratosUnidadesCobertas" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ContratosUnidadesCobertas_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ContratosEquipamentosCobertos" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ContratosEquipamentosCobertos_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "unidades_nomeSistema_key" ON "unidades"("nomeSistema");

-- CreateIndex
CREATE UNIQUE INDEX "unidades_cnpj_key" ON "unidades"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_username_key" ON "usuarios"("username");

-- CreateIndex
CREATE UNIQUE INDEX "equipamentos_tag_key" ON "equipamentos"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "equipamentos_numero_patrimonio_key" ON "equipamentos"("numero_patrimonio");

-- CreateIndex
CREATE UNIQUE INDEX "contratos_numeroContrato_key" ON "contratos"("numeroContrato");

-- CreateIndex
CREATE UNIQUE INDEX "manutencoes_numero_os_key" ON "manutencoes"("numero_os");

-- CreateIndex
CREATE UNIQUE INDEX "acessorios_numero_serie_key" ON "acessorios"("numero_serie");

-- CreateIndex
CREATE UNIQUE INDEX "seguros_apolice_numero_key" ON "seguros"("apolice_numero");

-- CreateIndex
CREATE UNIQUE INDEX "anexos_path_key" ON "anexos"("path");

-- CreateIndex
CREATE INDEX "_ContratosUnidadesCobertas_B_index" ON "_ContratosUnidadesCobertas"("B");

-- CreateIndex
CREATE INDEX "_ContratosEquipamentosCobertos_B_index" ON "_ContratosEquipamentosCobertos"("B");

-- AddForeignKey
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manutencoes" ADD CONSTRAINT "manutencoes_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acessorios" ADD CONSTRAINT "acessorios_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguros" ADD CONSTRAINT "seguros_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_auditoria" ADD CONSTRAINT "log_auditoria_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "unidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_manutencao_id_fkey" FOREIGN KEY ("manutencao_id") REFERENCES "manutencoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_seguro_id_fkey" FOREIGN KEY ("seguro_id") REFERENCES "seguros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContratosUnidadesCobertas" ADD CONSTRAINT "_ContratosUnidadesCobertas_A_fkey" FOREIGN KEY ("A") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContratosUnidadesCobertas" ADD CONSTRAINT "_ContratosUnidadesCobertas_B_fkey" FOREIGN KEY ("B") REFERENCES "unidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContratosEquipamentosCobertos" ADD CONSTRAINT "_ContratosEquipamentosCobertos_A_fkey" FOREIGN KEY ("A") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContratosEquipamentosCobertos" ADD CONSTRAINT "_ContratosEquipamentosCobertos_B_fkey" FOREIGN KEY ("B") REFERENCES "equipamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
