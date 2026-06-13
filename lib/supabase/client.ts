import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createABLE_KEY!  return createBrowserClient(
  );
}

// ✅ THIS LINE IS THE IMPORTANT FIX
export const supabase = createClient();
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
