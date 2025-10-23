import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || 'demo-key';

// Create a mock Supabase client for development when env vars are missing
const isDemoMode = !import.meta.env.VITE_PUBLIC_SUPABASE_URL || !import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

// Create a mock client for demo mode to avoid real Supabase calls
const createMockClient = () => ({
  from: () => ({
    select: () => ({
      eq: () => ({
        order: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          then: (callback: any) => callback({ data: [], error: null })
        }),
        then: (callback: any) => callback({ data: [], error: null })
      }),
      then: (callback: any) => callback({ data: [], error: null })
    }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => ({
      eq: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: null })
        })
      })
    }),
    delete: () => ({
      eq: () => Promise.resolve({ data: null, error: null })
    })
  }),
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: { user: null }, error: null }),
    signOut: () => Promise.resolve({ error: null })
  }
});

export const supabase = isDemoMode ? createMockClient() as any : createClient(supabaseUrl, supabaseAnonKey);

// Export demo mode flag for conditional behavior
export const isDemoEnvironment = isDemoMode;

// Database types
export interface Company {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Technician {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  commission_rate: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  order_position: number;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  customer_id?: string;
  technician_id?: string;
  stage_id?: string;
  title: string;
  description?: string;
  estimated_price?: number;
  actual_price?: number;
  priority: string;
  lead_source?: string;
  status: string;
  due_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  technician?: Technician;
  stage?: PipelineStage;
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  order_position: number;
  created_at: string;
  updated_at: string;
}

export interface Setting {
  id: string;
  key: string;
  value: any;
  created_at: string;
  updated_at: string;
}