import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, MapPin } from "lucide-react";
import { getCatalog } from "@/lib/api";
import { farmerSlugMap } from "@/lib/farmer-slug";
import { cfImage } from "@/lib/img";
import { legalIdLine } from "@/lib/legal";
import { SITE_URL } from "@/lib/config";
import { jsonLdScript } from "@/lib/json-ld";
import { StoreShell } from "@/components/store-shell";
import { ProductCard } from "@/components/product-card";
import { BrandedFarmer } from "@/components/farmer/branded-farmer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function initials(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toLocaleUpperCase("bg");
}

async function resolve(slug: string) {
  const boot = await getCatalog();
  const slugs = farmerSlugMap(boot.farmers);
  const farmer =
    boot.farmers.find((f) => slugs.get(f.id) === slug) ?? boot.farmers.find((f) => f.id === slug) ?? null;
  return { boot, farmer };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { farmer } = await resolve(slug);
  if (!farmer) return { title: "Фермер" };
  return {
    title: `${farmer.name} · Фермер`,
    description: farmer.bio?.trim() || `${farmer.name} — местно стопанство. Разгледай продуктите и поръчай директно от фермера.`,
  };
}

export default async function FarmerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const { boot, farmer } = await resolve(rawSlug);
  if (!farmer || !boot.storefront.multiFarmer) notFound();

  const availMap = new Map((boot.availability ?? []).map((w) => [w.productId, w.remaining]));
  const best = new Set(boot.bestSellerIds ?? []);
  const products = boot.products.filter((p) => p.farmerId === farmer.id && p.isActive !== false);
  const img = farmer.images?.[0] ?? farmer.imageUrl ?? null;
  const slug = farmerSlugMap(boot.farmers).get(farmer.id) ?? farmer.id;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: farmer.name,
    description: farmer.bio?.trim() || undefined,
    image: img ? [img] : undefined,
    url: `${SITE_URL}/farmer/${slug}`,
    address: farmer.city ? { "@type": "PostalAddress", addressLocality: farmer.city, addressCountry: "BG" } : undefined,
    geo: farmer.lat != null && farmer.lng != null ? { "@type": "GeoCoordinates", latitude: farmer.lat, longitude: farmer.lng } : undefined,
  };

  // Tier-2 „Бранд идентичност": paid, operator-unlocked → branded subpage (big portrait
  // + gallery + own color). Default farmers keep the compact layout below.
  if (farmer.branding?.enabled) {
    return (
      <StoreShell>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
        <div className="w-full py-6">
          <BrandedFarmer farmer={farmer} products={products} best={best} availMap={availMap} />
        </div>
      </StoreShell>
    );
  }

  return (
    <StoreShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6">
        {/* farmer header */}
        <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <Avatar className="size-20">
            {img ? <AvatarImage src={cfImage(img, 200)} alt={farmer.name} /> : null}
            <AvatarFallback className="bg-secondary text-2xl font-extrabold text-secondary-foreground">
              {initials(farmer.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-3xl font-bold tracking-tight">{farmer.name}</h1>
              <BadgeCheck className="size-6 text-primary" />
            </div>
            <div className="mt-1 text-[15px] text-muted-foreground">
              {[farmer.city, farmer.role, farmer.since ? `от ${farmer.since}` : null, `${products.length} продукта`].filter(Boolean).join(" · ")}
            </div>
            {/* legalIdLine() below already renders the address once legal.name is
                set (same gate as the "Продавач" block) — showing it here too would
                duplicate it. Only fall back to this line when there's no legal.name,
                i.e. the legal-disclosure block won't render at all, so the address
                would otherwise never appear anywhere on the page. */}
            {farmer.legal?.address && !farmer.legal?.name && (
              <div className="mt-1 flex items-center gap-1.5 text-[13.5px] text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" /> {farmer.legal.address}
              </div>
            )}
          </div>
        </div>
        {farmer.bio && (
          <p className="mt-5 max-w-3xl text-[16px] leading-relaxed text-foreground/85 whitespace-pre-line">{farmer.bio}</p>
        )}

        {farmer.legal?.name && (
          <div className="mt-5 max-w-3xl rounded-2xl border border-border bg-secondary/40 p-4 text-[13.5px]">
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

        <h2 className="mt-9 font-heading text-2xl font-bold">Продукти</h2>
        {products.length === 0 ? (
          <p className="mt-4 text-muted-foreground">Няма активни продукти в момента.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
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
    </StoreShell>
  );
}
