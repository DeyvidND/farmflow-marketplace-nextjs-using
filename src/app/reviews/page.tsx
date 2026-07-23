import type { Metadata } from "next";
import { StoreShell } from "@/components/store-shell";

export const metadata: Metadata = { title: "Отзиви · Фермерски пазари" };

export default function ReviewsPage() {
  return (
    <StoreShell>
      <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-heading text-4xl font-bold tracking-tight">Отзиви</h1>
        <p className="mt-4 text-[16px] leading-relaxed text-muted-foreground">
          Скоро тук ще виждаш какво казват клиентите за фермерите и техните продукти.
        </p>
      </div>
    </StoreShell>
  );
}
