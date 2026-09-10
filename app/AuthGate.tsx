"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getStoredAuth } from "@/lib/auth";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [allowed, setAllowed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const auth = getStoredAuth();
    const normalized = pathname.replace(/\/+$/, "") || "/";

    if (normalized === "/login") {
      setAllowed(true);
      return;
    }
    if (!auth) {
      router.replace("/login");
      setAllowed(false);
      return;
    }
    if (normalized.startsWith("/admin") && auth.role !== "admin") {
      router.replace("/");
      setAllowed(false);
      return;
    }
    setAllowed(true);
  }, [pathname, router]);

  if (!allowed) return null;
  return <>{children}</>;
}
