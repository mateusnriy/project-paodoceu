// src/types/order.ts
import { Produto } from './product';

export enum StatusPedido {
  PENDENTE = 'PENDENTE',
  PRONTO = 'PRONTO',
  ENTREGUE = 'ENTREGUE',
  CANCELADO = 'CANCELADO',
  LOCAL = 'LOCAL', // Status para o carrinho local antes de ser pago
}

export enum TipoPagamento {
  DINHEIRO = 'DINHEIRO',
  CREDITO = 'CARTAO_CREDITO',
  DEBITO = 'CARTAO_DEBITO',
  PIX = 'PIX',
}

export interface PedidoItem {
  id: string;
  produto: Produto;
  quantidade: number;
  preco: number; // Preço no momento da adição (ou preco_unitario do backend)
  subtotal?: number; // Adicionado para dados do backend
  pedidoId: string;
}

export interface Pedido {
  id: string;
  numero_sequencial_dia?: number; // Adicionado
  senha?: string; // Senha pode não existir no carrinho local
  valor_total: number; // Renomeado de 'total' para corresponder ao backend
  status: StatusPedido | string;
  itens: PedidoItem[];
  criado_em: string; // Renomeado de dataCriacao
  atualizado_em: string; // Renomeado de dataAtualizacao
  cliente_nome?: string;
  atendente_id?: string;
  // Campos de relacionamento (opcionais no frontend se não sempre carregados)
  atendente?: { nome: string }; // Exemplo
  pagamento?: { metodo: TipoPagamento, valor_pago: number, troco: number }; // Exemplo
}

// Interface usada no Payload de Pagamento (separada para clareza)
export interface PaymentPayload {
  metodo: TipoPagamento;
  valor_pago: number;
}
