import type { Metadata } from "next";
import { StoreShell } from "@/components/store-shell";

export const metadata: Metadata = { title: "Поверителност" };

export default function PrivacyPage() {
  return (
    <StoreShell>
      <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Политика за поверителност</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Събираме само данните, нужни за обработка на поръчката ти (име, телефон, адрес за доставка). Не ги споделяме с трети страни извън фермера, който изпълнява поръчката. Пълната политика ще бъде публикувана скоро.
        </p>
      </div>
    </StoreShell>
  );
}
