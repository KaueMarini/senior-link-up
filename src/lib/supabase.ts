import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://otmttxbbarxlzbhhnrvy.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90bXR0eGJiYXJ4bHpiaGhucnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1ODA2NTIsImV4cCI6MjA4ODE1NjY1Mn0.Vm-cSVo8O09Jh2IiXFYJ_rcJgy05E3Yzw76CjYTlLNA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
