import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o processo de seed...');

  await prisma.pagamento.deleteMany({});
  await prisma.itemPedido.deleteMany({});
  await prisma.pedido.deleteMany({});
  await prisma.produto.deleteMany({});
  await prisma.categoria.deleteMany({});
  await prisma.usuario.deleteMany({});
  console.log('Banco de dados limpo.');

  const salt = await bcrypt.genSalt(10);
  const senhaHash = await bcrypt.hash('admin123', salt);

  const admin = await prisma.usuario.create({
    data: {
      nome: 'Administrador do Sistema',
      email: 'admin@paodoceu.com',
      senha: senhaHash,
      perfil: 'ADMINISTRADOR',
    },
  });
  console.log(`Usuário Administrador criado: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error('Erro durante o processo de seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
