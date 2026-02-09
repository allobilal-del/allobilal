// Service Worker لتطبيق ALLO BILAL

const CACHE_NAME = 'allobilal-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/login.html',
  '/register-customer.html',
  '/register-driver.html',
  '/customer-dashboard.html',
  '/driver-dashboard.html',
  '/tracking.html',
  '/chat.html',
  '/audio-call.html',
  '/video-call.html',
  '/admin.html'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('تم تخزين الملفات في الذاكرة المؤقتة');
        return cache.addAll(urlsToCache);
      })
  );
  
  // تفعيل Service Worker فوراً
  self.skipWaiting();
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('حذف الذاكرة المؤقتة القديمة:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // السماح للـ Service Worker بالتحكم في الصفحة فوراً
  self.clients.claim();
});
// اعتراض الطلبات
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // إرجاع النسخة المخبأة إذا وجدت
        if (response) {
          return response;
        }
        
        // وإلا جلب من الشبكة
        return fetch(event.request).then(
          response => {
            // تأكد من أن الاستجابة صحيحة
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // إنشاء نسخة من الاستجابة للتخزين
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          }
        );
      })
  );
});

// معالجة الإشعارات
self.addEventListener('push', event => {
  console.log('تم استلام إشعار Push');
  
  const data = event.data ? event.data.json() : {};
  
  const title = data.title || 'ALLO BILAL';
  const options = {
    body: data.body || 'لديك طلب جديد!',
    icon: '/assets/images/logo.png',
    badge: '/assets/images/badge.png',
    vibrate: [100, 50, 100],
     {
      url: data.url || '/'
    },
    actions: [      { action: 'view', title: 'عرض الطلب' },
      { action: 'close', title: 'إغلاق' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// النقر على الإشعار
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});