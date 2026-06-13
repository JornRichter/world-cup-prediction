import { createBrowserClient } from "@supabase/ssr";import { createBrowserClient } from "@supabase/ssBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}

export const supabase = createClient();

export function createClient() {
