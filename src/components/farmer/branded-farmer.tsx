import { BadgeCheck, Award, Leaf, MapPin } from "lucide-react";
import type { CSSProperties } from "react";
import type { Farmer, Product } from "@/lib/types";
import { CfImg } from "@/components/cf-img";
import { SmartGallery } from "@/components/farmer/smart-gallery";
import { ProductCard } from "@/components/product-card";
import { legalIdLine } from "@/lib/legal";

/**
 * Tier-2 „Бранд идентичност" farmer subpage. Rendered only when `farmer.branding.enabled`.
 * The whole tree overrides `--primary` with the farmer's `tint`, so every `bg-primary`/
 * `text-primary` child (add buttons, prices, badges) adopts the brand automatically — the
 * memorable moment from the design. Big cover + overlapping portrait + photo gallery
 * (layout chosen by the operator) are the paid extras over the default compact card.
 * Portrait reuses `imageUrl`, gallery reuses `images` (farmer_media). See marketplace
 * spec + FarmFlow docs/tier2-brand-identity-spec.md.
 */

const BADGE_LABEL: Record<string, { label: string; icon: typeof BadgeCheck }> = {
  verified: { label: "Проверен фермер", icon: BadgeCheck },
  bio: { label: "Био", icon: Leaf },
  awarded: { label: "Награждаван", icon: Award },
};

function initials(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toLocaleUpperCase("bg");
}

export function BrandedFarmer({
  farmer,
  products,
  best,
  availMap,
}: {
  farmer: Farmer;
  products: Product[];
  best: Set<string>;
  availMap: Map<string, number | null>;
}) {
  const b = farmer.branding!;
  const tint = farmer.tint || "#33603e";
  const images = farmer.images ?? [];
  const portrait = farmer.imageUrl ?? images[0] ?? null;
  const nonPortrait = images.filter((u) => u !== portrait);
  // A person photo stretched into a wide banner crops badly, so the cover prefers a
  // landscape scene photo; the person photo stays the portrait. Gallery shows the rest.
  const cover = nonPortrait[0] ?? portrait;
  const gallery = nonPortrait.filter((u) => u !== cover);
  // coverCrop frames the portrait (it belongs to imageUrl — smartFocal picks the face).
  // The API returns focal {x,y} as 0..1 fractions; fall back to a top-biased crop so a
  // person's face isn't sliced off by a centered square.
  const cc = farmer.coverCrop as { x?: number; y?: number } | null | undefined;
  const portraitStyle: CSSProperties =
    cc && (cc.x != null || cc.y != null)
      ? { objectPosition: `${(cc.x ?? 0.5) * 100}% ${(cc.y ?? 0.5) * 100}%` }
      : { objectPosition: "center top" };
  const badges = (b.badges ?? []).map((k) => BADGE_LABEL[k]).filter(Boolean);
  const FirstBadgeIcon = badges[0]?.icon;
  const meta = [farmer.city, farmer.role, farmer.since ? `от ${farmer.since}` : null, `${products.length} продукта`]
    .filter(Boolean)
    .join(" · ");

  // Override the design token for the whole branded subtree — the brand color flows
  // into every bg-primary / text-primary child (buttons, prices, badges).
  const brandVars = { ["--primary" as string]: tint } as CSSProperties;

  return (
    <div style={brandVars} className="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
      {/* cover banner — contained + rounded, a landscape scene (not the person) */}
      <div className="relative h-[168px] overflow-hidden rounded-3xl sm:h-[216px]" style={{ background: tint }}>
        {cover && (
          <CfImg
            src={cover}
            width={1400}
            sizes="(min-width:1180px) 1132px, 92vw"
            priority
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${tint}00 45%, ${tint}5c)` }} />
        {badges[0] && FirstBadgeIcon && (
          <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 text-[12px] font-bold text-white backdrop-blur-sm">
            <FirstBadgeIcon className="size-3.5" /> {badges[0].label}
          </span>
        )}
      </div>

      {/* portrait + identity — overlaps the cover, same container width */}
      <div className="relative z-10 -mt-11 flex flex-wrap items-end gap-4 pl-1 sm:-mt-12 sm:gap-5 sm:pl-3">
        <div
          className="size-[100px] shrink-0 overflow-hidden rounded-2xl border-4 border-background bg-secondary shadow-[0_12px_30px_-14px_rgba(0,0,0,0.5)] sm:size-[116px]"
          style={{ background: tint }}
        >
          {portrait ? (
            <CfImg src={portrait} width={320} priority alt={farmer.name} className="h-full w-full object-cover" style={portraitStyle} />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-3xl font-extrabold text-white">
              {initials(farmer.name)}
            </span>
          )}
        </div>
        <div className="min-w-0 pb-1.5">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-[26px] font-bold tracking-tight sm:text-[30px]">{farmer.name}</h1>
            <BadgeCheck className="size-5 shrink-0 text-primary sm:size-6" />
          </div>
          <div className="mt-1 text-[13.5px] font-medium text-muted-foreground sm:text-[14px]">{meta}</div>
          {/* legalIdLine() below already renders the address once legal.name is
              set (same gate as the "Продавач" block) — showing it here too would
              duplicate it. Only fall back to this line when there's no legal.name,
              i.e. the legal-disclosure block won't render at all, so the address
              would otherwise never appear anywhere on the page. */}
          {farmer.legal?.address && !farmer.legal?.name && (
            <div className="mt-1 flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" /> {farmer.legal.address}
            </div>
          )}
        </div>
      </div>

      {/* badges */}
      {badges.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {badges.map(({ label, icon: Icon }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[13px] font-bold text-primary-foreground"
            >
              <Icon className="size-3.5" /> {label}
            </span>
          ))}
        </div>
      )}

      {/* story */}
      {farmer.bio && (
        <p className="font-heading mt-5 max-w-[56ch] text-[16px] italic leading-relaxed text-foreground/85 whitespace-pre-line">
          „{farmer.bio}“
        </p>
      )}

      {/* seller disclosure (КЗП) — only once the operator has filled in legal identity */}
      {farmer.legal?.name && (
        <div className="mt-5 max-w-[56ch] rounded-2xl border border-border bg-secondary/40 p-4 text-[13.5px]">
          <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Продавач</div>
          <div className="mt-1 font-bold text-foreground">{farmer.legal.name}</div>
          {legalIdLine(farmer.legal) && (
            <div className="mt-0.5 text-muted-foreground">{legalIdLine(farmer.legal)}</div>
          )}
          <p className="mt-2 text-muted-foreground">
            Продавач по договора за поръчката е този производител. Пазарът предоставя онлайн мястото за търговия като посредник.
          </p>
        </div>
      )}

      {/* gallery — aspect-aware justified rows, photos keep their own proportions */}
      {gallery.length > 0 && <SmartGallery images={gallery} layout={b.gallery ?? "mosaic"} />}

      {/* products */}
      <h2 className="font-heading mt-9 text-2xl font-bold">Продукти от {farmer.name.split(/\s+/)[0]}</h2>
      {products.length === 0 ? (
        <p className="mt-4 text-muted-foreground">Няма активни продукти в момента.</p>
      ) : (
        <div className="mb-2 mt-4 grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              farmerId={farmer.id}
              farmerName={farmer.name}
              bestSeller={best.has(p.id)}
              remaining={availMap.has(p.id) ? availMap.get(p.id) ?? null : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

