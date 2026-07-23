"use client";

import Link from "next/link";
import { BadgeCheck, Plus, Camera } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/cart/cart-provider";
import { CfImg } from "@/components/cf-img";
import { cfImage } from "@/lib/img";
import { coverCropStyle, shapeAspect } from "@/lib/cover";
import { isRecent, isBundle, bundleMemberPhotos } from "@/lib/catalog";
import { eur, bgn, eurFromLv } from "@/lib/money";
import { priceDisplay, discountPercent, hasVariants, allVariantsSoldOut } from "@/lib/pricing";
import { companionSatisfied, companionShortfall } from "@/lib/companion";
import type { Product } from "@/lib/types";

function initials(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toLocaleUpperCase("bg");
}

export function ProductCard({
  product: p,
  farmerId = null,
  farmerName = null,
  farmerSlug = null,
  farmerImage = null,
  bestSeller = false,
  remaining = null,
  className,
}: {
  product: Product;
  farmerId?: string | null;
  farmerName?: string | null;
  farmerSlug?: string | null;
  farmerImage?: string | null;
  bestSeller?: boolean;
  remaining?: number | null;
  className?: string;
}) {
  const { add, items } = useCart();
  const href = p.slug ? `/product/${p.slug}` : "/shop";
  const pd = priceDisplay(p);
  const discount = discountPercent(pd);
  const hasV = hasVariants(p);
  const hasWindow = remaining !== null && remaining !== undefined;
  const soldOut = (hasWindow && remaining === 0) || allVariantsSoldOut(p);
  // Loss-leader companion lock: never overlay on a sold-out button, and never
  // on a variant product (the card only has a "Избери вариант" link there —
  // the actual lock lives on the PDP add-to-cart once a variant is chosen).
  const companionMin = p.companionMinPriceStotinki ?? null;
  const isCompanionManaged = !!p.requiresCompanion && !soldOut && !hasV;
  const companionOk = isCompanionManaged ? companionSatisfied(p.id, companionMin, items) : true;
  const photoCount = p.images?.length ?? (p.imageUrl ? 1 : 0);
  const farmerHref = farmerSlug ? `/farmer/${farmerSlug}` : null;
  const isNew = isRecent(p.createdAt ?? null);
  const tag = p.featured ? "Хит" : pd.compareStotinki != null ? "Промо" : null;
  const bundle = isBundle(p);
  // A basket with no cover photo of its own is drawn as a grid of its members'
  // photos — up to four, in the order the operator arranged them. An uploaded
  // cover always wins.
  const memberPhotos = bundleMemberPhotos(p, 4);
  const showTiles = bundle && !p.imageUrl && memberPhotos.length >= 2;

  const onAdd = () => {
    add({
      id: p.id,
      name: p.name,
      price: pd.headlineStotinki / 100,
      weight: p.weight,
      farmerId: farmerId ?? undefined,
      farmerName: farmerName ?? undefined,
      requiresCompanion: p.requiresCompanion,
      companionMinStotinki: p.companionMinPriceStotinki,
    });
    toast.success(`Добави ${p.name}`, { description: "в количката" });
  };

  return (
    <Card
      className={`group flex flex-col gap-0 overflow-hidden rounded-2xl border-border bg-card p-3.5 transition-shadow hover:shadow-[0_8px_24px_-10px_rgba(38,73,47,0.18)] ${soldOut ? "opacity-70" : ""} ${className ?? ""}`}
    >
      {/* farmer-forward: producer on top of the image (the marketplace differentiator) */}
      {farmerName?.trim() && (
        <div className="mb-3 flex items-center gap-2">
          {farmerHref ? (
            <Link href={farmerHref} className="flex min-w-0 items-center gap-2 hover:opacity-85">
              <Avatar className="size-7">
                {farmerImage ? <AvatarImage src={cfImage(farmerImage, 96)} alt="" /> : null}
                <AvatarFallback className="bg-secondary text-[11px] font-bold text-secondary-foreground">
                  {initials(farmerName)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-[13px] font-bold text-foreground/85">{farmerName}</span>
            </Link>
          ) : (
            <span className="truncate text-[13px] font-bold text-foreground/85">{farmerName}</span>
          )}
          <BadgeCheck className="ml-auto size-3.5 shrink-0 text-primary" aria-label="Проверен фермер" />
        </div>
      )}

      <Link
        href={href}
        className="relative block overflow-hidden rounded-xl bg-secondary"
        style={{ aspectRatio: shapeAspect(p.coverCrop) }}
      >
        {(tag || bundle) && (
          <div className="absolute left-2.5 top-2.5 z-10 flex flex-col items-start gap-1.5">
            {tag && (
              <span className="rounded-full bg-honey px-2.5 py-1 text-[11px] font-bold text-[#2a2110]">
                {tag}
              </span>
            )}
            {bundle && (
              <span className="rounded-full bg-forest-dark px-2.5 py-1 text-[11px] font-bold text-primary-foreground">
                🧺 Кошница
              </span>
            )}
          </div>
        )}
        {bestSeller && (
          <span className="absolute right-2.5 top-2.5 z-10 rounded-full bg-honey px-2.5 py-1 text-[11px] font-extrabold text-[#2a2110]">
            Хит
          </span>
        )}
        {!bestSeller && isNew && (
          <span className="absolute right-2.5 top-2.5 z-10 rounded-full bg-primary px-2.5 py-1 text-[11px] font-extrabold text-primary-foreground">
            Ново
          </span>
        )}
        {showTiles ? (
          <div
            className={cn(
              "absolute inset-0 grid grid-cols-2 gap-0.5",
              memberPhotos.length > 2 ? "grid-rows-2" : "grid-rows-1",
            )}
          >
            {memberPhotos.map((src, i) => (
              <CfImg
                key={src + i}
                src={src}
                width={360}
                alt={i === 0 ? p.name : ""}
                className={cn(
                  "size-full object-cover",
                  memberPhotos.length === 3 && i === 0 && "row-span-2",
                )}
              />
            ))}
          </div>
        ) : p.imageUrl ? (
          <CfImg
            src={p.imageUrl}
            width={640}
            sizes="(min-width:1024px) 270px, (min-width:640px) 33vw, 50vw"
            alt={p.name}
            className="absolute inset-0 size-full object-cover"
            style={coverCropStyle(p.coverCrop)}
          />
        ) : (
          <span className="flex size-full items-center justify-center px-4 text-center text-sm font-medium text-muted-foreground">
            {p.name}
          </span>
        )}
        {photoCount > 1 && (
          <span className="absolute bottom-2.5 right-2.5 z-10 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] font-bold text-white">
            <Camera className="size-3" /> {photoCount}
          </span>
        )}
        {hasWindow &&
          (soldOut ? (
            <span className="absolute bottom-2.5 left-2.5 z-10 rounded-full bg-destructive px-2.5 py-1 text-[11px] font-bold text-white">
              изчерпан
            </span>
          ) : (
            <span className="absolute bottom-2.5 left-2.5 z-10 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground">
              {remaining} в наличност
            </span>
          ))}
        {p.weight && !hasWindow && (
          <span className="absolute bottom-2.5 left-2.5 z-10 rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
            {p.weight}
          </span>
        )}
      </Link>

      <Link href={href} className="mt-3.5">
        <h3 className="min-h-10 text-[15px] font-bold leading-tight text-foreground">{p.name}</h3>
      </Link>

      <div className="mt-1.5 flex items-baseline gap-2">
        {pd.fromPrefix && <span className="text-sm font-medium text-muted-foreground">от</span>}
        <span className="font-heading text-xl font-semibold text-forest-dark">{eur(pd.headlineStotinki)}</span>
        <span className="text-[12.5px] text-muted-foreground">{bgn(pd.headlineStotinki)}</span>
        {discount != null && (
          <span className="ml-auto rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-white">
            -{discount}%
          </span>
        )}
      </div>

      {isCompanionManaged && !companionOk && (
        <div className="mt-2.5 rounded-lg bg-accent px-2.5 py-1.5 text-[12px] font-semibold text-accent-foreground">
          {companionMin
            ? `🧺 Промо цена — добавя се към поръчка с други продукти за поне ${eur(companionMin)}`
            : `🧺 Промо цена — добавя се заедно с още поне един продукт`}
        </div>
      )}

      <div className="mt-3.5">
        {hasV ? (
          <Link href={href} className={cn(buttonVariants({ variant: "default" }), "h-11 w-full rounded-xl text-[15px] font-bold", soldOut && "opacity-50")}>
            {soldOut ? "Изчерпан" : "Избери вариант"}
          </Link>
        ) : isCompanionManaged && !companionOk ? (
          <Button
            disabled
            title={
              companionMin
                ? `„${p.name}“ се добавя само с други продукти на обща стойност поне ${eur(companionMin)}.`
                : `„${p.name}“ се добавя само заедно с друг продукт.`
            }
            className="h-11 w-full rounded-xl text-[15px] font-bold"
          >
            {companionMin
              ? `🔒 Още ${eurFromLv(companionShortfall(p.id, companionMin, items))} други продукти`
              : `🔒 Добави с друг продукт`}
          </Button>
        ) : (
          <Button
            onClick={onAdd}
            disabled={soldOut}
            className="h-11 w-full rounded-xl text-[15px] font-bold"
          >
            <Plus className="size-4" /> {soldOut ? "Изчерпан" : "Добави"}
          </Button>
        )}
      </div>
    </Card>
  );
}
