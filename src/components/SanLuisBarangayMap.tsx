"use client";

import React, { useState, useMemo } from "react";
import {
  MapPin,
  RotateCcw,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Info,
  ListFilter,
  Eye,
  ChevronRight,
  TrendingUp,
  Search,
  Check
} from "lucide-react";
import { YouthProfile } from "@/types";
import { SAN_LUIS_POLYGONS, BarangayPolygonPath } from "@/lib/san-luis-barangay-paths";

export type MapMetricType = "total" | "completion" | "pending" | "incomplete";

export interface BarangayStat {
  id: number;
  name: string;
  shortName: string;
  total: number;
  verified: number;
  pending: number;
  incomplete: number;
  completionRate: number;
  topInterest: string;
  centroidX: number;
  centroidY: number;
  pctX: number;
  pctY: number;
  d: string;
}

export function normalizeBarangayName(name: string): string {
  const n = (name || "").toLowerCase().trim();
  if (n.includes("poblacion")) return "Sta. Cruz Poblacion";
  if (n.includes("pambilog")) return "Sta. Cruz Pambilog";
  if (n.includes("catalina")) return "Sta. Catalina";
  if (n.includes("monica")) return "Sta. Monica";
  if (n.includes("rita")) return "Sta. Rita";
  if (n.includes("lucia")) return "Sta. Lucia";
  if (n.includes("rosario")) return "Sto. Rosario";
  if (n.includes("tomas")) return "Sto. Tomas";
  if (n.includes("niño") || n.includes("nino")) return "Sto. Niño";
  if (n.includes("agustin")) return "San Agustin";
  if (n.includes("carlos")) return "San Carlos";
  if (n.includes("isidro")) return "San Isidro";
  if (n.includes("jose")) return "San Jose";
  if (n.includes("juan")) return "San Juan";
  if (n.includes("nicolas")) return "San Nicolas";
  if (n.includes("roque")) return "San Roque";
  if (n.includes("sebastian")) return "San Sebastian";
  return name.trim();
}

interface SanLuisBarangayMapProps {
  youthProfiles: YouthProfile[];
  designatedBarangay: string;
  onSelectBarangay?: (barangayName: string | null) => void;
}

