import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, PackageCheck, Truck, XCircle, ChefHat } from "lucide-react";
import { getPublicOrder } from "@/lib/api";
import { eur, bgn } from "@/lib/money";
import { cn } from "@/lib/utils";
import { StoreShell } from "@/components/store-shell";
import type { PublicOrderSummary } from "@/lib/types";

export const metadata: Metadata = { title: "Статус на поръчка · Фермерски пазари" };

// The recap endpoint is UUID-gated and PII-free; the shopper watches a moving
// status, so this page is always rendered fresh (getPublicOrder is no-store).
export const dynamic = "force-dynamic";

const STATUS: Record<
  PublicOrderSummary["status"],
  { label: string; icon: typeof Clock; tone: string; note: string }
> = {
  pending: {
    label: "Приета",
    icon: Clock,
    tone: "bg-honey/15 text-honey",
    note: "Фермерът ще потвърди поръчката съвсем скоро.",
  },
  confirmed: {
    label: "Потвърдена",
    icon: CheckCircle2,
    tone: "bg-primary/10 text-primary",
    note: "Фермерът потвърди поръчката и я подготвя за твоя ден за доставка.",
  },
  preparing: {
    label: "Подготвя се",
    icon: ChefHat,
    tone: "bg-primary/10 text-primary",
    note: "Поръчката се приготвя — прясно, точно преди да тръгне към теб.",
  },
  out_for_delivery: {
    label: "Пътува към теб",
    icon: Truck,
    tone: "bg-primary/10 text-primary",
    note: "Поръчката е на път. Дръж телефона наблизо.",
  },
  delivered: {
    label: "Доставена",
    icon: PackageCheck,
    tone: "bg-primary/10 text-primary",
    note: "Поръчката е доставена. Добър апетит!",
  },
  cancelled: {
    label: "Отказана",
    icon: XCircle,
    tone: "bg-destructive/10 text-destructive",
    note: "Тази поръчка е отказана. При въпроси се свържи с нас от страницата за контакти.",
  },
};

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("bg-BG", { weekday: "long", day: "numeric", month: "long" }).format(new Date(iso));

export default async function OrderStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Non-UUID ids 400 on the API and come back null — same dead end as a
  // deleted/foreign order, same 404 here.
  const order = await getPublicOrder(id);
  if (!order) notFound();

  const st = STATUS[order.status] ?? STATUS.pending;
  const Icon = st.icon;
  const itemsTotal = order.items.reduce((s, i) => s + i.priceStotinki * i.quantity, 0);
  const deliveryStotinki = order.totalStotinki - itemsTotal;

  return (
    <StoreShell>
      <div className="mx-auto w-full max-w-xl px-4 py-12 sm:px-6">
        <div className="text-center">
          <span className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-extrabold", st.tone)}>
            <Icon className="size-4.5" /> {st.label}
          </span>
          <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight">
            {order.orderNumber != null ? `Поръчка №${order.orderNumber}` : "Твоята поръчка"}
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{st.note}</p>
          {order.slot && (
            <p className="mt-2 text-[15px] font-semibold text-foreground">
              {fmtDate(order.slot.date)}
              {order.slot.startTime && order.slot.endTime ? ` · ${order.slot.startTime}–${order.slot.endTime}` : ""}
            </p>
          )}
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-[13px] font-extrabold uppercase tracking-wide text-muted-foreground">Продукти</h2>
          <ul className="mt-3 divide-y divide-border">
            {order.items.map((i, idx) => (
              <li key={idx} className="flex items-baseline justify-between gap-3 py-2.5 text-[15px]">
                <span className="min-w-0">
                  {i.name}
                  {i.quantity > 1 && <span className="text-muted-foreground"> × {i.quantity}</span>}
                </span>
                <span className="shrink-0 font-bold">{eur(i.priceStotinki * i.quantity)}</span>
              </li>
            ))}
          </ul>
          {deliveryStotinki > 0 && (
            <div className="flex items-baseline justify-between border-t border-border py-2.5 text-[15px]">
              <span className="text-muted-foreground">Доставка</span>
              <span className="font-bold">{eur(deliveryStotinki)}</span>
            </div>
          )}
          <div className="flex items-baseline justify-between border-t-2 border-line-strong pt-3 text-[16.5px]">
            <span className="font-extrabold">Общо</span>
            <span className="text-right">
              <span className="font-extrabold">{eur(order.totalStotinki)}</span>{" "}
              <span className="text-[13px] text-muted-foreground">{bgn(order.totalStotinki)}</span>
            </span>
          </div>
        </div>

        <div className="mt-7 text-center">
          <Link href="/shop" className="text-[14px] font-bold text-primary">
            Продължи пазаруването →
          </Link>
        </div>
      </div>
    </StoreShell>
  );
}
