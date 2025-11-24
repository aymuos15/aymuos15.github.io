"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/theme-toggle";
import { CloudBackground } from "@/components/cloud-background";

export function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <motion.div
        layoutId="theme-toggle"
        className="fixed top-4 right-4 z-[60]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <ThemeToggle />
      </motion.div>
      <motion.header
        layoutId="main-header"
        className="fixed top-0 left-0 right-0 w-full py-4 flex justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div className="relative rounded-full overflow-hidden shadow-md" layout>
          <CloudBackground />
          <nav className="relative z-10 flex items-center gap-2 px-6 py-2">
            <Link
              href="/"
              prefetch={true}
              className={
                isActive("/")
                  ? "text-yellow-400 dark:text-[#D4A574] px-4 py-2 text-sm font-medium rounded-l-full transition-colors"
                  : "text-white px-4 py-2 text-sm font-medium rounded-l-full transition-colors"
              }
            >
              Home
            </Link>
            <Link
              href="/about"
              prefetch={true}
              className={
                isActive("/about")
                  ? "text-yellow-400 dark:text-[#D4A574] px-4 py-2 text-sm font-medium transition-colors"
                  : "text-white px-4 py-2 text-sm font-medium transition-colors"
              }
            >
              About
            </Link>
            <Link
              href="/research"
              prefetch={true}
              className={
                isActive("/research")
                  ? "text-yellow-400 dark:text-[#D4A574] px-4 py-2 text-sm font-medium transition-colors"
                  : "text-white px-4 py-2 text-sm font-medium transition-colors"
              }
            >
              Research
            </Link>
            <Link
              href="/updates"
              prefetch={true}
              className={
                isActive("/updates")
                  ? "text-yellow-400 dark:text-[#D4A574] px-4 py-2 text-sm font-medium transition-colors"
                  : "text-white px-4 py-2 text-sm font-medium transition-colors"
              }
            >
              Updates
            </Link>
            <Link
              href="/gallery"
              prefetch={true}
              className={
                isActive("/gallery")
                  ? "text-yellow-400 dark:text-[#D4A574] px-4 py-2 text-sm font-medium transition-colors"
                  : "text-white px-4 py-2 text-sm font-medium transition-colors"
              }
            >
              Gallery
            </Link>
            <Link
              href="https://aymuos15.github.io/blog/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white px-4 py-2 text-sm font-medium rounded-r-full transition-colors"
            >
              Blog
            </Link>
          </nav>
        </motion.div>
      </motion.header>
    </>
  );
}
