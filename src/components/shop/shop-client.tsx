"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductCard } from "@/components/product-card";
import type { CardData } from "@/lib/card-data";

export function ShopClient({
  cards,
  categories,
  farmers,
  initialQ = "",
}: {
  cards: CardData[];
  categories: { id: string; name: string }[];
  farmers: { id: string; name: string }[];
  initialQ?: string;
}) {
  const [q, setQ] = useState(initialQ);
  const [cat, setCat] = useState("all");
  const [farmer, setFarmer] = useState("all");

  const nq = q.trim().toLocaleLowerCase("bg");
  const shown = useMemo(
    () =>
      cards.filter((c) => {
        if (cat !== "all" && c.cat !== cat) return false;
        if (farmer !== "all" && c.farmerId !== farmer) return false;
        if (nq) {
          const hay = `${c.product.name} ${c.farmerName ?? ""}`.toLocaleLowerCase("bg");
          if (!hay.includes(nq)) return false;
        }
        return true;
      }),
    [cards, cat, farmer, nq],
  );

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6">
      <div className="mb-2">
        <div className="text-[12.5px] font-extrabold uppercase tracking-[0.15em] text-sage">Пазарувай</div>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Всички продукти</h1>
      </div>

      {/* filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            placeholder="Търси продукт или фермер…"
            className="h-12 rounded-xl border-line-strong bg-card pl-11 text-base"
          />
        </div>
        {farmers.length > 1 && (
          <Select value={farmer} onValueChange={(v) => setFarmer(v ?? "all")}>
            <SelectTrigger className="h-12 min-w-[180px] rounded-xl border-line-strong bg-card">
              <SelectValue placeholder="Всички фермери" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всички фермери</SelectItem>
              {farmers.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* category chips */}
      {categories.length > 0 && (
        <div className="no-scrollbar mt-4 flex gap-2.5 overflow-x-auto pb-1" role="tablist">
          {[{ id: "all", name: "Всички" }, ...categories].map((c) => (
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

      <p className="mt-5 text-sm text-muted-foreground">{shown.length} продукта</p>

      {shown.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-line-strong bg-card p-12 text-center text-muted-foreground">
          Няма намерени продукти{q ? ` за „${q}“` : ""}.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
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
      )}
    </div>
  );
}
