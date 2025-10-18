import { Produto } from './product';

// Define o Enum para Status do Pedido (exportado)
export enum StatusPedido {
  AGUARDANDO = 'AGUARDANDO',
  PRONTO = 'PRONTO',
  CONCLUIDO = 'CONCLUIDO',
  CANCELADO = 'CANCELADO',
  LOCAL = 'LOCAL', // Status para o carrinho local antes de ser pago
}

// Define o Enum para Tipo de Pagamento (exportado)
export enum TipoPagamento {
  DINHEIRO = 'DINHEIRO',
  CREDITO = 'CREDITO',
  DEBITO = 'DEBITO',
  PIX = 'PIX',
}

// Interface para o Item *dentro* de um Pedido
// (Alinhado com o Prisma e o hook usePOS)
export interface PedidoItem {
  id: string;
  produto: Produto;
  quantidade: number;
  preco: number; // Preço no momento da adição
  pedidoId: string;
}

// Interface principal do Pedido
export interface Pedido {
  id: string;
  senha: string;
  total: number;
  status: StatusPedido | string; // Permite o 'LOCAL'
  itens: PedidoItem[];
  dataCriacao: string;
  dataAtualizacao: string;
}
