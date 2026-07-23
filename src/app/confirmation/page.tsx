import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { StoreShell } from "@/components/store-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Благодарим · Поръчката е приета" };

export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<{ n?: string; o?: string }> }) {
  const { n, o } = await searchParams;
  return (
    <StoreShell>
      <div className="mx-auto w-full max-w-xl px-4 py-16 text-center sm:px-6">
        <CheckCircle2 className="mx-auto size-16 text-primary" />
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight">Благодарим за поръчката!</h1>
        {n && <p className="mt-2 text-lg text-muted-foreground">Номер на поръчка: <span className="font-bold text-foreground">{n}</span></p>}
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Приехме поръчката ти. Фермерът ще се свърже с теб за потвърждение на времето за доставка или вземане. Плащане в брой при получаване.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {o && (
            <Link href={`/order/${encodeURIComponent(o)}`} className={cn(buttonVariants(), "h-11 rounded-xl font-bold")}>
              Проследи поръчката
            </Link>
          )}
          <Link href="/shop" className={cn(buttonVariants({ variant: o ? "outline" : "default" }), "h-11 rounded-xl font-bold", o && "border-line-strong")}>Продължи пазаруването</Link>
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "h-11 rounded-xl border-line-strong font-bold")}>Към началото</Link>
        </div>
      </div>
    </StoreShell>
  );
}
