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
}
