import Link from "next/link";
import type { Metadata } from "next";
import {
  Truck, ArrowRight, BadgeCheck, Store, Receipt, ShoppingBasket, HandCoins, Sprout, MapPin,
} from "lucide-react";
import { getCatalog } from "@/lib/api";
import { categoriesFrom, catIdOf, recent, sortByTier } from "@/lib/catalog";
import { farmerSlugMap } from "@/lib/farmer-slug";
import { cfImage } from "@/lib/img";
import { SmartCollage } from "@/components/smart-collage";
import { SmartCover } from "@/components/smart-cover";
import { eur, bgn } from "@/lib/money";
import type { Farmer } from "@/lib/types";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { Bestsellers } from "@/components/sections/bestsellers";
import type { CardData } from "@/lib/card-data";
import { SubscriptionBox } from "@/components/sections/subscription-box";
import { CatIcon } from "@/components/icon";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { storefront } = await getCatalog();
  return { title: `${storefront.name} · Пазар за местни фермери` };
}

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

const GRADS = [
  "linear-gradient(155deg,#E7F0DC,#C6DAB3)",
  "linear-gradient(155deg,#F8EECF,#E9D399)",
  "linear-gradient(155deg,#EAF0E0,#CADBB6)",
  "linear-gradient(120deg,#ECE4D0,#D4C29C)",
];
const TILE = [
  { icon: "cherry", label: "Плодове · сезонни" },
  { icon: "droplet", label: "Мед · местен" },
  { icon: "leaf", label: "Зеленчуци · пресни" },
  { icon: "store", label: "Директно от фермера" },
];

const Eyebrow = ({ children, fresh }: { children: React.ReactNode; fresh?: boolean }) => (
  <div className={`text-[12.5px] font-extrabold uppercase tracking-[0.15em] ${fresh ? "text-honey" : "text-sage"}`}>
    {children}
  </div>
);
const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{children}</h2>
);
const SeeAll = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="inline-flex items-center gap-1.5 text-[14.5px] font-bold text-primary">
    {children} <ArrowRight className="size-4" />
  </Link>
);

