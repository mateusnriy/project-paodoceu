export interface PaginatedResponse<T> {
  /** Os dados da página atual */
  data: T[];
  
  /** Metadados da paginação */
  meta: {
    /** Total de itens no banco de dados (para a query) */
    total: number;
    /** O número da página atual (1-based) */
    pagina: number;
    /** O limite de itens por página */
    limite: number;
    /** O número total de páginas disponíveis */
    totalPaginas: number;
  };
}
