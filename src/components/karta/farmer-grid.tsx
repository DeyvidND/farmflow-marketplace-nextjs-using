"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cfImage } from "@/lib/img";
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

/** „Производители" tab of /farmers (formerly the standalone /farmers grid) —
 *  the richer card design: shadcn Avatar, a bio line, and a combined
 *  city/since/product-count footer next to the CTA. */
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
              <Avatar className="size-14">
                {img ? <AvatarImage src={cfImage(img, 160)} alt="" /> : null}
                <AvatarFallback style={{ background: bg, color: fg }} className="text-lg font-extrabold">
                  {initials(f.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-heading text-lg font-semibold">{f.name}</span>
                  <BadgeCheck className="size-4 shrink-0 text-primary" />
                </div>
                <div className="mt-0.5 text-[13px] text-muted-foreground">{roleFor(f)}</div>
              </div>
            </div>
            {f.bio && <p className="line-clamp-2 text-[14px] leading-relaxed text-foreground/75">{f.bio}</p>}
            <div className="mt-auto flex items-center justify-between gap-3 pt-1">
              <span className="truncate text-[13px] text-muted-foreground">
                {[f.city, f.since ? `от ${f.since}` : null, `${n} ${n === 1 ? "продукт" : "продукта"}`]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-primary">
                Виж магазина <ArrowRight className="size-4" />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
