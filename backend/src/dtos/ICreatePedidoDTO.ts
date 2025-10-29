
type ItemPedidoDto = {
  produto_id: string;
  quantidade: number;
};

export type CreatePedidoDto = {
  cliente_nome?: string;
  itens: ItemPedidoDto[];
};
