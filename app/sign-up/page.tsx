"use client";

import { useState } from "react";
import { createClient } from "../../lib/supabase/client";

export default function SignUpPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setErrorMsg("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setMessage("Check your email to confirm your account.");
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Sign up</h1>

      <form onSubmit={handleSignUp} className="space-y-3">
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
          Sign up
        </button>

        {message ? (
          <p className="text-sm text-green-600">{message}</p>
        ) : null}

        {errorMsg ? (
          <p className="text-sm text-red-600">{errorMsg}</p>
        ) : null}
      </form>
    </main>
  );
}
