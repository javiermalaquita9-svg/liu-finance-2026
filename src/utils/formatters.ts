export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatRut = (value: string): string => {
  // Simple cleaning
  let clean = value.replace(/[^0-9kK]/g, '');
  if (clean.length <= 1) return clean;
  
  const dv = clean.slice(-1);
  let body = clean.slice(0, -1);
  
  // Apply dots
  body = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  
  return `${body}-${dv.toUpperCase()}`;
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

export const calculateBEP = (fixedCosts: number, capacityHours: number): number => {
  if (capacityHours === 0) return 0;
  return Math.round(fixedCosts / capacityHours);
};