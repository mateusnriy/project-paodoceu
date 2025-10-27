// src/types/order.ts
import { Produto } from './product';

export enum StatusPedido {
  PENDENTE = 'PENDENTE',
  PRONTO = 'PRONTO',
  ENTREGUE = 'ENTREGUE',
  CANCELADO = 'CANCELADO',
  LOCAL = 'LOCAL',
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
  preco: number; // No frontend, usamos 'preco', mas o backend usa 'preco_unitario'
  subtotal?: number; // Adicionado para dados do backend
  pedidoId: string;
}

export interface Pedido {
  id: string;
  numero_sequencial_dia?: number;
  senha?: string; // Disponível no backend, pode ser útil
  valor_total: number; // Corrigido de 'total' para corresponder ao backend
  status: StatusPedido | string; // Permite o 'LOCAL'
  itens: PedidoItem[];
  criado_em: string; // Corrigido de 'dataCriacao'
  atualizado_em: string; // Corrigido de 'dataAtualizacao'
  cliente_nome?: string;
  atendente_id?: string;
  atendente?: { nome: string }; // Exemplo se precisar do nome
  pagamento?: { metodo: TipoPagamento; valor_pago: number; troco: number }; // Exemplo se precisar dos dados de pagamento
}

export interface PaymentPayload {
  metodo: TipoPagamento;
  valor_pago: number;
}
