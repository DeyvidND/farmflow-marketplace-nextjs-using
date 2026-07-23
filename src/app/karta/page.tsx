import type { Metadata } from "next";
import { getCatalog } from "@/lib/api";
import { farmerSlugMap } from "@/lib/farmer-slug";
import { categoriesFrom } from "@/lib/catalog";
import { StoreShell } from "@/components/store-shell";
import { KartaExplorer } from "@/components/karta/karta-explorer";

export async function generateMetadata(): Promise<Metadata> {
  const { storefront: sf } = await getCatalog();
  return {
    title: `Карта на фермерите · ${sf.name}`,
    description: `Виж на картата откъде идват фермерите и стопанствата зад продуктите на ${sf.name}.`,
  };
}

export default async function KartaPage() {
  const boot = await getCatalog();
  const slugs = farmerSlugMap(boot.farmers);
  const categories = categoriesFrom(boot.products, boot.subcategories, boot.storefront.multiSubcat).map((c) => ({
    id: c.id,
    name: c.name,
  }));
  // NEXT_PUBLIC_* is inlined at build time and readable on the server too —
  // decides the default tab and whether the „Карта" toggle even shows (no key
  // = graceful degradation to the „Производители" list, same contract the
  // old SSR fallback list used to guarantee).
  const hasMapsKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  return (
    <StoreShell>
      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6">
        <div className="text-[12.5px] font-extrabold uppercase tracking-[0.15em] text-sage-text">Откъде идва храната</div>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Карта на фермерите</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-muted-foreground">
          Нашите фермери и стопанства из България — по адреса на стопанството, където е известен.
        </p>

        <KartaExplorer
          farmers={boot.farmers}
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
