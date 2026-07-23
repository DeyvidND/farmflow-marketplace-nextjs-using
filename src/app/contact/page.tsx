import type { Metadata } from "next";
import { Phone, Mail } from "lucide-react";
import { getCatalog } from "@/lib/api";
import { StoreShell } from "@/components/store-shell";

export const metadata: Metadata = { title: "Контакти · Фермерски пазари" };

export default async function ContactPage() {
  const { storefront: sf } = await getCatalog();
  const phone = sf.contact?.phone ?? sf.phone;
  const email = sf.contact?.email ?? sf.email;

  return (
    <StoreShell>
      <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <div className="text-[12.5px] font-extrabold uppercase tracking-[0.15em] text-sage-text">Свържи се</div>
        <h1 className="mt-2 font-heading text-4xl font-bold tracking-tight">Контакти</h1>
        <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">
          Имаш въпрос за поръчка, продукт или доставка? Пиши ни или се обади — с радост ще помогнем.
        </p>
        <div className="mt-7 space-y-3">
          {phone && (
            <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 hover:border-primary/40">
              <Phone className="size-5 text-primary" />
              <span className="text-[16px] font-bold text-forest-dark">{phone}</span>
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 hover:border-primary/40">
              <Mail className="size-5 text-primary" />
              <span className="text-[16px] font-semibold">{email}</span>
            </a>
          )}
          {!phone && !email && <p className="text-muted-foreground">Данните за контакт ще бъдат добавени скоро.</p>}
        </div>
      </div>
    </StoreShell>
  );
}
