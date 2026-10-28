"use client";

import React, { useState, useMemo, useEffect } from "react";
import { RotateCcw } from "lucide-react";
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
  const [isInitialAnimationDone, setIsInitialAnimationDone] = useState(false);

  // Entrance animation duration: max delay 400ms + 350ms duration = 750ms.
  // Once complete, disable the entrance animation permanently for this appearance
  // so hovering or sorting never restarts or re-triggers marker fade-in.
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialAnimationDone(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Stable index map so marker entrance stagger is deterministic and doesn't change on hover
  const initialIndexMap = useMemo(() => {
    const map: Record<string, number> = {};
    SAN_LUIS_POLYGONS.forEach((poly, index) => {
      map[poly.name] = index;
    });
    return map;
  }, []);

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
    if (onSelectBarangay) onSelectBarangay(null);
  };

  const getPinValue = (stat: BarangayStat) => {
    if (selectedMetric === "total") return stat.total;
    if (selectedMetric === "completion") return `${stat.completionRate}%`;
    if (selectedMetric === "pending") return stat.pending;
    return stat.incomplete;
  };

  const metricTheme = useMemo(() => {
    if (selectedMetric === "pending") {
      return {
        highlightFill: "#0A6B43",
        highlightStroke: "#0A6B43",
        pinFill: "#D97706",
        pinStroke: "#FFFFFF",
        pinText: "#FFFFFF",
      };
    }
    if (selectedMetric === "incomplete") {
      return {
        highlightFill: "#0A6B43",
        highlightStroke: "#0A6B43",
        pinFill: "#E11D48",
        pinStroke: "#FFFFFF",
        pinText: "#FFFFFF",
      };
    }
    if (selectedMetric === "completion") {
      return {
        highlightFill: "#0A6B43",
        highlightStroke: "#0A6B43",
        pinFill: "#0A6B43",
        pinStroke: "#FFFFFF",
        pinText: "#FFFFFF",
      };
    }
    return {
      highlightFill: "#0A6B43",
      highlightStroke: "#0A6B43",
      pinFill: "#0A6B43",
      pinStroke: "#FFFFFF",
      pinText: "#FFFFFF",
    };
  }, [selectedMetric]);

  // Normalize the user's assigned barangay name to match polygon names
  const normalizedAssignedBarangay = useMemo(() => {
    return normalizeBarangayName(designatedBarangay);
  }, [designatedBarangay]);

  // Ensure the assigned pin, and hovered/selected pin render on top in SVG
  const sortedStats = useMemo(() => {
    return [...activeStats].sort((a, b) => {
      const aActive = a.name === hoveredBarangay || a.name === selectedBarangay;
      const bActive = b.name === hoveredBarangay || b.name === selectedBarangay;
      if (aActive && !bActive) return 1;
      if (!aActive && bActive) return -1;

      const aAssigned = a.name === normalizedAssignedBarangay;
      const bAssigned = b.name === normalizedAssignedBarangay;
      if (aAssigned && !bAssigned) return 1;
      if (!aAssigned && bAssigned) return -1;

      return 0;
    });
  }, [activeStats, hoveredBarangay, selectedBarangay, normalizedAssignedBarangay]);

  // Sort polygons so the assigned polygon's border renders cleanly above neighboring polygon borders
  const sortedPolygons = useMemo(() => {
    return [...SAN_LUIS_POLYGONS].sort((a, b) => {
      const aAssigned = a.name === normalizedAssignedBarangay;
      const bAssigned = b.name === normalizedAssignedBarangay;
      if (aAssigned && !bAssigned) return 1;
      if (!aAssigned && bAssigned) return -1;
      return 0;
    });
  }, [normalizedAssignedBarangay]);

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100/80 flex flex-col justify-between">
      {/* Top Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-extrabold text-gray-900 text-base sm:text-lg tracking-tight">
              San Luis Barangay Geographic Map
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Accurate 17-Barangay vector boundary map of San Luis, Pampanga
            </p>
          </div>

          {selectedBarangay && (
            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1 transition-colors self-start sm:self-auto cursor-pointer"
              title="Reset Selection"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Metric Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 pb-2">
          <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">
            Metric:
          </span>
          <button
            type="button"
            onClick={() => setSelectedMetric("total")}
            className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
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
            className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
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
            className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
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
            className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
              selectedMetric === "incomplete"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-gray-100/90 text-gray-600 hover:bg-gray-200/80"
            }`}
          >
            Incomplete Profiles
          </button>
        </div>
      </div>

      {/* Main Map: Borderless, Compact and Centered */}
      <div className="relative w-full py-1 flex flex-col items-center justify-center">
        {/* Vector Map Canvas: Compact Size */}
        <div className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-[480/356] select-none">
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

              {/* 17 Vector Barangay Polygons with assigned highlight and #0A6B43 on hover */}
              <g className="transition-all duration-200">
                {sortedPolygons.map((poly) => {
                  const isHovered = hoveredBarangay === poly.name;
                  const isSelected = selectedBarangay === poly.name;
                  const isAssigned = poly.name === normalizedAssignedBarangay;
                  const isHighlighted = isHovered || isSelected;

                  const fill = isHighlighted
                    ? "#0A6B43"
                    : isAssigned
                    ? "#A7F3D0"
                    : "#E2E8F0";
                  const stroke = isHighlighted
                    ? "#0A6B43"
                    : isAssigned
                    ? "#059669"
                    : "#CBD5E1";
                  const strokeWidth = isHighlighted
                    ? 1.2
                    : isAssigned
                    ? 1.5
                    : 0.45;

                  return (
                    <path
                      key={poly.name}
                      d={poly.d}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      className="cursor-pointer transition-colors duration-150 hover:opacity-95"
                      onMouseEnter={() => setHoveredBarangay(poly.name)}
                      onMouseLeave={() => setHoveredBarangay(null)}
                      onClick={() => handleBarangayClick(barangayStats[poly.name])}
                    />
                  );
                })}
              </g>

              {/* Functional Enlarged Location Pins (12px) on all 17 Barangays (entrance animation only on initial appearance) */}
              {sortedStats.map((stat) => {
                const isHovered = hoveredBarangay === stat.name;
                const isSelected = selectedBarangay === stat.name;
                const isAssigned = stat.name === normalizedAssignedBarangay;
                const isHighlighted = isHovered || isSelected;
                const val = getPinValue(stat);
                const valStr = String(val);
                const initialIdx = initialIndexMap[stat.name] ?? 0;

                return (
                  <g
                    key={stat.name}
                    transform={`translate(${stat.centroidX}, ${stat.centroidY})`}
                    style={
                      isInitialAnimationDone
                        ? undefined
                        : {
                            animation: `markerFadeIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) ${Math.min(initialIdx * 25, 400)}ms both`,
                          }
                    }
                    className="cursor-pointer select-none"
                    onMouseEnter={() => setHoveredBarangay(stat.name)}
                    onMouseLeave={() => setHoveredBarangay(null)}
                    onClick={() => handleBarangayClick(stat)}
                  >
                    {isHighlighted ? (
                      /* Active/Hovered: 12px Location Pin Callout with Barangay Name & Number */
                      <g filter="url(#pinShadow)">
                        {/* Soft highlight halo ring (static, no pulsing animation on hover) */}
                        <circle
                          r="18"
                          fill="#0A6B43"
                          opacity="0.22"
                        />

                        {/* Centroid anchor dot */}
                        <circle
                          cx="0"
                          cy="0"
                          r="3"
                          fill="#FFFFFF"
                          stroke="#0A6B43"
                          strokeWidth="1.2"
                        />

                        {(() => {
                          const label = isAssigned
                            ? `${stat.name} (Your Barangay): ${valStr}`
                            : `${stat.name}: ${valStr}`;
                          const badgeWidth = Math.max(56, label.length * 7.2 + 24);
                          const badgeHeight = 26;
                          return (
                            <>
                              {/* Pin pointer tip to centroid */}
                              <polygon
                                points="-5,-5.5 0,0 5,-5.5"
                                fill="#0A6B43"
                              />

                              {/* Pin head capsule */}
                              <rect
                                x={-badgeWidth / 2}
                                y={-31.5}
                                width={badgeWidth}
                                height={badgeHeight}
                                rx={badgeHeight / 2}
                                fill="#0A6B43"
                                stroke="#FFFFFF"
                                strokeWidth="1.5"
                              />

                              {/* Hovered text */}
                              <text
                                x="0"
                                y="-18.5"
                                textAnchor="middle"
                                dominantBaseline="central"
                                fontSize="12"
                                fontWeight="800"
                                fill="#FFFFFF"
                              >
                                {stat.name}
                                {isAssigned && (
                                  <tspan fill="#86EFAC" fontSize="10" fontWeight="700"> (Your Barangay)</tspan>
                                )}
                                : <tspan fill="#FDE047" fontWeight="900">{valStr}</tspan>
                              </text>
                            </>
                          );
                        })()}
                      </g>
                    ) : isAssigned ? (
                      /* Assigned Barangay Idle Pin: Highlighted with Brand Emerald & Pulsing Glow */
                      <g filter="url(#pinShadow)">
                        {/* Soft pulsing halo ring */}
                        <circle
                          r="15"
                          fill="#0A6B43"
                          opacity="0.22"
                          className="animate-pulse"
                        />

                        {/* Centroid anchor dot */}
                        <circle
                          cx="0"
                          cy="0"
                          r="3"
                          fill="#FFFFFF"
                          stroke="#0A6B43"
                          strokeWidth="1.5"
                        />

                        {(() => {
                          const badgeWidth = Math.max(30, valStr.length * 8.5 + 20);
                          const badgeHeight = 22;
                          return (
                            <>
                              {/* Pin pointer tip to centroid */}
                              <polygon
                                points="-4,-4.5 0,0 4,-4.5"
                                fill="#0A6B43"
                              />

                              {/* Pin head capsule */}
                              <rect
                                x={-badgeWidth / 2}
                                y={-26.5}
                                width={badgeWidth}
                                height={badgeHeight}
                                rx={badgeHeight / 2}
                                fill="#0A6B43"
                                stroke="#FFFFFF"
                                strokeWidth="1.5"
                              />


                              {/* Pin number */}
                              <text
                                x="0"
                                y="-15.5"
                                textAnchor="middle"
                                dominantBaseline="central"
                                fontSize="12"
                                fontWeight="900"
                                fill="#FFFFFF"
                              >
                                {valStr}
                              </text>
                            </>
                          );
                        })()}
                      </g>
                    ) : (
                      /* Standard Idle State Pin */
                      <g filter="url(#pinShadow)">
                        {/* Centroid anchor dot */}
                        <circle
                          cx="0"
                          cy="0"
                          r="2.5"
                          fill={metricTheme.pinFill}
                          opacity="0.6"
                        />

                        {(() => {
                          const badgeWidth = Math.max(26, valStr.length * 8.5 + 16);
                          const badgeHeight = 22;
                          return (
                            <>
                              {/* Pin pointer tip to centroid */}
                              <polygon
                                points="-4,-4.5 0,0 4,-4.5"
                                fill={metricTheme.pinFill}
                              />

                              {/* Pin head capsule */}
                              <rect
                                x={-badgeWidth / 2}
                                y={-26.5}
                                width={badgeWidth}
                                height={badgeHeight}
                                rx={badgeHeight / 2}
                                fill={metricTheme.pinFill}
                                stroke={metricTheme.pinStroke}
                                strokeWidth="1.2"
                              />

                              {/* Pin number: 12px bold */}
                              <text
                                x="0"
                                y="-15.5"
                                textAnchor="middle"
                                dominantBaseline="central"
                                fontSize="12"
                                fontWeight="900"
                                fill={metricTheme.pinText}
                              >
                                {valStr}
                              </text>
                            </>
                          );
                        })()}
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
        </div>
      </div>

      {/* Interactive Helper Hint */}
      <div className="pt-2 text-center text-[11px] text-gray-400 font-medium">
        Hover over any barangay or pin to view its name and count
      </div>
    </div>
  );
};

export default SanLuisBarangayMap;
