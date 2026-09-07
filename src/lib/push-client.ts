"use client";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Checks whether Web Push is supported in the current browser environment.
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Registers the service worker (`/sw.js`).
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;

  try {
    const reg = await navigator.serviceWorker.register("/sw.js", {
      scope: "/"
    });
    return reg;
  } catch (error) {
    console.error("[Push Client] Service Worker registration failed:", error);
    return null;
  }
}

/**
 * Checks current push permission and subscription status.
 */
export async function getPushSubscriptionStatus(): Promise<{
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
}> {
  if (!isPushSupported()) {
    return { supported: false, permission: "default", subscribed: false };
  }

  const permission = Notification.permission;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return {
      supported: true,
      permission,
      subscribed: !!sub
    };
  } catch {
    return {
      supported: true,
      permission,
      subscribed: false
    };
  }
}

/**
 * Requests permission and subscribes the user's browser to push notifications.
 */
export async function subscribeUserToPush(): Promise<{ success: boolean; error?: string }> {
  if (!isPushSupported()) {
    return { success: false, error: "Push notifications are not supported by this browser." };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, error: "Notification permission was denied." };
    }

    const reg = await registerServiceWorker();
    if (!reg) {
      return { success: false, error: "Failed to register background service worker." };
    }

    // Wait until service worker is active
    await navigator.serviceWorker.ready;

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BPMUZH7FMXp6LwJG16nnklQ1iYeJPTYrCnPxWiJWUc3DHyosBDJA8vFVXtOrojY0pY5xQVGn3wd8k5MUhoi3uak";
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
    }

    // Send subscription to server
    const response = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: subscription.toJSON() })
    });

    const resData = await response.json();
    if (!response.ok || !resData.success) {
      throw new Error(resData.error || "Server failed to save subscription.");
    }

    return { success: true };
  } catch (error: any) {
    console.error("[Push Client] Error subscribing:", error);
    return { success: false, error: error?.message || "Failed to subscribe to push notifications." };
  }
}

/**
 * Unsubscribes the user from push notifications.
 */
export async function unsubscribeUserFromPush(): Promise<{ success: boolean; error?: string }> {
  if (!isPushSupported()) return { success: true };

  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      await fetch("/api/notifications/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint })
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("[Push Client] Error unsubscribing:", error);
    return { success: false, error: error?.message || "Failed to unsubscribe." };
  }
}
