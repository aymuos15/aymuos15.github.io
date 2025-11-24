"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function About() {
  const [showCollaborators, setShowCollaborators] = useState(false);

  return (
    <div className="min-h-screen relative">
      {/* Split background - horizontal on desktop, vertical on mobile */}
      <div className="fixed inset-0 flex md:flex-row flex-col">
        <div className="md:w-1/2 w-full md:h-full h-1/2 bg-[#14120b]" />
        <div className="md:w-1/2 w-full md:h-full h-1/2 bg-[#f7f7f4]" />
      </div>

      {/* Content layer */}
      <div className="relative min-h-screen flex items-center justify-center px-4">
        <div className="max-w-2xl space-y-6 z-10">
          <style jsx>{`
            .split-text {
              background: linear-gradient(to right, #f7f7f4 0%, #f7f7f4 50%, #14120b 50%, #14120b 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            @media (max-width: 768px) {
              .split-text {
                background: linear-gradient(to bottom, #f7f7f4 0%, #f7f7f4 50%, #14120b 50%, #14120b 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
              }
            }
          `}</style>

          <p className="text-base leading-relaxed text-justify split-text">
            My MSc was with{" "}
            <Link href="https://eecs.qmul.ac.uk/~gslabaugh/" target="_blank" className="split-text underline hover:opacity-70">
              Greg Slabaugh
            </Link>{" "}
            and{" "}
            <Link href="https://www.unicornmedics.com/" target="_blank" className="split-text underline hover:opacity-70">
              Vineet Batta
            </Link>{" "}
            at QMUL. Did my UG with{" "}
            <Link href="https://www.srmist.edu.in/faculty/dr-s-dhanalakshmi/" target="_blank" className="split-text underline hover:opacity-70">
              Dhanalakshmi Samiappan
            </Link>{" "}
            and{" "}
            <Link href="https://nitdgp.ac.in/department/computer-science-engineering/faculty-1/debashis-nandi" target="_blank" className="split-text underline hover:opacity-70">
              Debashis Nandi
            </Link>{" "}
            (NIT-D) at SRM.
          </p>

          <p className="text-base leading-relaxed text-justify split-text">
            I am always exploring London's food scene or breaking down complex rhyme schemes in rap.
            In school, I represented my country in futsal and debated nationally.
          </p>

          <p className="text-base leading-relaxed text-justify split-text">
            I regularly mentor students (see{" "}
            <Link href="https://in2scienceuk.org/our-programmes/in2stem/" target="_blank" className="split-text underline hover:opacity-70">
              In2Stem!
            </Link>
            ) and researchers. Please{" "}
            <Link href="mailto:soumya_snigdha.kundu@kcl.ac.uk" className="split-text underline hover:opacity-70">
              reach out!
            </Link>{" "}
            There are many who have{" "}
            <span
              className="text-white underline hover:opacity-70 cursor-pointer"
              onClick={() => setShowCollaborators(!showCollaborators)}
            >
              supported my research
            </span>
            .
          </p>

          <AnimatePresence>
            {showCollaborators && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden pl-4"
                style={{
                  borderLeft: '2px solid',
                  borderImage: 'linear-gradient(to bottom, #f7f7f4 50%, #14120b 50%) 1'
                }}
              >
                <p className="text-base leading-relaxed text-justify split-text">
                  In no particular order, Everyone at CAI4CAI:{" "}
                  <Link href="https://cai4cai.ml/author/lorena-garcia-foncillas-macias/" className="split-text underline hover:opacity-70">
                    Lorena Macias
                  </Link>
                  ,{" "}
                  <Link href="https://cai4cai.ml/author/aaron-kujawa/" className="split-text underline hover:opacity-70">
                    Aaron Kujawa
                  </Link>
                  ,{" "}
                  <Link href="https://cai4cai.ml/author/theo-barfoot/" className="split-text underline hover:opacity-70">
                    Theo Barfoot
                  </Link>
                  ,{" "}
                  <Link href="https://cai4cai.ml/author/marina-ivory/" className="split-text underline hover:opacity-70">
                    Marina Ivory
                  </Link>
                  ,{" "}
                  <Link href="https://cai4cai.ml/author/navodini-wijethilake/" className="split-text underline hover:opacity-70">
                    Navodini Wijethilake
                  </Link>
                  ,{" "}
                  <Link href="https://cai4cai.ml/author/meng-wei/" className="split-text underline hover:opacity-70">
                    Meng Wei
                  </Link>
                  ,{" "}
                  <Link href="https://cai4cai.ml/author/oluwatosin-alabi/" className="split-text underline hover:opacity-70">
                    Oluwatosin Alabi
                  </Link>{" "}
                  and{" "}
                  <Link href="https://cai4cai.ml/author/martin-huber/" className="split-text underline hover:opacity-70">
                    Martin Huber
                  </Link>
                  . Along with:{" "}
                  <Link href="https://www.linkedin.com/in/pooja-ganesh-alpha/" className="split-text underline hover:opacity-70">
                    Pooja Ganesh
                  </Link>{" "}
                  (SEL),{" "}
                  <Link href="https://rakshit-naidu.github.io/" className="split-text underline hover:opacity-70">
                    Rakshit Naidu
                  </Link>{" "}
                  (GaTech),{" "}
                  <Link href="https://www.linkedin.com/in/aarsh-chaube-568b901b2/?originalSubdomain=in" className="split-text underline hover:opacity-70">
                    Aarsh Chaube
                  </Link>{" "}
                  (Edinburgh),{" "}
                  <Link href="https://www.oncology.ox.ac.uk/research/research-group/mcgowan-group" className="split-text underline hover:opacity-70">
                    Mona Furukawa
                  </Link>{" "}
                  (Oxford),{" "}
                  <Link href="https://www.kcl.ac.uk/people/yang-li" className="split-text underline hover:opacity-70">
                    Yang Li
                  </Link>{" "}
                  (KCL),{" "}
                  <Link href="https://www.kcl.ac.uk/people/feng-he" className="split-text underline hover:opacity-70">
                    Feng He
                  </Link>{" "}
                  (KCL), and{" "}
                  <Link href="https://www.kcl.ac.uk/people/ruoyang-liu" className="split-text underline hover:opacity-70">
                    Ruoyang Liu
                  </Link>{" "}
                  (KCL).
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
