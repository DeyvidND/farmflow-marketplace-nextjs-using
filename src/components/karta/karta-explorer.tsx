"use client";

import { useMemo, useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { matchFarmers, resolveMapPoints, type MapPoint } from "@/lib/farmer-map";
import type { Farmer, Product } from "@/lib/types";
import { FarmerMap } from "@/components/karta/farmer-map";
import { FarmerDetailPanel } from "@/components/karta/farmer-detail-panel";
import { FarmerGrid } from "@/components/karta/farmer-grid";

/** Sidebar filter body — rendered twice by the parent (always-open desktop
 *  card, collapsible mobile `<details>`) so both share one implementation. */
function FilterFields({
  q,
  onQ,
  categories,
  cats,
  onToggleCat,
  count,
  filterActive,
  onReset,
}: {
  q: string;
  onQ: (v: string) => void;
  categories: { id: string; name: string }[];
  cats: Set<string>;
  onToggleCat: (id: string) => void;
  count: number;
  filterActive: boolean;
  onReset: () => void;
}) {
  return (
    <div className="space-y-5 p-5">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[17px] -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => onQ(e.target.value)}
          type="search"
          placeholder="Име, продукт или описание"
          className="h-[52px] rounded-xl border-line-strong bg-background pl-10 text-[16px]"
        />
      </div>

      {categories.length > 0 && (
        <div>
          <div className="text-[13px] font-bold uppercase tracking-wide text-muted-foreground">Категории</div>
          <div className="mt-2 flex flex-col">
            {categories.map((c) => (
              <label
                key={c.id}
                className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg px-1 text-[14.5px] text-foreground/85 hover:bg-secondary/60"
              >
                <input
                  type="checkbox"
                  checked={cats.has(c.id)}
                  onChange={() => onToggleCat(c.id)}
                  className="size-[18px] shrink-0 rounded border-line-strong accent-primary focus-visible:ring-2 focus-visible:ring-ring/50"
                />
                <span>{c.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <span className="text-[13px] text-muted-foreground">
          {count} {count === 1 ? "производител" : "производители"}
        </span>
        {filterActive && (
          <button type="button" onClick={onReset} className="text-[13px] font-bold text-primary hover:underline">
            Изчисти
          </button>
        )}
      </div>
    </div>
  );
}

export function KartaExplorer({
  farmers,
  products,
  categories,
  multiSubcat,
  slugPairs,
  hasMapsKey,
}: {
  farmers: Farmer[];
  products: Product[];
  categories: { id: string; name: string }[];
  multiSubcat: boolean;
  slugPairs: [string, string][];
  hasMapsKey: boolean;
}) {
  const [q, setQ] = useState("");
  const [cats, setCats] = useState<Set<string>>(new Set());
  const [selectedFarmerId, setSelectedFarmerId] = useState<string | null>(null);

  const slugs = useMemo(() => new Map(slugPairs), [slugPairs]);

  const filteredFarmers = useMemo(
    () => matchFarmers(farmers, products, { q, cats, multiSubcat }),
    [farmers, products, q, cats, multiSubcat],
  );
  const filteredPoints = useMemo(() => resolveMapPoints(filteredFarmers, slugs), [filteredFarmers, slugs]);

  const toggleCat = (id: string) => {
    setCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const filterActive = q.trim() !== "" || cats.size > 0;
  const resetFilters = () => {
    setQ("");
    setCats(new Set());
  };

  const selectPoint = (point: MapPoint) => {
    // Points always carry the originating farmer's slug (see
    // farmerSlugMap — every farmer gets one); matching by name+coords is a
    // belt-and-braces fallback for the rare slugless case tests exercise.
    const farmer =
      (point.slug && filteredFarmers.find((f) => slugs.get(f.id) === point.slug)) ||
      filteredFarmers.find((f) => f.name === point.name && f.lat === point.lat && f.lng === point.lng);
    if (farmer) setSelectedFarmerId(farmer.id);
  };

  // Derived, not synced via an effect: a farmer the current filter has
  // excluded simply stops resolving here, closing the panel on its own.
  const selectedFarmer = selectedFarmerId ? (filteredFarmers.find((f) => f.id === selectedFarmerId) ?? null) : null;

  const filterFieldsProps = {
    q,
    onQ: setQ,
    categories,
    cats,
    onToggleCat: toggleCat,
    count: filteredFarmers.length,
    filterActive,
    onReset: resetFilters,
  };

  return (
    <div className="mt-7">
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden self-start rounded-2xl border border-border bg-card lg:block">
          <div className="border-b border-border px-5 py-4 font-heading text-lg font-semibold">Филтри</div>
          <FilterFields {...filterFieldsProps} />
        </aside>

        {/* Mobile collapsible filters */}
        <details className="group rounded-2xl border border-border bg-card lg:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-5 py-4 font-heading text-lg font-semibold [&::-webkit-details-marker]:hidden">
            Филтри
            <ChevronDown className="size-[18px] text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-border">
            <FilterFields {...filterFieldsProps} />
          </div>
        </details>

        <div className="min-w-0">
          {/* Роден Дар layout: map on top, the farmers-page card grid always
              visible below it — both driven by the same filters. */}
          {hasMapsKey && (
            <div className="mb-5">
              <FarmerMap points={filteredPoints} onSelect={selectPoint} />
            </div>
          )}
          {/* Full-page drawer + backdrop — lives at the page level, not inside
              the map box, so it overlays the whole viewport. */}
          {selectedFarmer && (
            <FarmerDetailPanel
              farmer={selectedFarmer}
              products={products}
              slug={slugs.get(selectedFarmer.id) ?? null}
              categories={categories}
              multiSubcat={multiSubcat}
              onClose={() => setSelectedFarmerId(null)}
            />
          )}
          <FarmerGrid
            farmers={filteredFarmers}
            products={products}
            categories={categories}
            multiSubcat={multiSubcat}
            slugs={slugs}
          />
        </div>
      </div>
    </div>
  );
}
