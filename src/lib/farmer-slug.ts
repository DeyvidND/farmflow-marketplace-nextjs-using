// Latin, SEO-friendly farmer slugs derived from the Cyrillic name.
import type { Farmer } from './types';

const BG_LATIN: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i',
  й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's',
  т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sht',
  ъ: 'a', ь: 'y', ю: 'yu', я: 'ya',
  А: 'a', Б: 'b', В: 'v', Г: 'g', Д: 'd', Е: 'e', Ж: 'zh', З: 'z', И: 'i',
  Й: 'y', К: 'k', Л: 'l', М: 'm', Н: 'n', О: 'o', П: 'p', Р: 'r', С: 's',
  Т: 't', У: 'u', Ф: 'f', Х: 'h', Ц: 'ts', Ч: 'ch', Ш: 'sh', Щ: 'sht',
  Ъ: 'a', Ь: 'y', Ю: 'yu', Я: 'ya',
};

export function farmerSlug(name: string): string {
  return Array.from(name)
    .map((ch) => BG_LATIN[ch] ?? ch)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** id → collision-safe public slug for every farmer. */
export function farmerSlugMap(farmers: Farmer[]): Map<string, string> {
  const byBase = new Map<string, Farmer[]>();
  for (const f of farmers) {
    const base = farmerSlug(f.name);
    const group = byBase.get(base);
    if (group) group.push(f);
    else byBase.set(base, [f]);
  }
  const out = new Map<string, string>();
  for (const group of byBase.values()) {
    group.forEach((f, i) => {
      out.set(f.id, i === 0 ? farmerSlug(f.name) : `${farmerSlug(f.name)}-${f.id.slice(0, 6)}`);
    });
  }
  return out;
}
