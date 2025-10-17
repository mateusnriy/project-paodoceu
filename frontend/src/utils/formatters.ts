export const formatCurrency = (value: number): string => {
  return value.toFixed(2).replace('.', ',');
};
