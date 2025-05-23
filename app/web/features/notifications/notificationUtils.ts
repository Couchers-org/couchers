export const getCurrentSubscription = async () => {
  let registration = await navigator.serviceWorker.getRegistration();

  if (!registration) {
    registration = await navigator.serviceWorker.register(
      "/service-worker.js",
      {
        scope: "/",
      },
    );
  }

  return registration?.pushManager.getSubscription();
};

export const checkPushEnabled = async () => {
  if ("serviceWorker" in navigator && "PushManager" in window) {
    const existingPushSubscription = await getCurrentSubscription();
    return (
      Notification.permission === "granted" && existingPushSubscription !== null
    );
  } else {
    throw new Error("Push notifications or service workers not supported");
  }
};
