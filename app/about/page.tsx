"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function About() {
  const [showCollaborators, setShowCollaborators] = useState(false);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/" className="font-bold underline hover:text-primary">
              Bio
            </Link>
            <span>|</span>
            <Link
              href="https://www.linkedin.com/in/soumyaskundu/"
              target="_blank"
              title="LinkedIn Profile"
            >
              <Image
                src="/assets/64px-LinkedIn_logo_initials.png"
                alt="LinkedIn"
                width={16}
                height={16}
                className="inline"
              />
            </Link>
          </div>

          <div className="space-y-4">
            <p className="text-base leading-relaxed">
              My MSc was with{" "}
              <Link href="https://eecs.qmul.ac.uk/~gslabaugh/" target="_blank" className="underline hover:text-primary">
                Greg Slabaugh
              </Link>{" "}
              and{" "}
              <Link href="https://www.unicornmedics.com/" target="_blank" className="underline hover:text-primary">
                Vineet Batta
              </Link>{" "}
              at QMUL. Did my UG with{" "}
              <Link href="https://www.srmist.edu.in/faculty/dr-s-dhanalakshmi/" target="_blank" className="underline hover:text-primary">
                Dhanalakshmi Samiappan
              </Link>{" "}
              and{" "}
              <Link href="https://nitdgp.ac.in/department/computer-science-engineering/faculty-1/debashis-nandi" target="_blank" className="underline hover:text-primary">
                Debashis Nandi
              </Link>{" "}
              (NIT-D) at SRM.
            </p>

            <p className="text-base leading-relaxed">
              I am always exploring London's food scene or breaking down complex rhyme schemes in rap.
              In school, I represented my country in futsal and debated nationally.
            </p>

            <p className="text-base leading-relaxed">
              I regularly mentor students (see{" "}
              <Link href="https://in2scienceuk.org/our-programmes/in2stem/" target="_blank" className="underline hover:text-primary">
                In2Stem!
              </Link>
              ) and researchers. Please{" "}
              <Link href="mailto:soumya_snigdha.kundu@kcl.ac.uk" className="underline hover:text-primary">
                reach out!
              </Link>{" "}
              There are many who have{" "}
              <Button
                variant="link"
                className="p-0 h-auto underline hover:text-primary"
                onClick={() => setShowCollaborators(!showCollaborators)}
              >
                supported my research
                {showCollaborators ? (
                  <ChevronUp className="inline ml-1 h-4 w-4" />
                ) : (
                  <ChevronDown className="inline ml-1 h-4 w-4" />
                )}
              </Button>
              .
            </p>

            {showCollaborators && (
              <Card className="border-l-2 border-primary">
                <CardContent className="pt-4">
                  <p className="text-base leading-relaxed">
                    In no particular order, Everyone at CAI4CAI:{" "}
                    <Link href="https://cai4cai.ml/author/lorena-garcia-foncillas-macias/" className="underline hover:text-primary">
                      Lorena Macias
                    </Link>
                    ,{" "}
                    <Link href="https://cai4cai.ml/author/aaron-kujawa/" className="underline hover:text-primary">
                      Aaron Kujawa
                    </Link>
                    ,{" "}
                    <Link href="https://cai4cai.ml/author/theo-barfoot/" className="underline hover:text-primary">
                      Theo Barfoot
                    </Link>
                    ,{" "}
                    <Link href="https://cai4cai.ml/author/marina-ivory/" className="underline hover:text-primary">
                      Marina Ivory
                    </Link>
                    ,{" "}
                    <Link href="https://cai4cai.ml/author/navodini-wijethilake/" className="underline hover:text-primary">
                      Navodini Wijethilake
                    </Link>
                    ,{" "}
                    <Link href="https://cai4cai.ml/author/meng-wei/" className="underline hover:text-primary">
                      Meng Wei
                    </Link>
                    ,{" "}
                    <Link href="https://cai4cai.ml/author/oluwatosin-alabi/" className="underline hover:text-primary">
                      Oluwatosin Alabi
                    </Link>{" "}
                    and{" "}
                    <Link href="https://cai4cai.ml/author/martin-huber/" className="underline hover:text-primary">
                      Martin Huber
                    </Link>
                    . Along with:{" "}
                    <Link href="https://www.linkedin.com/in/pooja-ganesh-alpha/" className="underline hover:text-primary">
                      Pooja Ganesh
                    </Link>{" "}
                    (SEL),{" "}
                    <Link href="https://rakshit-naidu.github.io/" className="underline hover:text-primary">
                      Rakshit Naidu
                    </Link>{" "}
                    (GaTech),{" "}
                    <Link href="https://www.linkedin.com/in/aarsh-chaube-568b901b2/?originalSubdomain=in" className="underline hover:text-primary">
                      Aarsh Chaube
                    </Link>{" "}
                    (Edinburgh),{" "}
                    <Link href="https://www.oncology.ox.ac.uk/research/research-group/mcgowan-group" className="underline hover:text-primary">
                      Mona Furukawa
                    </Link>{" "}
                    (Oxford),{" "}
                    <Link href="https://www.kcl.ac.uk/people/yang-li" className="underline hover:text-primary">
                      Yang Li
                    </Link>{" "}
                    (KCL),{" "}
                    <Link href="https://www.kcl.ac.uk/people/feng-he" className="underline hover:text-primary">
                      Feng He
                    </Link>{" "}
                    (KCL), and{" "}
                    <Link href="https://www.kcl.ac.uk/people/ruoyang-liu" className="underline hover:text-primary">
                      Ruoyang Liu
                    </Link>{" "}
                    (KCL).
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
