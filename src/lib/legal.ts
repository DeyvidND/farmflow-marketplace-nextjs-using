// КЗП seller-identity formatting (farmer-as-seller marketplace model). Pure
// string builder shared by the farmer page, the branded farmer layout, and
// the product detail page so the three surfaces never drift from each other.
import type { FarmerLegal } from './types';

/** Builds the identity line under the seller name: `ЕИК/БУЛСТАТ …` (falling
 *  back to `Рег. № зем. производител …` when no ЕИК is on file), then an
 *  optional ` · ДДС № …`, then an optional ` · {address}`. Returns '' when
 *  none of those fields are set (caller decides whether to render the row). */
export function legalIdLine(legal: FarmerLegal): string {
  const primary = legal.eik
    ? `ЕИК/БУЛСТАТ ${legal.eik}`
    : legal.regNo
      ? `Рег. № зем. производител ${legal.regNo}`
      : null;
  return [primary, legal.vatNumber ? `ДДС № ${legal.vatNumber}` : null, legal.address ?? null]
    .filter(Boolean)
    .join(' · ');
}
