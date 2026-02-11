// ========================================
// نظام إدارة الخرائط المتقدم باستخدام OpenStreetMap
// مجاني 100% - لا يحتاج إلى مفتاح API
// ========================================

class MapManager {
    constructor() {
        this.map = null;
        this.userMarker = null;
        this.driverMarkers = new Map();
        this.route = null;
        this.geolocationWatchId = null;
        this.initialized = false;
        this.options = {
            defaultCenter: [33.5731, -7.5898], // الدار البيضاء، المغرب
            defaultZoom: 13,
            minZoom: 3,
            maxZoom: 19,
            enableUserTracking: true,
            maxDriverMarkers: 20
        };
        
        this.init();
    }
    
    // تهيئة النظام
    init() {
        try {
            // التحقق من وجود مكتبة Leaflet
            if (typeof L === 'undefined') {
                this.showError('خطأ: لم يتم تحميل مكتبة الخرائط');
                return;
            }
            
            // إضافة أنماط الخريطة
            this.addMapStyles();
            
            // إعداد معالجة الأخطاء
            this.setupErrorHandling();
            
            console.log('✅ Map Manager initialized');
            this.initialized = true;
            
        } catch (error) {
            console.error('❌ Map Manager initialization error:', error);
            this.showError('خطأ في تهيئة نظام الخرائط');
        }
    }
    
