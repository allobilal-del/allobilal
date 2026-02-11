// ========================================
// نظام الدردشة المتقدم مع دعم الرسائل الصوتية والصور
// ========================================

const ChatSystem = {
    currentChatRoom: null,
    messagesListener: null,
    mediaRecorder: null,
    audioChunks: [],
    currentUser: null,
    isRecording: false,
    recordingTimer: null,
    recordingDuration: 0,
    maxRecordingDuration: 60, // الحد الأقصى للتسجيل: 60 ثانية
    
    // تهيئة نظام الدردشة
    async initialize(orderId) {
        try {
            this.currentChatRoom = orderId;
            this.currentUser = firebase.auth().currentUser;
            
            if (!this.currentUser) {
                throw new Error('يجب تسجيل الدخول أولاً');
            }
            
            if (!orderId) {
                throw new Error('معرف الدردشة غير صالح');
            }
            
            // إيقاف أي مستمع سابق
            this.cleanup();
            
            // تهيئة مستمع للرسائل
            await this.setupMessageListener();
            
            // تحميل الرسائل السابقة
            await this.loadPreviousMessages();
            
            // التمرير للأسفل
            this.scrollToBottom();
            
            this.showNotification('تم تهيئة الدردشة بنجاح', 'success');
            return true;
            
        } catch (error) {
            console.error('خطأ في تهيئة الدردشة:', error);
            this.showNotification(error.message, 'error');
            return false;
        }
    },
    
    // تهيئة مستمع للرسائل
    async setupMessageListener() {
        if (!this.currentChatRoom) return;
        
        try {
            const db = firebase.firestore();
            const messagesRef = db.collection('orders').doc(this.currentChatRoom).collection('messages');
            
            this.messagesListener = messagesRef
                .orderBy('timestamp', 'asc')
                .onSnapshot(
                    (snapshot) => this.handleNewMessages(snapshot),
                    (error) => {
                        console.error('خطأ في استماع الرسائل:', error);
                        this.showNotification('فقد الاتصال بالدردشة', 'error');
                    }
                );
        } catch (error) {
            console.error('خطأ في إعداد مستمع الرسائل:', error);
            throw error;
        }
    },
    
    // معالجة الرسائل الجديدة
    handleNewMessages(snapshot) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;
        
        // حفظ حالة التمرير
        const wasAtBottom = this.isAtBottom();
        
        // معالجة كل تغيير
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const message = change.doc.data();
                this.addMessageToUI(message);
            }
        });
        
        // التمرير للأسفل إذا كان المستخدم في الأسفل
        if (wasAtBottom) {
            setTimeout(() => this.scrollToBottom(), 100);
        }
    },
    
    // تحميل الرسائل السابقة
    async loadPreviousMessages() {
        if (!this.currentChatRoom) return;
        
        try {
            const db = firebase.firestore();
            const messagesRef = db.collection('orders').doc(this.currentChatRoom).collection('messages');
            const query = messagesRef.orderBy('timestamp', 'asc').limit(50);
            const snapshot = await query.get();
            
            const messagesContainer = document.getElementById('chatMessages');
            if (!messagesContainer) return;
            
            messagesContainer.innerHTML = '';
            
            snapshot.forEach(doc => {
                const message = doc.data();
                this.addMessageToUI(message);
            });
            
        } catch (error) {
            console.error('خطأ في تحميل الرسائل السابقة:', error);
            this.showNotification('خطأ في تحميل الرسائل', 'error');
        }
    },
    
    // إضافة رسالة للواجهة
    addMessageToUI(message) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer || !this.currentUser) return;
        
        const isSent = message.senderId === this.currentUser.uid;
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isSent ? 'sent' : 'received'}`;
        
        let contentHTML = '';
        
        // نص الرسالة
        if (message.text) {
            contentHTML += `<div class="message-text">${this.escapeHtml(message.text)}</div>`;
        }
        
        // صورة
        if (message.imageUrl) {
            contentHTML += `
                <div class="message-image-container">
                    <img src="${message.imageUrl}" 
                         class="message-image" 
                         onclick="ChatSystem.previewImage('${message.imageUrl}')"
                         alt="صورة مرفقة"
                         loading="lazy">
                </div>
            `;
        }
        
        // رسالة صوتية
        if (message.audioUrl) {
            contentHTML += `
                <div class="message-audio-container">
                    <audio controls class="message-audio">
                        <source src="${message.audioUrl}" type="audio/mpeg">
                        متصفحك لا يدعم تشغيل الصوت
                    </audio>
                    <div class="audio-duration">
                        <i class="fas fa-headphones"></i>
                        <span>رسالة صوتية</span>
                    </div>
                </div>
            `;
        }
        
        // معلومات المرسل والوقت
        const time = message.timestamp?.toDate() ? 
            this.formatTime(message.timestamp.toDate()) : 
            'الآن';
        
        messageElement.innerHTML = `
            ${contentHTML}
            <div class="message-info">
                <span class="message-time">${time}</span>
                ${isSent ? '<span class="message-status"><i class="fas fa-check"></i></span>' : ''}
            </div>
        `;
        
        // إضافة الرسالة مع تأثير
        messagesContainer.appendChild(messageElement);
        messageElement.style.animation = 'fadeIn 0.3s ease-out';
    },
    
    // إرسال رسالة نصية
    async sendTextMessage(text) {
        if (!this.validateMessage(text, 'text')) return false;
        
        try {
            const db = firebase.firestore();
            const messagesRef = db.collection('orders').doc(this.currentChatRoom).collection('messages');
            
            await messagesRef.add({
                senderId: this.currentUser.uid,
                text: text.trim(),
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                type: 'text',
                status: 'sent'
            });
            
            return true;
        } catch (error) {
            console.error('خطأ في إرسال الرسالة:', error);
            this.showNotification('حدث خطأ في إرسال الرسالة', 'error');
            return false;
        }
    },
    
    // إرسال صورة
    async sendImage(file) {
        if (!this.validateFile(file, 'image')) return false;
        
        try {
            this.showNotification('جاري رفع الصورة...', 'info');
            
            // رفع الصورة
            const storageRef = firebase.storage().ref();
            const imageRef = storageRef.child(`chat/${this.currentChatRoom}/images/${Date.now()}_${file.name}`);
            const uploadTask = imageRef.put(file);
            
            // متابعة عملية الرفع
            const imageUrl = await new Promise((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    null,
                    reject,
                    async () => {
                        try {
                            const url = await imageRef.getDownloadURL();
                            resolve(url);
                        } catch (error) {
                            reject(error);
                        }
                    }
                );
            });
            
            // حفظ الرسالة في قاعدة البيانات
            const db = firebase.firestore();
            const messagesRef = db.collection('orders').doc(this.currentChatRoom).collection('messages');
            
            await messagesRef.add({
                senderId: this.currentUser.uid,
                imageUrl: imageUrl,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                type: 'image',
                status: 'sent'
            });
            
            this.showNotification('تم إرسال الصورة بنجاح', 'success');
            return true;
            
        } catch (error) {
            console.error('خطأ في إرسال الصورة:', error);
            this.showNotification('حدث خطأ في إرسال الصورة', 'error');
            return false;
        }
    },
    
    // بدء التسجيل الصوتي
    async startAudioRecording() {
        try {
            if (this.isRecording) {
                this.stopAudioRecording();
                return;
            }
            
            // التحقق من دعم التسجيل
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('المتصفح لا يدعم التسجيل الصوتي');
            }
            
            // طلب إذن الميكروفون
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });
            
            // تهيئة المسجل
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            this.isRecording = true;
            this.recordingDuration = 0;
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = async () => {
                stream.getTracks().forEach(track => track.stop());
                
                if (this.audioChunks.length > 0) {
                    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                    await this.sendAudioMessage(audioBlob);
                }
                
                this.cleanupRecording();
            };
            
            this.mediaRecorder.onerror = (error) => {
                console.error('خطأ في التسجيل:', error);
                this.showNotification('حدث خطأ أثناء التسجيل', 'error');
                this.cleanupRecording();
            };
            
            // بدء التسجيل
            this.mediaRecorder.start();
            this.updateRecordingUI(true);
            
            // بدء المؤقت
            this.recordingTimer = setInterval(() => {
                this.recordingDuration++;
                
                // تحديث واجهة المؤقت
                const timerElement = document.getElementById('recordingTimer');
                if (timerElement) {
                    timerElement.textContent = `${this.recordingDuration} ثانية`;
                }
                
                // التحقق من الحد الأقصى
                if (this.recordingDuration >= this.maxRecordingDuration) {
                    this.stopAudioRecording();
                    this.showNotification('تم الوصول إلى الحد الأقصى للتسجيل', 'warning');
                }
            }, 1000);
            
            this.showNotification('جارٍ التسجيل...', 'info');
            
        } catch (error) {
            console.error('خطأ في بدء التسجيل:', error);
            this.showNotification('لم يتمكن من الوصول إلى الميكروفون', 'error');
            this.cleanupRecording();
        }
    },
    
    // إيقاف التسجيل الصوتي
    stopAudioRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.updateRecordingUI(false);
            
            if (this.recordingTimer) {
                clearInterval(this.recordingTimer);
                this.recordingTimer = null;
            }
        }
    },
    
    // إرسال رسالة صوتية
    async sendAudioMessage(audioBlob) {
        try {
            this.showNotification('جاري معالجة الرسالة الصوتية...', 'info');
            
            // رفع الملف الصوتي
            const storageRef = firebase.storage().ref();
            const audioRef = storageRef.child(`chat/${this.currentChatRoom}/audio/${Date.now()}_recording.webm`);
            
            const uploadTask = audioRef.put(audioBlob, {
                contentType: 'audio/webm'
            });
            
            const audioUrl = await new Promise((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    null,
                    reject,
                    async () => {
                        try {
                            const url = await audioRef.getDownloadURL();
                            resolve(url);
                        } catch (error) {
                            reject(error);
                        }
                    }
                );
            });
            
            // حفظ الرسالة
            const db = firebase.firestore();
            const messagesRef = db.collection('orders').doc(this.currentChatRoom).collection('messages');
            
            await messagesRef.add({
                senderId: this.currentUser.uid,
                audioUrl: audioUrl,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                type: 'audio',
                duration: this.recordingDuration,
                status: 'sent'
            });
            
            this.showNotification('تم إرسال الرسالة الصوتية', 'success');
            return true;
            
        } catch (error) {
            console.error('خطأ في إرسال الرسالة الصوتية:', error);
            this.showNotification('حدث خطأ في إرسال الرسالة الصوتية', 'error');
            return false;
        }
    },
    
    // التحقق من صحة الرسالة
    validateMessage(content, type) {
        if (!this.currentChatRoom) {
            this.showNotification('لم يتم تحديد دردشة نشطة', 'error');
            return false;
        }
        
        if (!this.currentUser) {
            this.showNotification('يجب تسجيل الدخول أولاً', 'error');
            return false;
        }
        
        if (type === 'text' && (!content || content.trim().length === 0)) {
            this.showNotification('الرسالة لا يمكن أن تكون فارغة', 'error');
            return false;
        }
        
        if (type === 'text' && content.trim().length > 1000) {
            this.showNotification('الرسالة طويلة جداً (الحد الأقصى 1000 حرف)', 'error');
            return false;
        }
        
        return true;
    },
    
    // التحقق من صحة الملف
    validateFile(file, type) {
        if (!file) {
            this.showNotification('لم يتم اختيار ملف', 'error');
            return false;
        }
        
        // التحقق من حجم الملف
        const maxSize = type === 'image' ? 5 * 1024 * 1024 : 15 * 1024 * 1024; // 5MB للصور، 15MB للصوت
        if (file.size > maxSize) {
            this.showNotification(`حجم الملف كبير جداً (الحد الأقصى ${type === 'image' ? '5' : '15'} ميجابايت)`, 'error');
            return false;
        }
        
        // التحقق من نوع الملف
        if (type === 'image' && !file.type.startsWith('image/')) {
            this.showNotification('الملف يجب أن يكون صورة', 'error');
            return false;
        }
        
        if (type === 'audio' && !file.type.startsWith('audio/')) {
            this.showNotification('الملف يجب أن يكون ملفاً صوتياً', 'error');
            return false;
        }
        
        return true;
    },
    
    // تحديث واجهة التسجيل
    updateRecordingUI(isRecording) {
        const recordBtn = document.getElementById('recordBtn');
        const micIcon = document.getElementById('micIcon');
        const recordingIndicator = document.getElementById('recordingIndicator');
        
        if (!recordBtn || !micIcon) return;
        
        if (isRecording) {
            recordBtn.classList.add('recording');
            micIcon.className = 'fas fa-stop';
            if (recordingIndicator) recordingIndicator.style.display = 'flex';
        } else {
            recordBtn.classList.remove('recording');
            micIcon.className = 'fas fa-microphone';
            if (recordingIndicator) recordingIndicator.style.display = 'none';
        }
    },
    
    // تنظيف التسجيل
    cleanupRecording() {
        this.isRecording = false;
        this.audioChunks = [];
        this.mediaRecorder = null;
        this.recordingDuration = 0;
        
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
        
        this.updateRecordingUI(false);
    },
    
    // تنظيف الدردشة
    cleanup() {
        if (this.messagesListener) {
            this.messagesListener();
            this.messagesListener = null;
        }
        
        this.stopAudioRecording();
        this.currentChatRoom = null;
    },
    
    // معاينة الصورة
    previewImage(url) {
        // يمكن تطوير هذه الوظيفة لعرض الصورة في مودال
        window.open(url, '_blank');
    },
    
    // التمرير للأسفل
    scrollToBottom() {
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            messagesContainer.scrollTo({
                top: messagesContainer.scrollHeight,
                behavior: 'smooth'
            });
        }
    },
    
    // التحقق إذا كان المستخدم في أسفل الصفحة
    isAtBottom() {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return true;
        
        const threshold = 100;
        const position = messagesContainer.scrollTop + messagesContainer.clientHeight;
        const height = messagesContainer.scrollHeight;
        
        return height - position <= threshold;
    },
    
    // تنسيق الوقت
    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'الآن'; // أقل من دقيقة
        if (diff < 3600000) return `${Math.floor(diff / 60000)} دقيقة`; // أقل من ساعة
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} ساعة`; // أقل من يوم
        
        return date.toLocaleTimeString('ar-MA', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // تجنب هجمات XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    // عرض الإشعار
    showNotification(message, type = 'info') {
        // يمكن دمج هذا مع نظام الإشعارات الخاص بالتطبيق
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // تنفيذ بسيط للإشعارات
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 
                               type === 'success' ? 'check-circle' : 
                               type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // إظهار الإشعار
        setTimeout(() => notification.classList.add('show'), 10);
        
        // إخفاء الإشعار تلقائياً
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
};

// تصدير الكائن للاستخدام
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatSystem;
} else {
    window.ChatSystem = ChatSystem;
}

