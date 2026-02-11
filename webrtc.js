<!DOCTYPE html>
<html lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>اتصال فيديو WebRTC بسيط</title>
    <style>
        * {
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        body {
            direction: rtl;
            text-align: right;
            background-color: #f5f5f5;
            padding: 20px;
            margin: 0;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            padding: 25px;
        }
        
        h1 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
            text-align: center;
        }
        
        .controls {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
            border: 1px solid #ddd;
        }
        
        .video-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 25px;
        }
        
        .video-box {
            background: #2c3e50;
            border-radius: 8px;
            overflow: hidden;
            position: relative;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .video-box video {
            width: 100%;
            height: 300px;
            object-fit: cover;
            display: block;
        }
        
        .video-label {
            position: absolute;
            bottom: 10px;
            right: 10px;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .btn {
            padding: 12px 25px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            transition: all 0.3s ease;
            margin: 5px;
        }
        
        .btn-start {
            background: #27ae60;
            color: white;
        }
        
        .btn-start:hover {
            background: #219653;
        }
        
        .btn-call {
            background: #3498db;
            color: white;
        }
        
        .btn-call:hover {
            background: #2980b9;
        }
        
        .btn-end {
            background: #e74c3c;
            color: white;
        }
        
        .btn-end:hover {
            background: #c0392b;
        }
        
        .btn:disabled {
            background: #95a5a6;
            cursor: not-allowed;
        }
        
        .input-group {
            margin-bottom: 15px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            color: #2c3e50;
        }
        
        input[type="text"] {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 6px;
            font-size: 16px;
            transition: border 0.3s;
        }
        
        input[type="text"]:focus {
            border-color: #3498db;
            outline: none;
        }
        
        .instructions {
            background: #e8f4fc;
            border-right: 4px solid #3498db;
            padding: 15px;
            border-radius: 6px;
            margin-top: 25px;
        }
        
        .instructions h3 {
            color: #2c3e50;
            margin-top: 0;
        }
        
        .instructions ol {
            padding-right: 20px;
        }
        
        .status {
            padding: 15px;
            border-radius: 6px;
            margin-top: 20px;
            text-align: center;
            font-weight: bold;
        }
        
        .status.connected {
            background: #d5f4e6;
            color: #27ae60;
            border: 1px solid #27ae60;
        }
        
        .status.disconnected {
            background: #fadbd8;
            color: #e74c3c;
            border: 1px solid #e74c3c;
        }
        
        .status.waiting {
            background: #fef9e7;
            color: #f39c12;
            border: 1px solid #f39c12;
        }
        
        @media (max-width: 768px) {
            .video-container {
                grid-template-columns: 1fr;
            }
            
            .video-box video {
                height: 250px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>اتصال فيديو مباشر باستخدام WebRTC</h1>
        
        <div class="controls">
            <div class="input-group">
                <label for="yourId">معرفك (ID الخاص بك):</label>
                <input type="text" id="yourId" readonly>
                <button class="btn btn-start" id="startBtn">إنشاء معرف جديد</button>
            </div>
            
            <div class="input-group">
                <label for="otherId">معرف الشخص الآخر للاتصال به:</label>
                <input type="text" id="otherId" placeholder="أدخل معرف الشخص الآخر هنا">
            </div>
            
            <div style="text-align: center;">
                <button class="btn btn-call" id="callBtn" disabled>اتصال</button>
                <button class="btn btn-end" id="endBtn" disabled>إنهاء الاتصال</button>
            </div>
        </div>
        
        <div class="video-container">
            <div class="video-box">
                <video id="localVideo" autoplay muted playsinline></video>
                <div class="video-label">كاميرتك</div>
            </div>
            
            <div class="video-box">
                <video id="remoteVideo" autoplay playsinline></video>
                <div class="video-label">الشخص الآخر</div>
            </div>
        </div>
        
        <div id="status" class="status disconnected">غير متصل - قم بإنشاء معرف جديد لبدء الاتصال</div>
        
        <div class="instructions">
            <h3>كيفية الاستخدام:</h3>
            <ol>
                <li>انقر على زر "إنشاء معرف جديد" للحصول على معرف فريد</li>
                <li>شارك المعرف الخاص بك مع الشخص الذي تريد الاتصال به</li>
                <li>أدخل معرف الشخص الآخر في الحقل المخصص</li>
                <li>انقر على زر "اتصال" لبدء مكالمة الفيديو</li>
                <li>ستحتاج إلى السماح للمتصفح بالوصول إلى الكاميرا والميكروفون</li>
                <li>انقر على "إنهاء الاتصال" لإنهاء المكالمة</li>
            </ol>
            <p><strong>ملاحظة:</strong> هذا التطبيق يستخدم خدمة PeerJS السحابية المجانية للتواصل.</p>
        </div>
    </div>

    <!-- PeerJS library -->
    <script src="https://unpkg.com/peerjs@1.4.7/dist/peerjs.min.js"></script>
    
    <!-- Our JavaScript code -->
    <script>
        // استيراد كود JavaScript من ملف منفصل (موجود أدناه في هذا الملف)
    </script>
    <script>
        // ========== كود JavaScript ==========
        // المتغيرات العامة
        let peer = null;
        let localStream = null;
        let currentCall = null;

        // عناصر DOM
        const yourIdInput = document.getElementById('yourId');
        const otherIdInput = document.getElementById('otherId');
        const startBtn = document.getElementById('startBtn');
        const callBtn = document.getElementById('callBtn');
        const endBtn = document.getElementById('endBtn');
        const localVideo = document.getElementById('localVideo');
        const remoteVideo = document.getElementById('remoteVideo');
        const statusDiv = document.getElementById('status');

        // تحديث حالة الاتصال
        function updateStatus(text, type) {
            statusDiv.textContent = text;
            statusDiv.className = `status ${type}`;
        }

        // إنشاء معرف جديد
        startBtn.addEventListener('click', async () => {
            try {
                // الحصول على إذن الكاميرا والميكروفون
                localStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                
                // عرض الفيديو المحلي
                localVideo.srcObject = localStream;
                
                // إنشاء معرف عشوائي
                const randomId = `user_${Math.random().toString(36).substr(2, 9)}`;
                
                // إنشاء اتصال Peer جديد
                peer = new Peer(randomId, {
                    host: '0.peerjs.com',
                    port: 443,
                    path: '/',
                    secure: true,
                    debug: 3
                });
                
                // عند فتح الاتصال
                peer.on('open', (id) => {
                    yourIdInput.value = id;
                    updateStatus(`جاهز للاتصال - معرفك: ${id}`, 'waiting');
                    callBtn.disabled = false;
                    startBtn.disabled = true;
                });
                
                // عند استقبال اتصال
                peer.on('call', (call) => {
                    // الإجابة على المكالمة وإرسال الفيديو المحلي
                    call.answer(localStream);
                    
                    currentCall = call;
                    
                    // استقبال الفيديو من الطرف الآخر
                    call.on('stream', (remoteStream) => {
                        remoteVideo.srcObject = remoteStream;
                        updateStatus('متصل', 'connected');
                        endBtn.disabled = false;
                        callBtn.disabled = true;
                    });
                    
                    // عند إغلاق الاتصال
                    call.on('close', () => {
                        endCall();
                    });
                    
                    call.on('error', (err) => {
                        console.error('خطأ في الاتصال:', err);
                        updateStatus('خطأ في الاتصال', 'disconnected');
                    });
                });
                
                // عند حدوث خطأ
                peer.on('error', (err) => {
                    console.error('خطأ في Peer:', err);
                    updateStatus(`خطأ: ${err.type}`, 'disconnected');
                });
                
            } catch (error) {
                console.error('خطأ في الوصول إلى الوسائط:', error);
                updateStatus(`خطأ: ${error.message}`, 'disconnected');
                alert('خطأ في الوصول إلى الكاميرا أو الميكروفون. يرجى التحقق من الأذونات.');
            }
        });

        // بدء اتصال
        callBtn.addEventListener('click', () => {
            const otherId = otherIdInput.value.trim();
            
            if (!otherId) {
                alert('الرجاء إدخال معرف الشخص الآخر');
                return;
            }
            
            if (!peer) {
                alert('الرجاء إنشاء معرف أولاً');
                return;
            }
            
            if (!localStream) {
                alert('لا يتوفر فيديو محلي. الرجاء التحقق من الكاميرا');
                return;
            }
            
            // بدء الاتصال
            const call = peer.call(otherId, localStream);
            
            currentCall = call;
            
            // استقبال الفيديو من الطرف الآخر
            call.on('stream', (remoteStream) => {
                remoteVideo.srcObject = remoteStream;
                updateStatus('متصل', 'connected');
                endBtn.disabled = false;
                callBtn.disabled = true;
            });
            
            // عند إغلاق الاتصال
            call.on('close', () => {
                endCall();
            });
            
            call.on('error', (err) => {
                console.error('خطأ في الاتصال:', err);
                updateStatus('خطأ في الاتصال', 'disconnected');
            });
        });

        // إنهاء الاتصال
        endBtn.addEventListener('click', endCall);

        // دالة إنهاء الاتصال
        function endCall() {
            if (currentCall) {
                currentCall.close();
                currentCall = null;
            }
            
            if (remoteVideo.srcObject) {
                remoteVideo.srcObject.getTracks().forEach(track => track.stop());
                remoteVideo.srcObject = null;
            }
            
            updateStatus('تم إنهاء الاتصال', 'disconnected');
            endBtn.disabled = true;
            callBtn.disabled = false;
        }

        // تنظيف الموارد عند إغلاق الصفحة
        window.addEventListener('beforeunload', () => {
            endCall();
            
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            
            if (peer) {
                peer.destroy();
            }
        });

        // تمكين زر الاتصال عند كتابة معرف
        otherIdInput.addEventListener('input', () => {
            if (otherIdInput.value.trim() && !callBtn.disabled) {
                callBtn.disabled = false;
            }
        });

        // رسالة ترحيبية في وحدة التحكم
        console.log('🚀 تطبيق WebRTC جاهز للاستخدام!');
        console.log('📹 تم تطوير هذا التطبيق باستخدام PeerJS و WebRTC');
    </script>
</body>
</html>