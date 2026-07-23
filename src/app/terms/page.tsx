import type { Metadata } from "next";
import { StoreShell } from "@/components/store-shell";

export const metadata: Metadata = { title: "Общи условия" };

export default function TermsPage() {
  return (
    <StoreShell>
      <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Общи условия</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Използвайки този сайт, се съгласяваш да поръчваш продукти директно от местните фермери. Плащането е в брой при получаване или онлайн, според избрания метод. Пълните общи условия ще бъдат публикувани скоро.
        </p>
      </div>
    </StoreShell>
  );
}
