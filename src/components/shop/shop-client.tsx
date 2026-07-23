"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductCard } from "@/components/product-card";
import type { CardData } from "@/lib/card-data";

const PAGE = 24;

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
  const [shown, setShown] = useState(PAGE);

  const nq = q.trim().toLocaleLowerCase("bg");

  const matched = useMemo(
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

  // Every filter change starts a fresh page.
  useEffect(() => {
    setShown(PAGE);
  }, [cat, farmer, nq]);

  // Deep-link from the homepage's /shop#<categoryId> chips (home page.tsx
  // encodes the id with encodeURIComponent). Read post-mount so the first
  // client render still matches the server-rendered "all" HTML.
  useEffect(() => {
    const raw = window.location.hash.replace(/^#/, "");
    if (!raw) return;
    let id = raw;
    try {
      id = decodeURIComponent(raw);
    } catch {
      return;
    }
    if (categories.some((c) => c.id === id)) setCat(id);
    // Intentionally run once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = matched.slice(0, shown);
  const hasMore = shown < matched.length;
  const remaining = matched.length - shown;

  const loadMore = useCallback(() => {
    setShown((s) => Math.min(matched.length, s + PAGE));
  }, [matched.length]);

  // IntersectionObserver auto-loads the next page; the button is the manual
  // fallback. Both call the same `loadMore`, so they can never disagree —
  // worst case they both fire for the same page and the clamp in `loadMore`
  // makes the second call a no-op once `shown` already covers `matched`.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadMore]);

  // Right-edge fade on the scrollable chip rail, only while there's more to
  // scroll to.
  const railRef = useRef<HTMLDivElement | null>(null);
  const [railFade, setRailFade] = useState(false);
  const updateRailFade = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    setRailFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);
  useEffect(() => {
    updateRailFade();
    const el = railRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateRailFade, { passive: true });
    window.addEventListener("resize", updateRailFade);
    return () => {
      el.removeEventListener("scroll", updateRailFade);
      window.removeEventListener("resize", updateRailFade);
    };
  }, [updateRailFade, categories.length]);

  const filterActive = q.trim() !== "" || cat !== "all" || farmer !== "all";
  const resetFilters = () => {
    setQ("");
    setCat("all");
    setFarmer("all");
  };

  const chips = [{ id: "all", name: "Всички" }, ...categories];

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
        <div className="relative mt-4">
          <div
            ref={railRef}
            role="group"
            aria-label="Категории"
            className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1"
          >
            {chips.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={cat === c.id}
                onClick={() => setCat(c.id)}
                className={`h-11 shrink-0 whitespace-nowrap rounded-full border px-4 text-sm font-bold transition-colors sm:h-10 ${
                  cat === c.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-line-strong bg-card text-foreground/75 hover:border-primary/40"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
          {railFade && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent"
            />
          )}
        </div>
      )}

      {/* result bar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {matched.length === 0 ? "Няма резултати" : `Показани ${visible.length} от ${matched.length}`}
        </p>
        {filterActive && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-sm font-bold text-primary underline-offset-2 hover:underline"
          >
            Изчисти филтрите
          </button>
        )}
      </div>

      {matched.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-line-strong bg-card p-12 text-center text-muted-foreground">
          {nq ? `Няма намерени продукти за „${q.trim()}“` : "Няма продукти за този филтър"}
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
            {visible.map((c) => (
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

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                className="h-12 rounded-xl border border-line-strong bg-card px-6 text-sm font-bold text-foreground transition-colors hover:border-primary/40"
              >
                {`Зареди още (още ${remaining})`}
              </button>
            </div>
          )}
          <div ref={sentinelRef} aria-hidden className="h-px" />
        </>
      )}
    </div>
  );
}
