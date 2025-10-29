// frontend/src/types/api.ts
// Define e exporta ApiMeta
export interface ApiMeta {
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: ApiMeta; // Usa a interface exportada
}
