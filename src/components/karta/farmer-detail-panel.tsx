"use client";

import Link from "next/link";
import { X, MapPin, BadgeCheck } from "lucide-react";
import { CfImg } from "@/components/cf-img";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { catIdOf } from "@/lib/catalog";
import type { Farmer, Product } from "@/lib/types";

const AV: [string, string][] = [
  ["#E8F0E2", "#3B6B45"], ["#F7EDCF", "#B07E1E"], ["#E9EFEA", "#33603E"], ["#F1ECE1", "#6E6250"],
  ["#F3E5E6", "#A85A55"], ["#EDE6D6", "#7A6A4A"], ["#F3E3DA", "#B5542E"], ["#EEE7D6", "#7A6A4A"],
];
function avatarOf(id: string): [string, string] {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AV[h % AV.length];
}
function initials(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toLocaleUpperCase("bg");
}

/** Pin-click detail card for /karta's map tab. Rendered as a plain, absolutely
 *  positioned sibling next to (not inside) the Google Map div — a click on it
 *  never reaches the map's own click handlers, since it isn't part of the
 *  map's DOM subtree. Desktop: right-side card over the map. Mobile: bottom
 *  sheet. */
export function FarmerDetailPanel({
  farmer,
  products,
  slug,
  categories,
  multiSubcat,
  onClose,
}: {
  farmer: Farmer;
  /** Full storefront product list — filtered down to this farmer's own. */
  products: Product[];
  slug: string | null;
  categories: { id: string; name: string }[];
  multiSubcat: boolean;
  onClose: () => void;
}) {
  const own = products.filter((p) => p.farmerId === farmer.id && p.isActive !== false);
  const catNames = [...new Set(own.map((p) => catIdOf(p, multiSubcat)))]
    .map((id) => categories.find((c) => c.id === id)?.name)
    .filter((n): n is string => !!n);
  const img = farmer.images?.[0] ?? farmer.imageUrl ?? null;
  const [bg, fg] = avatarOf(farmer.id);

  return (
    <>
      {/* Full-page dim + blur behind the drawer; click to close. */}
      <div
        onClick={onClose}
        aria-hidden
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-200"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={farmer.name}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[75vh] overflow-y-auto rounded-t-2xl border-t border-line-strong bg-card shadow-[0_-12px_32px_-14px_rgba(38,73,47,0.35)] animate-in slide-in-from-bottom duration-200 lg:inset-x-auto lg:inset-y-0 lg:right-0 lg:bottom-0 lg:max-h-none lg:w-[400px] lg:rounded-none lg:rounded-l-2xl lg:border-l lg:border-t-0 lg:border-line-strong lg:shadow-[-16px_0_40px_-12px_rgba(38,73,47,0.35)] lg:slide-in-from-right"
      >
      <button
        type="button"
        onClick={onClose}
        aria-label="Затвори"
        className="absolute top-3 right-3 z-10 grid size-11 place-items-center rounded-full bg-background/90 text-foreground/70 backdrop-blur transition-colors hover:bg-secondary hover:text-foreground"
      >
        <X className="size-5" />
      </button>

      <div className="p-5 pt-14 sm:p-6 sm:pt-16">
        <div className="flex items-center gap-3.5">
          <div
            className="relative size-16 shrink-0 overflow-hidden rounded-full"
            style={{ background: bg }}
          >
            {img ? (
              <CfImg src={img} width={160} alt={farmer.name} className="absolute inset-0 size-full object-cover" />
            ) : (
              <span
                className="absolute inset-0 grid place-items-center text-lg font-extrabold"
                style={{ color: fg }}
              >
                {initials(farmer.name)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-heading text-lg font-semibold">{farmer.name}</span>
              <BadgeCheck className="size-[17px] shrink-0 text-primary" />
            </div>
            {farmer.role && <div className="mt-0.5 text-[13px] text-muted-foreground">{farmer.role}</div>}
          </div>
        </div>

        {farmer.city && (
          <div className="mt-3.5 flex items-center gap-1.5 text-[13.5px] text-foreground/75">
            <MapPin className="size-4 shrink-0 text-muted-foreground" />
            {farmer.city}
          </div>
        )}

        {farmer.bio && (
          <p className="mt-3.5 line-clamp-6 text-[14px] leading-relaxed text-foreground/80 whitespace-pre-line">
            {farmer.bio}
          </p>
        )}

        {catNames.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {catNames.map((name) => (
              <Badge key={name} variant="secondary" className="h-6 rounded-full px-3 text-[12px] font-bold">
                {name}
              </Badge>
            ))}
          </div>
        )}

        <Link
          href={slug ? `/farmer/${slug}` : "/farmers"}
          className={cn(buttonVariants(), "mt-5 h-11 w-full rounded-xl font-bold")}
        >
          Виж магазина
        </Link>
      </div>
      </div>
    </>
  );
}
