import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { getCatalog } from "@/lib/api";
import { farmerSlugMap } from "@/lib/farmer-slug";
import { resolveMapPoints } from "@/lib/farmer-map";
import { StoreShell } from "@/components/store-shell";
import { FarmerMap, KARTA_FALLBACK_LIST_ID } from "@/components/karta/farmer-map";

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
  const points = resolveMapPoints(boot.farmers, slugs);

  return (
    <StoreShell>
      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6">
        <div className="text-[12.5px] font-extrabold uppercase tracking-[0.15em] text-sage-text">Откъде идва храната</div>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Карта на фермерите</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-muted-foreground">
          Нашите фермери и стопанства из България — по адреса на стопанството, където е известен.
        </p>

        <div className="mt-7 space-y-5">
          {/* Client-side interactive map — hidden until it boots; the fallback
              list below is what no-JS/no-key visitors see the whole time. */}
          <FarmerMap points={points} />

          <ul id={KARTA_FALLBACK_LIST_ID} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {points.length === 0 ? (
              <li className="col-span-full rounded-2xl border border-dashed border-border bg-card p-6 text-center text-[14.5px] text-muted-foreground">
                Все още нямаме известен адрес на стопанство за нашите фермери.
              </li>
            ) : (
              points.map((p) => {
                const card = (
                  <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-line-strong">
                    <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                      <MapPin className="size-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <div className="font-heading text-[15.5px] font-semibold">{p.name}</div>
                      {p.village && <div className="mt-0.5 text-[13px] text-muted-foreground">{p.village}</div>}
                    </div>
                  </div>
                );
                return (
                  <li key={`${p.name}-${p.lat}-${p.lng}`}>
                    {p.slug ? <Link href={`/farmer/${p.slug}`}>{card}</Link> : card}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </StoreShell>
  );
}
