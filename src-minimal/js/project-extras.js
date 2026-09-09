// Themes that exist only on the minimal site. They are merged after the
// shared list from src/js/research.js, so the main site is untouched.
export const extraThemes = [
  {
    blurb: "Moving mass, sparsely.",
    id: "optimal-transport",
    interactive: "sinkhorn",
    intro:
      "Entropic optimal transport finds a coupling between two distributions with Sinkhorn iterations. SinkSLOT reaches the same plans through a sparse lifted formulation. Below, watch a plan form as the regularisation changes.",
    orb3d: "transport",
    papers: [
      {
        title: "SinkSLOT: Sinkhorn via Sparse Lifted Optimal Transport",
        url: "https://arxiv.org/abs/2608.28262",
        venue: "Preprint 2026",
      },
    ],
    tint: "#7cbcd4",
    title: "Optimal Transport",
  },
  {
    blurb: "CuteSinkhorn.",
    id: "cuda-kernels",
    interactive: "cute",
    intro: "CuteSinkhorn.",
    orb3d: "tiles",
    papers: [],
    tint: "#8cc8a0",
    title: "CUDA Kernels",
  },
];
