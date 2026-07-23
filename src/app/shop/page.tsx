import type { Metadata } from "next";
import { getCatalog } from "@/lib/api";
import { categoriesFrom } from "@/lib/catalog";
import { toCards } from "@/lib/cards";
import { StoreShell } from "@/components/store-shell";
import { ShopClient } from "@/components/shop/shop-client";

export const metadata: Metadata = { title: "Магазин · Всички продукти" };

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

  return (
    <StoreShell>
      <ShopClient
        cards={cards}
        categories={cats.map((c) => ({ id: c.id, name: c.name }))}
        farmers={farmers}
        initialQ={q ?? ""}
      />
    </StoreShell>
  );
}
