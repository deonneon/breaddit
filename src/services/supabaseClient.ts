import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yzrogyxakhtibxofesec.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6cm9neXhha2h0aWJ4b2Zlc2VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MjUyNjcsImV4cCI6MjA2MzEwMTI2N30.jdxt4j_VVcsDJrWR09uY_1Pfyfmq4Ow8RyUmznKBdg4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
}; 