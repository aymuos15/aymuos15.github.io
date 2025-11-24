"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <Link href="/" className="font-bold text-xl underline hover:text-primary">
              News
            </Link>

            <div className="flex flex-wrap gap-2">
              {(Object.keys(categoryLabels) as Category[]).map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(category)}
                >
                  {categoryLabels[category]}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredUpdates.map((update: Update, index: number) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row gap-2 sm:gap-4 pb-3 border-b last:border-b-0"
              >
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                    {update.date}
                  </span>
                  <Badge variant="secondary" className="hidden sm:inline-flex">
                    {categoryLabels[update.category as Category]}
                  </Badge>
                </div>
                <p
                  className="text-base leading-relaxed flex-1"
                  dangerouslySetInnerHTML={{ __html: update.description }}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
