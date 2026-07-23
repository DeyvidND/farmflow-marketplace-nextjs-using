import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, ArrowRight } from "lucide-react";
import { getCatalog } from "@/lib/api";
import { sortByTier } from "@/lib/catalog";
import { farmerSlugMap } from "@/lib/farmer-slug";
import { cfImage } from "@/lib/img";
import { StoreShell } from "@/components/store-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const metadata: Metadata = { title: "Фермери · Пазар за местни фермери" };

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

export default async function FarmersPage() {
  const boot = await getCatalog();
  if (!boot.storefront.multiFarmer) notFound();
  const slugs = farmerSlugMap(boot.farmers);
  const count = (id: string) => boot.products.filter((p) => p.farmerId === id && p.isActive !== false).length;

  return (
    <StoreShell>
      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6">
        <div className="text-[12.5px] font-extrabold uppercase tracking-[0.15em] text-sage-text">Открий</div>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Нашите фермери</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">Всеки продукт идва от истински човек и истинско стопанство.</p>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortByTier(boot.farmers).map((f) => {
            const [bg, fg] = avatarOf(f.id);
            const img = f.images?.[0] ?? f.imageUrl ?? null;
            const n = count(f.id);
            const role = f.role ?? "Местно стопанство";
            return (
              <Link
                key={f.id}
                href={`/farmer/${slugs.get(f.id)}`}
                className="flex flex-col gap-3.5 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-10px_rgba(38,73,47,0.18)]"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-14">
                    {img ? <AvatarImage src={cfImage(img, 160)} alt="" /> : null}
                    <AvatarFallback style={{ background: bg, color: fg }} className="text-lg font-extrabold">{initials(f.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-heading text-lg font-semibold">{f.name}</span>
                      <BadgeCheck className="size-4 shrink-0 text-primary" />
                    </div>
                    <div className="mt-0.5 text-[13px] text-muted-foreground">{role}</div>
                  </div>
                </div>
                {f.bio && <p className="line-clamp-2 text-[14px] leading-relaxed text-foreground/75">{f.bio}</p>}
                <div className="mt-auto flex items-center justify-between pt-1">
                  <span className="text-[13px] text-muted-foreground">{[f.city, `${n} ${n === 1 ? "продукт" : "продукта"}`].filter(Boolean).join(" · ")}</span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary">Виж магазина <ArrowRight className="size-4" /></span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </StoreShell>
  );
}
