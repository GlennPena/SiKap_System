"use client";

import React, { useState, useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  Search,
  Navigation,
  Compass,
  Building2,
  Phone,
  User,
  ExternalLink,
  X,
  Layers,
  Check,
  AlertCircle,
  Copy,
  Info
} from "lucide-react";
import {
  PRESET_TRAINING_VENUES,
  PresetTrainingVenue,
  resolveProgramCoordinates,
  getMapNavigationLinks,
  extractLocationDisplay,
  extractLocationCoords,
  formatLocationWithCoords
} from "../lib/training-venues";

export interface TrainingVenueMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "picker" | "viewer";
  // Data for viewer mode
  programTitle?: string;
  provider?: string;
  initialLocation?: string;
  initialLat?: number;
  initialLng?: number;
  room?: string;
  instructor?: string;
  contactPerson?: string;
  contactNumber?: string;
  // Callback for picker mode
  onSelectLocation?: (result: {
    location: string;
    latitude: number;
    longitude: number;
  }) => void;
}

export const TrainingVenueMapModal: React.FC<TrainingVenueMapModalProps> = ({
  isOpen,
  onClose,
  mode,
  programTitle,
  provider,
  initialLocation,
  initialLat,
  initialLng,
  room,
  instructor,
  contactPerson,
  contactNumber,
  onSelectLocation
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  // Initial coordinates resolution
  const resolved = resolveProgramCoordinates(initialLocation, initialLat, initialLng);
  const cleanDisplayName = extractLocationDisplay(initialLocation) || resolved.venue?.fullAddress || "San Luis, Pampanga";

  // States
  const [currentLat, setCurrentLat] = useState<number>(resolved.lat);
  const [currentLng, setCurrentLng] = useState<number>(resolved.lng);
  const [locationName, setLocationName] = useState<string>(cleanDisplayName);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(resolved.venue?.id || "");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string>("");
  const [mapType, setMapType] = useState<"streets" | "satellite">("streets");
  const [copiedCoords, setCopiedCoords] = useState<boolean>(false);
  const [isLeafletReady, setIsLeafletReady] = useState<boolean>(false);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      const res = resolveProgramCoordinates(initialLocation, initialLat, initialLng);
      const clean = extractLocationDisplay(initialLocation) || res.venue?.fullAddress || "San Luis, Pampanga";
      setCurrentLat(res.lat);
      setCurrentLng(res.lng);
      setLocationName(clean);
      setSelectedPresetId(res.venue?.id || "");
      setSearchQuery("");
      setSearchError("");

      // Live geocoding fallback if no explicit coordinates were saved/embedded and not a preset
      const hasSavedCoords = extractLocationCoords(initialLocation) || (typeof initialLat === "number" && initialLat !== 0);
      if (!hasSavedCoords && !res.isPreset && clean && clean.toLowerCase() !== "san luis, pampanga") {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(clean + ", Pampanga, Philippines")}&limit=1`)
          .then((r) => r.json())
          .then((data) => {
            if (data && data.length > 0) {
              const newLat = parseFloat(data[0].lat);
              const newLng = parseFloat(data[0].lon);
              if (!isNaN(newLat) && !isNaN(newLng)) {
                setCurrentLat(newLat);
                setCurrentLng(newLng);
              }
            }
          })
          .catch((e) => console.warn("Live geocode fallback error:", e));
      }
    }
  }, [isOpen, initialLocation, initialLat, initialLng]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!isOpen) return;

    let isSubscribed = true;

    const initMap = async () => {
      try {
        const L = (await import("leaflet")).default;

        if (!isSubscribed || !mapContainerRef.current) return;

        // Cleanup existing instance if any
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        // Create Map
        const map = L.map(mapContainerRef.current, {
          center: [currentLat, currentLng],
          zoom: 15,
          zoomControl: false
        });

        // Add custom Zoom Control to bottom-right
        L.control.zoom({ position: "bottomright" }).addTo(map);

        // Street Layer vs Satellite Layer
        const streetTiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19
        });

        const satTiles = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          {
            attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
            maxZoom: 19
          }
        );

        if (mapType === "satellite") {
          satTiles.addTo(map);
          tileLayerRef.current = satTiles;
        } else {
          streetTiles.addTo(map);
          tileLayerRef.current = streetTiles;
        }

        // Custom DivIcon with Tailwind
        const customPinIcon = L.divIcon({
          className: "custom-barangay-div-icon",
          html: `
            <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full">
              <div class="w-10 h-10 rounded-2xl bg-[#0A6B43] text-white flex items-center justify-center shadow-xl border-2 border-white ring-4 ring-[#0A6B43]/20 transform transition-transform hover:scale-110">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <div class="absolute -bottom-1 w-2.5 h-2.5 bg-[#0A6B43] rotate-45 border-r border-b border-white"></div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          popupAnchor: [0, -42]
        });

        const marker = L.marker([currentLat, currentLng], {
          icon: customPinIcon,
          draggable: mode === "picker"
        }).addTo(map);

        const popupContent = `
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4; padding: 2px;">
            <strong style="color: #0A6B43; font-weight: 800; font-size: 13px;">${provider || "TESDA Partner Venue"}</strong>
            <p style="margin: 4px 0 2px; color: #1f2937; font-weight: 600;">${locationName}</p>
            ${room ? `<p style="margin: 0; color: #4b5563; font-size: 11px;">Room: <strong>${room}</strong></p>` : ""}
          </div>
        `;
        marker.bindPopup(popupContent);

        // Marker drag handler in picker mode
        if (mode === "picker") {
          marker.on("dragend", async () => {
            const pos = marker.getLatLng();
            setCurrentLat(pos.lat);
            setCurrentLng(pos.lng);
            setSelectedPresetId("");

            // Attempt reverse geocode
            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}&zoom=18&addressdetails=1`
              );
              const data = await res.json();
              if (data && data.display_name) {
                // Shorten display name to first 3 elements
                const parts = data.display_name.split(",").slice(0, 3).map((s: string) => s.trim());
                setLocationName(parts.join(", "));
              }
            } catch (err) {
              console.warn("Reverse geocode failed:", err);
            }
          });

          // Map click handler to move pin
          map.on("click", async (e: any) => {
            const { lat, lng } = e.latlng;
            marker.setLatLng([lat, lng]);
            setCurrentLat(lat);
            setCurrentLng(lng);
            setSelectedPresetId("");

            // Attempt reverse geocode
            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
              );
              const data = await res.json();
              if (data && data.display_name) {
                const parts = data.display_name.split(",").slice(0, 3).map((s: string) => s.trim());
                setLocationName(parts.join(", "));
              }
            } catch (err) {
              console.warn("Reverse geocode failed:", err);
            }
          });
        }

        mapInstanceRef.current = map;
        markerInstanceRef.current = marker;
        setIsLeafletReady(true);

        // Invalidate map size after animation
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 250);
      } catch (err) {
        console.error("Failed to load Leaflet:", err);
      }
    };

    initMap();

    return () => {
      isSubscribed = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, mapType]);

  // Update map position when coordinates change programmatically
  useEffect(() => {
    if (mapInstanceRef.current && markerInstanceRef.current && isLeafletReady) {
      mapInstanceRef.current.setView([currentLat, currentLng], 15, { animate: true });
      markerInstanceRef.current.setLatLng([currentLat, currentLng]);

      const popupContent = `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; padding: 2px;">
          <strong style="color: #0A6B43; font-weight: 800; font-size: 13px;">${provider || "TESDA Partner Venue"}</strong>
          <p style="margin: 4px 0 2px; color: #1f2937; font-weight: 600;">${locationName}</p>
          ${room ? `<p style="margin: 0; color: #4b5563; font-size: 11px;">Room: <strong>${room}</strong></p>` : ""}
        </div>
      `;
      markerInstanceRef.current.setPopupContent(popupContent);
    }
  }, [currentLat, currentLng, locationName, isLeafletReady]);

  // Handle Preset Selection
  const handleSelectPreset = (venue: PresetTrainingVenue) => {
    setSelectedPresetId(venue.id);
    setCurrentLat(venue.latitude);
    setCurrentLng(venue.longitude);
    setLocationName(`${venue.shortName}, ${venue.municipality}, ${venue.province}`);
    setSearchError("");
  };

  // Handle Search using Nominatim / Presets
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError("");

    // 1. Check local presets first
    const q = searchQuery.toLowerCase().trim();
    const localMatch = PRESET_TRAINING_VENUES.find(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.shortName.toLowerCase().includes(q) ||
        v.municipality.toLowerCase().includes(q)
    );

    if (localMatch) {
      handleSelectPreset(localMatch);
      setIsSearching(false);
      return;
    }

    // 2. Fetch from Nominatim (prioritizing Pampanga / Philippines)
    try {
      const queryWithContext = `${searchQuery}, Pampanga, Philippines`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryWithContext)}&limit=1`
      );
      const data = await res.json();

      if (data && data.length > 0) {
        const top = data[0];
        const newLat = parseFloat(top.lat);
        const newLng = parseFloat(top.lon);
        setCurrentLat(newLat);
        setCurrentLng(newLng);
        setSelectedPresetId("");

        const parts = top.display_name.split(",").slice(0, 3).map((s: string) => s.trim());
        setLocationName(parts.join(", "));
      } else {
        setSearchError("Location not found. Try clicking directly on the map or choosing a nearby preset.");
      }
    } catch (err) {
      setSearchError("Unable to search map location. Please click directly on the map to pin.");
    } finally {
      setIsSearching(false);
    }
  };

  // Navigation Links
  const navLinks = getMapNavigationLinks(currentLat, currentLng, locationName);

  // Copy coordinates
  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${currentLat.toFixed(6)}, ${currentLng.toFixed(6)}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col my-auto max-h-[94dvh] h-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-150 flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-50/50 via-white to-gray-50/40">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0A6B43] text-white flex items-center justify-center shadow-xs shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-gray-900 truncate">
                {mode === "picker" ? "Locate & Pin Training Venue" : (programTitle || "Training Venue & Campus Map")}
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-500 font-medium truncate flex items-center gap-1.5">
                <Building2 className="w-3 h-3 text-[#0A6B43] shrink-0" />
                <span>{provider || "TESDA Partner Facility"}</span>
                {mode === "picker" && <span className="text-emerald-700 font-bold">• Interactive Map Pinning</span>}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Close Map"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Picker Mode: Search & Presets Toolbar */}
        {mode === "picker" && (
          <div className="p-3 sm:p-4 bg-gray-50/90 border-b border-gray-200/80 space-y-2.5">
            {/* Search Input */}
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search venue, street, school, or landmark in Pampanga..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-[36px] sm:h-[38px] pl-9 pr-3 text-xs bg-white border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-gray-400"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="h-[36px] sm:h-[38px] px-3.5 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {isSearching ? "Searching..." : "Locate"}
              </button>
            </form>

            {searchError && (
              <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{searchError}</span>
              </p>
            )}

            {/* Quick Presets Carousel */}
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                Quick-Select Accredited Pampanga Training Centers:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-[11px]">
                {PRESET_TRAINING_VENUES.map((venue) => {
                  const isSelected = selectedPresetId === venue.id;
                  return (
                    <button
                      key={venue.id}
                      type="button"
                      onClick={() => handleSelectPreset(venue)}
                      className={`px-2.5 py-1 rounded-lg border font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-emerald-600 text-white border-emerald-700 shadow-2xs"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-emerald-50 hover:border-emerald-300"
                      }`}
                    >
                      {venue.isSanLuis && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      )}
                      <span>{venue.shortName}</span>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Modal Content (Fixes mobile touch & scroll trapping) */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col">
          {/* Map Body */}
          <div className="relative h-[220px] sm:h-[320px] md:h-[360px] w-full shrink-0 bg-slate-100 overflow-hidden">
            {/* Leaflet container */}
            <div ref={mapContainerRef} className="absolute inset-0 z-0 w-full h-full" />

          {/* Map Layer Switcher (Streets vs Satellite) */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-white/95 backdrop-blur-xs p-1 rounded-xl shadow-md border border-gray-200">
            <button
              type="button"
              onClick={() => setMapType("streets")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-colors flex items-center gap-1 ${
                mapType === "streets" ? "bg-[#0A6B43] text-white shadow-2xs" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Compass className="w-3 h-3" />
              <span>Map</span>
            </button>
            <button
              type="button"
              onClick={() => setMapType("satellite")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-colors flex items-center gap-1 ${
                mapType === "satellite" ? "bg-[#0A6B43] text-white shadow-2xs" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Satellite</span>
            </button>
          </div>

          {/* Interactive Hint Banner in Picker Mode */}
          {mode === "picker" && (
            <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-gray-200 shadow-md text-[11px] text-gray-700 font-semibold flex items-center gap-1.5 pointer-events-none">
              <Info className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />
              <span>Click anywhere on the map or drag the pin to reposition</span>
            </div>
          )}
        </div>

        {/* Footer Details Card */}
        <div className="p-3.5 sm:p-4.5 bg-white border-t border-gray-150 space-y-3">
          {mode === "picker" ? (
            /* Picker Mode Confirm Form */
            <div className="space-y-2.5">
              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-gray-500 block">
                  Selected Training Venue Address:
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1 min-w-0 w-full">
                    <MapPin className="w-4 h-4 text-[#0A6B43] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
                    <input
                      type="text"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="Enter or refine venue address name..."
                      className="w-full min-w-0 h-[40px] sm:h-[38px] pl-9 pr-3 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white truncate"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectLocation) {
                        onSelectLocation({
                          location: locationName.trim() || "San Luis Training Center",
                          latitude: currentLat,
                          longitude: currentLng
                        });
                      }
                      onClose();
                    }}
                    className="w-full sm:w-auto h-[40px] sm:h-[38px] px-5 bg-[#0A6B43] hover:bg-[#075332] active:bg-[#054026] text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-2xs cursor-pointer active:scale-[0.98]"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Apply Venue Location</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] sm:text-[11px] text-gray-400 font-mono pt-0.5 border-t border-gray-100">
                <span>Coordinates: {currentLat.toFixed(5)}, {currentLng.toFixed(5)}</span>
                <span className="text-[9px] sm:text-[10px] text-gray-400 font-sans">Powered by OpenStreetMap & Nominatim</span>
              </div>
            </div>
          ) : (
            /* Viewer Mode Venue Details & Turn-by-Turn Navigation */
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs">
                {/* Location / Campus */}
                <div className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-200/80 space-y-0.5">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-gray-400 block">
                    Campus / Venue Address
                  </span>
                  <p className="font-bold text-gray-900 flex items-start gap-1.5 leading-snug">
                    <MapPin className="w-3.5 h-3.5 text-[#0A6B43] shrink-0 mt-0.5" />
                    <span>{locationName}</span>
                  </p>
                </div>

                {/* Assigned Room / Facility */}
                <div className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-200/80 space-y-0.5">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-gray-400 block">
                    Assigned Room / Facility
                  </span>
                  <p className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />
                    <span>{room || "Main Training Workshop"}</span>
                  </p>
                </div>

                {/* Trainer / Instructor */}
                {instructor && (
                  <div className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-200/80 space-y-0.5">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-gray-400 block">
                      Trainer / Instructor
                    </span>
                    <p className="font-bold text-gray-900 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />
                      <span>{instructor}</span>
                    </p>
                  </div>
                )}

                {/* Coordinator Contact */}
                {contactPerson && (
                  <div className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-200/80 space-y-0.5">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-gray-400 block">
                      Registrar / Coordinator Contact
                    </span>
                    <p className="font-bold text-gray-900 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />
                      <span>{contactPerson} {contactNumber ? `(${contactNumber})` : ""}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Commute Tip */}
              {resolved.venue?.commuteTip && (
                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-[11px] text-emerald-900 font-medium flex items-start gap-2">
                  <Navigation className="w-4 h-4 text-[#0A6B43] shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-emerald-950">Commute Guidance from San Luis:</strong>{" "}
                    <span>{resolved.venue.commuteTip}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons: Turn-by-Turn External Apps */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between sm:justify-start gap-2 text-[11px] text-gray-500 font-mono">
                  <span>{currentLat.toFixed(5)}, {currentLng.toFixed(5)}</span>
                  <button
                    type="button"
                    onClick={handleCopyCoords}
                    className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                    title="Copy Coordinates"
                  >
                    {copiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <a
                    href={navLinks.googleMaps}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-3.5 py-2 sm:py-1.5 bg-[#0A6B43] hover:bg-[#075332] active:bg-[#054026] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span>Get Directions (Google Maps)</span>
                  </a>
                  <a
                    href={navLinks.waze}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-3.5 py-2 sm:py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span>Open in Waze</span>
                  </a>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

