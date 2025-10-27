// src/types/api.ts

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
  // Remover os campos duplicados se existirem no seu arquivo original
  // total?: number; // Redundante se tiver meta.total
  // page?: number; // Redundante se tiver meta.pagina
  // limit?: number; // Redundante se tiver meta.limite
}
