"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { Header } from "@/components/header";
import { SplitHeader } from "@/components/split-header";

export function ConditionalHeader() {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      {pathname === "/about" ? <SplitHeader key="split" /> : <Header key="regular" />}
    </AnimatePresence>
  );
}
