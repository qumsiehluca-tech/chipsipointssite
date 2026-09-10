"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { fetchAuthed } from "@/lib/data";
import { setStoredAuth } from "@/lib/auth";
import Seal from "../Seal";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const data = await fetchAuthed(password);
    setLoading(false);
    if (data) {
      setStoredAuth({ password, role: data.role });
      router.push("/");
    } else {
      setError("Incorrect password.");
    }
  }

  return (
    <div className="max-w-xs mx-auto mt-12 text-center">
      <Seal className="w-14 h-14 text-gold/70 mx-auto mb-6" />
      <p className="eyebrow text-gold/70 mb-2">Alpha Nu Tau</p>
      <h2 className="font-display text-2xl text-parchment mb-8">Chi Psi Points</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full bg-transparent border-b border-gold/30 rounded-none px-1 py-3 text-center text-parchment tracking-wide placeholder:text-parchmentDim/60 focus:outline-none focus:border-gold transition-colors"
        />
        {error && <p className="text-sm text-purpleLight">{error}</p>}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full border border-gold/60 text-gold hover:bg-gold hover:text-ink transition-colors font-body text-xs tracking-[0.2em] uppercase py-3 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gold"
        >
          {loading ? "Checking…" : "Enter"}
        </button>
      </form>
    </div>
  );
}
