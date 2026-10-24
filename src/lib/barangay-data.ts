/**
 * Official Geographic and Jurisdictional Zone Data
 * Municipality of San Luis, Pampanga (All 17 Barangays)
 * 
 * Accurately models the exact number of Puroks, named Puroks with Sitios,
 * and Street-based designations across each Barangay.
 */

export interface PurokOrZoneData {
  name: string;
  type: "purok" | "street";
  sitios?: string[];
}

export interface BarangayJurisdiction {
  name: string;
  zoneType: "purok" | "street";
  zones: PurokOrZoneData[];
}

function generateNumberedPuroks(count: number): PurokOrZoneData[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `Purok ${i + 1}`,
    type: "purok" as const
  }));
}

export const BARANGAY_JURISDICTIONS: Record<string, BarangayJurisdiction> = {
  "Sto. Niño": {
    name: "Sto. Niño",
    zoneType: "purok",
    zones: generateNumberedPuroks(6)
  },
  "San Roque": {
    name: "San Roque",
    zoneType: "purok",
    zones: generateNumberedPuroks(6)
  },
  "San Isidro": {
    name: "San Isidro",
    zoneType: "purok",
    zones: generateNumberedPuroks(7)
  },
  "San Juan": {
    name: "San Juan",
    zoneType: "purok",
    zones: generateNumberedPuroks(7)
  },
  "San Nicolas": {
    name: "San Nicolas",
    zoneType: "purok",
    zones: generateNumberedPuroks(5)
  },
  "Sta. Monica": {
    name: "Sta. Monica",
    zoneType: "purok",
    zones: generateNumberedPuroks(6)
  },
  "San Agustin": {
    name: "San Agustin",
    zoneType: "purok",
    zones: generateNumberedPuroks(7)
  },
  "Sta. Cruz Pambilog": {
    name: "Sta. Cruz Pambilog",
    zoneType: "purok",
    zones: generateNumberedPuroks(3)
  },
  "Sta. Catalina": {
    name: "Sta. Catalina",
    zoneType: "purok",
    zones: generateNumberedPuroks(5)
  },
  "San Sebastian": {
    name: "San Sebastian",
    zoneType: "purok",
    zones: generateNumberedPuroks(5)
  },
  "Sto. Tomas": {
    name: "Sto. Tomas",
    zoneType: "purok",
    zones: generateNumberedPuroks(10)
  },
  "Sta. Rita": {
    name: "Sta. Rita",
    zoneType: "purok",
    zones: generateNumberedPuroks(3)
  },
  "Sto. Rosario": {
    name: "Sto. Rosario",
    zoneType: "purok",
    zones: generateNumberedPuroks(7)
  },
  "Sta. Lucia": {
    name: "Sta. Lucia",
    zoneType: "purok",
    zones: generateNumberedPuroks(3)
  },
  "San Jose": {
    name: "San Jose",
    zoneType: "purok",
    zones: [
      {
        name: "Purok Musni",
        type: "purok",
        sitios: [
          "Sitio Tabing Sapa",
          "Sitio Pulong Taruc",
          "Sitio Pulong Manalili",
          "Sitio Pulong Calma",
          "Sitio Kayle Onse"
        ]
      },
      {
        name: "Purok Miranda",
        type: "purok",
        sitios: ["Sitio Salampak"]
      },
      {
        name: "Purok Mamena",
        type: "purok",
        sitios: [
          "Sitio Hawaii",
          "Sitio Tabing Sapa",
          "Sitio Pulong Mangga",
          "Sitio Gitnang Manena"
        ]
      },
      {
        name: "Purok Proper",
        type: "purok",
        sitios: [
          "Sitio Tabing Patubig",
          "Sitio Damag",
          "Sitio Pulong Kawayan",
          "Sitio Pulong Salas",
          "Sitio Manggahan",
          "Sitio Tabing Sangka",
          "Sitio Tabon",
          "Sitio Pasok"
        ]
      }
    ]
  },
  "San Carlos": {
    name: "San Carlos",
    zoneType: "purok",
    zones: [
      {
        name: "Purok 1",
        type: "purok",
        sitios: ["Sitio 1-A", "Sitio 1-B"]
      },
      {
        name: "Purok 2",
        type: "purok",
        sitios: ["Sitio 2-A", "Sitio 2-B"]
      },
      {
        name: "Purok 3",
        type: "purok",
        sitios: ["Sitio 3-A", "Sitio 3-B"]
      },
      {
        name: "Purok 4",
        type: "purok",
        sitios: ["Sitio 4-A", "Sitio 4-B"]
      },
      {
        name: "Purok 5",
        type: "purok",
        sitios: ["Sitio 5-A", "Sitio 5-B"]
      }
    ]
  },
  "Sta. Cruz Poblacion": {
    name: "Sta. Cruz Poblacion",
    zoneType: "street",
    zones: [
      { name: "Street 1", type: "street" },
      { name: "Street 2", type: "street" },
      { name: "Street 3", type: "street" },
      { name: "Street 4", type: "street" },
      { name: "Street 5", type: "street" },
      { name: "Street 6", type: "street" },
      { name: "Street 7", type: "street" },
      { name: "Street 8", type: "street" }
    ]
  }
};