// أنماط CSS المطلوبة
const chatStyles = `
<style>
.message {
    max-width: 70%;
    padding: 12px 16px;
    border-radius: 18px;
    margin-bottom: 8px;
    animation: fadeIn 0.3s ease-out;
}

.message.sent {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: white;
    margin-left: auto;
    margin-right: 0;
    border-bottom-right-radius: 4px;
}

.message.received {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    margin-right: auto;
    margin-left: 0;
    border-bottom-left-radius: 4px;
}

.message-text {
    word-break: break-word;
    line-height: 1.4;
}

.message-image-container {
    margin-top: 8px;
}

.message-image {
    max-width: 250px;
    border-radius: 12px;
    cursor: pointer;
    transition: transform 0.3s;
}

.message-image:hover {
    transform: scale(1.02);
}

.message-audio-container {
    margin-top: 8px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    padding: 12px;
}

.message-audio {
    width: 100%;
    border-radius: 8px;
}

.audio-duration {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
}

.message-info {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
    font-size: 12px;
    opacity: 0.8;
}

.message-status {
    font-size: 10px;
}

.recording {
    background: #ef4444 !important;
    animation: pulse 1.5s infinite;
}

#recordingIndicator {
    display: none;
    align-items: center;
    gap: 8px;
    background: rgba(239, 68, 68, 0.1);
    padding: 8px 16px;
    border-radius: 20px;
    color: #ef4444;
    font-weight: 600;
}

.recording-dot {
    width: 8px;
    height: 8px;
    background: #ef4444;
    border-radius: 50%;
    animation: blink 1s infinite;
}

.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    color: #1e293b;
    padding: 12px 20px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 10000;
    transform: translateX(150%);
    transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    max-width: 350px;
}

.notification.show {
    transform: translateX(0);
}

.notification-error {
    background: #ef4444;
    color: white;
}

.notification-success {
    background: #16a34a;
    color: white;
}

.notification-warning {
    background: #f59e0b;
    color: white;
}

.notification-info {
    background: #0ea5e9;
    color: white;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes pulse {
    0%, 100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.1);
    }
}

@keyframes blink {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}
</style>
`;

// إضافة الأنماط تلقائياً
document.head.insertAdjacentHTML('beforeend', chatStyles);

console.log('✅ نظام الدردشة تم تحميله بنجاح');