import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/api";
import { bundleMemberPhotos, catIdOf, categoriesFrom } from "@/lib/catalog";
import { farmerSlugMap } from "@/lib/farmer-slug";
import { priceDisplay, allVariantsSoldOut } from "@/lib/pricing";
import { SITE_URL } from "@/lib/config";
import { jsonLdScript } from "@/lib/json-ld";
import { cfImage } from "@/lib/img";
import { StoreShell } from "@/components/store-shell";
import { ProductDetail, type RelatedCard } from "@/components/product/product-detail";
import type { Product } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { products } = await getCatalog();
  const p = products.find((x) => x.slug === slug);
  if (!p) return { title: "Продукт" };

  // A кошница with no cover photo of its own falls back to its first member's
  // photo for the social preview — a grid of tiles isn't a valid og:image.
  const bundleImages = bundleMemberPhotos(p);
  const productImages = p.images?.length ? p.images : p.imageUrl ? [p.imageUrl] : bundleImages;
  const ogImage = productImages[0] ? cfImage(productImages[0], 1200) : undefined;

  return {
    title: `${p.name} · Фермерски пазари`,
    description: p.description?.trim() || `${p.name} — поръчай директно от фермера, прясно и без посредник.`,
    openGraph: ogImage ? { images: [{ url: ogImage }] } : undefined,
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

  // Breadcrumb category (Магазин · категория · име).
  const multiSubcat = boot.storefront.multiSubcat;
  const categoryId = catIdOf(p, multiSubcat);
  const categories = categoriesFrom(boot.products, boot.subcategories, multiSubcat);
  const categoryName = categories.find((c) => c.id === categoryId)?.name ?? null;

  const farmerById = new Map(boot.farmers.map((f) => [f.id, f]));
  const toCard = (item: Product): RelatedCard => {
    const fid = showFarmers ? item.farmerId : null;
    const f = fid ? farmerById.get(fid) ?? null : null;
    return {
      product: item,
      farmerId: fid,
      farmerName: f?.name ?? null,
      farmerSlug: f ? slugs.get(f.id) ?? null : null,
      farmerImage: f?.images?.[0] ?? f?.imageUrl ?? null,
      remaining: availMap.has(item.id) ? availMap.get(item.id) ?? null : null,
    };
  };
  const activeProducts = boot.products.filter((x) => x.isActive !== false);

  // "Още от {фермер}" — up to 4 other active products from the same farmer.
  const moreFromFarmerProducts =
    showFarmers && p.farmerId
      ? activeProducts.filter((x) => x.farmerId === p.farmerId && x.id !== p.id).slice(0, 4)
      : [];
  const moreFromFarmerIds = new Set(moreFromFarmerProducts.map((x) => x.id));

  // "Подобни продукти" — up to 4 active products from the same category,
  // excluding the current product and anything already in the farmer rail.
  const similarProducts = activeProducts
    .filter((x) => x.id !== p.id && !moreFromFarmerIds.has(x.id) && catIdOf(x, multiSubcat) === categoryId)
    .slice(0, 4);

  const moreFromFarmer = moreFromFarmerProducts.map(toCard);
  const similar = similarProducts.map(toCard);

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <ProductDetail
        product={p}
        farmerId={farmer?.id ?? null}
        farmerName={farmer?.name ?? null}
        farmerSlug={farmer ? slugs.get(farmer.id) ?? null : null}
        farmerImage={farmer?.images?.[0] ?? farmer?.imageUrl ?? null}
        farmerLegal={farmer?.legal ?? null}
        remaining={remaining}
        categoryId={categoryId}
        categoryName={categoryName}
        moreFromFarmer={moreFromFarmer}
        similarProducts={similar}
        deliveryEnabled={boot.storefront.deliveryEnabled}
        addressFeeStotinki={boot.storefront.delivery.addressFeeStotinki}
        freeThresholdStotinki={boot.storefront.delivery.freeThresholdStotinki}
      />
    </StoreShell>
  );
}
