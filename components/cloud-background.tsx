"use client";

import { useEffect, useRef } from "react";

export function CloudBackground() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadP5 = async () => {
      // @ts-ignore
      const p5 = (await import("p5")).default;

      const sketch = (p: any) => {
        const cloudPixelScale = 4;
        const cloudCutOff = 0.5;
        const panSpeed = 6;
        const cloudEvolutionSpeed = 3;

        p.setup = () => {
          if (canvasRef.current) {
            const canvas = p.createCanvas(canvasRef.current.offsetWidth, canvasRef.current.offsetHeight);
            canvas.parent(canvasRef.current);
          }
        };

        p.windowResized = () => {
          if (canvasRef.current) {
            p.resizeCanvas(canvasRef.current.offsetWidth, canvasRef.current.offsetHeight);
          }
        };

        p.draw = () => {
          // Sky blue background (light mode) or orange background (dark mode)
          const isDarkMode = document.documentElement.classList.contains('dark');
          if (isDarkMode) {
            p.background(201, 115, 89); // #C97359 orange
          } else {
            p.background(19, 142, 192); // blue
          }

          for (let x = 0; x <= p.width; x += cloudPixelScale) {
            for (let y = 0; y <= p.height; y += cloudPixelScale) {
              let tinyTimeOffset = p.millis() / 100000;
              let noiseScale = 0.01;

              let n = p.noise(
                x * noiseScale + tinyTimeOffset * panSpeed,
                y * noiseScale + tinyTimeOffset * 0.25 * panSpeed,
                tinyTimeOffset * cloudEvolutionSpeed
              );

              if (n < cloudCutOff) continue;

              let alpha = p.map(n, cloudCutOff, 0.65, 10, 255);
              p.fill(255, alpha);
              p.textSize(cloudPixelScale * 1.15);
              p.text(getLetterForCoordinate(x, y), x, y);
            }
          }
        };

        function getLetterForCoordinate(x: number, y: number) {
          let hash = (x + y) * Math.sin(x * y);
          let bit = Math.abs(Math.floor(hash * 1000)) % 2;
          return bit.toString();
        }
      };

      if (canvasRef.current && !p5InstanceRef.current) {
        p5InstanceRef.current = new p5(sketch);
      }
    };

    loadP5();

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ borderRadius: "inherit" }}
    />
  );
}
