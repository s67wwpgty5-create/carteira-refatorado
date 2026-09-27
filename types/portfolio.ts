/**
 * Portfolio Type Definitions
 * Centralized types for entire portfolio module
 */

export interface Client {
  id: string;
  name: string;
  document: string;
  contract?: string;
  sector?: string;
  first: string;
  last: string;
  months: Record<string, MonthData>;
}

export interface MonthData {
  items: number;
  cents: number;
  services: Record<string, ServiceData>;
}

export interface ServiceData {
  items: number;
  cents: number;
}

export interface Contact {
  phone: string;
  email: string;
  owner: string;
  region?: string;
  city?: string;
  commercialPhone?: string;
  emails?: string[];
  phones?: string[];
  contactSource?: string;
  contactSourceRows?: number[];
  rawPhones?: string[];
  rawEmails?: string;
}

export interface Activity {
  id: string;
  client: string;
  note: string;
  due: string;
  created: string;
  done?: boolean;
}

export interface Dataset {
  cutoff: string;
  closedThrough: string;
  coverageConfirmed: boolean;
  monthCoverage?: Record<string, boolean>;
  source: string;
  clients: Client[];
  items: number;
}

export interface ABCClassification {
  abc: 'A' | 'B' | 'C' | 'Sem valor';
  value: number;
  cumulative: number;
}

export interface FrequencyInfo {
  n: number;
  label: 'Sem histórico' | 'Eventual' | 'Ocasional' | 'Frequente' | 'Muito frequente';
}

export interface AlertLevel {
  level: 'normal' | 'ausencia' | 'forte';
  description: string;
}

export type ViewType =
  | 'Visão geral'
  | 'Clientes'
  | 'Alertas'
  | 'Curva ABC'
  | 'Acompanhamento'
  | 'Propostas'
  | 'Públicos e agendamentos'
  | 'Importar planilha';

export interface FilterState {
  region: string;
  contract: string;
  month: string;
  risk: string;
  abc: string;
  frequency: string;
  search: string;
}

export interface PaginationState {
  pageSize: number;
  currentPage: number;
}

export interface PortfolioUIState {
  view: ViewType;
  filters: FilterState;
  pagination: PaginationState;
  selectedClientIds: string[];
  status: string;
  loading: boolean;
  error: string | null;
}

export interface SaveAction {
  action: 'contact' | 'activity' | 'audience' | 'schedule' | 'import' | 'coverage';
  payload: unknown;
}

export interface SaveResponse {
  ok?: boolean;
  activity?: Activity;
  audience?: any;
  schedule?: any;
  error?: string;
}
