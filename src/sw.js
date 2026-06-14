import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    clients.claim(),
    cleanupOutdatedCaches(),
  ]));
});

self.addEventListener('push', (event) => {
  const data = event.data?.json();
  const title = data?.title ?? 'Moirai';
  const options = {
    body: data?.body ?? '',
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: data?.data ?? {},
    tag: data?.tag ?? 'push-default',
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    }),
  );
});