/**
 * Standard list of all 17 Barangays in San Luis, Pampanga
 */
export const SAN_LUIS_BARANGAYS: string[] = [
  "San Sebastian",
  "Sta. Cruz Pambilog",
  "San Nicolas",
  "Sto. Rosario",
  "San Jose",
  "San Juan",
  "Sta. Rita",
  "Sto. Niño",
  "San Agustin",
  "San Carlos",
  "San Isidro",
  "San Roque",
  "Sta. Cruz Poblacion",
  "Sta. Lucia",
  "Sta. Monica",
  "Sta. Catalina",
  "Sto. Tomas"
];

/**
 * Normalizes a barangay name (removes accents, leading "Barangay ", extra spaces)
 */
export function normalizeBarangayName(rawName?: string | null): string {
  if (!rawName) return "";
  let cleaned = rawName
    .replace(/^Barangay\s+/i, "")
    .replace(/^Brgy\.?\s+/i, "")
    .trim();

  // Normalize accent in Población -> Poblacion
  cleaned = cleaned.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Match case-insensitively against official list
  const found = Object.keys(BARANGAY_JURISDICTIONS).find(
    k => k.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === cleaned.toLowerCase()
  );

  return found || cleaned;
}

/**
 * Gets the jurisdiction configuration for a given barangay
 */
export function getBarangayJurisdiction(barangayName?: string | null): BarangayJurisdiction | undefined {
  const normalized = normalizeBarangayName(barangayName);
  return BARANGAY_JURISDICTIONS[normalized];
}

/**
 * Returns all selectable zone options for a given barangay.
 * If the barangay has sub-sitios, returns both the base purok and purok-sitio combinations.
 */
export function getBarangayZoneOptions(barangayName?: string | null): { value: string; label: string; zone: string; sitio?: string }[] {
  const jurisdiction = getBarangayJurisdiction(barangayName);
  if (!jurisdiction) {
    return [
      { value: "Purok 1", label: "Purok 1", zone: "Purok 1" },
      { value: "Purok 2", label: "Purok 2", zone: "Purok 2" },
      { value: "Purok 3", label: "Purok 3", zone: "Purok 3" },
      { value: "Purok 4", label: "Purok 4", zone: "Purok 4" }
    ];
  }

  const options: { value: string; label: string; zone: string; sitio?: string }[] = [];

  jurisdiction.zones.forEach((zone) => {
    if (zone.sitios && zone.sitios.length > 0) {
      // Include the base Purok
      options.push({
        value: zone.name,
        label: `${zone.name} (General)`,
        zone: zone.name
      });
      // Include each sub-sitio under this purok
      zone.sitios.forEach((sitio) => {
        const fullValue = `${zone.name} - ${sitio}`;
        options.push({
          value: fullValue,
          label: `${zone.name} • ${sitio}`,
          zone: zone.name,
          sitio
        });
      });
    } else {
      options.push({
        value: zone.name,
        label: zone.name,
        zone: zone.name
      });
    }
  });

  return options;
}

/**
 * Returns the label used for the zone type in this barangay ("Street" or "Purok")
 */
export function getBarangayZoneTypeLabel(barangayName?: string | null): string {
  const jurisdiction = getBarangayJurisdiction(barangayName);
  return jurisdiction?.zoneType === "street" ? "Street" : "Purok";
}
