self.addEventListener("push", function (event) {
  event.waitUntil(
    (async () => {
      let data;
      try {
        data = event.data?.json();
      } catch (error) {
        console.error("Failed to parse push notification data:", error);
        return;
      }

      // Validate required fields
      if (!data?.title) {
        console.error("Push notification missing required title field");
        return;
      }

      // Use thread_id as tag for notification grouping - notifications with the same tag
      // will replace each other instead of stacking
      const options = {
        body: data.body || "",
        icon: data.icon,
        badge: data.badge,
        data: { url: data.url },
      };

      // Add tag for grouping if thread_id is provided
      if (data.thread_id) {
        options.tag = data.thread_id;
        // renotify: true ensures the user is alerted even when replacing an existing notification
        options.renotify = true;
      }

      await self.registration.showNotification(data.title, options);
    })()
  );
});

// Handles clicking on a url within a notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    (async () => {
      const notificationData = event.notification.data;
      if (notificationData?.url) {
        await clients.openWindow(notificationData.url);
      }
    })()
  );
});
