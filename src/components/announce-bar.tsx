import { Truck } from "lucide-react";
import { eur, bgn } from "@/lib/money";

export function AnnounceBar({ freeThreshold }: { freeThreshold: number }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5 bg-forest-dark px-4 py-2.5 text-center text-[13.5px] text-[#edefe2]">
      <Truck className="size-[15px] text-[#bfd2b2]" />
      {freeThreshold > 0 ? (
        <span>
          Безплатна доставка при поръчка над {eur(freeThreshold)} {bgn(freeThreshold)} · плащаш веднъж за цялата кошница
        </span>
      ) : (
        <span>Локална доставка и вземане от място · една кошница от много фермери, едно плащане</span>
      )}
    </div>
  );
}
