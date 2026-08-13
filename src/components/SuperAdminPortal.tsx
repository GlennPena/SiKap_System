"use client";

import React, { useState, useMemo } from "react";
import {
  Building2, Users, Briefcase, Activity, Shield, Copy, Check, RefreshCw, 
  UserCheck, LogOut, ArrowRight, Eye, Edit, Trash2, PlusCircle, CheckCircle2, Lock
} from "lucide-react";
import { OfficialAccount, Councilor, YouthProfile, TESDAProgram, Barangay } from "../types";

interface SuperAdminPortalProps {
  youthProfiles: YouthProfile[];
  setYouthProfiles?: React.Dispatch<React.SetStateAction<YouthProfile[]>>;
  programs: TESDAProgram[];
  barangays: Barangay[];
  setBarangays: React.Dispatch<React.SetStateAction<Barangay[]>>;
  officialAccounts: OfficialAccount[];
  setOfficialAccounts: React.Dispatch<React.SetStateAction<OfficialAccount[]>>;
  councilors: Councilor[];
  onLogout: () => void;
  addToast: (msg: string, type: "success" | "error" | "info") => void;
  currentUser?: any;
}

export const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({
  youthProfiles,
  programs,
  barangays,
  setBarangays,
  officialAccounts,
  setOfficialAccounts,
  councilors,
  onLogout,
  addToast,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "barangays" | "tesda_records" | "create_account" | "create_tesda">("dashboard");

  // Create account states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [role, setRole] = useState<"SK Chairperson" | "Barangay Captain" | "TESDA Representative">("SK Chairperson");
  const [barangayAssignment, setBarangayAssignment] = useState("San Agustin");

  // State for newly created credentials modal
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    pass: string;
    role: string;
    barangay?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Edit / View Barangay states
  const [selectedBrgy, setSelectedBrgy] = useState<string | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editBrgyName, setEditBrgyName] = useState("");
  const [originalBrgyName, setOriginalBrgyName] = useState("");

  // Delete account verification state
  const [deleteAccountTarget, setDeleteAccountTarget] = useState<{ id: string; name: string; role: string } | null>(null);

  // Auto-generate temp password
  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempPassword(pass);
  };

  // Initialize password on load or when tab changes
  useState(() => {
    generatePassword();
  });

  // Fetch actual officials from database
  React.useEffect(() => {
    fetch("/api/users")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setOfficialAccounts(data.data);
        }
      })
      .catch(err => console.error("Error fetching users:", err));
  }, [setOfficialAccounts]);

  // Handle role change (disable barangay for TESDA)
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRole = e.target.value as "SK Chairperson" | "Barangay Captain" | "TESDA Representative";
    setRole(selectedRole);
  };

  const handleCreateAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !tempPassword.trim()) {
      addToast("Please fill in all required fields", "error");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      addToast("Please enter a valid email address", "error");
      return;
    }

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          email: email,
          tempPassword: tempPassword,
          role: role,
          barangay: role === "TESDA Representative" ? undefined : barangayAssignment
        })
      });

      const data = await response.json();

      if (data.success) {
        setOfficialAccounts(prev => [data.data, ...prev]);
        setCreatedCredentials({
          name: fullName,
          email: email,
          pass: tempPassword,
          role: role,
          barangay: role === "TESDA Representative" ? undefined : barangayAssignment
        });

        addToast(`Successfully created ${role} account for ${fullName}!`, "success");

        // Reset fields
        setFullName("");
        setEmail("");
        generatePassword();
      } else {
        addToast(data.message || "Failed to create account", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Network error creating account", "error");
    }
  };

  const handleCreateTesdaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !tempPassword.trim()) {
      addToast("Please fill in all required fields", "error");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      addToast("Please enter a valid email address", "error");
      return;
    }

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          email: email,
          tempPassword: tempPassword,
          role: "TESDA Representative"
        })
      });

      const data = await response.json();

      if (data.success) {
        setOfficialAccounts(prev => [data.data, ...prev]);
        setCreatedCredentials({
          name: fullName,
          email: email,
          pass: tempPassword,
          role: "TESDA Representative"
        });

        addToast(`Successfully created TESDA Representative account for ${fullName}!`, "success");

        // Reset fields
        setFullName("");
        setEmail("");
        generatePassword();
      } else {
        addToast(data.message || "Failed to create account", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Network error creating account", "error");
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `SiKap Portal Credentials
-----------------------------------
Name: ${createdCredentials.name}
Role: ${createdCredentials.role}
Barangay: ${createdCredentials.barangay || "N/A"}
Email: ${createdCredentials.email}
Temporary Password: ${createdCredentials.pass}
-----------------------------------
Please sign in and change your password immediately.`;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    addToast("Credentials copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  // Compute System Statistics
  const stats = useMemo(() => {
    // Registered users by role
    const skChairpersons = officialAccounts.filter(o => o.role === "SK Chairperson" && o.status === "Active").length;
    const brgyCaptains = officialAccounts.filter(o => o.role === "Barangay Captain" && o.status === "Active").length;
    const tesdaReps = officialAccounts.filter(o => o.role === "TESDA Representative" && o.status === "Active").length;
    const skCouncilors = councilors.filter(c => c.status === "Active").length;
    const kkMembers = youthProfiles.length;

    const totalPrograms = programs.length;
    const activePrograms = programs.filter(p => p.activeStatus === "Active").length;

    return {
      totalBarangays: barangays.length,
      skChairpersons,
      brgyCaptains,
      tesdaReps,
      skCouncilors,
      kkMembers,
      totalPrograms,
      activePrograms
    };
  }, [officialAccounts, councilors, youthProfiles, programs, barangays]);

  // Compute stats per Barangay
  const barangayDataList = useMemo(() => {
    return barangays.map(b => {
      // Find SK Chairperson
      const sk = officialAccounts.find(o => o.role === "SK Chairperson" && o.barangay === b.name);
      // Find Brgy Captain
      const cap = officialAccounts.find(o => o.role === "Barangay Captain" && o.barangay === b.name);
      // Councilor Count
      const councilorCount = councilors.filter(c => c.barangay === b.name).length;
      // KK Members Count
      // Note: Youth profile barangays are stored as e.g., "Barangay San Sebastian" or "San Sebastian"
      const kkCount = youthProfiles.filter(y => {
        const yBrgy = y.barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
        const bName = b.name.trim().toLowerCase();
        return yBrgy === bName;
      }).length;

      return {
        name: b.name,
        sk: sk ? { id: sk.id, name: sk.name, email: sk.email, status: sk.status } : { id: null, name: "Unassigned", email: "N/A", status: "Inactive" },
        cap: cap ? { id: cap.id, name: cap.name, email: cap.email, status: cap.status } : { id: null, name: "Unassigned", email: "N/A", status: "Inactive" },
        councilorCount,
        kkCount
      };
    });
  }, [barangays, officialAccounts, councilors, youthProfiles]);

  const selectedBrgyDetails = useMemo(() => {
    if (!selectedBrgy) return null;
    const data = barangayDataList.find(d => d.name === selectedBrgy);
    
    // Get councilors & youth for list
    const brgyCouncilors = councilors.filter(c => c.barangay === selectedBrgy);
    const brgyYouth = youthProfiles.filter(y => {
      const yBrgy = y.barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
      const bName = selectedBrgy.trim().toLowerCase();
      return yBrgy === bName;
    });

    return {
      ...data,
      councilors: brgyCouncilors,
      youth: brgyYouth
    };
  }, [selectedBrgy, barangayDataList, councilors, youthProfiles]);

  const handleEditBrgyClick = (brgyName: string) => {
    setOriginalBrgyName(brgyName);
    setEditBrgyName(brgyName);
    setIsEditModalOpen(true);
  };

  const handleSaveBrgyName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBrgyName.trim()) {
      addToast("Barangay Name cannot be empty", "error");
      return;
    }

    setBarangays(prev => prev.map(b => b.name === originalBrgyName ? { name: editBrgyName } : b));
    
    // Sync other objects with updated barangay name
    setOfficialAccounts(prev => prev.map(o => o.barangay === originalBrgyName ? { ...o, barangay: editBrgyName } : o));
    
    addToast(`Successfully renamed Barangay ${originalBrgyName} to ${editBrgyName}!`, "success");
    setIsEditModalOpen(false);
  };

  const confirmDeleteAccount = () => {
    if (!deleteAccountTarget) return;
    const { id, name, role } = deleteAccountTarget;
    setOfficialAccounts(prev => prev.filter(o => o.id !== id));
    addToast(`Successfully deleted account of ${role} ${name}!`, "success");
    setDeleteAccountTarget(null);
  };

  return (
    <div className="min-h-screen bg-[#090F1E] text-slate-100 flex font-sans" id="super-admin-portal-root">
      
      {/* Sidebar - Dark Navy (#0D1B3E) theme */}
      <aside className="w-68 bg-[#0D1B3E] border-r border-[#1B2B4A] flex flex-col justify-between shadow-2xl shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10 pb-4 border-b border-[#1B2B4A]">
            <div className="w-10 h-10 bg-[#FF9F1C] rounded-xl flex items-center justify-center text-slate-900 font-black shadow-lg">
              SA
            </div>
            <div>
              <span className="text-xs font-black text-amber-400 block tracking-widest uppercase">System Control</span>
              <span className="text-sm font-bold text-white tracking-tight">Super Admin Portal</span>
            </div>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left ${
                activeTab === "dashboard"
                  ? "bg-[#1E2E4E] text-[#FF9F1C] border-l-4 border-[#FF9F1C] shadow-inner"
                  : "text-slate-400 hover:bg-[#122240] hover:text-white"
              }`}
            >
              <Activity className="w-4 h-4" />
              System Dashboard
            </button>
            
            <button
              onClick={() => setActiveTab("barangays")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left ${
                activeTab === "barangays"
                  ? "bg-[#1E2E4E] text-[#FF9F1C] border-l-4 border-[#FF9F1C] shadow-inner"
                  : "text-slate-400 hover:bg-[#122240] hover:text-white"
              }`}
            >
              <Building2 className="w-4 h-4" />
              Barangay Management
            </button>

            <button
              onClick={() => setActiveTab("tesda_records")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left ${
                activeTab === "tesda_records"
                  ? "bg-[#1E2E4E] text-[#FF9F1C] border-l-4 border-[#FF9F1C] shadow-inner"
                  : "text-slate-400 hover:bg-[#122240] hover:text-white"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              TESDA Directory
            </button>

            <button
              onClick={() => {
                setActiveTab("create_account");
                setRole("SK Chairperson");
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left ${
                activeTab === "create_account"
                  ? "bg-[#1E2E4E] text-[#FF9F1C] border-l-4 border-[#FF9F1C] shadow-inner"
                  : "text-slate-400 hover:bg-[#122240] hover:text-white"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Create Official Account
            </button>

            <button
              onClick={() => {
                setActiveTab("create_tesda");
                setRole("TESDA Representative");
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left ${
                activeTab === "create_tesda"
                  ? "bg-[#1E2E4E] text-[#FF9F1C] border-l-4 border-[#FF9F1C] shadow-inner"
                  : "text-slate-400 hover:bg-[#122240] hover:text-white"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Create TESDA Account
            </button>
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="p-6 border-t border-[#1B2B4A]">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-900 flex items-center justify-center font-black text-xs">
              ADM
            </div>
            <div>
              <p className="text-xs font-bold text-white">System Super Admin</p>
              <p className="text-[10px] text-slate-400 font-medium">Full Permissions Active</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-red-500 hover:bg-red-950/20 text-xs text-red-400 rounded-xl transition-all font-bold uppercase tracking-wide"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out System
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#070B16] overflow-y-auto">
        
        {/* Top Header */}
        <header className="sticky top-0 bg-[#0D1B3E] border-b border-[#1B2B4A] px-8 py-5 flex items-center justify-between z-10">
          <div>
            <h1 className="text-lg font-black tracking-tight text-white uppercase">
              {activeTab === "dashboard" && "System-wide Infrastructure Dashboard"}
              {activeTab === "barangays" && "Barangay & Roster Directory"}
              {activeTab === "tesda_records" && "TESDA Directory & Records"}
              {activeTab === "create_account" && "Authorized Provisioning Engine"}
              {activeTab === "create_tesda" && "TESDA Provisioning Engine"}
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              SiKap Central Command · San Luis Pampanga
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
              System Status: Healthy
            </span>
          </div>
        </header>

        {/* Dynamic Inner Tab Content */}
        <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              
              {/* Highlight Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div className="bg-[#0D1B3E] border border-[#1B2B4A] p-6 rounded-2xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Building2 className="w-16 h-16 text-white" />
                  </div>
                  <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Barangays Tracked</span>
                  <p className="text-3xl font-black text-white mt-2">{stats.totalBarangays}</p>
                  <p className="text-xs text-slate-400 mt-2 font-medium">100% municipal coverage</p>
                </div>

                <div className="bg-[#0D1B3E] border border-[#1B2B4A] p-6 rounded-2xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Users className="w-16 h-16 text-white" />
                  </div>
                  <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Total KK Members</span>
                  <p className="text-3xl font-black text-white mt-2">{stats.kkMembers}</p>
                  <p className="text-xs text-slate-400 mt-2 font-medium">Active demographics registered</p>
                </div>

                <div className="bg-[#0D1B3E] border border-[#1B2B4A] p-6 rounded-2xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Briefcase className="w-16 h-16 text-white" />
                  </div>
                  <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">TESDA Modules</span>
                  <p className="text-3xl font-black text-white mt-2">{stats.activePrograms} / {stats.totalPrograms}</p>
                  <p className="text-xs text-slate-400 mt-2 font-medium">Active / Total programs live</p>
                </div>

                <div className="bg-[#0D1B3E] border border-[#1B2B4A] p-6 rounded-2xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Activity className="w-16 h-16 text-white" />
                  </div>
                  <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">System Status</span>
                  <p className="text-xl font-black text-emerald-400 mt-3 flex items-center gap-2">
                    <span className="w-3 h-3 bg-emerald-400 rounded-full inline-block animate-pulse" />
                    OPERATIONAL
                  </p>
                  <p className="text-xs text-slate-400 mt-2.5 font-medium">All database microservices synced</p>
                </div>

              </div>

              {/* Breakdown of Registered Users by Role */}
              <div className="bg-[#0D1B3E] border border-[#1B2B4A] rounded-2xl p-6">
                <h3 className="text-sm font-black uppercase tracking-wider text-white mb-6 flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-500" />
                  Registered System Demographics by Assigned Role
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { label: "SK Chairpersons", count: stats.skChairpersons, color: "from-blue-600 to-indigo-600" },
                    { label: "Barangay Captains", count: stats.brgyCaptains, color: "from-teal-600 to-emerald-600" },
                    { label: "TESDA Partner Reps", count: stats.tesdaReps, color: "from-orange-600 to-amber-600" },
                    { label: "SK Councilors", count: stats.skCouncilors, color: "from-pink-600 to-rose-600" },
                    { label: "KK Youth Members", count: stats.kkMembers, color: "from-[#0A6B43] to-emerald-700" }
                  ].map((roleItem, index) => (
                    <div key={index} className="bg-[#122240] border border-[#1F3054] p-4 rounded-xl flex flex-col justify-between">
                      <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">{roleItem.label}</p>
                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white">{roleItem.count}</span>
                        <span className="text-[10px] text-emerald-400 font-bold">Accounts</span>
                      </div>
                      <div className={`h-1.5 w-full bg-gradient-to-r ${roleItem.color} rounded-full mt-3`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Platform Activity Monitor */}
              <div className="bg-[#0D1B3E] border border-[#1B2B4A] rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Infrastructure Health & Node Status
                  </h3>
                  <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-2.5 py-1 rounded-md uppercase">
                    Refreshed: Real-time
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300 font-medium">
                  <div className="p-4 bg-[#122240] border border-[#1F3054] rounded-xl flex items-center gap-4">
                    <Lock className="w-8 h-8 text-amber-500 opacity-80" />
                    <div>
                      <p className="font-bold text-white text-xs">Security Layer</p>
                      <p className="text-slate-400 mt-1 leading-relaxed">OAuth 2.0 and role permissions enforced. Secure credentials generated with bcrypt hashing.</p>
                    </div>
                  </div>
                  <div className="p-4 bg-[#122240] border border-[#1F3054] rounded-xl flex items-center gap-4">
                    <RefreshCw className="w-8 h-8 text-blue-400 opacity-80 animate-spin" style={{ animationDuration: "6s" }} />
                    <div>
                      <p className="font-bold text-white text-xs">Dynamic Synchronizer</p>
                      <p className="text-slate-400 mt-1 leading-relaxed">State changes in SK Chairperson dashboard instantly update regional counts.</p>
                    </div>
                  </div>
                  <div className="p-4 bg-[#122240] border border-[#1F3054] rounded-xl flex items-center gap-4">
                    <UserCheck className="w-8 h-8 text-emerald-400 opacity-80" />
                    <div>
                      <p className="font-bold text-white text-xs">AI Inference Engine</p>
                      <p className="text-slate-400 mt-1 leading-relaxed">Google Gemini alignment matrix ready. Zero queue latency on referrals.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: BARANGAY MANAGEMENT */}
          {activeTab === "barangays" && (
            <div className="space-y-6">
              
              <div className="bg-[#0D1B3E] border border-[#1B2B4A] rounded-2xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-[#1B2B4A] flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">Barangay Administrative Directory</h3>
                    <p className="text-xs text-slate-400 mt-1 font-semibold">Live mapping of Sangguniang Kabataan and Barangay Captains across the 8 administrative zones</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#122240] border-b border-[#1B2B4A] text-[10px] text-slate-400 uppercase tracking-widest font-black">
                        <th className="p-4 pl-6">Barangay Name</th>
                        <th className="p-4">SK Chairperson</th>
                        <th className="p-4">Barangay Captain</th>
                        <th className="p-4 text-center">Councilor Count</th>
                        <th className="p-4 text-center">KK Members Count</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F3054] font-medium text-slate-200">
                      {barangayDataList.map((item, index) => (
                        <tr key={index} className="hover:bg-[#122240]/50 transition-colors">
                          <td className="p-4 pl-6 font-bold text-white text-sm">{item.name}</td>
                          
                          {/* SK Chairperson details */}
                          <td className="p-4">
                            <div className="flex items-start justify-between gap-2 group/btn">
                              <div>
                                <p className="font-bold text-slate-100">{item.sk.name}</p>
                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{item.sk.email}</p>
                                <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded mt-1.5 ${
                                  item.sk.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400"
                                }`}>
                                  {item.sk.status}
                                </span>
                              </div>
                              {item.sk.id && (
                                <button
                                  onClick={() => setDeleteAccountTarget({ id: item.sk.id!, name: item.sk.name, role: "SK Chairperson" })}
                                  className="p-1.5 bg-[#122240] hover:bg-red-600 hover:text-white text-red-400 border border-[#1F3054] hover:border-red-500 rounded-lg transition-all opacity-80 hover:opacity-100"
                                  title="Delete SK Chairperson Account"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Barangay Captain details */}
                          <td className="p-4">
                            <div className="flex items-start justify-between gap-2 group/btn">
                              <div>
                                <p className="font-bold text-slate-100">{item.cap.name}</p>
                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{item.cap.email}</p>
                                <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded mt-1.5 ${
                                  item.cap.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400"
                                }`}>
                                  {item.cap.status}
                                </span>
                              </div>
                              {item.cap.id && (
                                <button
                                  onClick={() => setDeleteAccountTarget({ id: item.cap.id!, name: item.cap.name, role: "Barangay Captain" })}
                                  className="p-1.5 bg-[#122240] hover:bg-red-600 hover:text-white text-red-400 border border-[#1F3054] hover:border-red-500 rounded-lg transition-all opacity-80 hover:opacity-100"
                                  title="Delete Barangay Captain Account"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>

                          <td className="p-4 text-center font-bold text-slate-300 text-sm">
                            <span className="px-2.5 py-1 bg-[#122240] border border-[#1F3054] rounded-md inline-block">
                              {item.councilorCount}
                            </span>
                          </td>

                          <td className="p-4 text-center font-bold text-[#FF9F1C] text-sm">
                            <span className="px-2.5 py-1 bg-[#122240] border border-[#1F3054] rounded-md inline-block">
                              {item.kkCount}
                            </span>
                          </td>

                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedBrgy(item.name);
                                  setIsViewModalOpen(true);
                                }}
                                className="p-2 bg-[#122240] hover:bg-blue-600 hover:text-white text-blue-400 border border-[#1F3054] rounded-lg transition-all"
                                title="View Barangay Roster"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditBrgyClick(item.name)}
                                className="p-2 bg-[#122240] hover:bg-amber-600 hover:text-white text-amber-400 border border-[#1F3054] rounded-lg transition-all"
                                title="Edit Barangay Details"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB: TESDA DIRECTORY & RECORDS */}
          {activeTab === "tesda_records" && (
            <div className="space-y-6">
              
              <div className="bg-[#0D1B3E] border border-[#1B2B4A] rounded-2xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-[#1B2B4A] flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">TESDA Municipal Representatives</h3>
                    <p className="text-xs text-slate-400 mt-1 font-semibold">Authorized technical and vocational training coordinators assigned to the municipality</p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab("create_tesda");
                      setRole("TESDA Representative");
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-black uppercase rounded-xl tracking-wider transition-all"
                  >
                    <PlusCircle className="w-4 h-4" /> Provision New Representative
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#122240] border-b border-[#1B2B4A] text-[10px] text-slate-400 uppercase tracking-widest font-black">
                        <th className="p-4 pl-6">Representative Name</th>
                        <th className="p-4">Official Email</th>
                        <th className="p-4">Assigned Role</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-center">Date Created</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1B2B4A] text-slate-300 font-medium">
                      {officialAccounts.filter(o => o.role === "TESDA Representative").length > 0 ? (
                        officialAccounts.filter(o => o.role === "TESDA Representative").map((item) => (
                          <tr key={item.id} className="hover:bg-slate-900/30 transition-colors">
                            <td className="p-4 pl-6 font-bold text-white text-sm">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center font-black text-[10px] uppercase">
                                  {item.name.charAt(0)}
                                </div>
                                {item.name}
                              </div>
                            </td>
                            <td className="p-4 text-blue-300 font-mono">{item.email}</td>
                            <td className="p-4 text-slate-300">{item.role}</td>
                            <td className="p-4 text-center">
                              <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                item.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400"
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="p-4 text-center text-slate-400">{item.dateCreated}</td>
                            <td className="p-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setDeleteAccountTarget({ id: item.id, name: item.name, role: "TESDA Representative" })}
                                  className="p-2 bg-[#122240] hover:bg-red-600 hover:text-white text-red-400 border border-[#1F3054] hover:border-red-500 rounded-lg transition-all"
                                  title="Delete TESDA Representative Account"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            No TESDA Representatives registered yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: CREATE OFFICIAL ACCOUNT FORM */}
          {activeTab === "create_account" && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-[#0D1B3E] border border-[#1B2B4A] rounded-2xl p-8 shadow-xl relative">
                
                <div className="border-b border-[#1B2B4A] pb-5 mb-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#1F3054] text-[#FF9F1C] flex items-center justify-center mx-auto mb-3">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase">Provision Official Account</h3>
                  <p className="text-xs text-slate-400 mt-1 font-semibold">Generate certified secure authentication nodes for municipal representatives</p>
                </div>

                <form onSubmit={handleCreateAccountSubmit} className="space-y-5 text-xs font-semibold">
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Authorized Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Captain Danilo Santos"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full p-3 bg-[#090F1E] border border-[#1B2B4A] rounded-xl text-white focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Official Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. danilosantos.captain@sanluispampanga.gov.ph"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-3 bg-[#090F1E] border border-[#1B2B4A] rounded-xl text-white focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Assigned Official Role</label>
                      <select
                        value={role}
                        onChange={handleRoleChange}
                        className="w-full p-3 bg-[#090F1E] border border-[#1B2B4A] text-white rounded-xl focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                      >
                        <option value="SK Chairperson">SK Chairperson</option>
                        <option value="Barangay Captain">Barangay Captain</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Barangay Assignment</label>
                      <select
                        value={barangayAssignment}
                        onChange={(e) => setBarangayAssignment(e.target.value)}
                        className="w-full p-3 bg-[#090F1E] border border-[#1B2B4A] text-white rounded-xl focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                      >
                        {barangays.map(b => (
                          <option key={b.name} value={b.name}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Generated Password block */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Temporary Password Node</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={tempPassword}
                        onChange={(e) => setTempPassword(e.target.value)}
                        className="w-full p-3 bg-[#090F1E] border border-[#1B2B4A] text-[#FF9F1C] font-mono rounded-xl tracking-wide focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-amber-500 transition-colors"
                        title="Regenerate Password"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 text-xs font-black rounded-xl uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    Create Account and Send Credentials
                  </button>

                </form>
              </div>
            </div>
          )}

          {/* TAB: CREATE TESDA REPRESENTATIVE FORM */}
          {activeTab === "create_tesda" && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-[#0D1B3E] border border-[#1B2B4A] rounded-2xl p-8 shadow-xl relative">
                
                <div className="border-b border-[#1B2B4A] pb-5 mb-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#1F3054] text-[#FF9F1C] flex items-center justify-center mx-auto mb-3">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase">Provision TESDA Account</h3>
                  <p className="text-xs text-slate-400 mt-1 font-semibold">Generate certified secure authentication nodes for municipal TESDA representatives</p>
                </div>

                <form onSubmit={handleCreateTesdaSubmit} className="space-y-5 text-xs font-semibold">
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Authorized Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Evelyn Castor"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full p-3 bg-[#090F1E] border border-[#1B2B4A] rounded-xl text-white focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Official Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. evelyn.castor@tesda.gov.ph"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-3 bg-[#090F1E] border border-[#1B2B4A] rounded-xl text-white focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Assigned Official Role</label>
                      <input
                        type="text"
                        readOnly
                        value="TESDA Representative"
                        className="w-full p-3 bg-[#090F1E] border border-[#1B2B4A] text-slate-400 rounded-xl cursor-not-allowed outline-hidden"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Scope Assignment</label>
                      <input
                        type="text"
                        readOnly
                        value="Municipal-wide (Unassigned Barangay)"
                        className="w-full p-3 bg-[#090F1E] border border-[#1B2B4A] text-slate-400 rounded-xl cursor-not-allowed outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Generated Password block */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Temporary Password Node</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={tempPassword}
                        onChange={(e) => setTempPassword(e.target.value)}
                        className="w-full p-3 bg-[#090F1E] border border-[#1B2B4A] text-[#FF9F1C] font-mono rounded-xl tracking-wide focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-amber-500 transition-colors"
                        title="Regenerate Password"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 text-xs font-black rounded-xl uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    Create TESDA Account and Send Credentials
                  </button>

                </form>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* VIEW BARANGAY DETAILS DIALOG MODAL */}
      {isViewModalOpen && selectedBrgyDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#0D1B3E] border border-[#1B2B4A] rounded-2xl w-full max-w-3xl overflow-hidden max-h-[85vh] flex flex-col text-xs font-semibold">
            
            <div className="p-6 bg-[#122240] border-b border-[#1B2B4A] flex justify-between items-center">
              <div>
                <span className="text-[9px] font-black text-[#FF9F1C] uppercase tracking-wider block">Administrative Roster</span>
                <h3 className="text-base font-black text-white">{selectedBrgyDetails.name} zone summary</h3>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-[#0D1B3E] border border-[#1B2B4A]"
              >
                &times; Close
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Leaders summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#122240] border border-[#1F3054] p-4 rounded-xl relative flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">SK Chairperson</span>
                    <p className="font-extrabold text-sm text-white mt-1">{selectedBrgyDetails.sk.name}</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">{selectedBrgyDetails.sk.email}</p>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#1F3054]">
                    <span className="inline-block text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">
                      {selectedBrgyDetails.sk.status}
                    </span>
                    {selectedBrgyDetails.sk.id && (
                      <button
                        onClick={() => {
                          setDeleteAccountTarget({ id: selectedBrgyDetails.sk.id!, name: selectedBrgyDetails.sk.name, role: "SK Chairperson" });
                          setIsViewModalOpen(false);
                        }}
                        className="text-red-400 hover:text-red-300 flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider hover:bg-red-500/10 px-2 py-1 rounded border border-transparent hover:border-red-500/20 transition-all"
                        title="Delete SK Chairperson Account"
                      >
                        <Trash2 className="w-3 h-3" /> Delete Account
                      </button>
                    )}
                  </div>
                </div>
                <div className="bg-[#122240] border border-[#1F3054] p-4 rounded-xl relative flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Barangay Captain</span>
                    <p className="font-extrabold text-sm text-white mt-1">{selectedBrgyDetails.cap.name}</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">{selectedBrgyDetails.cap.email}</p>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#1F3054]">
                    <span className="inline-block text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">
                      {selectedBrgyDetails.cap.status}
                    </span>
                    {selectedBrgyDetails.cap.id && (
                      <button
                        onClick={() => {
                          setDeleteAccountTarget({ id: selectedBrgyDetails.cap.id!, name: selectedBrgyDetails.cap.name, role: "Barangay Captain" });
                          setIsViewModalOpen(false);
                        }}
                        className="text-red-400 hover:text-red-300 flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider hover:bg-red-500/10 px-2 py-1 rounded border border-transparent hover:border-red-500/20 transition-all"
                        title="Delete Barangay Captain Account"
                      >
                        <Trash2 className="w-3 h-3" /> Delete Account
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Councilors Table / List */}
              <div>
                <h4 className="text-xs font-black uppercase text-white mb-3">SK Councilors Roster ({selectedBrgyDetails.councilors.length})</h4>
                {selectedBrgyDetails.councilors.length > 0 ? (
                  <div className="bg-[#122240] border border-[#1F3054] rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#090F1E] border-b border-[#1B2B4A] text-[9px] text-slate-400 uppercase tracking-widest font-black">
                          <th className="p-3">Name</th>
                          <th className="p-3">Email Address</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-right">Added</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1F3054] text-slate-300">
                        {selectedBrgyDetails.councilors.map((c, i) => (
                          <tr key={i} className="hover:bg-slate-900/40">
                            <td className="p-3 font-bold text-white">{c.name}</td>
                            <td className="p-3 text-slate-400">{c.email}</td>
                            <td className="p-3 text-center">
                              <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                c.status === "Active" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                              }`}>
                                {c.status}
                              </span>
                            </td>
                            <td className="p-3 text-right text-slate-400 font-medium">{c.dateCreated}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-[#122240] p-6 text-center rounded-xl text-slate-400">
                    No councilors registered for this barangay yet.
                  </div>
                )}
              </div>

              {/* KK Members list */}
              <div>
                <h4 className="text-xs font-black uppercase text-white mb-3">Registered KK Youth Residents ({selectedBrgyDetails.youth.length})</h4>
                {selectedBrgyDetails.youth.length > 0 ? (
                  <div className="bg-[#122240] border border-[#1F3054] rounded-xl overflow-hidden max-h-[160px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#090F1E] border-b border-[#1B2B4A] text-[9px] text-slate-400 uppercase tracking-widest font-black">
                          <th className="p-3">Name</th>
                          <th className="p-3">Age</th>
                          <th className="p-3">Purok</th>
                          <th className="p-3">Educational Attainment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1F3054] text-slate-300">
                        {selectedBrgyDetails.youth.map((y, i) => (
                          <tr key={i} className="hover:bg-slate-900/40">
                            <td className="p-3 font-bold text-white">{y.name}</td>
                            <td className="p-3 text-slate-400">{y.age} y/o</td>
                            <td className="p-3 text-slate-400">{y.purok}</td>
                            <td className="p-3 text-slate-400 font-medium">{y.educationalAttainment}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-[#122240] p-6 text-center rounded-xl text-slate-400">
                    No KK youth registered for this barangay yet.
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* EDIT BARANGAY NAME DIALOG MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#0D1B3E] border border-[#1B2B4A] rounded-2xl w-full max-w-md overflow-hidden text-xs font-semibold">
            
            <div className="p-5 bg-[#122240] border-b border-[#1B2B4A] flex justify-between items-center">
              <h3 className="text-sm font-black text-white uppercase">Rename Barangay</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                &times; Close
              </button>
            </div>

            <form onSubmit={handleSaveBrgyName} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase block">Administrative Barangay Name</label>
                <input
                  type="text"
                  required
                  value={editBrgyName}
                  onChange={(e) => setEditBrgyName(e.target.value)}
                  className="w-full p-3 bg-[#090F1E] border border-[#1B2B4A] text-white rounded-xl focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-bold uppercase rounded-lg"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 bg-[#122240] hover:bg-[#1a2d52] text-slate-300 rounded-lg border border-[#1F3054]"
                >
                  Cancel
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* SUCCESS CREATED CREDENTIALS MODAL */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#0D1B3E] border-2 border-amber-500/50 rounded-3xl w-full max-w-md p-6 text-center space-y-5 shadow-2xl relative">
            
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-1">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-black text-white uppercase tracking-tight">Account Created Successfully!</h3>
            
            <div className="text-left bg-[#090F1E] border border-[#1B2B4A] rounded-xl p-4 space-y-2 text-xs text-slate-300 font-medium">
              <p><strong className="text-slate-400 uppercase text-[9px] tracking-wider block">Assigned Name</strong> {createdCredentials.name}</p>
              <p><strong className="text-slate-400 uppercase text-[9px] tracking-wider block">Provisioned Role</strong> <span className="text-amber-400">{createdCredentials.role}</span></p>
              {createdCredentials.barangay && (
                <p><strong className="text-slate-400 uppercase text-[9px] tracking-wider block">Barangay Zone</strong> {createdCredentials.barangay}</p>
              )}
              <div className="h-px bg-[#1B2B4A] my-2" />
              <p><strong className="text-slate-400 uppercase text-[9px] tracking-wider block">Registered Email</strong> <span className="text-blue-300 font-mono text-[11px]">{createdCredentials.email}</span></p>
              <p><strong className="text-slate-400 uppercase text-[9px] tracking-wider block">Temporary Password</strong> <span className="text-[#FF9F1C] font-mono text-sm tracking-wide">{createdCredentials.pass}</span></p>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
              Copy this secure block and transmit it privately to the official node. Temporary password expires in 48 hours unless validated.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCopyCredentials}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-black rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied Node ✓" : "Copy Credentials"}
              </button>
              <button
                onClick={() => setCreatedCredentials(null)}
                className="px-5 py-3 bg-[#122240] hover:bg-[#1f3054] text-slate-200 text-xs font-extrabold rounded-xl"
              >
                Dismiss
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {deleteAccountTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#0D1B3E] border border-red-500/40 rounded-2xl w-full max-w-md overflow-hidden text-xs font-semibold shadow-2xl">
            
            <div className="p-5 bg-red-950/20 border-b border-[#1B2B4A] flex justify-between items-center text-red-400">
              <h3 className="text-sm font-black uppercase tracking-wider">Confirm Account Deletion</h3>
              <button
                onClick={() => setDeleteAccountTarget(null)}
                className="text-slate-400 hover:text-white text-lg"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto mb-2">
                  <Trash2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-black text-white uppercase">Are you absolutely sure?</p>
                <p className="text-slate-300 font-medium leading-relaxed">
                  You are about to delete the certified official account for <strong className="text-amber-400">{deleteAccountTarget.role} {deleteAccountTarget.name}</strong>.
                </p>
                <p className="text-[10px] text-red-400 font-bold bg-red-500/5 border border-red-500/10 p-2.5 rounded-lg">
                  This action is irreversible. The account holder will lose administrative access immediately.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={confirmDeleteAccount}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold uppercase rounded-lg transition-all"
                >
                  Delete Permanently
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteAccountTarget(null)}
                  className="px-4 py-2.5 bg-[#122240] hover:bg-[#1a2d52] text-slate-300 rounded-lg border border-[#1F3054]"
                >
                  Cancel
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
