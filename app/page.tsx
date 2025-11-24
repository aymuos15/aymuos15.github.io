"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [showPronunciation, setShowPronunciation] = useState(false);

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4">
      <div className="max-w-2xl space-y-6">
        <div>
          <h1
            className="text-3xl font-bold cursor-pointer hover:opacity-70"
            onClick={() => setShowPronunciation(!showPronunciation)}
          >
            Soumya Snigdha Kundu
          </h1>
          <AnimatePresence>
            {showPronunciation && (
              <motion.p
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 4 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="text-sm text-muted-foreground overflow-hidden"
              >
                (Shou-mo Snigh-dho Kun-du)
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <p className="text-base leading-relaxed text-justify">
          2<sup>nd</sup> Year Ph.D. working on ML for Neuro-Oncology at KCL advised by{" "}
          <Link href="https://cai4cai.ml/author/tom-vercauteren/" className="underline hover:opacity-70" target="_blank">
            Tom Vercauteren
          </Link>{" "}
          and{" "}
          <Link href="https://cai4cai.ml/author/jonathan-shapey/" className="underline hover:opacity-70" target="_blank">
            Jonathan Shapey
          </Link>
          .
        </p>

        <p className="text-base leading-relaxed text-justify">
          Previously, I've interned at{" "}
          <Link href="https://cosine.sh/" className="underline hover:opacity-70" target="_blank">
            Cosine
          </Link>{" "}
          (YC 23), with{" "}
          <Link href="https://www.bdi.ox.ac.uk/Team/bartek-papiez" className="underline hover:opacity-70" target="_blank">
            Bartek Papiez
          </Link>{" "}
          at Oxford,{" "}
          <Link href="https://pdeperio.github.io/" className="underline hover:opacity-70" target="_blank">
            Patrick de Perio
          </Link>{" "}
          and{" "}
          <Link href="https://www.uvic.ca/science/physics/vispa/people/adjunct/konaka.php" className="underline hover:opacity-70" target="_blank">
            Akira Konaka
          </Link>{" "}
          at TRIUMF-Canada and{" "}
          <Link href="https://sites.google.com/umn.edu/tarungangwar/home" className="underline hover:opacity-70" target="_blank">
            Tarun Gangwar
          </Link>{" "}
          at IIT-GN.
        </p>

        <p className="text-base text-justify">
          Do take a look at my{" "}
          <Link href="/research" className="underline hover:opacity-70">
            research
          </Link>
          ,{" "}
          <Link href="/updates" className="underline hover:opacity-70">
            updates
          </Link>
          ,{" "}
          <Link href="https://aymuos15.github.io/blog/" className="underline hover:opacity-70" target="_blank" rel="noopener noreferrer">
            blog
          </Link>
          ,{" "}
          <Link href="/gallery" className="underline hover:opacity-70">
            gallery
          </Link>
          , or a bit more about{" "}
          <Link href="/about" className="underline hover:opacity-70">
            me
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
