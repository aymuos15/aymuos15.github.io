"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export function SplitHeader() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <motion.header
      layoutId="main-header"
      className="fixed top-0 left-0 right-0 w-full py-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-center w-full">
        <motion.div
          className="flex md:flex-row flex-col items-stretch gap-0 w-full max-w-4xl"
          layout
        >
          {/* Left nav - dark background */}
          <nav className="flex items-center flex-wrap justify-end gap-1 px-6 py-2 bg-[#138EC0] md:rounded-l-full md:rounded-r-none rounded-t-full shadow-md flex-1">
            <Link
              href="/"
              prefetch={true}
              className={
                isActive("/")
                  ? "text-[#D4A574] px-3 py-1.5 text-sm font-medium transition-colors"
                  : "text-white px-3 py-1.5 text-sm font-medium transition-colors hover:text-[#D4A574]"
              }
            >
              Home
            </Link>
            <Link
              href="/about"
              prefetch={true}
              className={
                isActive("/about")
                  ? "text-[#D4A574] px-3 py-1.5 text-sm font-medium transition-colors"
                  : "text-white px-3 py-1.5 text-sm font-medium transition-colors hover:text-[#D4A574]"
              }
            >
              About
            </Link>
            <Link
              href="/research"
              prefetch={true}
              className={
                isActive("/research")
                  ? "text-[#D4A574] px-3 py-1.5 text-sm font-medium transition-colors"
                  : "text-white px-3 py-1.5 text-sm font-medium transition-colors hover:text-[#D4A574]"
              }
            >
              Research
            </Link>
          </nav>

          {/* Right nav - light background */}
          <nav className="flex items-center flex-wrap justify-start gap-1 px-6 py-2 bg-[#C97359] md:rounded-r-full md:rounded-l-none rounded-b-full shadow-md flex-1">
            <Link
              href="/updates"
              prefetch={true}
              className={
                isActive("/updates")
                  ? "text-[#D4A574] px-3 py-1.5 text-sm font-medium transition-colors"
                  : "text-white px-3 py-1.5 text-sm font-medium transition-colors hover:text-[#D4A574]"
              }
            >
              Updates
            </Link>
            <Link
              href="/gallery"
              prefetch={true}
              className={
                isActive("/gallery")
                  ? "text-[#D4A574] px-3 py-1.5 text-sm font-medium transition-colors"
                  : "text-white px-3 py-1.5 text-sm font-medium transition-colors hover:text-[#D4A574]"
              }
            >
              Gallery
            </Link>
            <Link
              href="https://aymuos15.github.io/blog/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white px-3 py-1.5 text-sm font-medium transition-colors hover:text-[#D4A574]"
            >
              Blog
            </Link>
          </nav>
        </motion.div>
      </div>
    </motion.header>
  );
}
