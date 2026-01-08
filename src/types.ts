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
  lastTotal: number;
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
}

export interface AgencyQuote {
  id: string;
  clientId: string;
  clientName: string;
  clientRut: string;
  date: string;
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