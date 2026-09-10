"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getStoredAuth, clearStoredAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";

export default function Nav() {
  const [role, setRole] = useState<Role | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setRole(getStoredAuth()?.role ?? null);
  }, [pathname]);

  function handleLogout() {
    clearStoredAuth();
    setRole(null);
    router.push("/login");
  }

  return (
    <div className="flex items-center gap-6">
      {role === "admin" && (
        <Link href="/admin" className="text-sm text-purpleLight hover:text-goldBright transition-colors">
          Log points
        </Link>
      )}
      {role && (
        <button
          onClick={handleLogout}
          className="text-sm text-parchmentDim hover:text-goldBright transition-colors"
        >
          Log out
        </button>
      )}
      <p className="font-display italic text-gold text-sm">Founded 1841</p>
    </div>
  );
}
