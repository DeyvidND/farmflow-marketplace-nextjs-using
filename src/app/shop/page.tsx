import type { Metadata } from "next";
import { getCatalog } from "@/lib/api";
import { categoriesFrom } from "@/lib/catalog";
import { toCards } from "@/lib/cards";
import { SITE_URL } from "@/lib/config";
import { jsonLdScript } from "@/lib/json-ld";
import { StoreShell } from "@/components/store-shell";
import { ShopClient } from "@/components/shop/shop-client";

export const metadata: Metadata = {
  title: "Магазин · Всички продукти",
  description: "Разгледай всички продукти от местните фермери — плодове, зеленчуци, мляко, сирене, мед и още. Поръчай директно от стопанина, без посредник.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const boot = await getCatalog();
  const active = boot.products.filter((p) => p.isActive !== false);
  const cats = categoriesFrom(boot.products, boot.subcategories, boot.storefront.multiSubcat);
  const cards = toCards(boot, active);
  const farmers = boot.storefront.multiFarmer
    ? boot.farmers
        .filter((f) => active.some((p) => p.farmerId === f.id))
        .map((f) => ({ id: f.id, name: f.name }))
    : [];

  const withSlug = active.filter((p) => p.slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: withSlug.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/product/${p.slug}`,
      name: p.name,
    })),
  };

  return (
    <StoreShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <ShopClient
        cards={cards}
        categories={cats.map((c) => ({ id: c.id, name: c.name }))}
        farmers={farmers}
        initialQ={q ?? ""}
      />
    </StoreShell>
  );
}
