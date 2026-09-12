import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase env vars. Check .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Role = 'owner' | 'manager' | 'technician';

export type TicketStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type TicketType = 'first_install' | 'maintenance' | 'second_visit' | 'other';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Technician {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  active: boolean;
  created_at: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  variation: string | null;
  active: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  cpf_cnpj: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipcode: string | null;
  notes: string | null;
  has_discount: boolean;
  discount_value: number;
  created_at: string;
}

export interface CustomerPlan {
  id: string;
  customer_id: string;
  plan_id: string;
  variation: string | null;
  created_at: string;
  plan?: Plan;
}

export interface Ticket {
  id: string;
  ticket_number: number;
  customer_id: string;
  technician_id: string | null;
  ticket_type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  description: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  technician?: Technician | null;
}

export interface Sale {
  id: string;
  sale_number: number;
  customer_id: string;
  plan_id: string | null;
  variation: string | null;
  amount: number;
  has_discount: boolean;
  discount_value: number;
  final_amount: number;
  payment_method: string | null;
  payment_condition: string | null;
  status: string;
  sale_date: string;
  notes: string | null;
  created_at: string;
  customer?: Customer;
  plan?: Plan | null;
}

export interface AdMetric {
  id: string;
  metric_date: string;
  platform: string;
  ad_name: string | null;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  revenue: number;
  notes: string | null;
  created_at: string;
}

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  pending: 'Pendente',
  assigned: 'Atribuído',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

export const TICKET_TYPE_LABELS: Record<TicketType, string> = {
  first_install: 'Primeira Instalação',
  maintenance: 'Manutenção',
  second_visit: 'Segundo Atendimento',
  other: 'Outro',
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente',
};

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Gestor Chefe',
  manager: 'Gestor Administrativo',
  technician: 'Técnico',
};
