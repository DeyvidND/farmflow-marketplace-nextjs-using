import {
  Apple, Milk, Beef, Droplet, Cookie, Nut, Sprout, Cherry, Leaf, Store, Egg, Candy, ShoppingBasket,
  type LucideIcon,
} from "lucide-react";

// Category / product lucide icons resolved by the string name our catalog helper
// emits (lib/catalog.iconForCategory). Falls back to Sprout.
const MAP: Record<string, LucideIcon> = {
  apple: Apple,
  milk: Milk,
  beef: Beef,
  droplet: Droplet,
  cookie: Cookie,
  nut: Nut,
  sprout: Sprout,
  cherry: Cherry,
  leaf: Leaf,
  store: Store,
  egg: Egg,
  candy: Candy,
  basket: ShoppingBasket,
};

export function CatIcon({ name, className }: { name: string; className?: string }) {
  const Cmp = MAP[name] ?? Sprout;
  return <Cmp className={className} aria-hidden />;
}
