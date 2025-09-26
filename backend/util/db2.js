import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://sqepyvxpukmzclablfue.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxZXB5dnhwdWttemNsYWJsZnVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNTYyNTQsImV4cCI6MjA3MjgzMjI1NH0.dEWHiKRWjYEkj_QFC6o3Oyc_Oj-JaOZO8srDHs4YYLU"
);
