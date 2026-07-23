"use client";

// Client-side Google Maps integration for /karta. Faithful port of the vanilla-JS
// chaika original: hand-built teardrop pin (data-URI SVG) + a custom `OverlayView`
// popup card (not `InfoWindow` — its chrome can't be restyled), themed with -next's
// own tokens rather than chaika's original hex values.
//
// Two specific behaviors carried over verbatim because they were bug fixes, not
// incidental choices:
//   - POPUP_TOP_CLEARANCE (210px): fitBounds top padding + a pan-into-view nudge
//     on marker click, so a popup opened near the top of the map isn't clipped.
//   - Initial zoom clamp (> 11 → 11, once on first `idle`): fitBounds on a single
//     or tightly-clustered point can zoom in absurdly far; clamp it back down.
import { useEffect, useRef, useState } from "react";
import type { MapPoint } from "@/lib/farmer-map";

/** `id` of the page's SSR fallback `<ul>` — hidden once the map has booted,
 *  restored if the map unmounts or never boots (no key / script failure). */
export const KARTA_FALLBACK_LIST_ID = "karta-fallback-list";

const POPUP_TOP_CLEARANCE = 210;
const MAX_INITIAL_ZOOM = 11;
const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";

// 30×40 teardrop pin, -next tokens: forest fill, cream ring, honey dot.
const PIN_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">' +
  '<path d="M15 0C6.7 0 0 6.7 0 15c0 10.9 12.1 22.9 14.3 24.9a1 1 0 0 0 1.4 0C17.9 37.9 30 25.9 30 15 30 6.7 23.3 0 15 0Z" fill="#33603e" stroke="#faf6ec" stroke-width="2"/>' +
  '<circle cx="15" cy="15" r="6" fill="#b5793b"/>' +
  "</svg>";
const PIN_ICON_URL = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(PIN_SVG)}`;

let mapsLoadPromise: Promise<void> | null = null;

/** Loads the Maps JS API script exactly once, safe against React StrictMode's
 *  double-invoked effects and repeated mounts across navigations. */
function loadGoogleMaps(): Promise<void> {
  if (typeof google !== "undefined" && google.maps) return Promise.resolve();
  if (mapsLoadPromise) return mapsLoadPromise;

  mapsLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById("karta-google-maps-script");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => {
        mapsLoadPromise = null;
        reject(new Error("Google Maps script failed to load"));
      });
      return;
    }
    const script = document.createElement("script");
    script.id = "karta-google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(MAPS_KEY)}&language=bg&region=BG`;
    script.async = true;
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => {
      mapsLoadPromise = null;
      reject(new Error("Google Maps script failed to load"));
    });
    document.head.appendChild(script);
  });
  return mapsLoadPromise;
}

function buildPopupCard(point: MapPoint, onClose: () => void): HTMLDivElement {
  const card = document.createElement("div");
  card.className =
    "absolute z-10 w-[240px] -translate-x-1/2 -translate-y-[calc(100%+14px)] rounded-2xl border border-line-strong bg-background p-4 shadow-[0_16px_40px_-12px_rgba(38,73,47,0.35)]";

  const close = document.createElement("button");
  close.type = "button";
  close.setAttribute("aria-label", "Затвори");
  close.className =
    "absolute right-2.5 top-2.5 grid size-6 place-items-center rounded-full text-[16px] leading-none text-muted-foreground hover:bg-secondary hover:text-foreground";
  close.textContent = "×";
  close.addEventListener("click", (event) => {
    event.stopPropagation();
    onClose();
  });
  card.appendChild(close);

  const name = document.createElement("div");
  name.className = "pr-5 font-heading text-[15.5px] font-semibold text-foreground";
  name.textContent = point.name;
  card.appendChild(name);

  if (point.village) {
    const village = document.createElement("div");
    village.className = "mt-1 text-[13px] text-muted-foreground";
    village.textContent = point.village;
    card.appendChild(village);
  }

  if (point.slug) {
    const link = document.createElement("a");
    link.href = `/farmer/${point.slug}`;
    link.className = "mt-2.5 inline-flex items-center gap-1 text-[13.5px] font-bold text-primary hover:underline";
    link.textContent = "Виж профил →";
    card.appendChild(link);
  }

  return card;
}

