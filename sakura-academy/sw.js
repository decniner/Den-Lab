const CACHE_NAME = 'sakura-academy-shell-v1.5.66';
const AUDIO_ASSETS = [
  './audio/speech/ja-001ba7ef732eea.mp3',
  './audio/speech/ja-014a9a7e0cf5fa.mp3',
  './audio/speech/ja-02c450915ff19e.mp3',
  './audio/speech/ja-0487f062bea2d2.mp3',
  './audio/speech/ja-04ca9ce92e0625.mp3',
  './audio/speech/ja-052140cfc0e37a.mp3',
  './audio/speech/ja-053c339595d1ee.mp3',
  './audio/speech/ja-054204e347e68c.mp3',
  './audio/speech/ja-05f43c1e3708c1.mp3',
  './audio/speech/ja-067d9aeac19a82.mp3',
  './audio/speech/ja-0840d347329632.mp3',
  './audio/speech/ja-09b9e17603a606.mp3',
  './audio/speech/ja-0cddc11e518c3e.mp3',
  './audio/speech/ja-0d013d916db9cd.mp3',
  './audio/speech/ja-0ed658c425fbe6.mp3',
  './audio/speech/ja-10d6d76c992e59.mp3',
  './audio/speech/ja-131fb267428c1d.mp3',
  './audio/speech/ja-13a8e55e4ae364.mp3',
  './audio/speech/ja-15cd15e67410b3.mp3',
  './audio/speech/ja-17b6b35ba87e6f.mp3',
  './audio/speech/ja-17cd5577c172db.mp3',
  './audio/speech/ja-18e5d77928cdf1.mp3',
  './audio/speech/ja-1965938da39251.mp3',
  './audio/speech/ja-1a593dff4eea79.mp3',
  './audio/speech/ja-1a7b00c2059a05.mp3',
  './audio/speech/ja-1b57d2427f26a0.mp3',
  './audio/speech/ja-1b5aa9c111a66b.mp3',
  './audio/speech/ja-1ba626dd871ec1.mp3',
  './audio/speech/ja-1c71bdc42d0299.mp3',
  './audio/speech/ja-1c9097066ff2c8.mp3',
  './audio/speech/ja-1dcf43170e9b97.mp3',
  './audio/speech/ja-1e5750e057d01e.mp3',
  './audio/speech/ja-1ec1c4f3824bdb.mp3',
  './audio/speech/ja-1ed1bd2cc6cee8.mp3',
  './audio/speech/ja-21cfb4bb319aef.mp3',
  './audio/speech/ja-255bad060dace3.mp3',
  './audio/speech/ja-25dc60ece4a0a4.mp3',
  './audio/speech/ja-26bd4be1a439bd.mp3',
  './audio/speech/ja-2765ddf5b2eca4.mp3',
  './audio/speech/ja-28c15f9d9825b1.mp3',
  './audio/speech/ja-2a1078a321da56.mp3',
  './audio/speech/ja-2c10828b222d07.mp3',
  './audio/speech/ja-2cc0af026c1155.mp3',
  './audio/speech/ja-2d0ad621424587.mp3',
  './audio/speech/ja-2dc203c5dea4eb.mp3',
  './audio/speech/ja-2eaabbed21188a.mp3',
  './audio/speech/ja-31e8b4c755284b.mp3',
  './audio/speech/ja-326ce4e9421b06.mp3',
  './audio/speech/ja-33bc5683006b15.mp3',
  './audio/speech/ja-33e4c84de1fc33.mp3',
  './audio/speech/ja-377c51458a0e01.mp3',
  './audio/speech/ja-3801f740df1c1e.mp3',
  './audio/speech/ja-3908e5fa4da19d.mp3',
  './audio/speech/ja-3ad8fd0a35f031.mp3',
  './audio/speech/ja-3affb05ae07a9d.mp3',
  './audio/speech/ja-3c3cca4f2ba0a3.mp3',
  './audio/speech/ja-3c66462f5c1b17.mp3',
  './audio/speech/ja-3fa19a8a47e72c.mp3',
  './audio/speech/ja-40ed6d01687128.mp3',
  './audio/speech/ja-440560ae1221f7.mp3',
  './audio/speech/ja-4590746f594ca6.mp3',
  './audio/speech/ja-476f2e636e995b.mp3',
  './audio/speech/ja-47c5e1a8b9f3dd.mp3',
  './audio/speech/ja-47f3cacd747919.mp3',
  './audio/speech/ja-47feeddf815558.mp3',
  './audio/speech/ja-482cdd55e925a1.mp3',
  './audio/speech/ja-492bfd8e12be96.mp3',
  './audio/speech/ja-4c75db79040494.mp3',
  './audio/speech/ja-50a4703f7ab83b.mp3',
  './audio/speech/ja-51cee2cebcf1f4.mp3',
  './audio/speech/ja-523f251cd6ac36.mp3',
  './audio/speech/ja-53f24f734e7083.mp3',
  './audio/speech/ja-54065d292cb7d3.mp3',
  './audio/speech/ja-54bb748bdbdd9a.mp3',
  './audio/speech/ja-55094920afddde.mp3',
  './audio/speech/ja-55a5b00745e50c.mp3',
  './audio/speech/ja-5a709f988cd4cf.mp3',
  './audio/speech/ja-5a72b623fa7841.mp3',
  './audio/speech/ja-5cb56f82f9fed1.mp3',
  './audio/speech/ja-5d91d63c5a36f9.mp3',
  './audio/speech/ja-5dc1da8700e5f9.mp3',
  './audio/speech/ja-5ef364e3cb2876.mp3',
  './audio/speech/ja-60b0a3a01c3847.mp3',
  './audio/speech/ja-658e03009fa8e5.mp3',
  './audio/speech/ja-67b781375e1396.mp3',
  './audio/speech/ja-699771dd8a0408.mp3',
  './audio/speech/ja-6d3ff00e99b9ce.mp3',
  './audio/speech/ja-6d4aba441a53cd.mp3',
  './audio/speech/ja-6df2608c199a6d.mp3',
  './audio/speech/ja-6ecb93a8793fc6.mp3',
  './audio/speech/ja-6fdd239788dafa.mp3',
  './audio/speech/ja-733d95ac9f1095.mp3',
  './audio/speech/ja-74c94725540aff.mp3',
  './audio/speech/ja-75442adf1e0516.mp3',
  './audio/speech/ja-778766f9a6e79d.mp3',
  './audio/speech/ja-7c7b1a92d9f530.mp3',
  './audio/speech/ja-7ea7d8d0c2d26f.mp3',
  './audio/speech/ja-835b713455dc3e.mp3',
  './audio/speech/ja-85b4389a503304.mp3',
  './audio/speech/ja-8859dabbc7fc6e.mp3',
  './audio/speech/ja-88a83c6a6e306f.mp3',
  './audio/speech/ja-89d3edb19de51d.mp3',
  './audio/speech/ja-8d2e0701a12fa8.mp3',
  './audio/speech/ja-8fe9d7e7d28afb.mp3',
  './audio/speech/ja-8ff461018ce77c.mp3',
  './audio/speech/ja-90cd87d0068296.mp3',
  './audio/speech/ja-93087282aa4ade.mp3',
  './audio/speech/ja-94fa622957a3ba.mp3',
  './audio/speech/ja-952d5d8d2bb0e9.mp3',
  './audio/speech/ja-95359c4a74c2e7.mp3',
  './audio/speech/ja-95ec5cbb2da567.mp3',
  './audio/speech/ja-96936900101f0c.mp3',
  './audio/speech/ja-9796531be5db50.mp3',
  './audio/speech/ja-986430368256f1.mp3',
  './audio/speech/ja-998ae89a18c715.mp3',
  './audio/speech/ja-99d34ea5ff0d00.mp3',
  './audio/speech/ja-9a8c9fecc96d80.mp3',
  './audio/speech/ja-9aeafca8f41aed.mp3',
  './audio/speech/ja-9b096c6742f50f.mp3',
  './audio/speech/ja-9c24c2054f85a8.mp3',
  './audio/speech/ja-9d2641bc636004.mp3',
  './audio/speech/ja-9d9483a9cfc126.mp3',
  './audio/speech/ja-9df5781e951c00.mp3',
  './audio/speech/ja-a1463b5c8f088c.mp3',
  './audio/speech/ja-a64a4494b8cce9.mp3',
  './audio/speech/ja-a792ac09a084ab.mp3',
  './audio/speech/ja-a85cedf4a68244.mp3',
  './audio/speech/ja-a9f28d1b15f5de.mp3',
  './audio/speech/ja-abae38e0107e2a.mp3',
  './audio/speech/ja-ac20f2e2080759.mp3',
  './audio/speech/ja-ac4ed17b7652a3.mp3',
  './audio/speech/ja-acbe1f69151385.mp3',
  './audio/speech/ja-aef87c54ff9029.mp3',
  './audio/speech/ja-af107252879926.mp3',
  './audio/speech/ja-af73ef335a8dfa.mp3',
  './audio/speech/ja-b2d30058e8c07d.mp3',
  './audio/speech/ja-b36588e1dd21d6.mp3',
  './audio/speech/ja-b3d8609d1d7edc.mp3',
  './audio/speech/ja-b3de9c302b3aa5.mp3',
  './audio/speech/ja-b62ea85e155a85.mp3',
  './audio/speech/ja-b7eed7c8688049.mp3',
  './audio/speech/ja-baab705135362c.mp3',
  './audio/speech/ja-bbff459f7292c3.mp3',
  './audio/speech/ja-bc56451ead1340.mp3',
  './audio/speech/ja-bd6762e19853a9.mp3',
  './audio/speech/ja-bd6894d6fece84.mp3',
  './audio/speech/ja-be2058e9742b17.mp3',
  './audio/speech/ja-bef958d9cb6d12.mp3',
  './audio/speech/ja-bff5123a3afdf9.mp3',
  './audio/speech/ja-c118cad201e3d7.mp3',
  './audio/speech/ja-c381c2c9c624c0.mp3',
  './audio/speech/ja-c3bd180d12834e.mp3',
  './audio/speech/ja-c3fc1fc547e500.mp3',
  './audio/speech/ja-c41917af7e10f7.mp3',
  './audio/speech/ja-c4abf942a38739.mp3',
  './audio/speech/ja-c56ab579456d6e.mp3',
  './audio/speech/ja-c70bc68a972a4d.mp3',
  './audio/speech/ja-c80b652d25d480.mp3',
  './audio/speech/ja-c8edcb1c3c69e6.mp3',
  './audio/speech/ja-c8f934e6fa6ed4.mp3',
  './audio/speech/ja-ca006344d4ddb7.mp3',
  './audio/speech/ja-cb00230a3834fa.mp3',
  './audio/speech/ja-cdb43b44ed4912.mp3',
  './audio/speech/ja-ce34f733565dd9.mp3',
  './audio/speech/ja-cef661206f8ded.mp3',
  './audio/speech/ja-d2815033823ea8.mp3',
  './audio/speech/ja-d4fc8012398a8f.mp3',
  './audio/speech/ja-d592c2cba434a0.mp3',
  './audio/speech/ja-d743c412f80521.mp3',
  './audio/speech/ja-d8d3e6f210e2a9.mp3',
  './audio/speech/ja-dacf3872be30e9.mp3',
  './audio/speech/ja-db24a048565283.mp3',
  './audio/speech/ja-dcb5ff87f34a00.mp3',
  './audio/speech/ja-dd063bab0dde73.mp3',
  './audio/speech/ja-dd5f5b34dfae3c.mp3',
  './audio/speech/ja-dd89d7b473f55d.mp3',
  './audio/speech/ja-dee6c8c2934471.mp3',
  './audio/speech/ja-df30c30e910f58.mp3',
  './audio/speech/ja-e0117b17a4897d.mp3',
  './audio/speech/ja-e01c9bf8c6baac.mp3',
  './audio/speech/ja-e034aceb9234ec.mp3',
  './audio/speech/ja-e1b4a4892fd7d2.mp3',
  './audio/speech/ja-e3610f8de2ae1d.mp3',
  './audio/speech/ja-e36e6556c91bd2.mp3',
  './audio/speech/ja-e3aa2d654d7526.mp3',
  './audio/speech/ja-e41391686efa1c.mp3',
  './audio/speech/ja-e453f76012688a.mp3',
  './audio/speech/ja-e79bee27152be8.mp3',
  './audio/speech/ja-e7e0dc60fabe6c.mp3',
  './audio/speech/ja-e88a824cb86488.mp3',
  './audio/speech/ja-e929ef325dd862.mp3',
  './audio/speech/ja-eac41c481ee786.mp3',
  './audio/speech/ja-ec6149df1f3e76.mp3',
  './audio/speech/ja-efbb67fbd2d4f5.mp3',
  './audio/speech/ja-efd4379e95c179.mp3',
  './audio/speech/ja-f0b5ecd06b9a3c.mp3',
  './audio/speech/ja-f14fc23c4aa532.mp3',
  './audio/speech/ja-f1b0e68b1f59f2.mp3',
  './audio/speech/ja-f1b45d02409660.mp3',
  './audio/speech/ja-f22e589664a745.mp3',
  './audio/speech/ja-f4a822bceaaa81.mp3',
  './audio/speech/ja-f5cfe0cf129386.mp3',
  './audio/speech/ja-f86e832361632b.mp3',
  './audio/speech/ja-f97a0301320258.mp3',
  './audio/speech/ja-fa7ce81a06fafe.mp3',
  './audio/speech/ja-fc0c0f24ce8d3c.mp3',
  './audio/speech/ja-fc9fd5f9fc1763.mp3',
  './audio/speech/ja-fdf2c44a8af699.mp3',
  './audio/speech/ja-fe21e23ab2fb0f.mp3',
  './audio/speech/ja-fe5ec8f4935f7f.mp3',
  './audio/speech/ja-ff1ae0fda41842.mp3',
];
const APP_SHELL = [
  './',
  './index.html',
  './favicon.svg',
  './styles.css?v=1.5.66',
  './issue-tracker.html',
  './PROGRESS.md',
  './DATA_SOURCES.md',
  './src/n5-data.js',
  './src/content.js',
  './src/n5-app.js',
  './src/content-validation.js',
  './src/lesson-progress.js?v=1.5.66',
  './src/audio-lessons.js?v=1.5.66',
  './src/reward-guard.js',
  './src/speech-audio-manifest.js?v=1.5.66',
  './src/app.js?v=1.5.66',
  ...AUDIO_ASSETS,
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith('sakura-academy-shell-') && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        const cachedPage = await caches.match(request, { ignoreSearch: true });
        if (cachedPage) return cachedPage;
        const appIndex = new URL('./index.html', self.registration.scope).href;
        return await caches.match(appIndex) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  })());
});
