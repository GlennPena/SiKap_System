"use client";

import React, { useState, useMemo } from "react";
import {
  Building2,
  FileCheck,
  ShieldCheck,
  Award,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Check,
  X,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  Clock,
  Phone,
  Mail,
  MapPin,
  User,
  Sparkles,
  Layers,
  GraduationCap,
  Calendar,
  ChevronRight,
  ShieldAlert,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { ProviderApplication, OfficialAccount, TESDAProgram } from "../types";
import { GrowthPlantAnimation } from "./GrowthPlantAnimation";

interface SuperAdminPartnerVerificationProps {
  providerApplications: ProviderApplication[];
  setProviderApplications: React.Dispatch<React.SetStateAction<ProviderApplication[]>>;
  officialAccounts: OfficialAccount[];
  setOfficialAccounts: React.Dispatch<React.SetStateAction<OfficialAccount[]>>;
  programs: TESDAProgram[];
  addToast: (msg: string, type: "success" | "error" | "info") => void;
  onNavigateToPrograms?: () => void;
}

export const SuperAdminPartnerVerification: React.FC<SuperAdminPartnerVerificationProps> = ({
  providerApplications,
  setProviderApplications,
  officialAccounts,
  setOfficialAccounts,
  programs,
  addToast,
  onNavigateToPrograms
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"pending" | "accredited">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  // Document Inspector Modal State
  const [inspectingApp, setInspectingApp] = useState<ProviderApplication | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotationAngle, setRotationAngle] = useState(0);

  // Decline Modal State
  const [decliningApp, setDecliningApp] = useState<ProviderApplication | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Pending applications count
  const pendingCount = useMemo(() => {
    return providerApplications.filter(a => a.status === "Pending").length;
  }, [providerApplications]);

  // Approved applications count
  const approvedCount = useMemo(() => {
    return providerApplications.filter(a => a.status === "Approved").length;
  }, [providerApplications]);

  // Filtered Pending Applications
  const filteredPending = useMemo(() => {
    return providerApplications
      .filter(a => a.status === "Pending")
      .filter(a => {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !q ||
          a.institutionName.toLowerCase().includes(q) ||
          a.representativeName.toLowerCase().includes(q) ||
          a.cptrNumber.toLowerCase().includes(q) ||
          a.campusAddress.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q);

        const matchesType = typeFilter === "All" || a.providerType === typeFilter;
        return matchesQuery && matchesType;
      });
  }, [providerApplications, searchQuery, typeFilter]);

  // Accredited Institutions List:
  // Includes Grandfathered TESDA GPSAT + Approved Provider Applications + Any TESDA Reps from officialAccounts
  const accreditedInstitutions = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      type: string;
      cptrNumber: string;
      campusAddress: string;
      representativeName: string;
      email: string;
      contactNumber: string;
      isFoundingPartner: boolean;
      activeProgramsCount: number;
    }> = [];

    // 1. Founding Partner: Gonzalo Puyat School of Arts and Trades (GPSAT)
    const gpsatPrograms = programs.filter(p =>
      p.provider?.toLowerCase().includes("gpsat") ||
      p.provider?.toLowerCase().includes("gonzalo puyat") ||
      p.provider?.toLowerCase().includes("tesda")
    );

    list.push({
      id: "founding-tesda-gpsat",
      name: "Gonzalo Puyat School of Arts and Trades (GPSAT)",
      type: "Public TESDA Technology Institution (TTI)",
      cptrNumber: "UTPRAS-R03-PAM-2024",
      campusAddress: "Guagua, Pampanga",
      representativeName: "TESDA Provincial Coordinator",
      email: "tesda.gpsat@gov.ph",
      contactNumber: "+63 919 555 7890",
      isFoundingPartner: true,
      activeProgramsCount: gpsatPrograms.length || 6
    });

    // 2. Approved Provider Applications
    providerApplications
      .filter(a => a.status === "Approved")
      .forEach(a => {
        const instProgCount = programs.filter(p =>
          p.provider?.toLowerCase().includes(a.institutionName.toLowerCase())
        ).length;

        list.push({
          id: a.id,
          name: a.institutionName,
          type: a.providerType,
          cptrNumber: a.cptrNumber,
          campusAddress: a.campusAddress,
          representativeName: a.representativeName,
          email: a.email,
          contactNumber: a.contactNumber,
          isFoundingPartner: false,
          activeProgramsCount: instProgCount
        });
      });

    // Apply Search Filter
    return list.filter(inst => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        inst.name.toLowerCase().includes(q) ||
        inst.representativeName.toLowerCase().includes(q) ||
        inst.cptrNumber.toLowerCase().includes(q) ||
        inst.campusAddress.toLowerCase().includes(q);
      const matchesType = typeFilter === "All" || inst.type === typeFilter;
      return matchesQuery && matchesType;
    });
  }, [providerApplications, programs, searchQuery, typeFilter]);

  // Action: Approve Application
  const handleApprove = async (app: ProviderApplication) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/provider-applications/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: app.id,
          action: "Approved"
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        addToast(data.message || "Failed to approve application", "error");
        setIsProcessing(false);
        return;
      }

      addToast(`Verified CPTR & approved ${app.institutionName}! Partner account is now active.`, "success");

      // Update state locally
      setProviderApplications(prev =>
        prev.map(p => (p.id === app.id ? { ...p, status: "Approved" } : p))
      );

      // Refresh official accounts
      fetch("/api/users")
        .then(r => r.json())
        .then(u => {
          if (u.success && u.data) setOfficialAccounts(u.data);
        })
        .catch(() => {});

      if (inspectingApp?.id === app.id) setInspectingApp(null);
    } catch (err) {
      console.error(err);
      addToast("Network error approving application", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Decline Application
  const handleDeclineSubmit = async () => {
    if (!decliningApp) return;
    setIsProcessing(true);

    try {
      const res = await fetch("/api/provider-applications/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: decliningApp.id,
          action: "Rejected",
          rejectionReason: declineReason.trim() || "CPTR certificate requirements could not be confirmed."
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        addToast(data.message || "Failed to decline application", "error");
        setIsProcessing(false);
        return;
      }

      addToast(`Application for ${decliningApp.institutionName} marked as declined.`, "info");

      setProviderApplications(prev =>
        prev.map(p =>
          p.id === decliningApp.id
            ? { ...p, status: "Rejected", rejectionReason: declineReason.trim() }
            : p
        )
      );

      setDecliningApp(null);
      setDeclineReason("");
      if (inspectingApp?.id === decliningApp.id) setInspectingApp(null);
    } catch (err) {
      console.error(err);
      addToast("Network error declining application", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const openInspector = (app: ProviderApplication) => {
    setInspectingApp(app);
    setZoomLevel(1);
    setRotationAngle(0);
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Header Banner */}
      <div
        className="w-full text-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-[0_12px_36px_-6px_rgba(4,26,19,0.28)] relative overflow-hidden"
        style={{
          background: "radial-gradient(circle at 75% 50%, #106348 0%, #082D21 55%, #041A13 100%)",
        }}
      >
        <GrowthPlantAnimation />

        <div className="relative z-10 flex flex-col justify-center max-w-xl sm:max-w-3xl lg:max-w-4xl">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-2xs">
              Municipal TVET Governance
            </span>
            <span className="text-[10px] font-bold text-emerald-200">
              TESDA CPTR Compliance
            </span>
          </div>
          <h2 className="font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight drop-shadow-sm">
            Partner Verification & Directory
          </h2>
          <p className="text-xs sm:text-sm lg:text-base text-emerald-100/90 mt-2 font-normal sm:font-medium leading-relaxed">
            Verify Certificate of TVET Program Registration (CPTR) accreditations, issue partner access accounts, and oversee all registered vocational academies in San Luis and Pampanga.
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-5 sm:p-6 space-y-5 border border-gray-100">
        {/* Navigation Tabs & Search / Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          {/* Sub Tabs */}
          <div className="flex items-center gap-2 bg-gray-100/80 p-1 rounded-xl shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveSubTab("pending")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === "pending"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Pending CPTR Review</span>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-500 text-slate-950">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab("accredited")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === "accredited"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Accredited Institutions</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-[#0A6B43]">
                {approvedCount + 1}
              </span>
            </button>
          </div>

          {/* Search and Filter Inputs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 lg:max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder={
                  activeSubTab === "pending"
                    ? "Search pending school, liaison, CPTR..."
                    : "Search accredited institution, location..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-3.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 px-3 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors"
            >
              <option value="All">All Types</option>
              <option value="Public TESDA Institute">Public TESDA (TTI)</option>
              <option value="Private TVET Institute">Private TVET (TVI)</option>
              <option value="LGU Training Center">LGU / Community Center</option>
              <option value="HEI / SUC">HEI / College</option>
            </select>
          </div>
        </div>

        {/* SUB-TAB 1: PENDING CPTR VERIFICATION QUEUE */}
        {activeSubTab === "pending" && (
          <div className="space-y-4">
            {filteredPending.length === 0 ? (
              <div className="py-14 text-center space-y-3 max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h4 className="text-base font-extrabold text-gray-900">
                  {searchQuery || typeFilter !== "All"
                    ? "No Matching Applications Found"
                    : "All Provider Applications Verified!"}
                </h4>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  {searchQuery || typeFilter !== "All"
                    ? "Try adjusting your search keywords or classification filter."
                    : "There are currently no pending training provider applications waiting for CPTR verification."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredPending.map((app) => (
                  <div
                    key={app.id}
                    className="p-5 rounded-2xl border border-gray-200/90 hover:border-emerald-300 bg-white hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Left: School Info & Liaison */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                          <span>Pending CPTR Verification</span>
                        </span>
                        <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full">
                          {app.providerType}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base font-black text-gray-900 tracking-tight">
                          {app.institutionName}
                        </h4>
                        <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{app.campusAddress}</span>
                        </p>
                      </div>

                      {/* Liaison & CPTR Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-gray-100 text-xs">
                        <div className="flex items-center gap-2 text-gray-700">
                          <User className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />
                          <span className="font-semibold truncate">
                            {app.representativeName} ({app.representativePosition})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="font-mono text-[11px] truncate">{app.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="font-medium text-[11px]">{app.contactNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-800 font-bold">
                          <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="font-mono text-[11px]">CPTR: {app.cptrNumber}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-row md:flex-col items-stretch justify-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                      <button
                        type="button"
                        onClick={() => openInspector(app)}
                        className="flex-1 md:flex-none px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#0A6B43]" />
                        <span>Inspect CPTR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApprove(app)}
                        disabled={isProcessing}
                        className="flex-1 md:flex-none px-4 py-2 bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDecliningApp(app);
                          setDeclineReason("");
                        }}
                        disabled={isProcessing}
                        className="flex-1 md:flex-none px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5 text-red-600" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUB-TAB 2: ACCREDITED INSTITUTIONS MASTERLIST */}
        {activeSubTab === "accredited" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accreditedInstitutions.map((inst) => (
                <div
                  key={inst.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3.5 ${
                    inst.isFoundingPartner
                      ? "bg-emerald-50/40 border-emerald-300/80 shadow-xs ring-1 ring-emerald-200/50"
                      : "bg-white border-gray-200 hover:border-gray-300 shadow-xs"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                          inst.isFoundingPartner
                            ? "bg-[#0A6B43] text-white"
                            : "bg-emerald-100 text-[#0A6B43]"
                        }`}
                      >
                        {inst.isFoundingPartner ? "Founding TVET Partner" : "CPTR Verified Partner ✓"}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                        {inst.type}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-gray-900 tracking-tight leading-snug">
                      {inst.name}
                    </h4>

                    <div className="space-y-1 text-xs text-gray-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{inst.campusAddress}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="font-mono text-emerald-900 font-bold">
                          Accreditation: {inst.cptrNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>Liaison: {inst.representativeName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="font-mono text-[11px]">{inst.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3 text-xs">
                    <span className="font-bold text-gray-700 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-[#0A6B43]" />
                      <span>{inst.activeProgramsCount} Published Programs</span>
                    </span>

                    {onNavigateToPrograms && (
                      <button
                        type="button"
                        onClick={onNavigateToPrograms}
                        className="text-[11px] font-bold text-[#0A6B43] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Catalog</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* DOCUMENT INSPECTOR MODAL */}
      {inspectingApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 rounded-3xl border border-white/10 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-white shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3 bg-black/40">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                    CPTR Accreditation Inspector
                  </span>
                  <span className="font-mono text-xs text-amber-300 font-bold">
                    No. {inspectingApp.cptrNumber}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white mt-1 truncate">
                  {inspectingApp.institutionName}
                </h3>
              </div>

              {/* Zoom & Rotate Controls */}
              <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.2))}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono px-1 font-bold">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.2))}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotationAngle(prev => (prev + 90) % 360)}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Rotate"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setInspectingApp(null)}
                  className="p-1.5 text-red-300 hover:text-red-100 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer ml-1"
                  title="Close Inspector"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Viewer Area */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/60 custom-scrollbar">
              {inspectingApp.cptrDocument ? (
                inspectingApp.cptrDocument.startsWith("data:application/pdf") ? (
                  <iframe
                    src={inspectingApp.cptrDocument}
                    title="CPTR Document PDF"
                    className="w-full h-[65vh] rounded-xl border border-white/20"
                  />
                ) : (
                  <img
                    src={inspectingApp.cptrDocument}
                    alt="CPTR Certificate"
                    style={{
                      transform: `scale(${zoomLevel}) rotate(${rotationAngle}deg)`,
                      transition: "transform 0.15s ease-out"
                    }}
                    className="max-h-[65vh] w-auto object-contain rounded-lg shadow-xl"
                  />
                )
              ) : (
                <div className="text-gray-400 text-xs">No document attached.</div>
              )}
            </div>

            {/* Modal Footer with Verification Actions */}
            <div className="p-4 sm:p-5 border-t border-white/10 bg-black/40 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-gray-300">
                <span>Liaison: <strong>{inspectingApp.representativeName}</strong> • {inspectingApp.contactNumber}</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setDecliningApp(inspectingApp);
                    setDeclineReason("");
                  }}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Decline</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApprove(inspectingApp)}
                  disabled={isProcessing}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Verify CPTR & Approve Account</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DECLINE REASON MODAL */}
      {decliningApp && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-gray-900">Decline Application</h4>
                  <p className="text-[11px] text-gray-500 font-medium">{decliningApp.institutionName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDecliningApp(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">
                Reason for Declining (Sent to Applicant) <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g. The uploaded CPTR certificate copy is illegible, please upload a clearer high-resolution scan."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:border-red-500 focus:outline-none transition-colors"
              />

              {/* Quick suggestions */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "CPTR copy is blurry/illegible",
                    "CPTR registration code is expired",
                    "Institution address mismatch"
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDeclineReason(preset)}
                      className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-md font-medium transition-colors cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDecliningApp(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeclineSubmit}
                disabled={isProcessing}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                <span>Confirm Decline</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

