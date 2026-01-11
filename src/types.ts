export enum CostType {
  FIXED = 'Fijo',
  VARIABLE = 'Variable',
}

export interface AgencyCost {
  id: string;
  name: string;
  amount: number;
  type: CostType;
  category: string;
}

export interface AgencyService {
  id: string;
  name: string;
  description: string;
  hours: number;
  margin: number; // Percentage 0-100
  price: number;
}

export interface AgencyClient {
  id: string;
  name: string;
  rut: string;
  email: string;
  phone: string;
  city: string;
  giro?: string;
  lastTotal: number;
}

export interface TermTemplate {
  id: string;
  name: string;
  content: string;
}

export interface QuoteItem {
  id: string;
  serviceId: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
}

export enum QuoteStatus {
  DRAFT = 'Borrador',
  SENT = 'Enviado',
  APPROVED = 'Aprobado',
  REJECTED = 'Rechazado',
}

export interface AgencyQuote {
  id: string;
  clientId: string;
  clientName: string;
  clientRut: string;
  date: string;
  validUntil: string;
  deliveryDate: string;
  items: QuoteItem[];
  total: number;
  status: QuoteStatus;
  terms: string;
}

export interface AgencySettings {
  companyName: string;
  rut: string;
  address: string;
  logoUrl: string;
  capacityHours: number; // Total monthly capacity
  contactEmail: string;
}

export type TabView = 'finances' | 'services' | 'analytics' | 'clients' | 'quotes';

export interface AgencyAsset {
  id: string;
  name: string;
  purchaseDate: string; // Formato YYYY-MM-DD
  initialValue: number;
  usefulLife: number; // en años
  // Opcional: podrías agregar un valor residual si lo necesitas
  // residualValue: number;
}

export interface MonthlySale {
  year: number;
  month: number; // 0 para Enero, 11 para Diciembre
  sales: number;
}