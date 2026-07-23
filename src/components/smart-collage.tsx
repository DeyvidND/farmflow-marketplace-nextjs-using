"use client";

import { useEffect, useState } from "react";
import type { CoverCrop } from "@/lib/types";
import { cfImage, cfSrcset } from "@/lib/img";
import { coverCropStyle } from "@/lib/cover";
import { CatIcon } from "@/components/icon";

/**
 * Hero photo collage that knows its photos. Two fixes over the old dumb grid:
 * 1. The old 2×2 grid had 5 cells' worth of spans — the wide tile landed on an
 *    invisible zero-height implicit row. Now the grid is explicitly 3 rows:
 *    tall left (spans 2) + two stacked right + wide bottom (spans 2 cols).
 * 2. Photos are ASSIGNED to slots by orientation (probed from a 64px thumb):
 *    most-portrait → tall slot, most-landscape → wide slot, the rest → squares.
 *    Labels travel with their photos, and each photo honors the farmer's
 *    coverCrop focal point.
 */

export type CollageTile = {
  img: string | null;
  label: string;
  icon: string;
  grad: string;
  cc?: CoverCrop | null;
};

// Slot geometry: index → className. Order: tall, sq1, sq2, wide.
const SLOTS = [
  "row-span-2", // tall left
  "", // right top
  "", // right bottom
  "col-span-2", // wide bottom
];

// The wide bottom slot spans the whole hero column — its `sizes` must say so, or the
// browser picks a half-width candidate and the photo lands soft on retina.
const SLOT_SIZES = [
  "(min-width:1024px) 290px, 45vw",
  "(min-width:1024px) 290px, 45vw",
  "(min-width:1024px) 290px, 45vw",
  "(min-width:1024px) 580px, 92vw",
];

export function SmartCollage({ tiles }: { tiles: CollageTile[] }) {
  const [aspects, setAspects] = useState<Record<string, number>>({});

  useEffect(() => {
    let alive = true;
    tiles.forEach((t) => {
      if (!t.img) return;
      const probe = new Image();
      probe.onload = () => {
        if (!alive || !probe.naturalWidth) return;
        setAspects((a) => (a[t.img!] ? a : { ...a, [t.img!]: probe.naturalWidth / probe.naturalHeight }));
      };
      probe.src = cfImage(t.img, 64) ?? t.img;
    });
    return () => {
      alive = false;
    };
  }, [tiles]);

  const measured = tiles.every((t) => !t.img || aspects[t.img]);

  // Assign tiles to slots. Before measuring, keep the given order (SSR-stable);
  // once ratios are known: most-portrait → tall, most-landscape → wide.
  let order = tiles.slice(0, 4);
  if (measured && order.filter((t) => t.img).length >= 2) {
    const withA = order.map((t) => ({ t, a: t.img ? aspects[t.img] : 1 }));
    const byPortrait = [...withA].sort((p, q) => p.a - q.a);
    const tall = byPortrait[0]; // narrowest
    const wide = byPortrait[byPortrait.length - 1]; // widest
    const mid = byPortrait.slice(1, -1);
    order = [tall.t, ...(mid[0] ? [mid[0].t] : []), ...(mid[1] ? [mid[1].t] : []), wide.t];
  }

  return (
    <div className="grid h-[clamp(400px,50vw,540px)] grid-cols-2 grid-rows-[1fr_1fr_0.85fr] gap-3">
      {order.map((t, i) => (
        <div
          key={t.label + i}
          className={`relative flex items-center justify-center overflow-hidden rounded-[20px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)] ${SLOTS[i] ?? ""}`}
          style={t.img ? undefined : { background: t.grad }}
        >
          {t.img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cfImage(t.img, i === 3 ? 1000 : 640)}
              srcSet={cfSrcset(t.img, i === 3 ? [480, 640, 800, 1000, 1200] : [360, 480, 640, 800])}
              sizes={SLOT_SIZES[i] ?? SLOT_SIZES[0]}
              fetchPriority="high"
              decoding="async"
              alt=""
              className="absolute inset-0 size-full object-cover"
              style={coverCropStyle(t.cc)}
            />
          ) : (
            <CatIcon name={t.icon} className="size-12 text-sage/70" />
          )}
          <span className="absolute bottom-3.5 left-3.5 rounded-full bg-card/90 px-3 py-1.5 text-xs font-bold text-foreground/85">
            {t.label}
          </span>
        </div>
      ))}
    </div>
  );
}
