"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    setLoading(false);
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Incorrect password.");
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h2 className="font-display text-2xl text-parchment mb-2">Alpha Nu Tau</h2>
      <p className="text-parchmentDim text-sm mb-8">
        Enter the site password to view the points roll.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full bg-lodge border border-gold/30 rounded px-4 py-3 text-parchment placeholder:text-parchmentDim focus:outline-none focus:border-gold"
        />
        {error && <p className="text-sm text-purpleLight">{error}</p>}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full bg-purple hover:bg-purpleLight transition-colors text-parchment font-display py-3 rounded disabled:opacity-50"
        >
          {loading ? "Checking…" : "Enter"}
        </button>
      </form>
    </div>
  );
}
