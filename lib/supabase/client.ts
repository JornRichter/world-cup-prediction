import { createBrowserClient } from "@supabase/ssr";

export function ✅ Export a usable instanceexport function createClient() {
export const supabase = createClient();

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}

