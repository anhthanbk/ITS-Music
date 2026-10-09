import { createClient } from "@supabase/supabase-js";

const rawUrl = "{{https://azbpjtwkaasyobisjruo.supabase.co}}";
const rawKey = "{{sb_publishable_ZWYXhmiFUlNuYoEpHG9SJw_Ot9QrMWL}}";

const SUPABASE_URL = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  rawUrl.replace(/^\{\{|\}\}$/g, "").trim()
);

const SUPABASE_PUBLIC_KEY = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  rawKey.replace(/^\{\{|\}\}$/g, "").trim()
);

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
