"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Store, Truck } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { eurFromLv, eur, bgn } from "@/lib/money";
import { PUBLIC_BASE } from "@/lib/config";
import { distinctSellers } from "@/lib/sellers";
import { CARRIER_METHODS } from "@/lib/courier";
import { unsatisfiedCompanions, companionMessage } from "@/lib/companion";
import { getSlots, getCatalog, FALLBACK_STOREFRONT } from "@/lib/api";
import type { Slot } from "@/lib/types";

type Method = "pickup" | "address";

/** "сряда, 30 юли" — full weekday, used on the picker cards. */
const fmtSlotDate = (iso: string) =>
  new Intl.DateTimeFormat("bg-BG", { weekday: "long", day: "numeric", month: "long" }).format(new Date(iso));

/** "ср, 30 юли" — short weekday, used on the CTA once a day is picked. */
const fmtSlotDateShort = (iso: string) =>
  new Intl.DateTimeFormat("bg-BG", { weekday: "short", day: "numeric", month: "long" }).format(new Date(iso));

/** Dormant today: `method` can only ever be "pickup"/"address" (neither is a
 *  carrier method), so this never renders yet — see src/lib/courier.ts. Typed
 *  `string` rather than `Method` so it lights up on its own once a carrier
 *  method is added to checkout, without this file's own Method union having
 *  to widen for it. */
function showNDeliveriesNotice(method: string, sellerCount: number): boolean {
  return sellerCount >= 2 && CARRIER_METHODS.has(method);
}

