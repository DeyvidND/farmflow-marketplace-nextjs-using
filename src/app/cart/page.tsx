import type { Metadata } from "next";
import { StoreShell } from "@/components/store-shell";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = { title: "Количка · Фермерски пазари" };

export default function CartPage() {
  return (
    <StoreShell>
      <CartView />
    </StoreShell>
  );
}
