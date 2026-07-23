import type { Metadata } from "next";
import { BadgeCheck, HandCoins, Sprout, Users } from "lucide-react";
import { StoreShell } from "@/components/store-shell";

export const metadata: Metadata = { title: "За нас · Пазар за местни фермери" };

const VALUES = [
  { ic: Sprout, t: "Местно и сезонно", d: "Продукти от региона — толкова свежи, колкото е възможно." },
  { ic: HandCoins, t: "Директно от фермера", d: "Без вериги и посредници — парите отиват при стопанина." },
  { ic: Users, t: "Общност", d: "Познаваме си хората — стопани и клиенти на едно място." },
  { ic: BadgeCheck, t: "Честно и ясно", d: "Знаеш кой, къде и как е произвел това, което купуваш." },
];

export default function AboutPage() {
  return (
    <StoreShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <div className="text-[12.5px] font-extrabold uppercase tracking-[0.15em] text-sage-text">За нас</div>
        <h1 className="mt-2 font-heading text-4xl font-bold tracking-tight">Един пазар, много местни стопани</h1>
        <div className="mt-6 space-y-4 text-[16px] leading-relaxed text-foreground/85">
          <p>
            Събираме местните фермери на едно място. Тук храната не минава през вериги и складове — купуваш я директно от човека, който я е отгледал.
          </p>
          <p>
            На пазара се събират стопанства с плодове и зеленчуци, мляко и сирене, мед, месо и домашни сладка. Различни стопани, един и същ принцип — местно, сезонно и честно.
          </p>
          <p>
            Сайтът е тук, за да е по-лесно: разглеждаш фермерите и продуктите им, поръчваш онлайн и избираш доставка до дома или вземане от място.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {VALUES.map((v) => (
            <div key={v.t} className="rounded-2xl border border-border bg-card p-5">
              <v.ic className="size-6 text-primary" />
              <h3 className="mt-3 text-[17px] font-bold">{v.t}</h3>
              <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted-foreground">{v.d}</p>
            </div>
          ))}
        </div>
      </div>
    </StoreShell>
  );
}
