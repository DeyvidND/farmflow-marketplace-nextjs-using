import { getCatalog } from "@/lib/api";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AnnounceBar } from "@/components/announce-bar";

/** Server wrapper: storefront chrome (header + announcement + footer) around a
 *  page's content. getCatalog is request-deduped, so pages that also fetch it
 *  pay for one request. */
export async function StoreShell({ children }: { children: React.ReactNode }) {
  const { storefront: sf } = await getCatalog();
  return (
    <>
      <SiteHeader name={sf.name} multiFarmer={sf.multiFarmer} />
      <AnnounceBar freeThreshold={sf.delivery?.freeThresholdStotinki ?? 0} />
      <main className="flex-1">{children}</main>
      <SiteFooter storefront={sf} />
    </>
  );
}
