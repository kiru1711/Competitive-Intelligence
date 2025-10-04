import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Article {
  id: string;
  title: string;
  source: string;
  posted_time: string;
  impact_level: 'low' | 'medium' | 'high';
  summary: string;
  full_content: string;
  created_at: string;
}

export interface Keyword {
  id: string;
  keyword: string;
  created_at: string;
}

export interface Todo {
  id: string;
  task: string;
  completed: boolean;
  reminder_days: number | null;
  created_at: string;
}
