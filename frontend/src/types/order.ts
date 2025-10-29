// frontend/src/types/order.ts
// Garante preco_unitario em PedidoItem
import { Produto } from './product';

export enum StatusPedido {
  PENDENTE = 'PENDENTE',
  PRONTO = 'PRONTO',
  ENTREGUE = 'ENTREGUE',
  CANCELADO = 'CANCELADO',
  LOCAL = 'LOCAL', // Status interno do frontend
}

export enum TipoPagamento {
  DINHEIRO = 'DINHEIRO',
  CREDITO = 'CARTAO_CREDITO',
  DEBITO = 'CARTAO_DEBITO',
  PIX = 'PIX',
}

export interface PedidoItem {
  id: string; // ID do ItemPedido (ou produto.id localmente)
  produto: Produto;
  quantidade: number;
  preco_unitario: number; // << CORREÇÃO GARANTIDA
  subtotal?: number;
  pedidoId?: string;
  produto_id?: string;
}

export interface Pedido {
  id: string;
  numero_sequencial_dia?: number;
  senha?: string;
  valor_total: number;
  status: StatusPedido | string;
  itens: PedidoItem[];
  criado_em: string;
  atualizado_em: string;
  cliente_nome?: string | null;
  atendente_id?: string | null;
  atendente?: { nome: string };
  pagamento?: { metodo: TipoPagamento; valor_pago: number; troco: number };
}

export interface PaymentPayload {
  metodo: TipoPagamento;
  valor_pago: number;
}

export interface CreateOrderPayload {
  cliente_nome?: string;
  itens: { produto_id: string; quantidade: number }[];
}
