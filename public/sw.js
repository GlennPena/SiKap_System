// SiKap System Service Worker for Web Push Notifications

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || "SiKap Notification";
    const options = {
      body: payload.body || "You have a new update in your account.",
      icon: payload.icon || "/favicon.ico",
      badge: payload.badge || "/favicon.ico",
      tag: payload.tag || "sikap-notification",
      data: {
        url: payload.url || "/"
      },
      vibrate: [100, 50, 100]
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    // Fallback for plain text push messages
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification("SiKap Notification", {
        body: text,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        data: { url: "/" }
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  let targetPath = event.notification.data?.url || "/";
  if (targetPath === "/portal") {
    targetPath = "/";
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a tab is already open on this origin, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          if (targetPath !== "/" && !client.url.endsWith(targetPath)) {
            client.navigate(targetPath);
          }
          return client.focus();
        }
      }
      // Otherwise open a new tab/window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetPath);
      }
    })
  );
});
