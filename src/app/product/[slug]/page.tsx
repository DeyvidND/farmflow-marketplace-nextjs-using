import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/api";
import { bundleMemberPhotos } from "@/lib/catalog";
import { farmerSlugMap } from "@/lib/farmer-slug";
import { cfImage } from "@/lib/img";
import { StoreShell } from "@/components/store-shell";
import { ProductDetail } from "@/components/product/product-detail";

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

  return (
    <StoreShell>
      <ProductDetail
        product={p}
        farmerId={farmer?.id ?? null}
        farmerName={farmer?.name ?? null}
        farmerSlug={farmer ? slugs.get(farmer.id) ?? null : null}
        farmerImage={farmer?.images?.[0] ?? farmer?.imageUrl ?? null}
        remaining={availMap.has(p.id) ? availMap.get(p.id) ?? null : null}
      />
    </StoreShell>
  );
}
