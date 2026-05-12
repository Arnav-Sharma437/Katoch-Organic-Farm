"use client";

import { useEffect, useRef } from "react";
import VanillaTilt from "vanilla-tilt";

export type GalleryItem = {
  id: string;
  title: string;
  year: string;
  imageUrl: string;
};

export default function Gallery({ items }: { items: GalleryItem[] }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-tilt]"));
    VanillaTilt.init(nodes, {
      max: 15,
      speed: 400,
      glare: true,
      "max-glare": 0.2,
      scale: 1.02,
    });
    return () => {
      nodes.forEach((el) => {
        const vt = (el as HTMLElement & { vanillaTilt?: { destroy: () => void } }).vanillaTilt;
        vt?.destroy?.();
      });
    };
  }, [items]);

  return (
    <div className="gallery-grid" ref={rootRef}>
      {items.map((item) => (
        <div
          key={item.id}
          className="gallery-item fade-up"
          data-tilt
          data-tilt-max="15"
          data-tilt-speed="400"
          data-tilt-perspective="1000"
        >
          <div
            className="gallery-img"
            style={{ backgroundImage: `url('${item.imageUrl}')` }}
          />
          <div className="gallery-info">
            <h3>
              {item.title} ({item.year})
            </h3>
          </div>
        </div>
      ))}
    </div>
  );
}
