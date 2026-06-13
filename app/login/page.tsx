"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Log in</h1>

      <form onSubmit={handleLogin} className="space-y-3">
        <input
          className="w-full rounded-xl border px-3 py-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full rounded-xl border px-3 py-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full rounded-xl bg-blue-600 text-white py-2">
          Log in
        </button>

        {errorMsg ? (
          <p className="text-sm text-red-600">{errorMsg}</p>
        ) : null}
      </form>
    </main>
  );
}