export default async function Home() {
  const boot = await getCatalog();
  const { storefront: sf, products, farmers, subcategories: subcats } = boot;

  const cats = categoriesFrom(products, subcats, sf.multiSubcat);
  const showFarmers = sf.multiFarmer;
  const rankedFarmers = sortByTier(farmers);

  const slugs = farmerSlugMap(farmers);
  const farmerById = new Map(farmers.map((f) => [f.id, f]));
  const farmerName = (id: string | null) => (id ? farmerById.get(id)?.name ?? null : null);
  const farmerImg = (id: string | null) => {
    const f = id ? farmerById.get(id) : null;
    return f?.images?.[0] ?? f?.imageUrl ?? null;
  };
  const productCount = (id: string) => products.filter((p) => p.farmerId === id).length;
  const farmerRole = (f: Farmer) => {
    if (f.role?.trim()) return f.role;
    const c = cats.find((c) => products.some((p) => p.farmerId === f.id && catIdOf(p, sf.multiSubcat) === c.id));
    return c?.name ?? "Местно стопанство";
  };

  const availMap = new Map((boot.availability ?? []).map((w) => [w.productId, w.remaining]));
  const bestSellerIds = new Set(boot.bestSellerIds ?? []);
  const active = products.filter((p) => p.isActive !== false);
  const bestFirst = [
    ...active.filter((p) => bestSellerIds.has(p.id)),
    ...active.filter((p) => !bestSellerIds.has(p.id)),
  ].slice(0, 8);
  const newProducts = recent(products, 14, 8);
  const newFarmers = showFarmers ? recent(farmers, 14, 0) : [];

  const cards: CardData[] = bestFirst.map((p) => ({
    product: p,
    farmerName: showFarmers ? farmerName(p.farmerId) : null,
    farmerSlug: showFarmers && p.farmerId ? slugs.get(p.farmerId) ?? null : null,
    farmerImage: showFarmers ? farmerImg(p.farmerId) : null,
    farmerId: showFarmers ? p.farmerId : null,
    bestSeller: bestSellerIds.has(p.id),
    remaining: availMap.has(p.id) ? availMap.get(p.id) ?? null : null,
    cat: catIdOf(p, sf.multiSubcat),
  }));

  const stats = [
    ...(showFarmers && farmers.length ? [{ n: farmers.length, l: "местни фермери" }] : []),
    ...(cats.length ? [{ n: cats.length, l: "категории" }] : []),
    ...(products.length ? [{ n: products.length, l: "продукта" }] : []),
  ];

  const photoProducts = active.filter((p) => p.imageUrl).slice(0, 4);
  const collage = [0, 1, 2, 3].map((i) => ({
    img: photoProducts[i]?.imageUrl ?? null,
    label: photoProducts[i]?.name ?? TILE[i].label,
    icon: TILE[i].icon,
    grad: GRADS[i],
    cc: photoProducts[i]?.coverCrop ?? null,
  }));

  const fowFarmer = boot.farmerOfWeek ? farmerById.get(boot.farmerOfWeek.id) ?? null : null;
  const potw = boot.productOfWeek ? products.find((p) => p.id === boot.productOfWeek!.id) ?? null : null;
  const potwFarmer = potw?.farmerId ? farmerById.get(potw.farmerId) ?? null : null;
  const featFarmer: Farmer | null = showFarmers
    ? fowFarmer ?? (potwFarmer?.bio ? potwFarmer : rankedFarmers.find((f) => f.bio?.trim()) ?? null)
    : null;
  const fowNote = boot.farmerOfWeek?.note ?? null;

  const freeThreshold = sf.delivery?.freeThresholdStotinki ?? 0;

  return (
    <>
      <SiteHeader name={sf.name} multiFarmer={sf.multiFarmer} />

      {/* announcement */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 bg-forest-dark px-4 py-2.5 text-center text-[13.5px] text-[#edefe2]">
        <Truck className="size-[15px] text-[#bfd2b2]" />
        {freeThreshold > 0 ? (
          <span>
            Безплатна доставка при поръчка над {eur(freeThreshold)} {bgn(freeThreshold)} · плащаш веднъж за цялата кошница
          </span>
        ) : (
          <span>Локална доставка и вземане от място · една кошница от много фермери, едно плащане</span>
        )}
      </div>

      <main>
        {/* HERO */}
        <section className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center gap-x-14 gap-y-8 px-4 py-12 sm:px-6 lg:py-16">
          <div className="min-w-[300px] max-w-[600px] flex-1">
            <Eyebrow>Местен фермерски пазар</Eyebrow>
            <h1 className="mt-4 font-heading text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-[4rem]">
              Пазарувай директно от местни фермери
            </h1>
            <p className="mt-5 max-w-[470px] text-[17px] leading-relaxed text-foreground/80">
              Прясна храна с име и лице зад нея. Купувай директно от фермера — без посредник, без излишни ръце по пътя до твоята маса.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="#shop" className={cn(buttonVariants(), "h-13 rounded-xl px-6 text-[15.5px] font-bold")}>
                Разгледай пазара <ArrowRight className="size-[18px]" />
              </Link>
              <Link href="#how" className={cn(buttonVariants({ variant: "outline" }), "h-13 rounded-xl border-line-strong px-6 text-[15.5px] font-bold")}>
                Как работи
              </Link>
            </div>
            {stats.length >= 2 && (
              <div className="mt-9 flex flex-wrap gap-x-11 gap-y-5 border-t border-border pt-6">
                {stats.map((s) => (
                  <div key={s.l}>
                    <div className="font-heading text-3xl font-semibold leading-none text-forest-dark">{s.n}</div>
                    <div className="mt-1.5 max-w-[16ch] text-[13px] text-muted-foreground">{s.l}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="min-w-[300px] flex-1">
            <SmartCollage tiles={collage} />
          </div>
        </section>

        {/* FARMERS */}
        {showFarmers && farmers.length > 0 && (
          <section id="farmers" className="scroll-mt-32">
            <div className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3.5">
                <div>
                  <Eyebrow>Открий</Eyebrow>
                  <H2>Фермери близо до теб</H2>
                  <p className="mt-2 text-[15px] text-muted-foreground">Всеки продукт идва от истински човек и истинско стопанство.</p>
                </div>
                <SeeAll href="/farmers">Виж всички фермери</SeeAll>
              </div>
              <div className="no-scrollbar flex gap-4 overflow-x-auto pb-3.5">
                {rankedFarmers.slice(0, 12).map((f) => {
                  const [bg, fg] = avatarOf(f.id);
                  const img = f.images?.[0] ?? f.imageUrl ?? null;
                  const n = productCount(f.id);
                  return (
                    <Link
                      key={f.id}
                      href={`/farmer/${slugs.get(f.id)}`}
                      className="flex w-[252px] shrink-0 flex-col gap-3.5 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-10px_rgba(38,73,47,0.18)]"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar style={{ width: 52, height: 52 }}>
                          {img ? <AvatarImage src={cfImage(img, 120)} alt="" /> : null}
                          <AvatarFallback style={{ background: bg, color: fg }} className="text-[17px] font-extrabold">
                            {initials(f.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-heading text-[17px] font-semibold">{f.name}</span>
                            <BadgeCheck className="size-[15px] shrink-0 text-primary" />
                          </div>
                          <div className="mt-0.5 text-[13px] text-muted-foreground">{farmerRole(f)}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[13px] text-foreground/75">
                        {f.city && (
                          <>
                            <span className="inline-flex items-center gap-1"><MapPin className="size-3.5 text-muted-foreground" />{f.city}</span>
                            <span className="size-[3px] rounded-full bg-line-strong" />
                          </>
                        )}
                        {f.since && (
                          <>
                            <span>от {f.since}</span>
                            <span className="size-[3px] rounded-full bg-line-strong" />
                          </>
                        )}
                        <span>{n} {n === 1 ? "продукт" : "продукта"}</span>
                      </div>
                      <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                        Виж магазина <ArrowRight className="size-[15px]" />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* FEATURED FARMER */}
        {featFarmer && (
          <section className="mx-auto w-full max-w-[1180px] px-4 pb-2 sm:px-6">
            <div className="flex flex-wrap overflow-hidden rounded-[22px] border border-border bg-card">
              <div className="relative flex min-h-[240px] flex-1 basis-[300px] items-center justify-center bg-[linear-gradient(150deg,#E7F0DC,#BFD3AC)]">
                {(() => {
                  const imgs = featFarmer.images?.length
                    ? featFarmer.images
                    : featFarmer.imageUrl
                      ? [featFarmer.imageUrl]
                      : [];
                  return imgs.length ? (
                    <SmartCover
                      images={imgs}
                      width={700}
                      sizes="(min-width:640px) 50vw, 92vw"
                      alt={featFarmer.name}
                      className="absolute inset-0 size-full object-cover"
                    />
                  ) : (
                    <CatIcon name="cherry" className="size-16 text-[#4C7A3F]/50" />
                  );
                })()}
                <span className="absolute left-4 top-4 rounded-full bg-primary px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider text-primary-foreground">
                  Фермер на седмицата
                </span>
              </div>
              <div className="flex flex-1 basis-[360px] flex-col justify-center p-7 sm:p-10">
                <div className="flex items-center gap-2.5">
                  {(() => {
                    const [bg, fg] = avatarOf(featFarmer.id);
                    return (
                      <Avatar style={{ width: 44, height: 44 }}>
                        <AvatarFallback style={{ background: bg, color: fg }} className="text-[15px] font-extrabold">
                          {initials(featFarmer.name)}
                        </AvatarFallback>
                      </Avatar>
                    );
                  })()}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-heading text-xl font-semibold">{featFarmer.name}</span>
                      <BadgeCheck className="size-4 text-primary" />
                    </div>
                    <div className="text-[13px] text-muted-foreground">
                      {farmerRole(featFarmer)}{featFarmer.since ? ` · от ${featFarmer.since}` : ""}
                    </div>
                  </div>
                </div>
                {(fowNote || featFarmer.bio) && (
                  <p className="mt-4 font-heading text-lg italic leading-relaxed text-foreground/85">„{fowNote || featFarmer.bio}“</p>
                )}
                <Link href={`/farmer/${slugs.get(featFarmer.id)}`} className={cn(buttonVariants(), "mt-6 h-11 w-fit rounded-xl font-bold")}>
                  Виж магазина на {featFarmer.name.split(/\s+/)[0]} <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* CATEGORIES */}
        {cats.length > 0 && (
          <section id="categories" className="scroll-mt-32">
            <div className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3.5">
                <div>
                  <Eyebrow>Разгледай по вид</Eyebrow>
                  <H2>Категории</H2>
                </div>
                <SeeAll href="/shop">Виж целия магазин</SeeAll>
              </div>
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
                {cats.map((c) => (
                  <Link
                    key={c.id}
                    href={`/shop#${encodeURIComponent(c.id)}`}
                    className="flex min-h-[138px] flex-col justify-between gap-4 rounded-2xl border border-black/5 bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(0,0,0,0.06)]"
                  >
                    <CatIcon name={c.icon} className="size-[30px] text-primary" />
                    <div>
                      <div className="text-[15.5px] font-bold">{c.name}</div>
                      <div className="mt-1 text-[12.5px] text-muted-foreground">
                        {c.count > 0 ? `${c.count} ${c.count === 1 ? "продукт" : "продукта"}` : "скоро"}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* BESTSELLERS (client — chip filter) */}
        <Bestsellers cards={cards} categories={cats.map((c) => ({ id: c.id, name: c.name }))} />

        {/* NEW THIS WEEK */}
        {newProducts.length > 0 && (
          <section id="new" className="scroll-mt-32">
            <div className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3.5">
                <div>
                  <Eyebrow fresh>Прясно пристигна</Eyebrow>
                  <H2>Ново тази седмица</H2>
                </div>
                <SeeAll href="/shop">Виж всички</SeeAll>
              </div>
              {newFarmers.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {newFarmers.map((f) => (
                    <Link
                      key={f.id}
                      href={`/farmer/${slugs.get(f.id)}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-[13px] font-bold text-primary"
                    >
                      Нов фермер · {f.name}
                    </Link>
                  ))}
                </div>
              )}
              <div className="no-scrollbar flex gap-4 overflow-x-auto pb-3.5">
                {newProducts.map((p) => (
                  <div key={p.id} className="w-[240px] shrink-0">
                    <ProductCard
                      product={p}
                      farmerId={showFarmers && p.farmerId ? p.farmerId : null}
                      farmerName={showFarmers ? farmerName(p.farmerId) : null}
                      farmerSlug={showFarmers && p.farmerId ? slugs.get(p.farmerId) ?? null : null}
                      farmerImage={showFarmers ? farmerImg(p.farmerId) : null}
                      remaining={availMap.has(p.id) ? availMap.get(p.id) ?? null : null}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SUBSCRIPTION (client) */}
        <SubscriptionBox />

        {/* HOW IT WORKS */}
        <section id="how" className="scroll-mt-32 border-y border-[#e1e8d8] bg-secondary">
          <div className="mx-auto w-full max-w-[1180px] px-4 py-14 sm:px-6">
            <div className="max-w-[640px]">
              <Eyebrow>Просто и прозрачно</Eyebrow>
              <H2>Как работи</H2>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {[
                { ic: Store, n: "01", t: "Избери фермер и продукти", d: "Разгледай магазините на местните фермери и напълни кошницата с това, което ти харесва." },
                { ic: Receipt, n: "02", t: "Плащаш веднъж за цялата кошница", d: "Една поръчка, едно плащане — дори когато продуктите са от няколко различни фермера." },
                { ic: Truck, n: "03", t: "Доставяме или взимаш от място", d: "Локална доставка до врата или вземане директно от фермера — ти избираш." },
              ].map((s) => (
                <div key={s.n} className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex size-12 items-center justify-center rounded-[13px] bg-primary text-primary-foreground">
                      <s.ic className="size-[22px]" />
                    </span>
                    <span className="font-heading text-4xl font-semibold text-[#CBD6BB]">{s.n}</span>
                  </div>
                  <h3 className="mt-5 text-[17.5px] font-extrabold leading-tight">{s.t}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-foreground/80">{s.d}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl bg-primary px-6 py-6 text-[#eef2e7]">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <ShoppingBasket className="size-6 text-[#fbf8f0]" />
              </span>
              <div className="min-w-[220px] flex-1">
                <div className="font-heading text-lg font-semibold">Една кошница, много фермери</div>
                <div className="mt-1 text-[14.5px] leading-relaxed text-[#c9d6be]">
                  Комбинирай продукти от различни стопанства в една поръчка и едно плащане.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST */}
        <section className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { ic: BadgeCheck, t: "Проверени фермери", s: "Всеки продавач е реален и потвърден" },
              { ic: HandCoins, t: "Без посредник", s: "Плащаш на фермера, не на прекупвач" },
              { ic: Sprout, t: "Проследим произход", s: "Знаеш от кое стопанство е всичко" },
              { ic: Truck, t: "Локална доставка", s: "До дома или вземане от място" },
            ].map((x) => (
              <div key={x.t} className="flex items-center gap-3.5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-[11px] bg-secondary">
                  <x.ic className="size-5 text-primary" />
                </span>
                <div>
                  <div className="text-[14.5px] font-bold leading-tight">{x.t}</div>
                  <div className="mt-0.5 text-[12.5px] text-muted-foreground">{x.s}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter storefront={sf} />
    </>
  );
}
