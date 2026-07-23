import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/api";
import { farmerSlugMap } from "@/lib/farmer-slug";
import { SITE_URL } from "@/lib/config";

/** Public, indexable informational pages (excludes session-scoped flows like
 *  /cart, /checkout, /confirmation, which have nothing to offer a crawler). */
const STATIC_PATHS = [
  "/shop",
  "/farmers",
  "/about",
  "/contact",
  "/orders",
  "/articles",
  "/reviews",
  "/terms",
  "/privacy",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const boot = await getCatalog();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    ...STATIC_PATHS.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];

  for (const p of boot.products) {
    if (!p.slug || p.isActive === false) continue;
    entries.push({
      url: `${SITE_URL}/product/${p.slug}`,
      lastModified: p.createdAt ? new Date(p.createdAt) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  if (boot.storefront.multiFarmer) {
    const slugs = farmerSlugMap(boot.farmers);
    for (const f of boot.farmers) {
      const slug = slugs.get(f.id);
      if (!slug) continue;
      entries.push({
        url: `${SITE_URL}/farmer/${slug}`,
        lastModified: f.createdAt ? new Date(f.createdAt) : now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  return entries;
}
