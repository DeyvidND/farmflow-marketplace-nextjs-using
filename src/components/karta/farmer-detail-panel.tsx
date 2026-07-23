"use client";

import Link from "next/link";
import { X, MapPin, BadgeCheck, ArrowLeft } from "lucide-react";
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

      <div className="flex min-h-full flex-col items-center justify-center px-6 py-9 text-center sm:pt-12">
        {/* portrait card, centered */}
        <div
          className="relative aspect-[4/5] w-full max-w-[280px] overflow-hidden rounded-2xl"
          style={{ background: bg }}
        >
          {img ? (
            <CfImg
              src={img}
              width={480}
              sizes="280px"
              alt={farmer.name}
              className="absolute inset-0 size-full object-cover object-top"
            />
          ) : (
            <span
              className="absolute inset-0 grid place-items-center text-4xl font-extrabold"
              style={{ color: fg }}
            >
              {initials(farmer.name)}
            </span>
          )}
        </div>

        <div className="mt-5 flex items-center justify-center gap-1.5">
          <h2 className="font-heading text-[23px] font-bold">{farmer.name}</h2>
          <BadgeCheck className="size-[18px] shrink-0 text-primary" />
        </div>
        {farmer.role && <div className="mt-0.5 text-[13.5px] font-semibold text-muted-foreground">{farmer.role}</div>}

        {farmer.city && (
          <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[13.5px] text-muted-foreground">
            <MapPin className="size-4 shrink-0" />
            {farmer.city}
          </div>
        )}

        {farmer.bio && (
          <p className="mt-3.5 line-clamp-6 max-w-[340px] text-[14px] leading-relaxed text-foreground/80 whitespace-pre-line">
            {farmer.bio}
          </p>
        )}

        {catNames.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {catNames.map((name) => (
              <Badge key={name} variant="secondary" className="h-6 rounded-full px-3 text-[12px] font-bold">
                {name}
              </Badge>
            ))}
          </div>
        )}

        <Link
          href={slug ? `/farmer/${slug}` : "/farmers"}
          className={cn(buttonVariants(), "mt-6 h-12 w-full max-w-[320px] rounded-xl font-bold")}
        >
          Виж магазина
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="mt-2.5 inline-flex h-12 w-full max-w-[320px] items-center justify-center gap-1.5 rounded-xl border border-line-strong font-bold text-foreground/75 transition-colors hover:border-primary hover:text-primary"
        >
          <ArrowLeft className="size-[18px]" /> Назад към картата
        </button>
      </div>
      </div>
    </>
  );
}
