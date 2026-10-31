/**
 * Accredited TESDA Partner Training Centers & Venues
 * Pampanga & Central Luzon Region
 */

export interface PresetTrainingVenue {
  id: string;
  name: string;
  shortName: string;
  fullAddress: string;
  municipality: string;
  province: string;
  latitude: number;
  longitude: number;
  commuteTip: string;
  isSanLuis?: boolean;
}

export const PRESET_TRAINING_VENUES: PresetTrainingVenue[] = [
  {
    id: "san-luis-tc",
    name: "San Luis Municipal Training & Livelihood Center",
    shortName: "San Luis Training Center",
    fullAddress: "Sta. Cruz Poblacion, San Luis, Pampanga (Near Municipal Hall)",
    municipality: "San Luis",
    province: "Pampanga",
    latitude: 15.0422,
    longitude: 120.7397,
    commuteTip: "Located right at the town center, walking distance or short tricycle ride from San Luis Municipal Hall.",
    isSanLuis: true
  },
  {
    id: "gpsat-guagua",
    name: "Gonzalo Puyat School of Arts and Trades (GPSAT)",
    shortName: "GPSAT Guagua",
    fullAddress: "San Sebastian, Guagua, Pampanga",
    municipality: "Guagua",
    province: "Pampanga",
    latitude: 14.9667,
    longitude: 120.6333,
    commuteTip: "Take jeepney from San Luis to Guagua town proper; accessible via Guagua-Sta. Rita-San Fernando route.",
    isSanLuis: false
  },
  {
    id: "ptc-pampanga",
    name: "TESDA Provincial Training Center - Pampanga",
    shortName: "PTC Pampanga (Sindalan)",
    fullAddress: "Sindalan, City of San Fernando, Pampanga (Near Government Center)",
    municipality: "City of San Fernando",
    province: "Pampanga",
    latitude: 15.0745,
    longitude: 120.6789,
    commuteTip: "Take jeepney from San Luis to San Fernando Intersection, then transfer to Sindalan / Angeles-bound jeepney.",
    isSanLuis: false
  },
  {
    id: "pmtc-csfp",
    name: "Pampanga Manpower Training Center (PMTC)",
    shortName: "PMTC San Fernando",
    fullAddress: "Provincial Capitol Compound, City of San Fernando, Pampanga",
    municipality: "City of San Fernando",
    province: "Pampanga",
    latitude: 15.0298,
    longitude: 120.6908,
    commuteTip: "Accessible from San Fernando Capitol via short walk from the Provincial Capitol rotunda.",
    isSanLuis: false
  },
  {
    id: "mexico-tvi",
    name: "Mexico Technical Vocational Institute (MTVI)",
    shortName: "Mexico TVI",
    fullAddress: "Parian, Mexico, Pampanga (Adjacent to San Luis border)",
    municipality: "Mexico",
    province: "Pampanga",
    latitude: 15.0642,
    longitude: 120.7205,
    commuteTip: "Bordering municipality of San Luis; short 15-minute jeepney or tricycle ride via San Luis - Mexico provincial road.",
    isSanLuis: false
  },
  {
    id: "rtcl-guiguinto",
    name: "Regional Training Center - Central Luzon (RTCCL)",
    shortName: "RTC Central Luzon",
    fullAddress: "Tabang, Guiguinto, Bulacan (Central Luzon Regional Center)",
    municipality: "Guiguinto",
    province: "Bulacan",
    latitude: 14.834,
    longitude: 120.879,
    commuteTip: "Accessible via provincial bus (Victory Liner / Genesis / Bataan Transit) along MacArthur Highway.",
    isSanLuis: false
  },
  {
    id: "megaup-skills",
    name: "Megaup Skills Training & Assessment Center",
    shortName: "Megaup Skills CSFP",
    fullAddress: "Dolores, City of San Fernando, Pampanga",
    municipality: "City of San Fernando",
    province: "Pampanga",
    latitude: 15.0345,
    longitude: 120.6865,
    commuteTip: "Accessible via MacArthur Highway / Dolores intersection.",
    isSanLuis: false
  }
];

export const DEFAULT_MAP_CENTER = {
  lat: 15.0422,
  lng: 120.7397,
  zoom: 14,
  label: "San Luis, Pampanga"
};

/**
 * Extracts embedded coordinates from a location string if present:
 * e.g. "San Sebastian, Guagua, Pampanga <!-- geo: 14.9667, 120.6333 -->"
 */
export function extractLocationCoords(str?: string | null): { lat: number; lng: number } | null {
  if (!str) return null;
  const match =
    str.match(/<!--\s*geo:\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*-->/i) ||
    str.match(/\[geo:\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\]/i);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      return { lat, lng };
    }
  }
  return null;
}

/**
 * Returns a human-friendly display string stripped of any embedded geo comment tags
 */
