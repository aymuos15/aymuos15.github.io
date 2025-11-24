"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import updatesData from "@/lib/updates.json";

type Category = "all" | "publishing" | "reviewing" | "teaching" | "misc";

interface Update {
  date: string;
  description: string;
  category: string;
}

const categoryLabels: Record<Category, string> = {
  all: "All",
  publishing: "Pubs",
  reviewing: "Revs",
  teaching: "TA",
  misc: "Misc",
};

export default function Updates() {
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  const filteredUpdates = updatesData.updates.filter((update: Update) => {
    if (activeCategory === "all") return true;
    return update.category === activeCategory;
  }).slice(0, 6);

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center px-4 py-8">
      <div className="max-w-3xl mx-auto w-full space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link href="/" className="font-bold text-xl underline hover:opacity-70">
            News
          </Link>

          <div className="flex flex-wrap gap-2">
            {(Object.keys(categoryLabels) as Category[]).map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveCategory(category)}
                className="text-sm"
              >
                {categoryLabels[category]}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{
                opacity: 0,
                filter: "blur(20px) brightness(1.5)"
              }}
              animate={{
                opacity: 1,
                filter: "blur(0px) brightness(1)"
              }}
              exit={{
                opacity: 0,
                filter: "blur(20px) brightness(1.5)"
              }}
              transition={{
                duration: 0.4,
                ease: "easeInOut"
              }}
              className="space-y-6"
            >
              {filteredUpdates.map((update: Update, index: number) => (
                <div key={index} className="flex flex-col sm:flex-row gap-3 group">
                  <span className="text-sm font-medium text-muted-foreground whitespace-nowrap min-w-[80px]">
                    {update.date}
                  </span>
                  <p
                    className="text-base leading-relaxed flex-1 text-justify"
                    dangerouslySetInnerHTML={{ __html: update.description }}
                  />
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
