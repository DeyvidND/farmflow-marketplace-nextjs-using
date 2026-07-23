"use client";

// Client-side Google Maps integration for /karta. Faithful port of the vanilla-JS
// chaika original for pins + fit/zoom behavior, minus its per-pin `OverlayView`
// popup: the „Роден Дар"-style explorer renders farmer detail as a plain,
// absolutely-positioned panel (see `farmer-detail-panel.tsx`) that sits beside
// the map as a DOM sibling instead of glued to a marker's projected pixel — no
// custom OverlayView, no preventMapHitsAndGesturesFrom dance, no top-clearance
// pan-into-view math needed, since the panel never overlaps a marker's own
// popup chrome.
import { useEffect, useRef, useState } from "react";
import type { MapPoint } from "@/lib/farmer-map";

const MAP_FIT_PADDING = 56;
// fitBounds on a single or tightly-clustered point can zoom in absurdly far;
// clamp it back down once, on first `idle` — carried over from the original
// implementation as a genuine bug fix, unrelated to the removed popup.
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

export function FarmerMap({
  points,
  onSelect,
}: {
  points: MapPoint[];
  /** Fired when a pin is clicked — the caller resolves it back to a full
   *  `Farmer` record (via slug) and opens the detail panel. */
  onSelect: (point: MapPoint) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  // Kept fresh without re-running the marker-sync effect on every render.
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  });
  const [ready, setReady] = useState(false);

  // Boots the map exactly once, whenever a key is configured.
  useEffect(() => {
    if (!MAPS_KEY || !containerRef.current) return;
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        mapRef.current = new google.maps.Map(containerRef.current, {
          center: { lat: 42.7339, lng: 25.4858 },
          zoom: 7,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
        });
        setReady(true);
      })
      .catch(() => {
        // Offline / blocked / bad key — the container just stays empty; the
        // page's "Производители" tab is the fallback route either way.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Rebuilds pins whenever the filtered point set changes (search/category
  // filters, or the initial load once the map is ready).
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (points.length === 0) return;

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
      marker.addListener("click", () => onSelectRef.current(point));
      markersRef.current.push(marker);
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        top: MAP_FIT_PADDING,
        right: MAP_FIT_PADDING,
        bottom: MAP_FIT_PADDING,
        left: MAP_FIT_PADDING,
      });
    }
    google.maps.event.addListenerOnce(map, "idle", () => {
      const zoom = map.getZoom();
      if (zoom !== undefined && zoom > MAX_INITIAL_ZOOM) map.setZoom(MAX_INITIAL_ZOOM);
    });
  }, [ready, points]);

  // Marker teardown on unmount.
  useEffect(
    () => () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
    },
    [],
  );

  if (!MAPS_KEY) return null;

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Карта на фермерите"
      className="min-h-[600px] w-full rounded-2xl border border-border bg-secondary/30"
    />
  );
}
