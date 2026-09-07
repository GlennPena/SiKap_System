"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Mail,
  Smartphone,
  CheckCircle,
  AlertTriangle,
  Send,
  RefreshCw,
  Shield,
  Info
} from "lucide-react";
import {
  isPushSupported,
  getPushSubscriptionStatus,
  subscribeUserToPush,
  unsubscribeUserFromPush
} from "@/lib/push-client";

interface NotificationSettingsCardProps {
  userRole?: string;
  userEmail?: string;
  addToast?: (msg: string, type: "success" | "error" | "info") => void;
  compact?: boolean;
}

export const NotificationSettingsCard: React.FC<NotificationSettingsCardProps> = ({
  userRole = "KK_YOUTH",
  userEmail,
  addToast = () => {},
  compact = false
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Preference states
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [notifyOnApplicationStatus, setNotifyOnApplicationStatus] = useState(true);
  const [notifyOnAnnouncements, setNotifyOnAnnouncements] = useState(true);
  const [notifyOnNewRegistrations, setNotifyOnNewRegistrations] = useState(true);

  // Browser push status
  const [pushStatus, setPushStatus] = useState<{
    supported: boolean;
    permission: NotificationPermission;
    subscribed: boolean;
  }>({
    supported: true,
    permission: "default",
    subscribed: false
  });

  // Load preferences and browser push status
  const loadPreferences = async () => {
    try {
      setLoading(true);
      const [prefRes, pushState] = await Promise.all([
        fetch("/api/notifications/preferences").then((r) => r.json()),
        getPushSubscriptionStatus()
      ]);

      if (prefRes.success && prefRes.data) {
        setPushEnabled(Boolean(prefRes.data.pushEnabled));
        setEmailEnabled(Boolean(prefRes.data.emailEnabled));
        setNotifyOnApplicationStatus(Boolean(prefRes.data.notifyOnApplicationStatus));
        setNotifyOnAnnouncements(Boolean(prefRes.data.notifyOnAnnouncements));
        setNotifyOnNewRegistrations(Boolean(prefRes.data.notifyOnNewRegistrations));
      }

      setPushStatus(pushState);
    } catch (err) {
      console.error("Error loading notification preferences:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  // Save updated preferences to server
  const savePreferences = async (overrides: Partial<{
    pushEnabled: boolean;
    emailEnabled: boolean;
    notifyOnApplicationStatus: boolean;
    notifyOnAnnouncements: boolean;
    notifyOnNewRegistrations: boolean;
  }>) => {
    try {
      setSaving(true);
      const payload = {
        pushEnabled,
        emailEnabled,
        notifyOnApplicationStatus,
        notifyOnAnnouncements,
        notifyOnNewRegistrations,
        ...overrides
      };

      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        addToast("Notification preferences updated", "success");
      } else {
        addToast(data.error || "Failed to save preferences", "error");
      }
    } catch {
      addToast("Network error saving preferences", "error");
    } finally {
      setSaving(false);
    }
  };

  // Toggle Web Push Subscription
  const handleTogglePush = async (enable: boolean) => {
    if (enable) {
      if (!isPushSupported()) {
        addToast("Web Push is not supported by this browser.", "error");
        return;
      }

      const res = await subscribeUserToPush();
      if (res.success) {
        setPushEnabled(true);
        savePreferences({ pushEnabled: true });
        addToast("Browser push notifications enabled!", "success");
      } else {
        addToast(res.error || "Could not enable push notifications", "error");
      }
    } else {
      await unsubscribeUserFromPush();
      setPushEnabled(false);
      savePreferences({ pushEnabled: false });
      addToast("Push notifications turned off", "info");
    }

    const updatedStatus = await getPushSubscriptionStatus();
    setPushStatus(updatedStatus);
  };

  // Send test alert
  const handleSendTest = async (type: "push" | "email" | "all") => {
    try {
      setTesting(true);

      // If testing push but not subscribed yet on this browser, auto-subscribe first!
      if ((type === "push" || type === "all") && (!pushStatus.subscribed || !pushEnabled)) {
        const subRes = await subscribeUserToPush();
        if (subRes.success) {
          setPushEnabled(true);
          await savePreferences({ pushEnabled: true });
          const updated = await getPushSubscriptionStatus();
          setPushStatus(updated);
        } else {
          addToast(subRes.error || "Please allow browser notification permission first.", "error");
          setTesting(false);
          return;
        }
      }

      const res = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
      });
      const data = await res.json();

      if (data.success) {
        if (type === "push" || type === "all") {
          addToast("Test push notification dispatched! Check your device.", "success");
        } else {
          addToast("Test email notification dispatched!", "success");
        }
      } else {
        addToast(data.error || "Failed to trigger test notification", "error");
      }
    } catch {
      addToast("Network error sending test notification", "error");
    } finally {
      setTesting(false);
    }
  };

  const isYouth = userRole === "KK_YOUTH";
  const isTESDA = userRole === "TESDA_PARTNER";
  const isBarangayGov = ["SK_OFFICIAL", "SUPER_ADMIN", "BARANGAY_CAPTAIN"].includes(userRole);

  if (compact) {
    // Compact widget for dropdowns or quick bars
    return (
      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#0A6B43]" />
            <span className="text-xs font-bold text-gray-800">Off-Site Browser Alerts</span>
          </div>
          {pushStatus.subscribed && pushEnabled ? (
            <span className="text-[10px] bg-emerald-100 text-[#0A6B43] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Active
            </span>
          ) : (
            <button
              onClick={() => handleTogglePush(true)}
              className="px-2.5 py-1 bg-[#0A6B43] hover:bg-[#075332] text-white text-[10px] font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              Turn On Alerts
            </button>
          )}
        </div>
        <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
          {isYouth
            ? "Receive instant pop-ups on your phone or PC when TESDA accepts your application, even if this website is closed."
            : "Receive instant desktop/mobile pop-ups for new KK youth registrations and status updates even with the browser closed."}
        </p>
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => handleSendTest("push")}
            disabled={testing}
            className="text-[10px] text-[#0A6B43] font-bold hover:underline cursor-pointer flex items-center gap-1"
          >
            {testing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            {pushStatus.subscribed && pushEnabled ? "Send Test Pop-up" : "Turn On & Send Test Pop-up"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-xs space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#0A6B43]" />
            Notifications & Off-Site Alerts
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Configure how and where SiKap sends you important account and application updates
          </p>
        </div>

        <button
          onClick={() => handleSendTest("all")}
          disabled={testing || loading}
          className="self-start sm:self-auto px-3.5 py-2 bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-[#0A6B43] text-xs font-bold rounded-xl border border-gray-200 transition-all cursor-pointer flex items-center gap-2 shrink-0"
          title="Send a sample notification to verify settings"
        >
          {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-[#0A6B43]" />}
          <span>Send Test Alert</span>
        </button>
      </div>

      {loading ? (
        <div className="py-8 flex items-center justify-center text-xs text-gray-400 gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#0A6B43]" />
          Loading notification preferences...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Channel 1: Web Push Notifications */}
          <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-emerald-100/80 rounded-xl text-[#0A6B43] shrink-0 mt-0.5">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-gray-900">Web Push Notifications</h4>
                    {pushStatus.subscribed && pushEnabled ? (
                      <span className="text-[10px] bg-emerald-100 text-[#0A6B43] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Connected
                      </span>
                    ) : pushStatus.permission === "denied" ? (
                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Blocked in Browser
                      </span>
                    ) : (
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 font-medium leading-relaxed mt-1">
                    Receive instant system alerts on your Android device or PC even when the browser or tab is completely closed.
                  </p>
                  {pushStatus.permission === "denied" && (
                    <p className="text-[11px] text-red-600 font-semibold mt-1">
                      Notifications are blocked in your browser settings. Click the lock icon in your address bar to allow notifications.
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleTogglePush(!pushEnabled || !pushStatus.subscribed)}
                disabled={saving || !pushStatus.supported || pushStatus.permission === "denied"}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  pushEnabled && pushStatus.subscribed ? "bg-[#0A6B43]" : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    pushEnabled && pushStatus.subscribed ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Channel 2: Transactional Email Alerts */}
          <div className="p-4 rounded-xl border border-gray-150 bg-gray-50/50 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-gray-200/80 rounded-xl text-gray-700 shrink-0 mt-0.5">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-gray-900">Email Notifications</h4>
                    {emailEnabled ? (
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Enabled
                      </span>
                    ) : (
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">
                        Disabled
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 font-medium leading-relaxed mt-1">
                    Receive official notices and paper-trail updates sent directly to your registered email address
                    {userEmail && <strong className="text-gray-800"> ({userEmail})</strong>}.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  const next = !emailEnabled;
                  setEmailEnabled(next);
                  savePreferences({ emailEnabled: next });
                }}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  emailEnabled ? "bg-[#0A6B43]" : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    emailEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Granular Preferences Section */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
              {isTESDA ? "TESDA Partner Notification Triggers" : isBarangayGov ? "Barangay Governance Alerts" : "Youth Notification Triggers"}
            </h4>

            {/* Trigger 1: Application / Referral Updates */}
            {isYouth && (
              <label className="flex items-start justify-between p-3 bg-gray-50/70 hover:bg-gray-50 border border-gray-150 rounded-xl cursor-pointer transition-colors">
                <div className="pr-4">
                  <p className="text-xs font-bold text-gray-800">TESDA Application & Enrollment Updates</p>
                  <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                    Notify me immediately when TESDA approves, accepts, or requests physical document submissions for my course applications.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyOnApplicationStatus}
                  onChange={(e) => {
                    const next = e.target.checked;
                    setNotifyOnApplicationStatus(next);
                    savePreferences({ notifyOnApplicationStatus: next });
                  }}
                  className="w-4.5 h-4.5 rounded-sm text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer"
                />
              </label>
            )}

            {isTESDA && (
              <>
                <label className="flex items-start justify-between p-3 bg-gray-50/70 hover:bg-gray-50 border border-gray-150 rounded-xl cursor-pointer transition-colors">
                  <div className="pr-4">
                    <p className="text-xs font-bold text-gray-800">New Course Applications & Referrals</p>
                    <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                      Receive instant pop-up alerts and emails when KK Youth submit applications or are referred by SK to your published training courses.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyOnApplicationStatus}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setNotifyOnApplicationStatus(next);
                      savePreferences({ notifyOnApplicationStatus: next });
                    }}
                    className="w-4.5 h-4.5 rounded-sm text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer"
                  />
                </label>

                <label className="flex items-start justify-between p-3 bg-gray-50/70 hover:bg-gray-50 border border-gray-150 rounded-xl cursor-pointer transition-colors">
                  <div className="pr-4">
                    <p className="text-xs font-bold text-gray-800">Course Slot Capacity & Quota Alerts</p>
                    <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                      Get notified when training slots for your courses are nearly full, reach maximum quota, or when waitlisted youth apply.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyOnNewRegistrations}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setNotifyOnNewRegistrations(next);
                      savePreferences({ notifyOnNewRegistrations: next });
                    }}
                    className="w-4.5 h-4.5 rounded-sm text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer"
                  />
                </label>
              </>
            )}

            {isBarangayGov && (
              <>
                <label className="flex items-start justify-between p-3 bg-gray-50/70 hover:bg-gray-50 border border-gray-150 rounded-xl cursor-pointer transition-colors">
                  <div className="pr-4">
                    <p className="text-xs font-bold text-gray-800">New KK Youth Self-Registration Alerts</p>
                    <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                      Receive immediate email and push alerts when an Out-of-School Youth (OSY) or KK resident registers in your barangay.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyOnNewRegistrations}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setNotifyOnNewRegistrations(next);
                      savePreferences({ notifyOnNewRegistrations: next });
                    }}
                    className="w-4.5 h-4.5 rounded-sm text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer"
                  />
                </label>

                <label className="flex items-start justify-between p-3 bg-gray-50/70 hover:bg-gray-50 border border-gray-150 rounded-xl cursor-pointer transition-colors">
                  <div className="pr-4">
                    <p className="text-xs font-bold text-gray-800">TESDA Referral & Pipeline Updates</p>
                    <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                      Get notified when TESDA accepts, enrolls, or processes training applications for youth from your barangay.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyOnApplicationStatus}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setNotifyOnApplicationStatus(next);
                      savePreferences({ notifyOnApplicationStatus: next });
                    }}
                    className="w-4.5 h-4.5 rounded-sm text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer"
                  />
                </label>
              </>
            )}

            {/* Trigger: Announcements */}
            <label className="flex items-start justify-between p-3 bg-gray-50/70 hover:bg-gray-50 border border-gray-150 rounded-xl cursor-pointer transition-colors">
              <div className="pr-4">
                <p className="text-xs font-bold text-gray-800">
                  {isTESDA ? "Municipal Livelihood & SK Announcements" : "SK Announcements & Community Notices"}
                </p>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                  {isTESDA
                    ? "Receive updates regarding municipal training initiatives, SK community events, and partner coordination notices in San Luis."
                    : "Get notified whenever new livelihood programs, training dates, or community events are posted."}
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifyOnAnnouncements}
                onChange={(e) => {
                  const next = e.target.checked;
                  setNotifyOnAnnouncements(next);
                  savePreferences({ notifyOnAnnouncements: next });
                }}
                className="w-4.5 h-4.5 rounded-sm text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer"
              />
            </label>
          </div>

          <div className="p-3 bg-blue-50/60 border border-blue-150 rounded-xl text-blue-800 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Tip for Mobile Users:</strong> On Android devices, push alerts appear in your notification tray even when your browser is closed. On iOS (iPhones), add SiKap to your Home Screen to receive native push notifications.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
