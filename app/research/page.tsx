"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function Research() {
  const [showGrants, setShowGrants] = useState(false);
  const [showReviewing, setShowReviewing] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const toggleCard = (index: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedCards(newExpanded);
  };

  const academicResearch = [
    {
      title: "Volumetric Segmentation at all granularity",
      content: "Building instance imblance invariant networks, losses and metrics for Semantic, Instance, Panoptic and Part Aware Segmentation. Part of this is in collaboration with BraTS where I am organiser for BraTS-METS.",
    },
    {
      title: "Kernels for Segmentation",
      content: "Engineering Triton kernels specifically to enhance segmentation pipelines.",
    },
    {
      title: "Federated Learning on the Edge",
      content: "With Yang Li, we are developing end-to-end hardware + software stack for FL on the Edge and work on the hyper-optimisation of neural networks for edge deployment.",
    },
  ];

  const industryResearch = [
    {
      title: "Parallelism for Large Models",
      content: "Investigate all sorts of parallelism strategies to massively accelerate large model training and inference.",
    },
    {
      title: "Data Acquisition for Large Code Models",
      content: "Orchestration of scalable pipelines for acquisition, filtering, and curation of high-quality, multi-lingual code datasets to train and test large code models.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/" className="font-bold underline hover:text-primary">
              Core Academic Research
            </Link>
            <span>|</span>
            <Link
              href="https://scholar.google.com/citations?user=WmHtKBYAAAAJ&hl=en&oi=ao"
              target="_blank"
              title="Google Scholar Profile"
            >
              <Image
                src="/assets/google_scholar.png"
                alt="Google Scholar"
                width={20}
                height={20}
                className="inline"
              />
            </Link>
            <Link href="https://github.com/aymuos15" target="_blank" title="GitHub Profile">
              <Image
                src="/assets/github_logo.png"
                alt="GitHub"
                width={20}
                height={20}
                className="inline"
              />
            </Link>
          </div>

          <div className="grid gap-4">
            {academicResearch.map((research, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => toggleCard(index)}
              >
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    {research.title}
                    {expandedCards.has(index) ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </CardTitle>
                </CardHeader>
                {expandedCards.has(index) && (
                  <CardContent>
                    <p className="text-base leading-relaxed">{research.content}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-6">
            <Link href="/" className="font-bold underline hover:text-primary">
              Industry Research (with Cosine)
            </Link>
          </div>

          <div className="grid gap-4">
            {industryResearch.map((research, index) => {
              const cardIndex = academicResearch.length + index;
              return (
                <Card
                  key={cardIndex}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => toggleCard(cardIndex)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      {research.title}
                      {expandedCards.has(cardIndex) ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  {expandedCards.has(cardIndex) && (
                    <CardContent>
                      <p className="text-base leading-relaxed">{research.content}</p>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <p className="text-base">
              I have been fortunate with{" "}
              <Button
                variant="link"
                className="p-0 h-auto underline hover:text-primary"
                onClick={() => setShowGrants(!showGrants)}
              >
                grants
                {showGrants ? (
                  <ChevronUp className="inline ml-1 h-4 w-4" />
                ) : (
                  <ChevronDown className="inline ml-1 h-4 w-4" />
                )}
              </Button>
              .
            </p>

            {showGrants && (
              <Card className="border-l-2 border-primary mt-2">
                <CardContent className="pt-4">
                  <p className="text-base leading-relaxed">
                    My Phd is fully funded by the{" "}
                    <Link href="https://kcl-mrcdtp.com/" target="_blank" className="underline hover:text-primary">
                      Medical Research Council of UK
                    </Link>
                    . I was awarded the{" "}
                    <Link href="https://www.ukri.org/opportunity/fast-start-innovation/" target="_blank" className="underline hover:text-primary">
                      UKRI fast track grant
                    </Link>{" "}
                    for my MSc. During UG, I secured the{" "}
                    <Link href="https://www.mitacs.ca/our-programs/globalink-research-internship-students/" target="_blank" className="underline hover:text-primary">
                      MITACS Globalink Fellowship
                    </Link>
                    .
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <p className="text-base">
              I also frequently{" "}
              <Button
                variant="link"
                className="p-0 h-auto underline hover:text-primary"
                onClick={() => setShowReviewing(!showReviewing)}
              >
                review
                {showReviewing ? (
                  <ChevronUp className="inline ml-1 h-4 w-4" />
                ) : (
                  <ChevronDown className="inline ml-1 h-4 w-4" />
                )}
              </Button>
              .
            </p>

            {showReviewing && (
              <Card className="border-l-2 border-primary mt-2">
                <CardContent className="pt-4">
                  <p className="text-base leading-relaxed">
                    MICCAI, ICML, NeurIPS, ICLR, AISTATS and IEEE-ISBI.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
