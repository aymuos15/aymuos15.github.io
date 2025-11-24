"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const ROUTES = ["/", "/about", "/research", "/updates", "/gallery"];

export function PrefetchRoutes() {
  const router = useRouter();

  useEffect(() => {
    // Aggressively prefetch all routes on mount
    ROUTES.forEach((route) => {
      router.prefetch(route);
    });
  }, [router]);

  return null;
}