export const SanLuisBarangayMap: React.FC<SanLuisBarangayMapProps> = ({
  youthProfiles,
  designatedBarangay,
  onSelectBarangay
}) => {
  const [selectedMetric, setSelectedMetric] = useState<MapMetricType>("total");
  const [selectedBarangay, setSelectedBarangay] = useState<string | null>(null);
  const [hoveredBarangay, setHoveredBarangay] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [searchQuery, setSearchQuery] = useState("");

  // Aggregate stats for all 17 barangays mapped to their vector polygons
  const barangayStats = useMemo(() => {
    const statsMap: Record<string, BarangayStat> = {};

    SAN_LUIS_POLYGONS.forEach((poly) => {
      statsMap[poly.name] = {
        id: poly.id,
        name: poly.name,
        shortName: poly.shortName,
        total: 0,
        verified: 0,
        pending: 0,
        incomplete: 0,
        completionRate: 0,
        topInterest: "Technical Skills",
        centroidX: poly.centroidX,
        centroidY: poly.centroidY,
        pctX: poly.pctX,
        pctY: poly.pctY,
        d: poly.d
      };
    });

    const interestCounts: Record<string, Record<string, number>> = {};

    youthProfiles.forEach((profile) => {
      const rawBrgy = profile.barangay || "Unassigned";
      const norm = normalizeBarangayName(rawBrgy);

      if (statsMap[norm]) {
        statsMap[norm].total += 1;

        if (
          profile.approvalStatus === "Approved" ||
          (profile as any).verificationStatus === "Verified"
        ) {
          statsMap[norm].verified += 1;
        } else if (
          profile.approvalStatus === "Pending" ||
          (profile as any).verificationStatus === "Pending" ||
          (profile as any).accountStatus === "Pending Approval"
        ) {
          statsMap[norm].pending += 1;
        }

        const isComplete =
          Boolean(profile.contactNumber || (profile as any).phone) &&
          Boolean(profile.educationalAttainment) &&
          Boolean(profile.purok) &&
          Array.isArray(profile.skills) &&
          profile.skills.length > 0;

        if (!isComplete) {
          statsMap[norm].incomplete += 1;
        }

        if (Array.isArray(profile.interests)) {
          if (!interestCounts[norm]) interestCounts[norm] = {};
          profile.interests.forEach((item) => {
            interestCounts[norm][item] = (interestCounts[norm][item] || 0) + 1;
          });
        }
      }
    });

    Object.values(statsMap).forEach((st) => {
      if (st.total > 0) {
        const completeCount = st.total - st.incomplete;
        st.completionRate = Math.round((completeCount / st.total) * 100);
      } else {
        st.completionRate = 0;
      }

      const brgyInterests = interestCounts[st.name];
      if (brgyInterests && Object.keys(brgyInterests).length > 0) {
        let best = "";
        let maxC = -1;
        for (const [k, v] of Object.entries(brgyInterests)) {
          if (v > maxC) {
            maxC = v;
            best = k;
          }
        }
        if (best) st.topInterest = best;
      }
    });

    return statsMap;
  }, [youthProfiles]);

  const activeStats = useMemo(() => {
    return Object.values(barangayStats);
  }, [barangayStats]);

  const filteredStats = useMemo(() => {
    if (!searchQuery.trim()) return activeStats;
    const q = searchQuery.toLowerCase();
    return activeStats.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.shortName.toLowerCase().includes(q)
    );
  }, [activeStats, searchQuery]);

  const selectedData = selectedBarangay
    ? barangayStats[selectedBarangay] || null
    : null;

  const activeInspection = hoveredBarangay
    ? barangayStats[hoveredBarangay] || null
    : selectedData;

  const handleBarangayClick = (stat: BarangayStat) => {
    if (selectedBarangay === stat.name) {
      setSelectedBarangay(null);
      if (onSelectBarangay) onSelectBarangay(null);
    } else {
      setSelectedBarangay(stat.name);
      if (onSelectBarangay) onSelectBarangay(stat.name);
    }
  };

  const handleReset = () => {
    setSelectedBarangay(null);
    setHoveredBarangay(null);
    setSearchQuery("");
    if (onSelectBarangay) onSelectBarangay(null);
  };

  const getMetricBadgeValue = (stat: BarangayStat) => {
    if (selectedMetric === "total") return `${stat.total} OSY`;
    if (selectedMetric === "completion") return `${stat.completionRate}% complete`;
    if (selectedMetric === "pending") return `${stat.pending} pending`;
    return `${stat.incomplete} incomplete`;
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100/80 flex flex-col justify-between">
      {/* Top Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-[#0A6B43]">
                <MapPin className="w-4 h-4" />
              </span>
              <h3 className="font-extrabold text-gray-900 text-base sm:text-lg tracking-tight">
                San Luis Barangay Geographic Map
              </h3>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Accurate 17-Barangay vector boundary map of San Luis, Pampanga
            </p>
          </div>

          {/* View Mode Toggle & Reset */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  viewMode === "map"
                    ? "bg-white text-gray-900 shadow-2xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Map Graphic
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  viewMode === "list"
                    ? "bg-white text-gray-900 shadow-2xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Table View
              </button>
            </div>

            {(selectedBarangay || searchQuery) && (
              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Reset Selection"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Metric Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 pb-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">
            Metric:
          </span>
          <button
            type="button"
            onClick={() => setSelectedMetric("total")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              selectedMetric === "total"
                ? "bg-[#0A6B43] text-white shadow-xs"
                : "bg-gray-100/90 text-gray-600 hover:bg-gray-200/80"
            }`}
          >
            Total Registered OSY
          </button>
          <button
            type="button"
            onClick={() => setSelectedMetric("completion")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              selectedMetric === "completion"
                ? "bg-[#0A6B43] text-white shadow-xs"
                : "bg-gray-100/90 text-gray-600 hover:bg-gray-200/80"
            }`}
          >
            Completion Rate (%)
          </button>
          <button
            type="button"
            onClick={() => setSelectedMetric("pending")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              selectedMetric === "pending"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-gray-100/90 text-gray-600 hover:bg-gray-200/80"
            }`}
          >
            Pending Verification
          </button>
          <button
            type="button"
            onClick={() => setSelectedMetric("incomplete")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              selectedMetric === "incomplete"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-gray-100/90 text-gray-600 hover:bg-gray-200/80"
            }`}
          >
            Incomplete Profiles
          </button>
        </div>
      </div>

      {/* Main Map: Borderless, Full-Width inside the card content itself */}
      {viewMode === "map" ? (
        <div className="relative w-full py-2 flex flex-col items-center justify-center">
          {/* Vector Map Canvas: No outer container box */}
          <div className="relative w-full max-w-[620px] aspect-[480/356] select-none">
            <svg
              viewBox="0 0 480 356"
              className="w-full h-full overflow-visible"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Defs for subtle shadows and glow filters */}
              <defs>
                <filter id="greenGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0A6B43" floodOpacity="0.35" />
                </filter>
                <filter id="pinShadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.2" />
                </filter>
              </defs>

              {/* 17 Vector Barangay Polygons */}
              <g className="transition-all duration-200">
                {SAN_LUIS_POLYGONS.map((poly) => {
                  const isHovered = hoveredBarangay === poly.name;
                  const isSelected = selectedBarangay === poly.name;
                  const isHighlighted = isHovered || isSelected;

                  // Gray fill & Gray border by default; Green highlight when hovered/selected
                  const fill = isHighlighted ? "#0A6B43" : "#E8ECEF";
                  const stroke = isHighlighted ? "#075233" : "#CBD5E1";
                  const strokeWidth = isHighlighted ? 2.5 : 1.25;

                  return (
                    <path
                      key={poly.name}
                      d={poly.d}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      filter={isHighlighted ? "url(#greenGlow)" : undefined}
                      className="cursor-pointer transition-all duration-200 hover:opacity-95"
                      onMouseEnter={() => setHoveredBarangay(poly.name)}
                      onMouseLeave={() => setHoveredBarangay(null)}
                      onClick={() => handleBarangayClick(barangayStats[poly.name])}
                    />
                  );
                })}
              </g>

              {/* Pins on all 17 Barangays */}
              {activeStats.map((stat) => {
                const isHovered = hoveredBarangay === stat.name;
                const isSelected = selectedBarangay === stat.name;
                const isHighlighted = isHovered || isSelected;

                return (
                  <g
                    key={stat.name}
                    transform={`translate(${stat.centroidX}, ${stat.centroidY})`}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredBarangay(stat.name)}
                    onMouseLeave={() => setHoveredBarangay(null)}
                    onClick={() => handleBarangayClick(stat)}
                  >
                    {/* Concentric Pin Rings (matching user reference image style) */}
                    {isHighlighted ? (
                      /* Active Green Target Pin */
                      <g filter="url(#pinShadow)">
                        {/* Outer Glow Wave */}
                        <circle
                          r="16"
                          fill="#0A6B43"
                          opacity="0.2"
                          className="animate-ping"
                        />
                        <circle
                          r="14"
                          fill="#0A6B43"
                          opacity="0.35"
                        />
                        {/* Middle Solid Green Ring */}
                        <circle
                          r="7.5"
                          fill="#0A6B43"
                          stroke="#FFFFFF"
                          strokeWidth="2.5"
                        />
                        {/* Inner White Center Dot */}
                        <circle
                          r="2.5"
                          fill="#FFFFFF"
                        />
                      </g>
                    ) : (
                      /* Idle Gray/Subtle Pin Marker */
                      <g className="transition-transform duration-200 hover:scale-125">
                        <circle
                          r="4.5"
                          fill="#94A3B8"
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                          opacity="0.9"
                        />
                        <circle
                          r="1.8"
                          fill="#FFFFFF"
                        />
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Floating Sleek Tooltip Pill (matching user reference image design) */}
            {activeInspection && (
              <div
                style={{
                  left: `${activeInspection.pctX}%`,
                  top: `${activeInspection.pctY}%`,
                  transform: "translate(-50%, -135%)"
                }}
                className="absolute z-30 pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95"
              >
                <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/98 text-gray-900 shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-emerald-400/80 backdrop-blur-md whitespace-nowrap">
                  {/* Green Circular Target Icon */}
                  <div className="relative flex items-center justify-center shrink-0">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0A6B43] flex items-center justify-center">
                        <span className="w-1 h-1 rounded-full bg-white" />
                      </span>
                    </span>
                  </div>

                  {/* Label Text */}
                  <div className="text-left">
                    <p className="font-extrabold text-xs text-gray-900 leading-tight">
                      {activeInspection.name}, San Luis
                    </p>
                    <p className="text-[10px] font-bold text-[#0A6B43] leading-tight mt-0.5">
                      {getMetricBadgeValue(activeInspection)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Accessible Tabular View */
        <div className="mt-3 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search barangay..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#0A6B43] bg-gray-50/50"
            />
          </div>

          <div className="overflow-x-auto max-h-[340px] rounded-xl border border-gray-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider sticky top-0 border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3">Barangay</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-right">Verified</th>
                  <th className="py-2.5 px-3 text-right">Pending</th>
                  <th className="py-2.5 px-3 text-right">Completion</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {filteredStats.map((st) => (
                  <tr
                    key={st.name}
                    onClick={() => handleBarangayClick(st)}
                    className={`hover:bg-emerald-50/40 cursor-pointer transition-colors ${
                      selectedBarangay === st.name
                        ? "bg-emerald-50 font-semibold"
                        : ""
                    }`}
                  >
                    <td className="py-2 px-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#0A6B43]" />
                      <span className="text-gray-900">{st.name}</span>
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-gray-900">
                      {st.total}
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-700">
                      {st.verified}
                    </td>
                    <td className="py-2 px-3 text-right text-amber-700">
                      {st.pending}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {st.completionRate}%
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="text-emerald-700 font-bold hover:underline text-[11px]">
                        Inspect
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selected Barangay Detailed Drawer Card */}
      {selectedData ? (
        <div className="mt-3 p-4 rounded-xl bg-emerald-50/40 border border-emerald-200/90 shadow-2xs space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between border-b border-emerald-200/70 pb-2">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-[#0A6B43] text-white">
                <MapPin className="w-3.5 h-3.5" />
              </span>
              <div>
                <h4 className="font-bold text-sm text-gray-900 leading-tight">
                  Barangay {selectedData.name}
                </h4>
                <p className="text-[10px] text-gray-500 font-medium">
                  Official Barangay Jurisdiction • San Luis, Pampanga
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] font-bold text-[#0A6B43] hover:underline cursor-pointer"
            >
              Clear Selection
            </button>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-lg bg-white border border-gray-200/80">
              <p className="text-[10px] text-gray-500 font-medium">Total Registered</p>
              <p className="text-base font-extrabold text-gray-900 mt-0.5">
                {selectedData.total}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-gray-200/80">
              <p className="text-[10px] text-gray-500 font-medium">Verified Youth</p>
              <p className="text-base font-extrabold text-emerald-700 mt-0.5">
                {selectedData.verified}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-gray-200/80">
              <p className="text-[10px] text-gray-500 font-medium">Pending Review</p>
              <p className="text-base font-extrabold text-amber-700 mt-0.5">
                {selectedData.pending}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-gray-200/80">
              <p className="text-[10px] text-gray-500 font-medium">Profile Completion</p>
              <p className="text-base font-extrabold text-[#0A6B43] mt-0.5">
                {selectedData.completionRate}%
              </p>
            </div>
          </div>

          {/* Profile Completion Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-gray-600 font-medium">
              <span>Intake Completeness</span>
              <span>{selectedData.completionRate}% complete</span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#0A6B43] transition-all duration-500"
                style={{ width: `${selectedData.completionRate}%` }}
              />
            </div>
          </div>

          {/* Additional Insight */}
          <div className="flex items-center justify-between text-[11px] text-gray-600 pt-1">
            <span className="flex items-center gap-1 text-gray-500">
              <TrendingUp className="w-3.5 h-3.5 text-[#0A6B43]" />
              Dominant Field of Interest:
            </span>
            <span className="font-bold text-gray-900 bg-white px-2 py-0.5 rounded-md border border-gray-200">
              {selectedData.topInterest}
            </span>
          </div>
        </div>
      ) : (
        /* Empty / Helper Hint */
        <div className="mt-2 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#0A6B43]" />
            Hover over any barangay to highlight in green, or click to inspect statistics
          </span>
          <span className="font-medium text-gray-400 hidden sm:inline">
            Aggregated Data Only • Privacy Protected
          </span>
        </div>
      )}
    </div>
  );
};

export default SanLuisBarangayMap;
