// Public storefront shapes returned by the ФермериБГ `/public/:slug/*` API.

/** How the farmer framed the photo in the panel: focal point (x/y as 0..1 fractions
 *  of the source), zoom (1..3), and the card shape they framed for. Mirrors the
 *  FarmFlow API payload — honor it wherever the photo is cropped. */
export interface CoverCrop {
  x?: number;
  y?: number;
  zoom?: number;
  shape?: 'square' | 'tall' | 'wide' | null;
}

/** Resolved member of a кошница (bundle) — inline on the bundle product itself.
 *  There is NO bundleParentId anywhere; membership arrives only this way. */
export interface PublicBundleItem {
  productId: string;
  name: string;
  slug: string | null;
  image: string | null;
  quantity: number;
  priceStotinki: number;
}

export interface PublicProductVariant {
  id: string;
  label: string;
  priceStotinki: number;
  salePriceStotinki?: number | null;
  soldOut?: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  priceStotinki: number;
  unit: string;
  weight: string | null;
  category: string | null;
  tint: string | null;
  isActive: boolean | null;
  imageUrl: string | null;
  coverCrop?: CoverCrop | null;
  images?: string[];
  farmerId: string | null;
  subcategoryId: string | null;
  featured: boolean;
  courierDisabled?: boolean;
  createdAt: string | null;
  salePercent?: number | null;
  saleEndsAt?: string | null;
  salePriceStotinki?: number | null;
  compareAtPriceStotinki?: number | null;
  variants?: PublicProductVariant[];
  /** Curated free-text content lines for a кошница (legacy, informational). */
  bundleItems?: string[];
  /** Resolved кошница members — present only when category === 'bundle'. */
  bundleProducts?: PublicBundleItem[];
  /** Loss-leader: product can't be ordered alone. */
  requiresCompanion?: boolean;
  /** EUR-cents the OTHER cart lines must total before this product unlocks.
   *  null/absent/0 = any one other product suffices. */
  companionMinPriceStotinki?: number | null;
  /** Positive alias of !courierDisabled, sent by the API. */
  courierShippable?: boolean;
}

export interface Farmer {
  id: string;
  name: string;
  role: string | null;
  bio: string | null;
  phone: string | null;
  email: string | null;
  since: string | null;
  /** Home settlement of the farm (e.g. "Варна"). NULL/absent = not set. */
  city?: string | null;
  tint: string | null;
  imageUrl: string | null;
  coverCrop?: CoverCrop | null;
  images?: string[];
  /** Tier-2 „Бранд идентичност" — when enabled, this farmer's subpage renders the
   *  branded layout (big portrait + gallery + own color). NULL/enabled:false = default. */
  branding?: Tier2Branding | null;
  position: number;
  tier: number;
  createdAt: string | null;
  courierReady?: boolean;
  /** Long-form „За фермата" story (separate from the short bio). */
  story?: string | null;
  /** КЗП/НАП seller identity — legally required public disclosure once filled. */
  legal?: FarmerLegal | null;
  /** Geocoded farm coordinates (from the registered address); null = no pin. */
  lat?: number | null;
  lng?: number | null;
}

/** Legal seller identity (farmer-as-seller marketplace model). All optional —
 *  operators fill it gradually; render seller blocks only when `name` is set. */
export interface FarmerLegal {
  kind?: string | null;
  name?: string | null;
  eik?: string | null;
  vatNumber?: string | null;
  address?: string | null;
  regNo?: string | null;
  confirmedAt?: string | null;
}

/** Tier-2 branding control layer (mirrors FarmFlow @fermeribg/types Tier2Branding). */
export interface Tier2Branding {
  enabled: boolean;
  plan?: "tier2";
  accent?: string | null;
  headingFont?: string | null;
  gallery?: "wide" | "mosaic" | "row" | "grid" | null;
  badges?: string[] | null;
  unlockedAt?: string | null;
  unlockedBy?: string | null;
}

export interface Subcategory {
  id: string;
  name: string;
  description: string | null;
  tint: string | null;
  imageUrl: string | null;
  coverCrop?: CoverCrop | null;
  images?: string[];
  position: number;
  createdAt: string | null;
}

export interface DeliveryPricing {
  freeThresholdStotinki: number;
  addressFeeStotinki: number;
  econtFeeStotinki: number;
  econtAddressFeeStotinki: number;
}

export interface Storefront {
  name: string;
  slug: string;
  phone: string | null;
  email: string | null;
  deliveryEnabled: boolean;
  multiFarmer: boolean;
  multiSubcat: boolean;
  delivery: DeliveryPricing;
  faviconUrl?: string | null;
  themeColor?: string | null;
  productOfWeekPlacement?: 'section' | 'bar';
  contact?: {
    address: string | null;
    hours: string | null;
    tagline: string | null;
    phone: string | null;
    email: string | null;
  } | null;
}

export interface Bootstrap {
  storefront: Storefront;
  products: Product[];
  farmers: Farmer[];
  subcategories: Subcategory[];
  productOfWeek?: { id: string; note: string | null } | null;
  farmerOfWeek?: { id: string; note: string | null } | null;
  availability?: { productId: string; remaining: number }[];
  bestSellerIds?: string[];
  /** Curated storefront reviews for the home page (shape owned by the API). */
  homeReviews?: unknown[];
}

/* ---- Articles (public /articles, /articles/:slug) ---- */

export interface ArticleMedia {
  id: string;
  type: 'image' | 'video' | 'youtube' | 'instagram';
  url: string;
  embedId: string | null;
  caption: string | null;
  position: number;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  coverImageUrl: string | null;
  category: string | null;
  status: 'published' | 'draft';
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  media: ArticleMedia[];
}

/* ---- Reviews (public /reviews) ---- */

export interface Review {
  id: string;
  authorName: string;
  authorLocation: string | null;
  rating: number;
  body: string;
  createdAt: string | null;
}

export interface ReviewSummary {
  average: number;
  count: number;
  reviews: Review[];
}

/* ---- Public order recap (public /orders/:id — UUID-gated, no PII echoed) ---- */

export interface PublicOrderItem {
  name: string;
  quantity: number;
  priceStotinki: number;
}

export interface PublicOrderSummary {
  id: string;
  orderNumber: number | null;
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  paidAt: string | null;
  totalStotinki: number;
  deliveryType: string | null;
  econtOffice: string | null;
  slot: { date: string; startTime: string; endTime: string } | null;
  items: PublicOrderItem[];
  createdAt: string | null;
}