export function CheckoutView() {
  const router = useRouter();
  const { items, clear } = useCart();
  const [method, setMethod] = useState<Method>("pickup");
  const sellers = distinctSellers(items);
  const sellerCount = sellers.length;
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ customerName: "", customerPhone: "", customerEmail: "", address: "", notes: "" });
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [delivery, setDelivery] = useState(FALLBACK_STOREFRONT.delivery);

  // Client-side: availability (slots) and the fee/threshold settings both
  // need fresh data, not the page's cached bootstrap — degrade silently, the
  // form works fine without either (no slot section, no fee line).
  useEffect(() => {
    getSlots().then(setSlots).catch(() => {});
    getCatalog()
      .then((c) => setDelivery(c.storefront.delivery))
      .catch(() => {});
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const availableSlots = slots.filter((s) => s.remaining > 0);
  const selectedSlot = slotId ? availableSlots.find((s) => s.id === slotId) : undefined;

  // Cart lines store EUR floats — round each line to cents before summing so
  // float drift can't wrongly fail the free-delivery threshold comparison.
  const subtotalStotinki = items.reduce((sum, it) => sum + Math.round(it.price * 100) * it.qty, 0);
  const isFreeDelivery = delivery.freeThresholdStotinki > 0 && subtotalStotinki >= delivery.freeThresholdStotinki;
  const feeStotinki = method === "address" && !isFreeDelivery ? delivery.addressFeeStotinki : 0;
  const totalStotinki = subtotalStotinki + feeStotinki;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length) {
      router.replace("/cart");
      return;
    }
    const unmetCompanions = unsatisfiedCompanions(items);
    if (unmetCompanions.length > 0) {
      toast.error(companionMessage(unmetCompanions[0]));
      router.push("/cart");
      return;
    }
    if (!form.customerName.trim() || !form.customerPhone.trim()) {
      toast.error("Попълни име и телефон.");
      return;
    }
    if (method === "address" && !form.address.trim()) {
      toast.error("Въведи адрес за доставка.");
      return;
    }

    const payload: Record<string, unknown> = {
      items: items.map((it) => {
        const [productId, variantId] = it.id.split(":");
        return { productId, quantity: it.qty, ...(variantId ? { variantId } : {}) };
      }),
      customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.trim(),
      customerEmail: form.customerEmail.trim(),
      paymentMethod: "cod",
      ...(slotId ? { slotId } : {}),
    };
    if (method === "pickup") {
      payload.deliveryType = "pickup";
      payload.deliveryAddress = "Вземане от място";
      payload.notes = form.notes.trim() || "Вземане от място";
    } else {
      payload.deliveryType = "address";
      payload.deliveryAddress = form.address.trim();
      if (form.notes.trim()) payload.deliveryNote = form.notes.trim();
    }

    setBusy(true);
    try {
      const res = await fetch(`${PUBLIC_BASE}/checkout`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = (body?.message?.message ?? body?.message) || "Поръчката не можа да бъде приета.";
        toast.error(Array.isArray(msg) ? msg[0] : String(msg));
        return;
      }
      const data = await res.json().catch(() => ({}));
      const num = data?.orderNumber ?? data?.orders?.[0]?.orderNumber ?? data?.number ?? "";
      // Order UUID → the public status page (/order/[id]). CheckoutResult carries
      // it as orderId; the courier-split shape nests it under orders[0].
      const oid = data?.orderId ?? data?.orders?.[0]?.orderId ?? "";
      clear();
      const q = new URLSearchParams();
      if (num) q.set("n", String(num));
      if (oid) q.set("o", String(oid));
      router.push(`/confirmation${q.size ? `?${q}` : ""}`);
    } catch {
      toast.error("Няма връзка със сървъра. Опитай отново.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="font-heading text-3xl font-bold tracking-tight">Поръчка</h1>

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line-strong bg-card p-12 text-center text-muted-foreground">
          Количката е празна. <Link href="/shop" className="font-semibold text-primary">Разгледай магазина →</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {/* delivery method */}
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-bold">Как да получиш продуктите</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {([
                  { id: "pickup", ic: Store, t: "Вземане от място", d: "Директно от фермера — без такса" },
                  { id: "address", ic: Truck, t: "Доставка до адрес", d: "Локална доставка до вратата" },
                ] as const).map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
                      method === m.id ? "border-primary bg-secondary" : "border-line-strong"
                    }`}
                  >
                    <m.ic className="mt-0.5 size-5 text-primary" />
                    <span>
                      <span className="block font-bold">{m.t}</span>
                      <span className="block text-[13px] text-muted-foreground">{m.d}</span>
                    </span>
                  </button>
                ))}
              </div>
              {method === "address" && (
                <div className="mt-4">
                  <label className="text-sm font-semibold">Адрес за доставка</label>
                  <Input value={form.address} onChange={set("address")} placeholder="ул. Дунав 5, Варна" className="mt-1.5 h-11 rounded-xl border-line-strong bg-card" />
                </div>
              )}
              {showNDeliveriesNotice(method, sellerCount) && (
                <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-[13px] text-amber-900 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-200">
                  Продуктите ти са от {sellerCount} различни производители. Ще се създадат {sellerCount} отделни
                  доставки — по една от всеки фермер, всяка със собствен наложен платеж при получаване.
                </div>
              )}
            </section>

            {/* delivery day */}
            {availableSlots.length > 0 && (
              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="font-bold">{method === "pickup" ? "Ден за вземане" : "Ден за доставка"}</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {availableSlots.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => setSlotId(s.id)}
                      className={`flex min-h-11 flex-col items-start gap-0.5 rounded-xl border-2 p-4 text-left transition-colors ${
                        slotId === s.id ? "border-primary bg-secondary" : "border-line-strong"
                      }`}
                    >
                      <span className="block font-bold capitalize">{fmtSlotDate(s.date)}</span>
                      {s.startTime && s.endTime && (
                        <span className="block text-[13px] text-muted-foreground">{s.startTime}–{s.endTime}</span>
                      )}
                      <span className="block text-[13px] text-muted-foreground">{s.remaining} свободни</span>
                      {s.customerNote && (
                        <span className="block text-[13px] text-muted-foreground">{s.customerNote}</span>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* contact */}
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-bold">Данни за контакт</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Име и фамилия *"><Input value={form.customerName} onChange={set("customerName")} autoComplete="name" className="h-11 rounded-xl border-line-strong bg-card" /></Field>
                <Field label="Телефон *"><Input value={form.customerPhone} onChange={set("customerPhone")} type="tel" autoComplete="tel" className="h-11 rounded-xl border-line-strong bg-card" /></Field>
                <Field label="Имейл"><Input value={form.customerEmail} onChange={set("customerEmail")} type="email" autoComplete="email" className="h-11 rounded-xl border-line-strong bg-card" /></Field>
                <Field label={method === "address" ? "Бележка (блок, вход, етаж)" : "Бележка"}><Input value={form.notes} onChange={set("notes")} className="h-11 rounded-xl border-line-strong bg-card" /></Field>
              </div>
              <p className="mt-3 text-[13px] text-muted-foreground">Плащане: в брой при получаване (наложен платеж).</p>
            </section>
          </div>

          {/* summary */}
          <aside className="h-fit rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-28">
            <h2 className="font-bold">Твоята поръчка</h2>
            <div className="mt-3 space-y-2 text-sm">
              {items.map((it) => (
                <div key={it.id} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate text-foreground/85">{it.qty}× {it.name}</span>
                  <span className="shrink-0 font-semibold">{eurFromLv(it.price * it.qty)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Продукти</span>
                <span className="font-semibold">{eur(subtotalStotinki)}</span>
              </div>
              {method === "address" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Доставка</span>
                  <span className="font-semibold">{feeStotinki === 0 ? "безплатно" : eur(feeStotinki)}</span>
                </div>
              )}
            </div>
            {method === "address" && !isFreeDelivery && delivery.freeThresholdStotinki > 0 && (
              <p className="mt-2 text-[12.5px] text-muted-foreground">
                Безплатна доставка над {eur(delivery.freeThresholdStotinki)}
              </p>
            )}
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="font-bold">Общо</span>
              <span className="text-right">
                <span className="font-heading text-xl font-semibold text-forest-dark">{eur(totalStotinki)}</span>
                <span className="ml-1.5 text-[13px] text-muted-foreground">{bgn(totalStotinki)}</span>
              </span>
            </div>
            {sellerCount >= 2 && (
              <div className="mt-4 rounded-xl border border-border bg-secondary/40 p-3.5 text-[12.5px] text-muted-foreground">
                Поръчка от {sellerCount} производители. Договорът за всеки продукт се сключва със съответния
                производител — пазарът е посредник (онлайн място за търговия). Продавачи: {sellers.map((s) => s.name).join(", ")}.
              </div>
            )}
            <Button type="submit" disabled={busy} className="mt-4 h-12 w-full rounded-xl text-base font-bold">
              {busy ? "Изпращане…" : selectedSlot ? `Поръчай · ${fmtSlotDateShort(selectedSlot.date)}` : "Поръчай сега"}
            </Button>
          </aside>
        </form>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}
