self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data?.text() || '' };
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || 'Frutería Web', {
      body: payload.body || 'Tienes una actualización de tu pedido.',
      icon: '/hoja.svg',
      data: { url: payload.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const destination = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url === destination);
      return existing ? existing.focus() : self.clients.openWindow(destination);
    })
  );
});
