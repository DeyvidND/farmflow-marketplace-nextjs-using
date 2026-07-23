"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBasket, ArrowRight } from "lucide-react";
import { useCart, type CartItem } from "@/components/cart/cart-provider";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ProductCard } from "@/components/product-card";
import { eur, eurFromLv, EUR_TO_BGN } from "@/lib/money";
import { unsatisfiedCompanions, companionMessage } from "@/lib/companion";
import { getCatalog, FALLBACK_STOREFRONT } from "@/lib/api";
import { toCards } from "@/lib/cards";
import type { CardData } from "@/lib/card-data";
import type { Bootstrap } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAX_RECOMMENDATIONS = 4;

/** Mirrors ProductCard's own local `initials()` (src/components/product-card.tsx),
 *  which isn't exported — kept in sync by hand since both render the same
 *  farmer-avatar-fallback idiom. */
function initials(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toLocaleUpperCase("bg");
}

interface FarmerGroup {
  farmerId: string | null;
  farmerName: string | null;
  items: CartItem[];
}

/** Groups cart lines by their stamped farmer, unstamped lines last under a
 *  generic "Продукти" bucket. Returns null (flat list) when fewer than two
 *  distinct farmers are present — the common single-farmer storefront case. */
function groupByFarmer(items: CartItem[]): FarmerGroup[] | null {
  const distinctFarmerIds = new Set(items.filter((it) => it.farmerId).map((it) => it.farmerId));
  if (distinctFarmerIds.size < 2) return null;

  const UNSTAMPED = "__unstamped__";
  const order: string[] = [];
  const map = new Map<string, FarmerGroup>();
  for (const it of items) {
    const key = it.farmerId ?? UNSTAMPED;
    if (!map.has(key)) {
      map.set(key, { farmerId: it.farmerId ?? null, farmerName: it.farmerName ?? null, items: [] });
      order.push(key);
    }
    map.get(key)!.items.push(it);
  }
  const keys = order.filter((k) => k !== UNSTAMPED);
  if (map.has(UNSTAMPED)) keys.push(UNSTAMPED);
  return keys.map((k) => map.get(k)!);
}

function CartLine({
  it,
  setQty,
  remove,
}: {
  it: CartItem;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-4 p-4">
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold">{it.name}</div>
        {it.weight && <div className="text-[13px] text-muted-foreground">{it.weight}</div>}
        <div className="mt-0.5 text-[13px] text-muted-foreground">{eurFromLv(it.price)} / бр.</div>
      </div>
      <div className="flex items-center rounded-lg border border-line-strong">
        <button onClick={() => setQty(it.id, it.qty - 1)} aria-label="По-малко" className="flex size-9 items-center justify-center text-primary hover:bg-secondary">
          <Minus className="size-4" />
        </button>
        <span className="w-8 text-center text-sm font-bold">{it.qty}</span>
        <button onClick={() => setQty(it.id, it.qty + 1)} aria-label="Повече" className="flex size-9 items-center justify-center text-primary hover:bg-secondary">
          <Plus className="size-4" />
        </button>
      </div>
      <div className="w-20 text-right font-heading font-semibold text-forest-dark">{eurFromLv(it.price * it.qty)}</div>
      <button onClick={() => remove(it.id)} aria-label="Премахни" className="text-muted-foreground hover:text-destructive">
        <Trash2 className="size-[18px]" />
      </button>
    </div>
  );
}

function FarmerGroupHeader({ farmerId, farmerName }: { farmerId: string | null; farmerName: string | null }) {
  if (farmerId && farmerName) {
    return (
      <div className="mb-2 flex items-center gap-2 px-1">
        <Avatar size="sm">
          <AvatarFallback className="bg-secondary text-[10px] font-bold text-secondary-foreground">
            {initials(farmerName)}
          </AvatarFallback>
        </Avatar>
        <span className="text-[13px] font-bold text-foreground/70">{farmerName}</span>
      </div>
    );
  }
  return (
    <div className="mb-2 px-1">
      <span className="text-[13px] font-bold text-foreground/70">Продукти</span>
    </div>
  );
}

