import type { Metadata } from "next";
import Link from "next/link";
import { Store, Receipt, Truck, ShoppingBasket } from "lucide-react";
import { StoreShell } from "@/components/store-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Как работи · Поръчки" };

const STEPS = [
  { ic: Store, n: "01", t: "Избери фермер и продукти", d: "Разгледай магазините на местните фермери и напълни кошницата." },
  { ic: Receipt, n: "02", t: "Плащаш веднъж за цялата кошница", d: "Една поръчка, едно плащане — дори от няколко различни фермера." },
  { ic: Truck, n: "03", t: "Доставяме или взимаш от място", d: "Локална доставка до врата или вземане директно от фермера." },
];

export default function OrdersPage() {
  return (
    <StoreShell>
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <div className="text-[12.5px] font-extrabold uppercase tracking-[0.15em] text-sage-text">Просто и прозрачно</div>
        <h1 className="mt-2 font-heading text-4xl font-bold tracking-tight">Как стига храната до теб</h1>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <span className="flex size-12 items-center justify-center rounded-[13px] bg-primary text-primary-foreground"><s.ic className="size-[22px]" /></span>
                <span className="font-heading text-4xl font-semibold text-[#CBD6BB]">{s.n}</span>
              </div>
              <h3 className="mt-5 text-[17.5px] font-extrabold leading-tight">{s.t}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-foreground/80">{s.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl bg-primary px-6 py-6 text-[#eef2e7]">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15"><ShoppingBasket className="size-6 text-[#fbf8f0]" /></span>
          <div className="min-w-[220px] flex-1">
            <div className="font-heading text-lg font-semibold">Една кошница, много фермери</div>
            <div className="mt-1 text-[14.5px] leading-relaxed text-[#c9d6be]">Комбинирай продукти от различни стопанства в една поръчка и едно плащане.</div>
          </div>
          <Link href="/shop" className={cn(buttonVariants(), "h-11 rounded-xl bg-[#fbf8f0] font-bold text-primary hover:bg-[#fbf8f0]/90")}>Разгледай пазара</Link>
        </div>
      </div>
    </StoreShell>
  );
}
