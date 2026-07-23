import type { Metadata } from "next";
import Link from "next/link";
import { StoreShell } from "@/components/store-shell";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Страницата не е намерена · Фермерски пазари" };

export default function NotFound() {
  return (
    <StoreShell>
      <div className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-20 text-center sm:px-6">
        <div className="flex size-20 items-center justify-center rounded-full bg-secondary text-4xl">🌾</div>
        <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Тази страница я няма</h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
          Може да е преместена, изтрита или адресът е сгрешен. Провери го още веднъж — или се върни в магазина, прясната продукция те чака.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className={buttonVariants({ size: "lg" })}>
            Начало
          </Link>
          <Link href="/shop" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Към магазина
          </Link>
        </div>
      </div>
    </StoreShell>
  );
}
