import { PrismaClient, ItemPedido } from '@prisma/client';

const prisma = new PrismaClient();

export class ImpressaoService {

  async gerarDadosComprovante(pedidoId: string) {
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        pagamento: true,
        itens: {
          include: {
            produto: { select: { nome: true } },
          },
        },
      },
    });

    if (!pedido) {
      throw new Error('Pedido não encontrado.');
    }
    if (!pedido.pagamento) {
      throw new Error('Este pedido ainda não foi pago.');
    }

    type ItemComProduto = ItemPedido & { produto: { nome: string } };

    const comprovante = {
      cabecalho: {
        nomeEstabelecimento: 'Padaria Pão do Céu',
        endereco: 'Rua das Delícias, 123',
        telefone: '(99) 99999-9999',
      },
      pedido: {
        numero: pedido.numero_sequencial_dia,
        data: pedido.criado_em.toLocaleString('pt-BR'),
        cliente: pedido.cliente_nome || 'Não informado',
      },
      itens: pedido.itens.map((item: ItemComProduto) => ({
        quantidade: item.quantidade,
        nome: item.produto.nome,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal,
      })),
      resumo: {
        total: pedido.valor_total,
        metodoPagamento: pedido.pagamento.metodo,
        valorPago: pedido.pagamento.valor_pago,
        troco: pedido.pagamento.troco,
      },
      rodape: {
        agradecimento: 'Obrigado pela preferência!',
      },
    };

    return comprovante;
  }
}
