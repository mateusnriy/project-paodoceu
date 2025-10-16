import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

// Inicializa o cliente do Prisma
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o processo de seed...');

  // 1. Limpar dados existentes (opcional, mas bom para desenvolvimento)
  await prisma.pagamento.deleteMany({});
  await prisma.itemPedido.deleteMany({});
  await prisma.pedido.deleteMany({});
  await prisma.produto.deleteMany({});
  await prisma.categoria.deleteMany({});
  await prisma.usuario.deleteMany({});
  console.log('Banco de dados limpo.');

  // 2. Criar usuário administrador
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

  // 3. Criar categorias
  const categoriaPao = await prisma.categoria.create({ data: { nome: 'Pães' } });
  const categoriaSalgado = await prisma.categoria.create({ data: { nome: 'Salgados' } });
  const categoriaBebida = await prisma.categoria.create({ data: { nome: 'Bebidas' } });
  const categoriaDoce = await prisma.categoria.create({ data: { nome: 'Doces e Sobremesas' } });
  console.log('Categorias criadas: Pães, Salgados, Bebidas, Doces e Sobremesas');

  // 4. Criar produtos
  await prisma.produto.createMany({
    data: [
      // Pães
      { nome: 'Pão Francês', preco: 0.8, estoque: 100, categoria_id: categoriaPao.id },
      { nome: 'Pão de Queijo', preco: 3.5, estoque: 50, categoria_id: categoriaPao.id },
      // Salgados
      { nome: 'Coxinha de Frango', preco: 7.0, estoque: 30, categoria_id: categoriaSalgado.id },
      { nome: 'Esfiha de Carne', preco: 6.5, estoque: 40, categoria_id: categoriaSalgado.id },
      // Bebidas
      { nome: 'Café Expresso', preco: 5.0, estoque: 200, categoria_id: categoriaBebida.id },
      { nome: 'Suco de Laranja (500ml)', preco: 9.0, estoque: 25, categoria_id: categoriaBebida.id },
      { nome: 'Refrigerante Lata', preco: 6.0, estoque: 80, categoria_id: categoriaBebida.id },
      // Doces
      { nome: 'Brigadeiro', preco: 4.0, estoque: 60, categoria_id: categoriaDoce.id },
      { nome: 'Bolo de Chocolate (Fatia)', preco: 8.5, estoque: 15, categoria_id: categoriaDoce.id },
    ],
  });
  console.log('Produtos de exemplo criados.');

  console.log('Processo de seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro durante o processo de seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Fecha a conexão com o banco de dados
    await prisma.$disconnect();
  });
