"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="w-full py-4">
      <div className="flex items-center justify-center gap-6">
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/">
            <Button variant="ghost" size="sm">
              Home
            </Button>
          </Link>
          <Link href="/about">
            <Button variant="ghost" size="sm">
              About
            </Button>
          </Link>
          <Link href="/research">
            <Button variant="ghost" size="sm">
              Research
            </Button>
          </Link>
          <Link href="/updates">
            <Button variant="ghost" size="sm">
              Updates
            </Button>
          </Link>
          <Link href="/gallery">
            <Button variant="ghost" size="sm">
              Gallery
            </Button>
          </Link>
          <Link href="/blog">
            <Button variant="ghost" size="sm">
              Blog
            </Button>
          </Link>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
