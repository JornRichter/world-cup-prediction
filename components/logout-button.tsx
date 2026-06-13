"use client";

import { supabase } from "../lib/supabase/client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <button onClick={logout}>
      Logout
    </button>
  );
}