"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, Plus, Minus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCart } from "@/components/cart/cart-provider";
import { CfImg } from "@/components/cf-img";
import { cfImage, cfSrcset } from "@/lib/img";
import { coverCropStyle } from "@/lib/cover";
import { eur, bgn } from "@/lib/money";
import {
  priceDisplay, discountPercent, hasVariants, allVariantsSoldOut, variantPriceStotinki,
} from "@/lib/pricing";
import type { Product } from "@/lib/types";

function initials(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toLocaleUpperCase("bg");
}

export function ProductDetail({
  product: p,
  farmerName,
  farmerSlug,
  farmerImage,
  remaining,
}: {
  product: Product;
  farmerName: string | null;
  farmerSlug: string | null;
  farmerImage: string | null;
  remaining: number | null;
}) {
  const { add } = useCart();
  const gallery = p.images?.length ? p.images : p.imageUrl ? [p.imageUrl] : [];
  const [main, setMain] = useState(gallery[0] ?? null);
  // The main frame adapts to the photo's own proportions (clamped so the layout
  // stays sane) — the buyer inspects the product here, cropping it is a sin.
  const [mainAspect, setMainAspect] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const variants = hasVariants(p) ? p.variants! : [];
  const [variantId, setVariantId] = useState<string | null>(variants[0]?.id ?? null);
  const selVariant = variants.find((v) => v.id === variantId) ?? null;

  const pd = priceDisplay(p);
  const discount = discountPercent(pd);
  const soldOut = (remaining !== null && remaining === 0) || allVariantsSoldOut(p);
  const priceStotinki = selVariant ? variantPriceStotinki(selVariant) : pd.headlineStotinki;

  const onAdd = () => {
    const label = selVariant ? `${p.name} · ${selVariant.label}` : p.name;
    add({ id: selVariant ? `${p.id}:${selVariant.id}` : p.id, name: label, price: priceStotinki / 100, weight: p.weight }, qty);
    toast.success(`Добави ${label}`, { description: `${qty} бр. в количката` });
  };

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6">
      <Link href="/shop" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" /> Обратно към магазина
      </Link>
      <div className="grid gap-8 md:grid-cols-2">
        {/* gallery */}
        <div>
          <div
            className="relative overflow-hidden rounded-2xl border border-border bg-secondary"
            style={{ aspectRatio: mainAspect ?? 1 }}
          >
            {main ? (
              // Frame follows the photo (clamped 3:4…4:3) → little to no crop; the
              // farmer's focal point covers whatever clamping still trims.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cfImage(main, 900)}
                srcSet={cfSrcset(main, [480, 720, 900, 1200])}
                sizes="(min-width:768px) 46vw, 92vw"
                fetchPriority="high"
                decoding="async"
                alt={p.name}
                // ref, not just onLoad: with SSR the (cached) image often finishes
                // loading before hydration, so onLoad never fires — `complete` covers it.
                ref={(el) => {
                  if (el?.complete && el.naturalWidth) {
                    setMainAspect((a) => a ?? Math.min(4 / 3, Math.max(3 / 4, el.naturalWidth / el.naturalHeight)));
                  }
                }}
                onLoad={(e) => {
                  const el = e.currentTarget;
                  if (el.naturalWidth && el.naturalHeight) {
                    setMainAspect(Math.min(4 / 3, Math.max(3 / 4, el.naturalWidth / el.naturalHeight)));
                  }
                }}
                className="absolute inset-0 size-full object-cover"
                style={coverCropStyle(p.coverCrop)}
              />
            ) : (
              <span className="flex size-full items-center justify-center p-8 text-center text-muted-foreground">{p.name}</span>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-2.5">
              {gallery.slice(0, 5).map((g) => (
                <button
                  key={g}
                  onClick={() => setMain(g)}
                  className={`relative size-16 overflow-hidden rounded-xl border-2 ${main === g ? "border-primary" : "border-border"}`}
                >
                  <CfImg src={g} width={160} alt="" className="absolute inset-0 size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* info */}
        <div>
          {farmerName && (
            <Link
              href={farmerSlug ? `/farmer/${farmerSlug}` : "/shop"}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 hover:border-primary/40"
            >
              <Avatar className="size-6">
                {farmerImage ? <AvatarImage src={cfImage(farmerImage, 96)} alt="" /> : null}
                <AvatarFallback className="bg-secondary text-[10px] font-bold text-secondary-foreground">{initials(farmerName)}</AvatarFallback>
              </Avatar>
              <span className="text-[13px] font-bold">{farmerName}</span>
              <BadgeCheck className="size-3.5 text-primary" />
            </Link>
          )}
          <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-4xl">{p.name}</h1>
          {p.weight && <div className="mt-1.5 text-sm text-muted-foreground">{p.weight}</div>}

          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-heading text-3xl font-semibold text-forest-dark">{eur(priceStotinki)}</span>
            <span className="text-[15px] text-muted-foreground">{bgn(priceStotinki)}</span>
            {discount != null && !selVariant && (
              <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-white">-{discount}%</span>
            )}
          </div>

          {variants.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 text-sm font-bold">Избери вариант</div>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    disabled={v.soldOut}
                    onClick={() => setVariantId(v.id)}
                    className={`h-11 rounded-xl border px-4 text-sm font-bold transition-colors disabled:opacity-40 ${
                      variantId === v.id ? "border-primary bg-primary text-primary-foreground" : "border-line-strong bg-card"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {remaining !== null && (
            <div className="mt-4 text-sm font-semibold text-primary">
              {remaining > 0 ? `${remaining} в наличност` : "Изчерпан"}
            </div>
          )}

          {/* qty + add */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl border-2 border-primary">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="По-малко" className="flex size-11 items-center justify-center text-primary hover:bg-secondary">
                <Minus className="size-[18px]" />
              </button>
              <span className="w-10 text-center text-[15px] font-extrabold text-forest-dark">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} aria-label="Повече" className="flex size-11 items-center justify-center text-primary hover:bg-secondary">
                <Plus className="size-[18px]" />
              </button>
            </div>
            <Button onClick={onAdd} disabled={soldOut} className="h-12 flex-1 rounded-xl text-base font-bold">
              <Plus className="size-[18px]" /> {soldOut ? "Изчерпан" : "Добави в количката"}
            </Button>
          </div>

          {p.description && (
            <div className="mt-7 border-t border-border pt-6 text-[15px] leading-relaxed text-foreground/85 whitespace-pre-line">
              {p.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