/** Custom-themed popup positioned via `OverlayView` (not `InfoWindow` — its
 *  chrome can't be restyled to match -next's tokens). */
function createPopupOverlay(position: google.maps.LatLng, point: MapPoint, onClose: () => void) {
  class Popup extends google.maps.OverlayView {
    private el: HTMLDivElement | null = null;

    onAdd() {
      this.el = buildPopupCard(point, onClose);
      this.getPanes()?.floatPane.appendChild(this.el);
      // Popup DOM lives in floatPane, above the map — without this, any click on
      // the card (other than the ×) bubbles to the map's own click handler and
      // immediately self-closes the popup that click just opened.
      google.maps.OverlayView.preventMapHitsAndGesturesFrom(this.el);
    }

    draw() {
      if (!this.el) return;
      const pixel = this.getProjection()?.fromLatLngToDivPixel(position);
      if (!pixel) return;
      this.el.style.left = `${pixel.x}px`;
      this.el.style.top = `${pixel.y}px`;
    }

    onRemove() {
      this.el?.remove();
      this.el = null;
    }
  }
  return new Popup();
}

/** Invisible overlay whose only job is exposing a live pixel projection, so a
 *  marker's on-screen position can be measured before any popup of its own has
 *  been added to the map (needed for the pan-into-view clearance check). Built
 *  lazily — `google.maps.OverlayView` doesn't exist until the script loads. */
function createProjectionProbe() {
  class ProjectionProbe extends google.maps.OverlayView {
    onAdd() {}
    draw() {}
    onRemove() {}
  }
  return new ProjectionProbe();
}

export function FarmerMap({ points }: { points: MapPoint[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!MAPS_KEY || points.length === 0 || !containerRef.current) return;

    let cancelled = false;
    const markers: google.maps.Marker[] = [];
    let activePopup: google.maps.OverlayView | null = null;
    let probe: google.maps.OverlayView | null = null;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current) return;

        const map = new google.maps.Map(containerRef.current, {
          center: { lat: 42.7339, lng: 25.4858 },
          zoom: 7,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
        });

        probe = createProjectionProbe();
        probe.setMap(map);

        const closeActivePopup = () => {
          activePopup?.setMap(null);
          activePopup = null;
        };

        const bounds = new google.maps.LatLngBounds();
        points.forEach((point) => {
          const position = new google.maps.LatLng(point.lat, point.lng);
          bounds.extend(position);

          const marker = new google.maps.Marker({
            position,
            map,
            title: point.name,
            icon: {
              url: PIN_ICON_URL,
              scaledSize: new google.maps.Size(30, 40),
              anchor: new google.maps.Point(15, 40),
            },
          });
          marker.addListener("click", () => {
            closeActivePopup();
            const popup = createPopupOverlay(position, point, closeActivePopup);
            popup.setMap(map);
            activePopup = popup;

            const pixel = probe?.getProjection()?.fromLatLngToDivPixel(position);
            if (pixel && pixel.y < POPUP_TOP_CLEARANCE) {
              map.panBy(0, pixel.y - POPUP_TOP_CLEARANCE);
            }
          });
          markers.push(marker);
        });

        map.addListener("click", closeActivePopup);

        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { top: POPUP_TOP_CLEARANCE, right: 64, bottom: 64, left: 64 });
        }
        google.maps.event.addListenerOnce(map, "idle", () => {
          const zoom = map.getZoom();
          if (zoom !== undefined && zoom > MAX_INITIAL_ZOOM) map.setZoom(MAX_INITIAL_ZOOM);
        });

        if (cancelled) return;
        setReady(true);
        document.getElementById(KARTA_FALLBACK_LIST_ID)?.setAttribute("hidden", "");
      })
      .catch(() => {
        // Offline / blocked / bad key — the SSR fallback list simply stays visible.
      });

    return () => {
      cancelled = true;
      markers.forEach((m) => m.setMap(null));
      activePopup?.setMap(null);
      probe?.setMap(null);
      document.getElementById(KARTA_FALLBACK_LIST_ID)?.removeAttribute("hidden");
    };
  }, [points]);

  if (!MAPS_KEY || points.length === 0) return null;

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Карта на фермерите"
      className={ready ? "h-[520px] w-full rounded-2xl border border-border" : "sr-only h-0 w-0"}
    />
  );
}
