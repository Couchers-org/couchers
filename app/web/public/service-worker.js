self.addEventListener("push", function (event) {
  const data = event.data?.json();

  self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    data: { url: data.url },
  });
});

// Handles clicking on a url within a notification
self.addEventListener("notificationclick", (event) => {
  const notificationData = event.notification.data;

  if (notificationData.url) {
    clients.openWindow(notificationData.url);
  }

  event.notification.close();
});
