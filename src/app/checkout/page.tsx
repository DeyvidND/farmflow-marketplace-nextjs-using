import type { Metadata } from "next";
import { StoreShell } from "@/components/store-shell";
import { CheckoutView } from "@/components/checkout/checkout-view";

export const metadata: Metadata = { title: "Поръчка · Фермерски пазари" };

export default function CheckoutPage() {
  return (
    <StoreShell>
      <CheckoutView />
    </StoreShell>
  );
}
