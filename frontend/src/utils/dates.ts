import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfDay, endOfDay, formatISO } from 'date-fns';

export type DateRangeOption = 'today' | 'week' | 'month' | 'year';

export const getDateRangeQuery = (rangeType: DateRangeOption): { data_inicio?: string; data_fim?: string } => {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (rangeType) {
    case 'today':
      startDate = startOfDay(now);
      endDate = endOfDay(now);
      break;
    case 'week':
      startDate = startOfWeek(now, { weekStartsOn: 1 });
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
    default:
       startDate = startOfWeek(now, { weekStartsOn: 1 });
       endDate = endOfWeek(now, { weekStartsOn: 1 });
       break;
  }
  const formatOptions = { representation: 'date' } as const;

  return {
    data_inicio: startDate.toISOString().split('T')[0] + 'T00:00:00.000Z',
    data_fim: endDate.toISOString().split('T')[0] + 'T23:59:59.999Z',
  };
};
