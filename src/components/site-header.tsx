"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Sprout, Search, MapPin, ShoppingCart, Menu } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from "@/components/cart/cart-provider";
import { cn } from "@/lib/utils";

const CITIES = ["Цяла България", "София", "Пловдив", "Варна", "Бургас", "Русе", "Стара Загора", "Плевен"];
const CITY_KEY = "mk-city";

const PAGES = [
  { label: "Магазин", href: "/shop" },
  { label: "Поръчки", href: "/orders" },
  { label: "За нас", href: "/about" },
  { label: "Отзиви", href: "/reviews" },
  { label: "Контакти", href: "/contact" },
];

export function SiteHeader({ name, multiFarmer }: { name: string; multiFarmer: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const onHome = pathname === "/";
  const { count } = useCart();
  const [city, setCity] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CITY_KEY);
    if (stored && CITIES.includes(stored)) setCity(stored);
  }, []);

  const onCity = (v: string | null) => {
    if (!v) return;
    setCity(v);
    localStorage.setItem(CITY_KEY, v);
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : "/shop");
  };

  // Homepage → in-page anchors; elsewhere → resolve against "/".
  const a = (id: string) => (onHome ? `#${id}` : `/#${id}`);
  const rail = [
    ...(multiFarmer ? [{ label: "Фермери", href: onHome ? "#farmers" : "/farmers" }, { label: "Карта", href: "/karta" }] : []),
    { label: "Категории", href: a("categories") },
    { label: "Най-продавани", href: a("shop") },
    { label: "Ново", href: a("new") },
    { label: "Как работи", href: a("how") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-[#fbf8f0]/97">
      <div className="mx-auto w-full max-w-[1180px] px-4 pt-3.5 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
          {/* brand */}
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={`${name} — начало`}>
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sprout className="size-[22px]" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-[17px] font-extrabold tracking-tight text-forest-dark">{name}</span>
              <span className="mt-0.5 text-[11.5px] font-semibold text-muted-foreground">Пазар за местни фермери</span>
            </span>
          </Link>

          {/* search */}
          <form onSubmit={onSearch} role="search" className="relative order-3 w-full min-w-0 flex-1 sm:order-none sm:max-w-[640px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-[19px] -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="search"
              enterKeyHint="search"
              aria-label="Търси продукт или фермер"
              placeholder="Търси продукт или фермер…"
              className="h-12 rounded-xl border-line-strong bg-card pl-11 text-base"
            />
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-2.5">
            {/* city */}
            <Select value={city ?? undefined} onValueChange={onCity}>
              <SelectTrigger
                aria-label="Град за доставка"
                className="hidden h-11 gap-1.5 rounded-full border-line-strong bg-card !text-[14.5px] font-semibold sm:flex"
              >
                <MapPin className="size-[17px] text-primary" />
                <SelectValue placeholder="Цяла България" />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* cart */}
            <Link
              href="/cart"
              aria-label="Количка"
              className={cn(buttonVariants({ variant: "outline", size: "icon" }), "relative size-11 rounded-xl border-line-strong bg-card")}
            >
              <ShoppingCart className="size-5" />
              {count > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full border-2 border-[#fbf8f0] bg-primary px-1 text-[11px] font-extrabold text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>

            {/* mobile menu */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                className={cn(buttonVariants({ variant: "outline", size: "icon" }), "size-11 rounded-xl border-line-strong bg-card lg:hidden")}
              >
                <Menu className="size-5" />
                <span className="sr-only">Меню</span>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle className="font-heading">{name}</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 px-4">
                  <Link href="/" className="rounded-lg px-3 py-3 text-[15px] font-semibold hover:bg-secondary" onClick={() => setOpen(false)}>Начало</Link>
                  {multiFarmer && (
                    <Link href="/farmers" className="rounded-lg px-3 py-3 text-[15px] font-semibold hover:bg-secondary" onClick={() => setOpen(false)}>Фермери</Link>
                  )}
                  {multiFarmer && (
                    <Link href="/karta" className="rounded-lg px-3 py-3 text-[15px] font-semibold hover:bg-secondary" onClick={() => setOpen(false)}>Карта</Link>
                  )}
                  {PAGES.map((p) => (
                    <Link key={p.href} href={p.href} className="rounded-lg px-3 py-3 text-[15px] font-semibold hover:bg-secondary" onClick={() => setOpen(false)}>{p.label}</Link>
                  ))}
                  <div className="mt-3 px-3">
                    <Select value={city ?? undefined} onValueChange={onCity}>
                      <SelectTrigger className="h-11 w-full rounded-full border-line-strong">
                        <MapPin className="size-[17px] text-primary" />
                        <SelectValue placeholder="Град за доставка" />
                      </SelectTrigger>
                      <SelectContent>
                        {CITIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* discovery rail */}
        {/* py-2 on links (not just the bar) keeps every nav item a ~40px target. */}
        <nav aria-label="Разгледай" className="no-scrollbar mt-3 flex items-center gap-0 overflow-x-auto border-t border-border py-1 max-lg:hidden">
          {rail.map((l, i) => (
            <span key={l.href} className="flex items-center">
              {i > 0 && <span className="mx-3 text-line-strong xl:mx-4.5">·</span>}
              <Link href={l.href} className="whitespace-nowrap py-2 text-[14.5px] font-semibold text-foreground/75 hover:text-primary">
                {l.label}
              </Link>
            </span>
          ))}
          <span className="mx-4 h-4 w-px shrink-0 bg-line-strong xl:mx-6" />
          {[...(multiFarmer ? [{ label: "Фермери", href: "/farmers" }, { label: "Карта", href: "/karta" }] : []), ...PAGES].map((l) => (
            <Link key={l.href} href={l.href} className="mr-4 whitespace-nowrap py-2 text-[14.5px] font-semibold text-muted-foreground hover:text-primary xl:mr-5">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
