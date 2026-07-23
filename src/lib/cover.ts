import type { CSSProperties } from "react";
import type { CoverCrop } from "./types";

/**
 * The farmer framed every catalog photo in the panel (focal point + zoom + card
 * shape) — `coverCrop` is that framing. These helpers apply it to any cropped
 * <img> so what the farmer framed is what shoppers see.
 */

/** object-position/zoom for a cropped img. Zoom scales around the focal point so
 *  the chosen subject stays centered. Falls back to a plain centered crop. */
export function coverCropStyle(cc: CoverCrop | null | undefined): CSSProperties {
  if (!cc || (cc.x == null && cc.y == null && !cc.zoom)) return {};
  const x = (cc.x ?? 0.5) * 100;
  const y = (cc.y ?? 0.5) * 100;
  const zoom = cc.zoom && cc.zoom > 1 ? Math.min(cc.zoom, 3) : null;
  return {
    objectPosition: `${x}% ${y}%`,
    ...(zoom ? { transform: `scale(${zoom})`, transformOrigin: `${x}% ${y}%` } : {}),
  };
}

/** CSS aspect-ratio for the card the farmer framed for (panel parity: square→1:1,
 *  tall→4:5, wide→4:3). Default square keeps the marketplace grid rhythm. */
export function shapeAspect(cc: CoverCrop | null | undefined): string {
  switch (cc?.shape) {
    case "tall":
      return "4 / 5";
    case "wide":
      return "4 / 3";
    default:
      return "1 / 1";
  }
}
