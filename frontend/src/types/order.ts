export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderItem {
  produto: {
    nome: string;
  };
  quantidade: number;
}

export interface Order {
  id: string;
  numero_sequencial_dia: number;
  criado_em: string;
  itens: OrderItem[];
  valor_total: number;
  status: 'PENDENTE' | 'PRONTO' | 'ENTREGUE' | 'CANCELADO';
}

export type PaymentMethod = 'DINHEIRO' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'PIX';

export interface PaymentPayload {
  metodo: PaymentMethod;
  valor_pago: number;
}
