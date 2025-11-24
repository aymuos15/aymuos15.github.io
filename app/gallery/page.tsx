"use client";

import { useState } from "react";
import Image from "next/image";

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
  const [isPaused, setIsPaused] = useState(false);

  // Duplicate photos for seamless loop
  const duplicatedPhotos = [...photos, ...photos, ...photos];

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center px-4 py-8">
      <div className="max-w-4xl mx-auto w-full">
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

          <div className="relative overflow-hidden max-w-[340px] mx-auto">
            <style dangerouslySetInnerHTML={{
              __html: `
                @keyframes gallery-scroll {
                  0% {
                    transform: translateX(0);
                  }
                  100% {
                    transform: translateX(calc(-112px * ${photos.length}));
                  }
                }
              `
            }} />
            <div
              className="flex gap-4"
              style={{
                animation: "gallery-scroll 10s linear infinite",
                animationPlayState: isPaused ? "paused" : "running",
              }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {duplicatedPhotos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedPhoto(photo)}
                  onMouseEnter={() => setSelectedPhoto(photo)}
                  className="relative flex-shrink-0 w-24 h-24 rounded-md overflow-hidden border-2 border-transparent hover:border-primary transition-all"
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
