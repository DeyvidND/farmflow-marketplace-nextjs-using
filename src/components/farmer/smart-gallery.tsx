"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cfImage, cfSrcset } from "@/lib/img";

/**
 * Aspect-aware "justified" photo gallery (Google-Photos style). The dumb fixed grid
 * forced portrait shots into landscape tiles and vice versa — ugly crops. This one
 * measures each photo's real aspect ratio (via a tiny 64px probe, instant), then packs
 * rows so every photo keeps its OWN proportions: row height flexes, widths follow the
 * ratios, nothing is cropped. The operator's layout choice tunes the packing:
 *   wide   → 1 photo per row (big, aspect-preserved)
 *   row    → up to 3 per row
 *   grid   → up to 2 per row
 *   mosaic → auto-greedy (2-3 per row depending on how wide the photos are)
 */

const GAP = 10;

type Dim = { r: number }; // aspect ratio w/h

export function SmartGallery({ images, layout }: { images: string[]; layout: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [dims, setDims] = useState<Record<string, Dim>>({});

  // Container width (responsive, tracks resizes).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Probe each photo's aspect ratio with a 64px thumbnail — tiny, cache-friendly,
  // and the ratio is identical to the full-size image.
  useEffect(() => {
    let alive = true;
    images.forEach((u) => {
      const probe = new Image();
      probe.onload = () => {
        if (!alive || !probe.naturalWidth || !probe.naturalHeight) return;
        setDims((d) => (d[u] ? d : { ...d, [u]: { r: probe.naturalWidth / probe.naturalHeight } }));
      };
      probe.src = cfImage(u, 64) ?? u;
    });
    return () => {
      alive = false;
    };
  }, [images]);

  const ready = width > 0 && images.every((u) => dims[u]);

  const rows = useMemo(() => {
    if (!ready) return [];
    const maxPerRow = layout === "wide" ? 1 : layout === "grid" ? 2 : 3;
    // Target row height scales with container; phones get shorter rows.
    const target = layout === "wide" ? Math.min(420, width * 0.56) : width < 560 ? 168 : 232;
    const out: { url: string; r: number; w: number }[][] = [];
    let cur: { url: string; r: number }[] = [];

    const close = (items: { url: string; r: number }[], last: boolean) => {
      const sumR = items.reduce((s, i) => s + i.r, 0);
      const avail = width - GAP * (items.length - 1);
      let h = avail / sumR; // exact-fit height
      if (last && h > target) h = target; // don't blow up a sparse last row
      h = Math.max(120, Math.min(h, layout === "wide" ? 460 : 340));
      out.push(items.map((i) => ({ ...i, w: i.r * h })));
    };

    for (const url of images) {
      cur.push({ url, r: dims[url].r });
      const sumR = cur.reduce((s, i) => s + i.r, 0);
      const h = (width - GAP * (cur.length - 1)) / sumR;
      // Row is "full" once exact-fit height drops to target, or the cap is hit.
      if (h <= target || cur.length >= maxPerRow) {
        close(cur, false);
        cur = [];
      }
    }
    if (cur.length) close(cur, true);
    return out;
  }, [ready, width, dims, images, layout]);

  if (images.length === 0) return null;

  return (
    <div ref={wrapRef} className="mt-7">
      {!ready ? (
        // Measuring: light placeholder band, no layout jump drama.
        <div className="flex gap-2.5">
          {images.slice(0, 3).map((u) => (
            <div key={u} className="h-[180px] flex-1 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col" style={{ gap: GAP }}>
          {rows.map((row, ri) => {
            const rowH = row[0] ? row[0].w / row[0].r : 0;
            return (
              <div key={ri} className="flex" style={{ gap: GAP, height: rowH }}>
                {row.map(({ url, w, r }) => (
                  <div
                    key={url}
                    className="group relative overflow-hidden rounded-2xl bg-secondary"
                    style={{ width: w, aspectRatio: `${r}` }}
                  >
                    {/* Box matches the photo's own ratio → object-cover crops nothing. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cfImage(url, Math.min(1400, Math.round(w * 2)))}
                      srcSet={cfSrcset(url, [Math.round(w), Math.round(w * 1.5), Math.min(1400, Math.round(w * 2))])}
                      sizes={`${Math.round(w)}px`}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <span className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]" />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