    // إضافة أنماط الخريطة
    addMapStyles() {
        const styles = `
        <style>
        .map-container {
            width: 100%;
            height: 100%;
            border-radius: 12px;
            overflow: hidden;
            position: relative;
        }
        
        .leaflet-container {
            font-family: 'Cairo', sans-serif;
            direction: rtl;
        }
        
        .custom-marker {
            background: transparent;
            border: none;
        }
        
        .user-marker {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #ffd700 0%, #f59e0b 100%);
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 15px rgba(255, 215, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            animation: pulse 2s infinite;
        }
        
        .user-marker::after {
            content: '';
            width: 10px;
            height: 10px;
            background: white;
            border-radius: 50%;
        }
        
        .driver-marker {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 15px rgba(37, 99, 235, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .driver-marker::after {
            content: '';
            width: 10px;
            height: 10px;
            background: white;
            border-radius: 50%;
        }
        
        .destination-marker {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 15px rgba(22, 163, 74, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .destination-marker::after {
            content: '🎯';
            font-size: 16px;
            color: white;
        }
        
        .route-line {
            stroke-dasharray: 10, 10;
            animation: dash 1s linear infinite;
        }
        
        .map-controls {
            position: absolute;
            top: 15px;
            right: 15px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .map-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: white;
            border: none;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 18px;
            color: #1e293b;
            transition: all 0.3s;
        }
        
        .map-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }
        
        .map-btn.active {
            background: #2563eb;
            color: white;
        }
        
        .location-info {
            position: absolute;
            bottom: 15px;
            right: 15px;
            background: rgba(255, 255, 255, 0.95);
            padding: 12px 16px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            max-width: 300px;
            font-size: 14px;
            z-index: 1000;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        @keyframes dash {
            to { stroke-dashoffset: -20; }
        }
        
        @media (max-width: 768px) {
            .map-controls {
                top: 10px;
                right: 10px;
            }
            
            .map-btn {
                width: 35px;
                height: 35px;
                font-size: 16px;
            }
            
            .location-info {
                bottom: 10px;
                right: 10px;
                left: 10px;
                max-width: none;
            }
        }
        </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
    
    // إنشاء خريطة جديدة
    createMap(elementId, options = {}) {
        try {
            // دمج الخيارات
            const mapOptions = { ...this.options, ...options };
            
            // إنشاء الحاوية إذا لم تكن موجودة
            let container = document.getElementById(elementId);
            if (!container) {
                container = document.createElement('div');
                container.id = elementId;
                container.className = 'map-container';
                document.body.appendChild(container);
            }
            
            // إنشاء الخريطة
            this.map = L.map(elementId, {
                center: mapOptions.defaultCenter,
                zoom: mapOptions.defaultZoom,
                minZoom: mapOptions.minZoom,
                maxZoom: mapOptions.maxZoom,
                zoomControl: false // سنضيف عناصر تحكم مخصصة
            });
            
            // إضافة خريطة OpenStreetMap
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: mapOptions.maxZoom
            }).addTo(this.map);
            
            // إضافة عناصر التحكم
            this.addMapControls();
            
            // تتبع موقع المستخدم إذا كان مفعلاً
            if (mapOptions.enableUserTracking) {
                this.startUserTracking();
            }
            
            // إضافة وضع الشاشة الكاملة
            this.addFullscreenControl();
            
            console.log(`✅ Map created: ${elementId}`);
            return this.map;
            
        } catch (error) {
            console.error('❌ Map creation error:', error);
            this.showError('خطأ في إنشاء الخريطة');
            return null;
        }
    }
    
    // إضافة عناصر تحكم للخريطة
    addMapControls() {
        if (!this.map) return;
        
        const controls = document.createElement('div');
        controls.className = 'map-controls';
        
        // زر التكبير
        const zoomInBtn = this.createControlButton('fas fa-plus', 'تكبير', () => {
            this.map.zoomIn();
        });
        
        // زر التصغير
        const zoomOutBtn = this.createControlButton('fas fa-minus', 'تصغير', () => {
            this.map.zoomOut();
        });
        
        // زر تحديد الموقع
        const locationBtn = this.createControlButton('fas fa-location-arrow', 'تحديد موقعي', () => {
            this.centerOnUser();
        });
        
        // زر إعادة الضبط
        const resetBtn = this.createControlButton('fas fa-redo', 'إعادة ضبط', () => {
            this.resetView();
        });
        
        controls.appendChild(zoomInBtn);
        controls.appendChild(zoomOutBtn);
        controls.appendChild(locationBtn);
        controls.appendChild(resetBtn);
        
        this.map.getContainer().appendChild(controls);
    }
    
    // إنشاء زر تحكم
    createControlButton(iconClass, title, onClick) {
        const btn = document.createElement('button');
        btn.className = 'map-btn';
        btn.title = title;
        btn.innerHTML = `<i class="${iconClass}"></i>`;
        btn.addEventListener('click', onClick);
        return btn;
    }
    
    // بدء تتبع موقع المستخدم
    startUserTracking() {
        if (!this.map) return;
        
        if (!navigator.geolocation) {
            this.showNotification('المتصفح لا يدعم تحديد الموقع', 'warning');
            return;
        }
        
        try {
            // الحصول على الموقع الحالي
            navigator.geolocation.getCurrentPosition(
                (position) => this.handleLocationSuccess(position),
                (error) => this.handleLocationError(error),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
            
            // بدء تتابع الموقع
            this.geolocationWatchId = navigator.geolocation.watchPosition(
                (position) => this.handleLocationSuccess(position, true),
                (error) => this.handleLocationError(error),
                { enableHighAccuracy: true, maximumAge: 30000 }
            );
            
        } catch (error) {
            console.error('❌ Geolocation error:', error);
            this.showNotification('خطأ في تحديد الموقع', 'error');
        }
    }
    
    // معالجة نجاح الحصول على الموقع
    handleLocationSuccess(position, isUpdate = false) {
        if (!this.map) return;
        
        const coords = [position.coords.latitude, position.coords.longitude];
        
        if (this.userMarker) {
            // تحديث العلامة الحالية
            this.userMarker.setLatLng(coords);
            
            if (!isUpdate) {
                this.map.setView(coords, 15);
            }
        } else {
            // إنشاء علامة جديدة
            this.userMarker = L.marker(coords, {
                icon: L.divIcon({
                    className: 'custom-marker',
                    html: '<div class="user-marker"></div>',
                    iconSize: [40, 40],
                    iconAnchor: [20, 20]
                })
            }).addTo(this.map);
            
            this.userMarker.bindPopup('موقعك الحالي').openPopup();
            this.map.setView(coords, 15);
        }
        
        // عرض معلومات الموقع
        this.showLocationInfo(coords, position.coords.accuracy);
    }
    
    // معالجة خطأ الحصول على الموقع
    handleLocationError(error) {
        console.warn('📍 Geolocation error:', error);
        
        const messages = {
            1: 'تم رفض طلب تحديد الموقع',
            2: 'تعذر تحديد الموقع',
            3: 'انتهى وقت الانتظار'
        };
        
        this.showNotification(messages[error.code] || 'خطأ في تحديد الموقع', 'warning');
    }
    
    // إضافة سائق
    addDriver(driverId, coords, name = 'سائق', info = {}) {
        if (!this.map || !coords) return null;
        
        // إزالة السائق القديم إذا كان موجوداً
        if (this.driverMarkers.has(driverId)) {
            this.removeDriver(driverId);
        }
        
        // إنشاء علامة السائق
        const marker = L.marker(coords, {
            icon: L.divIcon({
                className: 'custom-marker',
                html: '<div class="driver-marker"></div>',
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            })
        }).addTo(this.map);
        
        // إنشاء محتوى البوب أب
        const popupContent = `
            <div style="text-align: right; font-family: 'Cairo', sans-serif;">
                <h4 style="margin: 0 0 10px 0; color: #2563eb;">${name}</h4>
                ${info.vehicle ? `<p style="margin: 5px 0;"><strong>المركبة:</strong> ${info.vehicle}</p>` : ''}
                ${info.plate ? `<p style="margin: 5px 0;"><strong>رقم اللوحة:</strong> ${info.plate}</p>` : ''}
                ${info.rating ? `<p style="margin: 5px 0;"><strong>التقييم:</strong> ${'⭐'.repeat(Math.min(5, Math.floor(info.rating)))}</p>` : ''}
                <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">${new Date().toLocaleTimeString('ar-MA')}</p>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        
        // حفظ المرجع
        this.driverMarkers.set(driverId, {
            marker,
            name,
            info,
            lastUpdate: Date.now()
        });
        
        // تنظيف العلامات القديمة
        this.cleanupOldMarkers();
        
        console.log(`✅ Driver added: ${driverId}`);
        return marker;
    }
    
