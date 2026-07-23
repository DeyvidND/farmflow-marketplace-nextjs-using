"use client";

import { useEffect, useState } from "react";
import { cfImage, cfSrcset } from "@/lib/img";

/**
 * Wide-slot cover that picks the RIGHT photo. Given all of a farmer's photos it
 * probes their ratios (64px thumb) and shows the most landscape one — a person
 * portrait squeezed into a wide banner crops at the chest, a field/produce shot
 * belongs there. If every candidate is a portrait, it top-biases the crop so the
 * face survives.
 */
export function SmartCover({
  images,
  width = 700,
  sizes,
  alt = "",
  className,
}: {
  images: string[];
  width?: number;
  sizes?: string;
  alt?: string;
  className?: string;
}) {
  const [aspects, setAspects] = useState<Record<string, number>>({});

  useEffect(() => {
    let alive = true;
    images.forEach((u) => {
      const probe = new Image();
      probe.onload = () => {
        if (!alive || !probe.naturalWidth) return;
        setAspects((a) => (a[u] ? a : { ...a, [u]: probe.naturalWidth / probe.naturalHeight }));
      };
      probe.src = cfImage(u, 64) ?? u;
    });
    return () => {
      alive = false;
    };
  }, [images]);

  if (images.length === 0) return null;
  const measured = images.every((u) => aspects[u]);
  const best = measured ? [...images].sort((a, b) => aspects[b] - aspects[a])[0] : images[0];
  const portraitInWideBox = measured && aspects[best] < 1;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={cfImage(best, width)}
      srcSet={cfSrcset(best, [480, 640, 800, 1000])}
      sizes={sizes}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      style={portraitInWideBox ? { objectPosition: "center 22%" } : undefined}
    />
  );
}
