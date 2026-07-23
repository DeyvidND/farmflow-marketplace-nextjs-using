"use client";

import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBasket, ArrowRight } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { buttonVariants } from "@/components/ui/button";
import { eurFromLv, EUR_TO_BGN } from "@/lib/money";
import { cn } from "@/lib/utils";

export function CartView() {
  const { items, setQty, remove, total } = useCart();

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
          <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
            {items.map((it) => (
              <div key={it.id} className="flex items-center gap-4 p-4">
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
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between text-lg">
              <span className="font-bold">Общо</span>
              <span className="text-right">
                <span className="font-heading text-2xl font-semibold text-forest-dark">{eurFromLv(total)}</span>
                <span className="ml-2 text-sm text-muted-foreground">({(total * EUR_TO_BGN).toFixed(2).replace(".", ",")} лв.)</span>
              </span>
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">Доставката се изчислява на следващата стъпка.</p>
            <Link href="/checkout" className={cn(buttonVariants(), "mt-4 h-12 w-full rounded-xl text-base font-bold")}>
              Към поръчката <ArrowRight className="size-[18px]" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