    // تحديث موقع السائق
    updateDriver(driverId, coords) {
        if (!this.map || !this.driverMarkers.has(driverId)) return false;
        
        const driver = this.driverMarkers.get(driverId);
        driver.marker.setLatLng(coords);
        driver.lastUpdate = Date.now();
        
        return true;
    }
    
    // إزالة سائق
    removeDriver(driverId) {
        if (!this.driverMarkers.has(driverId)) return;
        
        const driver = this.driverMarkers.get(driverId);
        this.map.removeLayer(driver.marker);
        this.driverMarkers.delete(driverId);
    }
    
    // إضافة وجهة
    addDestination(coords, title = 'الوجهة') {
        if (!this.map || !coords) return null;
        
        const marker = L.marker(coords, {
            icon: L.divIcon({
                className: 'custom-marker',
                html: '<div class="destination-marker"></div>',
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            })
        }).addTo(this.map);
        
        marker.bindPopup(title).openPopup();
        
        return marker;
    }
    
    // رسم مسار
    drawRoute(startCoords, endCoords, options = {}) {
        if (!this.map || !startCoords || !endCoords) return null;
        
        // إزالة المسار القديم
        this.clearRoute();
        
        // خيارات الخط
        const lineOptions = {
            color: options.color || '#2563eb',
            weight: options.weight || 5,
            opacity: options.opacity || 0.8,
            dashArray: options.dashArray || '10, 10',
            className: 'route-line'
        };
        
        // رسم الخط
        this.route = L.polyline([startCoords, endCoords], lineOptions).addTo(this.map);
        
        // تكبير الخريطة لرؤية المسار
        const bounds = L.latLngBounds([startCoords, endCoords]);
        this.map.fitBounds(bounds, { padding: [100, 100] });
        
        // إضافة علامات النقاط
        if (options.addMarkers !== false) {
            L.marker(startCoords, {
                icon: L.divIcon({
                    html: '<div style="background: #16a34a; color: white; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">بداية</div>',
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                })
            }).addTo(this.map);
            
            L.marker(endCoords, {
                icon: L.divIcon({
                    html: '<div style="background: #ef4444; color: white; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">نهاية</div>',
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                })
            }).addTo(this.map);
        }
        
        return this.route;
    }
    
    // مسح المسار
    clearRoute() {
        if (this.route) {
            this.map.removeLayer(this.route);
            this.route = null;
        }
    }
    
