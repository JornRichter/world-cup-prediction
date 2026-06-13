"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const supabase = createClient();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-xl border px-4 py-2"
    >
      Log out
    </button>
  );
}