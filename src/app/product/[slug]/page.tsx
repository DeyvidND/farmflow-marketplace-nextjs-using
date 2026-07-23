import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/api";
import { farmerSlugMap } from "@/lib/farmer-slug";
import { priceDisplay, allVariantsSoldOut } from "@/lib/pricing";
import { SITE_URL } from "@/lib/config";
import { StoreShell } from "@/components/store-shell";
import { ProductDetail } from "@/components/product/product-detail";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { products } = await getCatalog();
  const p = products.find((x) => x.slug === slug);
  if (!p) return { title: "Продукт" };
  return {
    title: `${p.name} · Фермерски пазари`,
    description: p.description?.trim() || `${p.name} — поръчай директно от фермера, прясно и без посредник.`,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const boot = await getCatalog();
  const p = boot.products.find((x) => x.slug === slug && x.isActive !== false);
  if (!p) notFound();

  const showFarmers = boot.storefront.multiFarmer;
  const farmer = showFarmers && p.farmerId ? boot.farmers.find((f) => f.id === p.farmerId) ?? null : null;
  const slugs = farmerSlugMap(boot.farmers);
  const availMap = new Map((boot.availability ?? []).map((w) => [w.productId, w.remaining]));
  const remaining = availMap.has(p.id) ? availMap.get(p.id) ?? null : null;
  const soldOut = (remaining !== null && remaining === 0) || allVariantsSoldOut(p);
  const pd = priceDisplay(p);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description?.trim() || undefined,
    image: p.imageUrl ? [p.imageUrl] : undefined,
    sku: p.id,
    brand: farmer ? { "@type": "Brand", name: farmer.name } : undefined,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${p.slug}`,
      priceCurrency: "EUR",
      price: (pd.headlineStotinki / 100).toFixed(2),
      availability: soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
  };

  return (
    <StoreShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductDetail
        product={p}
        farmerId={farmer?.id ?? null}
        farmerName={farmer?.name ?? null}
        farmerSlug={farmer ? slugs.get(farmer.id) ?? null : null}
        farmerImage={farmer?.images?.[0] ?? farmer?.imageUrl ?? null}
        farmerLegal={farmer?.legal ?? null}
        remaining={remaining}
      />
    </StoreShell>
  );
}
