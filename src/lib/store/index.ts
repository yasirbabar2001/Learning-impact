import "server-only";
import { fileStore } from "./file-store";
import { supabaseStore } from "./supabase-store";
import type { Store } from "./types";

export const usingSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

export const store: Store = usingSupabase ? supabaseStore : fileStore;
