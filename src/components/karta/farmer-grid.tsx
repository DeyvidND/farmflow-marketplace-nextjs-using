"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, MapPin } from "lucide-react";
import { CfImg } from "@/components/cf-img";
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

/** „Производители" tab of /karta — same card pattern as the home page's
 *  farmer rail (app/page.tsx), laid out as a grid instead of a horizontal
 *  scroller. Also the forced no-Maps-key fallback (see karta-explorer.tsx). */
export function FarmerGrid({
  farmers,
  products,
  categories,
  multiSubcat,
  slugs,
}: {
  farmers: Farmer[];
  products: Product[];
  categories: { id: string; name: string }[];
  multiSubcat: boolean;
  slugs: Map<string, string>;
}) {
  if (farmers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line-strong bg-card p-12 text-center text-muted-foreground">
        Няма фермери за този филтър.
      </div>
    );
  }

  const roleFor = (f: Farmer) => {
    if (f.role?.trim()) return f.role;
    const c = categories.find((c) =>
      products.some((p) => p.farmerId === f.id && catIdOf(p, multiSubcat) === c.id),
    );
    return c?.name ?? "Местно стопанство";
  };
  const productCount = (id: string) => products.filter((p) => p.farmerId === id && p.isActive !== false).length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {farmers.map((f) => {
        const [bg, fg] = avatarOf(f.id);
        const img = f.images?.[0] ?? f.imageUrl ?? null;
        const n = productCount(f.id);
        return (
          <Link
            key={f.id}
            href={`/farmer/${slugs.get(f.id) ?? f.id}`}
            className="flex flex-col gap-3.5 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-10px_rgba(38,73,47,0.18)]"
          >
            <div className="flex items-center gap-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-full" style={{ background: bg }}>
                {img ? (
                  <CfImg src={img} width={140} alt={f.name} className="absolute inset-0 size-full object-cover" />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-lg font-extrabold" style={{ color: fg }}>
                    {initials(f.name)}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-heading text-lg font-semibold">{f.name}</span>
                  <BadgeCheck className="size-4 shrink-0 text-primary" />
                </div>
                <div className="mt-0.5 text-[13px] text-muted-foreground">{roleFor(f)}</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[13px] text-foreground/75">
              {f.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5 text-muted-foreground" />
                  {f.city}
                </span>
              )}
              {f.city && (f.since || n > 0) && <span className="size-[3px] rounded-full bg-line-strong" />}
              {f.since && <span>от {f.since}</span>}
              {f.since && n > 0 && <span className="size-[3px] rounded-full bg-line-strong" />}
              {n > 0 && <span>{n} {n === 1 ? "продукт" : "продукта"}</span>}
            </div>
            <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-bold text-primary">
              Виж магазина <ArrowRight className="size-4" />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
