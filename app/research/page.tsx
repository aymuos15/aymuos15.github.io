"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function Research() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedResearch, setSelectedResearch] = useState<number | null>(null);
  const academicResearch = [
    {
      title: "Segmentation at all granularity",
      content: "Building instance imblance invariant networks, losses and metrics for Semantic, Instance, Panoptic and Part Aware Segmentation. Part of this is in collaboration with BraTS where I am organiser for BraTS-METS.",
      image: "/research_pics/a_street_tunis_2021.34.6.jpg",
    },
    {
      title: "Kernels for Segmentation",
      content: "Engineering Triton kernels specifically to enhance segmentation pipelines.",
      image: "/research_pics/jan_Novak_old_man.jpg",
    },
    {
      title: "Federated Learning on the Edge",
      content: "With Yang Li, we are developing end-to-end hardware + software stack for FL on the Edge and work on the hyper-optimisation of neural networks for edge deployment.",
      image: "/research_pics/paul-klee_color-chart-qu-1.png",
    },
  ];

  const industryResearch = [
    {
      title: "Parallelism for Large Models",
      content: "Investigate all sorts of parallelism strategies to massively accelerate large model training and inference.",
      image: "/research_pics/keelmen_heaving_in_coals_by_moonlight_1942.9.86.jpg",
    },
    {
      title: "Data Acquisition for Large Code Models",
      content: "Orchestration of scalable pipelines for acquisition, filtering, and curation of high-quality, multi-lingual code datasets to train and test large code models.",
      image: "/research_pics/jeunesse_passe_vite_vertu_..._2015.143.103.jpg",
    },
  ];

  const allResearch = [...academicResearch, ...industryResearch];

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <section className="max-w-xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="border border-border rounded-lg overflow-hidden"
        >
          {/* Research Block */}
          <div className="grid grid-cols-[2fr_1fr] relative">
            <div className="border-r border-border">
              {allResearch.map((research, index) => (
                <motion.div
                  key={index}
                  layout
                  className="px-6 py-3 border-b border-border cursor-pointer hover:bg-muted/50 transition-all relative overflow-hidden"
                  onClick={() => setSelectedResearch(selectedResearch === index ? null : index)}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <AnimatePresence>
                    {selectedResearch === index && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        className="absolute inset-0 z-0"
                      >
                        <Image
                          src={research.image}
                          alt={research.title}
                          fill
                          className="object-cover"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <h3 className="text-lg font-semibold relative z-10">
                    {research.title}
                  </h3>
                </motion.div>
              ))}
            </div>
            <div className="absolute left-[66.66%] top-0 bottom-0 right-0 flex items-start justify-start p-6 overflow-y-auto scrollbar-hide">
              <AnimatePresence mode="wait">
                {selectedResearch !== null && (
                  <motion.p
                    key={selectedResearch}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="text-sm leading-relaxed"
                  >
                    {allResearch[selectedResearch].content}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Grants & Reviewing Side by Side */}
          <div className="grid grid-cols-[2fr_1fr] border-t border-border">
            {/* Grants Block */}
            <div className="px-6 py-3 border-r border-border">
              <h3
                className="text-lg font-semibold cursor-pointer hover:opacity-70"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                Grants
              </h3>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="text-sm leading-relaxed mt-3">
                      My Phd is fully funded by the{" "}
                      <Link
                        href="https://kcl-mrcdtp.com/"
                        target="_blank"
                        className="underline hover:opacity-70"
                      >
                        Medical Research Council of UK
                      </Link>
                      . I was awarded the{" "}
                      <Link
                        href="https://www.ukri.org/opportunity/fast-start-innovation/"
                        target="_blank"
                        className="underline hover:opacity-70"
                      >
                        UKRI fast track grant
                      </Link>{" "}
                      for my MSc. During UG, I secured the{" "}
                      <Link
                        href="https://www.mitacs.ca/our-programs/globalink-research-internship-students/"
                        target="_blank"
                        className="underline hover:opacity-70"
                      >
                        MITACS Globalink Fellowship
                      </Link>
                      .
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Reviewing Block */}
            <div className="px-6 py-3">
              <h3
                className="text-lg font-semibold cursor-pointer hover:opacity-70"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                Reviewing
              </h3>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="text-sm leading-relaxed mt-3">
                      I frequently review for MICCAI, ICML, NeurIPS, ICLR, AISTATS and IEEE-ISBI.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
