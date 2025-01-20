const getCurrentSubscription = async () => {
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

export { getCurrentSubscription };
