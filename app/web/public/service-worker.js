self.addEventListener("push", function (event) {
  const data = event.data.json();
  // console.log("NEW PUSH NOTIFICATION", data);
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
  });

  // // Send a message to the app
  // self.clients.matchAll().then((clients) => {
  //   clients.forEach((client) => {
  //     client.postMessage({
  //       title: data.title,
  //       body: data.body,
  //     });
  //   });
  // });
});
