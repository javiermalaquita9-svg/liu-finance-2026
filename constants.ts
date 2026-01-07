import { AgencySettings } from './types';

export const DEFAULT_SETTINGS: AgencySettings = {
  companyName: 'Liu Digital Agency',
  rut: '76.123.456-K',
  address: 'Av. Providencia 1234, Of 601, Santiago',
  logoUrl: 'https://picsum.photos/100/100',
  capacityHours: 160,
  contactEmail: 'contacto@liu.cl'
};

export const DEFAULT_TERMS = `1. Validez de la oferta: 15 días hábiles.
2. Forma de pago: 50% anticipo, 50% contra entrega.
3. Valores netos, no incluyen IVA.
4. Tiempos de entrega sujetos a disponibilidad de información por parte del cliente.`;

export const MONTH_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];