/**
 * Real-Time Cross-Tab and In-App Synchronization Hub
 * 
 * Provides:
 * 1. BroadcastChannel across all browser tabs for instant (<10ms) synchronization
 * 2. Window-level CustomEvent for same-tab cross-component reactivity
 * 3. Subscription helper to easily trigger revalidation
 */

const CHANNEL_NAME = "sikap_realtime_sync_channel";
const EVENT_NAME = "sikap:data_changed";

export interface SyncPayload {
  entity?: "youth" | "programs" | "announcements" | "referrals" | "councilors" | "users" | "all";
  action?: string;
  timestamp: number;
}

/**
 * Broadcasts a data change event across all open tabs and within the current window.
 */
export function broadcastDataChange(entity: SyncPayload["entity"] = "all", action?: string) {
  if (typeof window === "undefined") return;

  const payload: SyncPayload = {
    entity,
    action,
    timestamp: Date.now()
  };

  // 1. Dispatch custom event within current window
  try {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: payload }));
  } catch (err) {
    console.warn("Could not dispatch CustomEvent:", err);
  }

  // 2. Broadcast across tabs if BroadcastChannel is supported
  if ("BroadcastChannel" in window) {
    try {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage(payload);
      channel.close();
    } catch {
      // Fallback: localStorage ping
      try {
        localStorage.setItem("sikap_sync_ping", `${Date.now()}_${entity}`);
      } catch {}
    }
  } else {
    try {
      localStorage.setItem("sikap_sync_ping", `${Date.now()}_${entity}`);
    } catch {}
  }
}

/**
 * Subscribes to real-time data change notifications.
 * Returns an unsubscribe cleanup function.
 */
export function onRealtimeSync(callback: (payload: SyncPayload) => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  // 1. Listen to same-window custom events
  const handleCustomEvent = (e: Event) => {
    const customEvent = e as CustomEvent<SyncPayload>;
    callback(customEvent.detail || { entity: "all", timestamp: Date.now() });
  };
  window.addEventListener(EVENT_NAME, handleCustomEvent);

  // 2. Listen to other tabs via BroadcastChannel
  let channel: BroadcastChannel | null = null;
  if ("BroadcastChannel" in window) {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event: MessageEvent<SyncPayload>) => {
        if (event.data) {
          callback(event.data);
        }
      };
    } catch {
      channel = null;
    }
  }

  // 3. Fallback: listen to storage event for older browsers or if BroadcastChannel is blocked
  const handleStorage = (e: StorageEvent) => {
    if (e.key === "sikap_sync_ping" && e.newValue) {
      callback({ entity: "all", timestamp: Date.now() });
    }
  };
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(EVENT_NAME, handleCustomEvent);
    window.removeEventListener("storage", handleStorage);
    if (channel) {
      channel.close();
    }
  };
}
