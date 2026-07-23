// Bulgaria requires dual EUR/BGN pricing during the euro transition. Backend
// stores integer euro-cents. Fixed currency-board rate — never changes.
export const EUR_TO_BGN = 1.95583;

/** "6,50 €" from integer euro-cents. */
export function eur(stotinki: number): string {
  return (stotinki / 100).toFixed(2).replace('.', ',') + ' €';
}

/** "(12,71 лв.)" — the legally-required BGN equivalent, muted in the UI. */
export function bgn(stotinki: number): string {
  return '(' + ((stotinki / 100) * EUR_TO_BGN).toFixed(2).replace('.', ',') + ' лв.)';
}

/** "6,50 €" from a euro float (client cart totals). */
export function eurFromLv(v: number): string {
  return v.toFixed(2).replace('.', ',') + ' €';
}