    // الحصول على إحداثيات من عنوان
    async geocodeAddress(address) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&accept-language=ar`,
                {
                    headers: {
                        'User-Agent': 'ALLO-BILAL-App/1.0',
                        'Accept-Language': 'ar'
                    }
                }
            );
            
            const data = await response.json();
            
            if (data && data.length > 0) {
                return {
                    coords: [parseFloat(data[0].lat), parseFloat(data[0].lon)],
                    address: data[0].display_name,
                    details: data[0]
                };
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Geocoding error:', error);
            return null;
        }
    }
    
    // الحصول على عنوان من إحداثيات
    async reverseGeocode(coords) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}&zoom=18&accept-language=ar`,
                {
                    headers: {
                        'User-Agent': 'ALLO-BILAL-App/1.0',
                        'Accept-Language': 'ar'
                    }
                }
            );
            
            const data = await response.json();
            
            if (data && data.display_name) {
                return {
                    address: data.display_name,
                    details: data.address,
                    fullData: data
                };
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Reverse geocoding error:', error);
            return null;
        }
    }
    
    // التنقل إلى موقع
    navigateTo(coords, zoom = 15) {
        if (!this.map || !coords) return;
        
        this.map.flyTo(coords, zoom, {
            duration: 1, // مدة التحليق بالثواني
            easeLinearity: 0.25
        });
    }
    
    // التمركز على المستخدم
    centerOnUser() {
        if (!this.map || !this.userMarker) {
            this.showNotification('لم يتم تحديد موقعك بعد', 'warning');
            return;
        }
        
        const coords = this.userMarker.getLatLng();
        this.map.flyTo(coords, 15);
    }
    
    // إعادة ضبط العرض
    resetView() {
        if (!this.map) return;
        
        this.map.setView(this.options.defaultCenter, this.options.defaultZoom);
        this.clearRoute();
    }
    
    // إضافة وضع الشاشة الكاملة
    addFullscreenControl() {
        if (!this.map) return;
        
        const fullscreenBtn = this.createControlButton('fas fa-expand', 'شاشة كاملة', () => {
            const container = this.map.getContainer();
            
            if (!document.fullscreenElement) {
                container.requestFullscreen?.();
            } else {
                document.exitFullscreen?.();
            }
        });
        
        fullscreenBtn.id = 'fullscreen-btn';
        this.map.getContainer().querySelector('.map-controls').appendChild(fullscreenBtn);
        
        // تحديث الأيقونة عند تغيير وضع الشاشة
        document.addEventListener('fullscreenchange', () => {
            const icon = fullscreenBtn.querySelector('i');
            if (document.fullscreenElement) {
                icon.className = 'fas fa-compress';
                fullscreenBtn.title = 'خروج من الشاشة الكاملة';
            } else {
                icon.className = 'fas fa-expand';
                fullscreenBtn.title = 'شاشة كاملة';
            }
        });
    }
    
    // عرض معلومات الموقع
    showLocationInfo(coords, accuracy) {
        if (!this.map) return;
        
        let infoDiv = this.map.getContainer().querySelector('.location-info');
        
        if (!infoDiv) {
            infoDiv = document.createElement('div');
            infoDiv.className = 'location-info';
            this.map.getContainer().appendChild(infoDiv);
        }
        
        // الحصول على العنوان
        this.reverseGeocode(coords).then(result => {
            const accuracyText = accuracy ? ` ±${Math.round(accuracy)}m` : '';
            const address = result?.address || 'جارٍ تحديد العنوان...';
            
            infoDiv.innerHTML = `
                <div style="text-align: right;">
                    <h4 style="margin: 0 0 8px 0; color: #2563eb;">موقعك الحالي</h4>
                    <p style="margin: 0 0 5px 0; color: #475569;">${address}</p>
                    <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                        📍 ${coords[0].toFixed(6)}, ${coords[1].toFixed(6)} ${accuracyText}
                    </p>
                </div>
            `;
        });
    }
    
    // تنظيف العلامات القديمة
    cleanupOldMarkers() {
        if (this.driverMarkers.size <= this.options.maxDriverMarkers) return;
        
        const now = Date.now();
        const maxAge = 30 * 60 * 1000; // 30 دقيقة
        
        for (const [driverId, driver] of this.driverMarkers.entries()) {
            if (now - driver.lastUpdate > maxAge) {
                this.removeDriver(driverId);
            }
        }
    }
    
    // إعداد معالجة الأخطاء
    setupErrorHandling() {
        window.addEventListener('unhandledrejection', (event) => {
            if (event.reason.message.includes('map') || event.reason.message.includes('leaflet')) {
                console.error('Map promise rejection:', event.reason);
                this.showNotification('حدث خطأ في نظام الخرائط', 'error');
            }
        });
    }
    
    // عرض الإشعارات
    showNotification(message, type = 'info') {
        // استخدام Firebase Manager إذا كان متاحاً
        if (window.FirebaseManager) {
            window.FirebaseManager.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
    
    // عرض خطأ
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    // تدمير الخريطة
    destroy() {
        // إيقاف تتبع الموقع
        if (this.geolocationWatchId !== null) {
            navigator.geolocation.clearWatch(this.geolocationWatchId);
            this.geolocationWatchId = null;
        }
        
        // إزالة جميع العلامات
        if (this.userMarker) {
            this.map?.removeLayer(this.userMarker);
            this.userMarker = null;
        }
        
        this.driverMarkers.clear();
        
        // إزالة الخريطة
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        
        this.initialized = false;
        console.log('🗺️ Map destroyed');
    }
}

// إنشاء نسخة وحيدة من المدير
window.MapManager = new MapManager();
console.log('✅ Map Manager loaded successfully');