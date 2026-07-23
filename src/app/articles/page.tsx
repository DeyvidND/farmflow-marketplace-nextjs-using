import type { Metadata } from "next";
import { StoreShell } from "@/components/store-shell";

export const metadata: Metadata = { title: "Статии · Фермерски пазари" };

export default function ArticlesPage() {
  return (
    <StoreShell>
      <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-heading text-4xl font-bold tracking-tight">Статии</h1>
        <p className="mt-4 text-[16px] leading-relaxed text-muted-foreground">
          Историите на фермерите и съвети за сезонните продукти — очаквай скоро.
        </p>
      </div>
    </StoreShell>
  );
}
