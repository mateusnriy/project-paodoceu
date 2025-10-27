// src/utils/dates.ts
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  startOfDay,
  endOfDay,
  // formatISO, // REMOVIDO
} from 'date-fns';

export type DateRangeOption = 'today' | 'week' | 'month' | 'year';

export const getDateRangeQuery = (
  rangeType: DateRangeOption
): { data_inicio?: string; data_fim?: string } => {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (rangeType) {
    case 'today':
      startDate = startOfDay(now);
      endDate = endOfDay(now);
      break;
    case 'week':
      startDate = startOfWeek(now, { weekStartsOn: 1 }); // Segunda-feira como início da semana
      endDate = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case 'month':
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      break;
    case 'year':
      startDate = startOfYear(now);
      endDate = endOfYear(now);
      break;
    default: // Default para 'week' se tipo inválido
      startDate = startOfWeek(now, { weekStartsOn: 1 });
      endDate = endOfWeek(now, { weekStartsOn: 1 });
      break;
  }
  // const formatOptions = { representation: 'date' } as const; // REMOVIDO

  // Retorna datas no formato ISO 8601 completo (UTC)
  return {
    data_inicio: startDate.toISOString(),
    data_fim: endDate.toISOString(),
  };
};