export function extractLocationDisplay(str?: string | null): string {
  if (!str) return "";
  return str.replace(/<!--\s*geo:[^>]*-->/gi, "").replace(/\[geo:[^\]]*\]/gi, "").trim();
}

/**
 * Encodes verified latitude and longitude directly inside the location string
 */
export function formatLocationWithCoords(name: string, lat: number, lng: number): string {
  const clean = extractLocationDisplay(name) || "San Luis Training Center";
  return `${clean} <!-- geo: ${lat.toFixed(6)}, ${lng.toFixed(6)} -->`;
}

/**
 * Intelligent helper to resolve an existing program's location string or coordinates
 * to the most accurate geographic coordinates.
 */
export function resolveProgramCoordinates(
  locationString?: string | null,
  savedLat?: number | null,
  savedLng?: number | null
): { lat: number; lng: number; venue?: PresetTrainingVenue; isPreset: boolean } {
  // 1. Check if coordinates are explicitly passed or embedded in the location string
  const embedded = extractLocationCoords(locationString);
  const effectiveLat =
    typeof savedLat === "number" && !isNaN(savedLat) && savedLat !== 0
      ? savedLat
      : embedded?.lat;
  const effectiveLng =
    typeof savedLng === "number" && !isNaN(savedLng) && savedLng !== 0
      ? savedLng
      : embedded?.lng;

  if (typeof effectiveLat === "number" && typeof effectiveLng === "number") {
    const matched = PRESET_TRAINING_VENUES.find(
      (v) => Math.abs(v.latitude - effectiveLat) < 0.001 && Math.abs(v.longitude - effectiveLng) < 0.001
    );
    return {
      lat: effectiveLat,
      lng: effectiveLng,
      venue: matched,
      isPreset: !!matched
    };
  }

  // 2. If no saved or embedded coordinates, match clean location string against presets & keywords
  if (locationString) {
    const cleanLocation = extractLocationDisplay(locationString);
    const query = cleanLocation.toLowerCase().trim();

    // Check exact or partial matches
    const matched = PRESET_TRAINING_VENUES.find((v) => {
      const vName = v.name.toLowerCase();
      const vShort = v.shortName.toLowerCase();
      const vAddr = v.fullAddress.toLowerCase();
      return (
        query.includes(vShort) ||
        vName.includes(query) ||
        (query.includes(v.municipality.toLowerCase()) && (query.includes("training") || query.includes("tesda"))) ||
        vAddr.includes(query)
      );
    });

    if (matched) {
      return {
        lat: matched.latitude,
        lng: matched.longitude,
        venue: matched,
        isPreset: true
      };
    }

    // Keyword heuristics
    if (query.includes("guagua") || query.includes("puyat") || query.includes("gpsat")) {
      const gpsat = PRESET_TRAINING_VENUES.find((v) => v.id === "gpsat-guagua")!;
      return { lat: gpsat.latitude, lng: gpsat.longitude, venue: gpsat, isPreset: true };
    }
    if (query.includes("sindalan") || query.includes("provincial training center") || query.includes("ptc")) {
      const ptc = PRESET_TRAINING_VENUES.find((v) => v.id === "ptc-pampanga")!;
      return { lat: ptc.latitude, lng: ptc.longitude, venue: ptc, isPreset: true };
    }
    if (query.includes("mexico")) {
      const mtvi = PRESET_TRAINING_VENUES.find((v) => v.id === "mexico-tvi")!;
      return { lat: mtvi.latitude, lng: mtvi.longitude, venue: mtvi, isPreset: true };
    }
    if (query.includes("san fernando") || query.includes("capitol") || query.includes("manpower")) {
      const pmtc = PRESET_TRAINING_VENUES.find((v) => v.id === "pmtc-csfp")!;
      return { lat: pmtc.latitude, lng: pmtc.longitude, venue: pmtc, isPreset: true };
    }
    if (query.includes("san luis") || query.includes("municipal") || query.includes("poblacion")) {
      const sanLuis = PRESET_TRAINING_VENUES.find((v) => v.id === "san-luis-tc")!;
      return { lat: sanLuis.latitude, lng: sanLuis.longitude, venue: sanLuis, isPreset: true };
    }
  }

  // Fallback to San Luis Town Center
  const defaultVenue = PRESET_TRAINING_VENUES[0];
  return {
    lat: DEFAULT_MAP_CENTER.lat,
    lng: DEFAULT_MAP_CENTER.lng,
    venue: defaultVenue,
    isPreset: true
  };
}

/**
 * Generates an external turn-by-turn navigation URL for Google Maps and Waze
 */
export function getMapNavigationLinks(lat: number, lng: number, label?: string) {
  const encodedLabel = encodeURIComponent(label || "TESDA Training Partner Venue");
  return {
    googleMaps: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=&travelmode=driving`,
    googleMapsSearch: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}(${encodedLabel})`,
    waze: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
  };
}

