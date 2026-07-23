"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShoppingBasket } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import type { CardData } from "@/lib/card-data";

export function Bestsellers({
  cards,
  categories,
}: {
  cards: CardData[];
  categories: { id: string; name: string }[];
}) {
  const [cat, setCat] = useState("all");

  // Only offer chips for categories actually present in the shown set, so no
  // chip ever filters down to zero cards.
  const present = useMemo(() => new Set(cards.map((c) => c.cat)), [cards]);
  const chips = [{ id: "all", name: "Всички" }, ...categories.filter((c) => present.has(c.id))];
  const shown = cat === "all" ? cards : cards.filter((c) => c.cat === cat);

  return (
    <section id="shop" className="scroll-mt-32">
      <div className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3.5">
          <div>
            <div className="text-[12.5px] font-extrabold uppercase tracking-[0.15em] text-sage">Пазарувай</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Най-продавани</h2>
            <p className="mt-2 max-w-[52ch] text-[15px] text-muted-foreground">
              Всеки продукт носи името на своя фермер — знаеш точно от кого купуваш.
            </p>
          </div>
          <Link href="/shop" className="inline-flex items-center gap-1.5 text-[14.5px] font-bold text-primary">
            Виж всички продукти <ArrowRight className="size-4" />
          </Link>
        </div>

        {cards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line-strong bg-card p-10 text-center text-muted-foreground">
            <ShoppingBasket className="mx-auto size-9 text-line-strong" />
            <h3 className="mt-2.5 font-heading text-xl text-foreground">Пазарът тепърва отваря</h3>
            <p className="mt-1.5 text-[15px]">Фермерите подготвят продуктите си. Върни се скоро.</p>
          </div>
        ) : (
          <>
            {chips.length > 2 && (
              <div className="no-scrollbar mb-5 flex gap-2.5 overflow-x-auto pb-1" role="tablist" aria-label="Филтър по категория">
                {chips.map((c) => (
                  <button
                    key={c.id}
                    role="tab"
                    aria-selected={cat === c.id}
                    onClick={() => setCat(c.id)}
                    className={`h-10 shrink-0 whitespace-nowrap rounded-full border px-4 text-sm font-bold transition-colors ${
                      cat === c.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-line-strong bg-card text-foreground/75 hover:border-primary/40"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
              {shown.map((c) => (
                <ProductCard
                  key={c.product.id}
                  product={c.product}
                  farmerName={c.farmerName}
                  farmerSlug={c.farmerSlug}
                  farmerImage={c.farmerImage}
                  bestSeller={c.bestSeller}
                  remaining={c.remaining}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