export function CartView() {
  const { items, setQty, remove, total } = useCart();
  const unmetCompanions = unsatisfiedCompanions(items);
  const grouped = useMemo(() => groupByFarmer(items), [items]);

  const [boot, setBoot] = useState<Bootstrap | null>(null);
  const [delivery, setDelivery] = useState(FALLBACK_STOREFRONT.delivery);

  // Client-side, same pattern as checkout-view: fetch fresh storefront data
  // (delivery fee/threshold + full catalog for the recommendations rail)
  // rather than relying on any server-cached bootstrap — degrade silently,
  // the page works fine without either (no progress bar, no rail).
  useEffect(() => {
    getCatalog()
      .then((c) => {
        setBoot(c);
        setDelivery(c.storefront.delivery);
      })
      .catch(() => {});
  }, []);

  // Cart lines store EUR floats — round each line to cents before summing so
  // float drift can't wrongly fail the free-delivery threshold comparison.
  const subtotalStotinki = useMemo(
    () => items.reduce((sum, it) => sum + Math.round(it.price * 100) * it.qty, 0),
    [items],
  );
  const freeThreshold = delivery.freeThresholdStotinki;
  const isFreeDelivery = freeThreshold > 0 && subtotalStotinki >= freeThreshold;
  const progressPct = freeThreshold > 0 ? Math.min(100, Math.round((subtotalStotinki / freeThreshold) * 100)) : 0;
  const remainingStotinki = freeThreshold > 0 ? Math.max(0, freeThreshold - subtotalStotinki) : 0;

  const cartProductIds = useMemo(() => new Set(items.map((it) => it.id.split(":")[0])), [items]);
  const cartFarmerIds = useMemo(
    () => new Set(items.filter((it) => it.farmerId).map((it) => it.farmerId as string)),
    [items],
  );

  // "Върви добре с поръчката": up to 4 active products not already in the
  // cart, ranked farmers-already-in-cart > bestsellers > has-photo > rest.
  // Array#sort is stable (ES2019+), so ties keep the catalog's own order.
  const recCards = useMemo<CardData[]>(() => {
    if (!boot || items.length === 0) return [];
    const bestIds = new Set(boot.bestSellerIds ?? []);
    const score = (c: CardData) => {
      if (c.farmerId && cartFarmerIds.has(c.farmerId)) return 3;
      if (bestIds.has(c.product.id)) return 2;
      if (c.product.imageUrl) return 1;
      return 0;
    };
    return toCards(boot, boot.products)
      .filter((c) => c.product.isActive !== false && !cartProductIds.has(c.product.id))
      .sort((a, b) => score(b) - score(a))
      .slice(0, MAX_RECOMMENDATIONS);
  }, [boot, items.length, cartFarmerIds, cartProductIds]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-heading text-3xl font-bold tracking-tight">Количка</h1>

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line-strong bg-card p-12 text-center">
          <ShoppingBasket className="mx-auto size-10 text-line-strong" />
          <p className="mt-3 text-muted-foreground">Количката е празна.</p>
          <Link href="/shop" className={cn(buttonVariants(), "mt-5 h-11 rounded-xl font-bold")}>
            Разгледай магазина
          </Link>
        </div>
      ) : (
        <>
          {grouped ? (
            <div className="mt-6 space-y-5">
              {grouped.map((g) => (
                <div key={g.farmerId ?? "unstamped"}>
                  <FarmerGroupHeader farmerId={g.farmerId} farmerName={g.farmerName} />
                  <div className="divide-y divide-border rounded-2xl border border-border bg-card">
                    {g.items.map((it) => (
                      <CartLine key={it.id} it={it} setQty={setQty} remove={remove} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
              {items.map((it) => (
                <CartLine key={it.id} it={it} setQty={setQty} remove={remove} />
              ))}
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between text-lg">
              <span className="font-bold">Общо</span>
              <span className="text-right">
                <span className="font-heading text-2xl font-semibold text-forest-dark">{eurFromLv(total)}</span>
                <span className="ml-2 text-sm text-muted-foreground">({(total * EUR_TO_BGN).toFixed(2).replace(".", ",")} лв.)</span>
              </span>
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">Доставката се изчислява на следващата стъпка.</p>

            {freeThreshold > 0 && (
              <div className="mt-4">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className={cn("mt-1.5 text-[13px] font-semibold", isFreeDelivery ? "text-primary" : "text-muted-foreground")}>
                  {isFreeDelivery ? "✓ Безплатна доставка" : `Още ${eur(remainingStotinki)} до безплатна доставка`}
                </p>
              </div>
            )}

            {unmetCompanions.length > 0 && (
              <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-[13px] text-amber-900 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-200">
                {companionMessage(unmetCompanions[0])}
              </div>
            )}
            {unmetCompanions.length > 0 ? (
              <span
                aria-disabled="true"
                className={cn(buttonVariants(), "mt-4 h-12 w-full cursor-not-allowed rounded-xl text-base font-bold opacity-50 pointer-events-none")}
              >
                Към поръчката <ArrowRight className="size-[18px]" />
              </span>
            ) : (
              <Link href="/checkout" className={cn(buttonVariants(), "mt-4 h-12 w-full rounded-xl text-base font-bold")}>
                Към поръчката <ArrowRight className="size-[18px]" />
              </Link>
            )}
          </div>

          {recCards.length > 0 && (
            <div className="mt-8">
              <h2 className="font-heading text-xl font-bold tracking-tight">Върви добре с поръчката</h2>
              <div className="no-scrollbar mt-3 flex gap-4 overflow-x-auto pb-2">
                {recCards.map((c) => (
                  <div key={c.product.id} className="w-[240px] shrink-0">
                    <ProductCard
                      product={c.product}
                      farmerId={c.farmerId}
                      farmerName={c.farmerName}
                      farmerSlug={c.farmerSlug}
                      farmerImage={c.farmerImage}
                      bestSeller={c.bestSeller}
                      remaining={c.remaining}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
