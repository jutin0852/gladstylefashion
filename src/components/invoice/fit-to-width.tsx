"use client";

import { useEffect, useRef, useState } from "react";

/** Scales a fixed-width sheet down to fit narrow screens without changing the sheet itself. */
export function FitToWidth({ width, children }: { width: number; children: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const outerNode = outer.current;
    const innerNode = inner.current;
    if (!outerNode || !innerNode) return;
    const update = () => {
      const next = Math.min(1, outerNode.clientWidth / width);
      setScale(next);
      setHeight(innerNode.offsetHeight * next);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(outerNode);
    observer.observe(innerNode);
    return () => observer.disconnect();
  }, [width]);

  return (
    <div ref={outer} className="w-full overflow-hidden" style={{ height }}>
      <div ref={inner} style={{ width, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );
}
