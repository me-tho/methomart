// MethoMart Service Worker — বেসিক অফলাইন সাপোর্টের জন্য
// ক্যাশ ভার্সন বদলালে (v2 -> v3) পুরনো ক্যাশ মুছে নতুন করে ফাইলগুলো সেভ হবে
const CACHE_NAME = 'methomart-cache-v3';
// ⚠️ APP_SHELL এ শুধু সেই ফাইলগুলোই রাখুন যেগুলো আসলেই আপনার হোস্টিং-এ আছে —
// cache.addAll() সব-অথবা-কিছুই নয় (all-or-nothing): তালিকায় একটা ফাইলও ৪০৪
// দিলে পুরো ইনস্টলই ব্যর্থ হয়ে যায়, আর তখন ব্রাউজার আগের পুরনো (আটকে থাকা)
// সার্ভিস ওয়ার্কারটাই চালু রাখে — যেটা পুরনো/ভাঙা ক্যাশড পেজ দেখাতে পারে।
// account.html ও reviews.html সাইটে নেই বলে আগে এখানে থাকায় প্রতিবার ইনস্টল
// ব্যর্থ হচ্ছিল — এখন শুধু বাস্তবে-থাকা ফাইলগুলোই রাখা হয়েছে।
const APP_SHELL = [
  './',
  './index.html',
  './login.html',
  './admin.html',
  './accounting.html',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch(err => console.error('SW precache failed:', err)) // এখন ব্যর্থ হলেও চুপচাপ পুরো সাইট আটকে থাকবে না
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;

  // Supabase API কল কখনো ক্যাশ করা হয় না — সবসময় সরাসরি নেটওয়ার্কে যাবে
  if (req.method !== 'GET' || req.url.indexOf('.supabase.co') !== -1) {
    return;
  }

  // পেজ নেভিগেশন — নেটওয়ার্ক আগে চেষ্টা করা হয়, ব্যর্থ হলে ক্যাশ থেকে দেখানো হয়
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  // অন্যান্য স্ট্যাটিক ফাইল (ছবি, আইকন) — আগে ক্যাশ, না থাকলে নেটওয়ার্ক থেকে এনে ক্যাশে রাখা
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
