-- AlterTable
ALTER TABLE "produtos" ADD COLUMN     "imagem_url" TEXT;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true;
