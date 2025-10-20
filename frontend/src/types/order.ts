import { Produto } from './product'; // <<< Importa Produto

// Define o Enum para Status do Pedido (exportado)
export enum StatusPedido {
  PENDENTE = 'PENDENTE', // <<< CORREÇÃO: AGUARDANDO -> PENDENTE
  PRONTO = 'PRONTO',
  ENTREGUE = 'ENTREGUE', // <<< CORREÇÃO: CONCLUIDO -> ENTREGUE
  CANCELADO = 'CANCELADO',
  LOCAL = 'LOCAL', // Status para o carrinho local antes de ser pago
}

// Define o Enum para Tipo de Pagamento (exportado)
// <<< CORREÇÃO: Alinhado com Prisma >>>
export enum TipoPagamento {
  DINHEIRO = 'DINHEIRO',
  CREDITO = 'CARTAO_CREDITO', // <- MUDOU
  DEBITO = 'CARTAO_DEBITO',   // <- MUDOU
  PIX = 'PIX',
}

// Interface para o Item *dentro* de um Pedido
export interface PedidoItem {
  id: string;
  produto: Produto; // <<< CORREÇÃO: Usa o tipo Produto
  quantidade: number;
  preco: number; // Preço no momento da adição
  pedidoId: string;
}

// Interface principal do Pedido
export interface Pedido {
  id: string;
  senha?: string; // Senha pode não existir no carrinho local
  total: number;
  status: StatusPedido | string; // Permite o 'LOCAL'
  itens: PedidoItem[];
  dataCriacao: string;
  dataAtualizacao: string;
  cliente_nome?: string; // Adicionado
  numero_sequencial_dia?: number; // Adicionado
  atendente_id?: string; // Adicionado
}

// Interface usada no Payload de Pagamento (separada para clareza)
export interface PaymentPayload {
  metodo: TipoPagamento;
  valor_pago: number;
}
