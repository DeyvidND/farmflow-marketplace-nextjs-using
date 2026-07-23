import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/api";
import { farmerSlugMap } from "@/lib/farmer-slug";
import { StoreShell } from "@/components/store-shell";
import { ProductDetail } from "@/components/product/product-detail";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { products } = await getCatalog();
  const p = products.find((x) => x.slug === slug);
  return { title: p ? `${p.name} · Фермерски пазари` : "Продукт" };
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
