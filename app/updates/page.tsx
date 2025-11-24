"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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

const researchImages = [
  "/research_pics/a_street_tunis_2021.34.6.jpg",
  "/research_pics/jan_Novak_old_man.jpg",
  "/research_pics/jeunesse_passe_vite_vertu_..._2015.143.103.jpg",
  "/research_pics/keelmen_heaving_in_coals_by_moonlight_1942.9.86.jpg",
  "/research_pics/paul-klee_color-chart-qu-1.png",
];

export default function Updates() {
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [randomImage, setRandomImage] = useState<string>("");

  useEffect(() => {
    // Select random image on mount
    const randomIndex = Math.floor(Math.random() * researchImages.length);
    setRandomImage(researchImages[randomIndex]);
  }, []);

  const filteredUpdates = updatesData.updates.filter((update: Update) => {
    if (activeCategory === "all") return true;
    return update.category === activeCategory;
  }).slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="max-w-3xl w-full space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-4">
          <div className="relative rounded-lg overflow-hidden">
            {randomImage && (
              <Image
                src={randomImage}
                alt="Background"
                fill
                className="object-cover opacity-30"
              />
            )}
            <div className="relative z-10 flex flex-wrap gap-2 p-3">
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
