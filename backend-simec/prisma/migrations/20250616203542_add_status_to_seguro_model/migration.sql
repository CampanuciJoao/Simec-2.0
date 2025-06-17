-- CreateEnum
CREATE TYPE "StatusSeguro" AS ENUM ('Ativo', 'Expirado', 'Cancelado', 'Vigente');

-- AlterTable
ALTER TABLE "seguros" ADD COLUMN     "status" "StatusSeguro" NOT NULL DEFAULT 'Ativo';
