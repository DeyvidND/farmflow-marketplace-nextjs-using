"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PUBLIC_BASE } from "@/lib/config";

export function SubscriptionBox() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error("Провери имейл адреса.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${PUBLIC_BASE}/newsletter`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      toast.success("Благодарим за абонамента!");
      setEmail("");
    } catch {
      toast.error("Възникна грешка. Опитай отново.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="box" className="scroll-mt-32">
      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center gap-8 rounded-3xl bg-forest-dark p-7 text-[#eef2e7] sm:p-11">
          <div className="min-w-[280px] flex-1">
            <div className="text-[12.5px] font-extrabold uppercase tracking-[0.15em] text-[#a9c79a]">
              Всяка седмица прясно
            </div>
            <h2 className="mt-2.5 font-heading text-3xl font-bold leading-tight text-[#fbf8f0]">
              Седмична фермерска кошница
            </h2>
            <p className="mt-3 max-w-[440px] text-[15.5px] leading-relaxed text-[#c9d6be]">
              Абонирай се и всяка седмица получаваш подбрано най-прясното от местните фермери — без да мислиш какво да поръчаш. Спираш или променяш когато поискаш.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2.5">
              {["Без ангажимент", "Спираш по всяко време", "Локална доставка"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5 text-[13.5px] text-[#dce7d3]">
                  <Check className="size-4 text-[#a9c79a]" /> {t}
                </span>
              ))}
            </div>
          </div>
          <div className="min-w-[260px] max-w-[420px] flex-1">
            <form onSubmit={submit} className="rounded-2xl bg-[#f4efe1] p-5">
              <label htmlFor="nl-email" className="text-[13.5px] font-bold text-foreground">
                Остави имейл — пишем ти какво е прясно
              </label>
              <div className="mt-3 flex flex-wrap gap-2.5">
                <Input
                  id="nl-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="име@example.com"
                  className="h-12 flex-1 rounded-xl border-line-strong bg-card text-base text-foreground"
                />
                <Button type="submit" disabled={busy} className="h-12 rounded-xl font-bold">
                  Абонирай се
                </Button>
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                Без спам. Само какво пристига от фермерите тази седмица.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
