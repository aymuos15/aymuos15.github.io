"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

interface Photo {
  src: string;
  caption: string;
  alt: string;
}

const photos: Photo[] = [
  { src: "/assets/me.jpeg", caption: "Me :)", alt: "Profile" },
  { src: "/assets/bhavith.jpeg", caption: "Oldest friend, Bhavith.", alt: "Bhavith" },
  { src: "/assets/cai4cai.jpg", caption: "CAI4CAI Group", alt: "CAI4CAI Group" },
  { src: "/assets/isbi.jpeg", caption: "ISBI'25 with Bartek and Mona.", alt: "ISBI'25" },
  { src: "/assets/parents.jpeg", caption: "Parents.", alt: "Parents" },
  { src: "/assets/pupil.jpeg", caption: "The gang.", alt: "The gang" },
  { src: "/assets/WhatsApp Image 2025-09-19 at 12.53.27.jpeg", caption: "Cosine summer retreat", alt: "Cosine summer retreat" },
];

export default function Gallery() {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo>(photos[0]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardContent className="pt-6">
          <Link href="/" className="font-bold text-xl underline hover:text-primary mb-6 block">
            Gallery
          </Link>

          <div className="space-y-6">
            <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-muted">
              <Image
                src={selectedPhoto.src}
                alt={selectedPhoto.alt}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 896px"
              />
            </div>

            <p className="text-center text-base text-muted-foreground">
              {selectedPhoto.caption}
            </p>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2">
              {photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedPhoto(photo)}
                  className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all hover:scale-105 ${
                    selectedPhoto.src === photo.src
                      ? "border-primary"
                      : "border-transparent"
                  }`}
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 25vw, (max-width: 768px) 16vw, 12vw"
                  />
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
