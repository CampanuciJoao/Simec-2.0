/*
  Warnings:

  - The values [Ativo,Inativo,Descontinuado,PendenteInstalacao] on the enum `StatusEquipamento` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StatusEquipamento_new" AS ENUM ('Operante', 'Inoperante', 'UsoLimitado', 'EmManutencao');
ALTER TABLE "equipamentos" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "equipamentos" ALTER COLUMN "status" TYPE "StatusEquipamento_new" USING ("status"::text::"StatusEquipamento_new");
ALTER TYPE "StatusEquipamento" RENAME TO "StatusEquipamento_old";
ALTER TYPE "StatusEquipamento_new" RENAME TO "StatusEquipamento";
DROP TYPE "StatusEquipamento_old";
ALTER TABLE "equipamentos" ALTER COLUMN "status" SET DEFAULT 'Operante';
COMMIT;

-- AlterTable
ALTER TABLE "equipamentos" ALTER COLUMN "status" SET DEFAULT 'Operante';
