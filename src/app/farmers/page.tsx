import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/api";
import { sortByTier, categoriesFrom } from "@/lib/catalog";
import { farmerSlugMap } from "@/lib/farmer-slug";
import { StoreShell } from "@/components/store-shell";
import { KartaExplorer } from "@/components/karta/karta-explorer";

export async function generateMetadata(): Promise<Metadata> {
  const { storefront: sf } = await getCatalog();
  return {
    title: `Фермери и карта · ${sf.name}`,
    description: `Разгледай фермерите на ${sf.name} в списък или на картата — истински хора и истински стопанства зад всеки продукт.`,
  };
}

export default async function FarmersPage() {
  const boot = await getCatalog();
  if (!boot.storefront.multiFarmer) notFound();

  const slugs = farmerSlugMap(boot.farmers);
  const categories = categoriesFrom(boot.products, boot.subcategories, boot.storefront.multiSubcat).map((c) => ({
    id: c.id,
    name: c.name,
  }));
  // NEXT_PUBLIC_* is inlined at build time and readable on the server too —
  // decides whether the „Карта" toggle even shows (no key = graceful
  // degradation to the „Производители" grid only).
  const hasMapsKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  return (
    <StoreShell>
      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6">
        <div className="text-[12.5px] font-extrabold uppercase tracking-[0.15em] text-sage-text">Открий</div>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Нашите фермери</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-muted-foreground">
          Всеки продукт идва от истински човек и истинско стопанство — разгледай ги в списък или на картата.
        </p>

        <KartaExplorer
          farmers={sortByTier(boot.farmers)}
          products={boot.products}
          categories={categories}
          multiSubcat={boot.storefront.multiSubcat}
          slugPairs={[...slugs.entries()]}
          hasMapsKey={hasMapsKey}
        />
      </div>
    </StoreShell>
  );
}
