-- ========================================================================
-- 🔐 ŞÜPHELİ KİŞİ TESPİTİ & ÇAPRAZ EŞLEŞTİRME SİSTEMİ
-- Versiyon: 3.0 (Olasılık Puanlama Motoru Uyumlu)
-- Tarih: 2026-08-27
-- ========================================================================
-- Bu SQL dosyasını Supabase Dashboard > SQL Editor ekranında çalıştırın.
--
-- SİSTEM MİMARİSİ:
-- 1) facebook_suspect_logs  → Bülent Küçük Blogu ziyaretçileri (script.js yazar)
-- 2) cesme_holiday_leads    → Tatil Sepeti / WhatsApp ziyaretçileri (tatilsepeti/script.js yazar)
-- 3) Panel (panel.html)     → Her iki tabloyu okur, client-side olasılık motoru ile çapraz eşleştirir
--
-- ⚠️ DİKKAT: Bu script mevcut tabloları SİLER ve sıfırdan oluşturur!
-- ========================================================================

-- ========================================================================
-- 0) ESKİ TABLOLARI VE VIEW'LARI TEMİZLE
-- ========================================================================
DROP VIEW IF EXISTS matched_suspect_identities CASCADE;
DROP VIEW IF EXISTS suspect_cross_match_view CASCADE;
DROP TABLE IF EXISTS facebook_suspect_logs CASCADE;
DROP TABLE IF EXISTS cesme_holiday_leads CASCADE;
DROP TABLE IF EXISTS whatsapp_leads CASCADE;
DROP TABLE IF EXISTS facebook_leads CASCADE;
DROP TABLE IF EXISTS unified_suspect_tracker CASCADE;

-- ========================================================================
-- 1) TABLO: facebook_suspect_logs
--    Bülent Küçük Blogu'na Facebook üzerinden gelen ziyaretçiler
--    Blog script.js → DEFAULT_TABLE: 'facebook_suspect_logs'
-- ========================================================================
CREATE TABLE facebook_suspect_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 🔑 KİMLİK & İMZA (Çapraz Eşleştirmenin Temel Anahtarları)
    fingerprint_hash TEXT NOT NULL,          -- Donanımsal parmak izi (GPU+Canvas+Audio birleşik hash)
    device_signature TEXT,                   -- Zombie ID (LocalStorage/Cookie/IndexedDB kasası)
    target_id TEXT,                          -- Hedef şüpheli referansı (ör: suspect1)
    campaign_source TEXT DEFAULT 'facebook_fake',
    channel TEXT DEFAULT 'facebook',
    project_domain TEXT DEFAULT 'bulentkucuk-blog',
    
    -- 📍 COĞRAFİ KONUM & AĞ
    ip_address TEXT,
    city TEXT,
    region TEXT,
    country TEXT,
    latitude TEXT,
    longitude TEXT,
    location_type TEXT DEFAULT 'IP Geolocation',
    timezone TEXT,
    
    -- 💻 CİHAZ, TARAYICI & DONANIMSAL PARMAK İZİ
    device_type TEXT,                        -- Desktop / Mobile / Tablet
    os TEXT,                                 -- Windows / iOS / Android / macOS
    os_version TEXT,                         -- 10 / 18.1 / 14
    browser TEXT,                            -- Chrome / Safari / Edge
    browser_version TEXT,                    -- 128.0.6613.120
    browser_languages TEXT,                  -- tr,en-US,da
    browser_platform TEXT,                   -- Win32 / MacIntel / Linux armv81
    gpu_vendor TEXT,                         -- Google Inc. / Apple
    gpu_renderer TEXT,                       -- ANGLE (NVIDIA GeForce RTX 4070) / Apple M2
    screen_resolution TEXT,                  -- 1920x1080 / 390x844
    window_size TEXT,                        -- 1920x937 / 390x844
    color_depth TEXT,                        -- 24 / 30
    device_pixel_ratio TEXT,                 -- 1 / 2 / 3
    hardware_concurrency INTEGER,            -- CPU çekirdek sayısı (8, 10, 12...)
    device_memory TEXT,                      -- RAM GB (4, 8, 16...)
    battery_level INTEGER,                   -- Pil yüzdesi (0-100)
    battery_charging BOOLEAN,               -- Şarjda mı?
    network_type TEXT,                       -- 4g / wifi / ethernet
    network_downlink TEXT,                   -- İndirme hızı Mbps
    network_rtt TEXT,                        -- Ağ gecikmesi ms
    canvas_hash TEXT,                        -- 2D Canvas grafik motoru hash'i
    audio_hash TEXT,                         -- Web Audio frekans tepki hash'i
    touch_support TEXT,                      -- Dokunmatik ekran var mı?
    
    -- 📊 DAVRANIŞ & ETKİLEŞİM
    visitor_name TEXT,                       -- Ziyaretçi defterine yazdığı isim
    visitor_phone TEXT,                      -- Ziyaretçi defterine yazdığı telefon
    visitor_email TEXT,                      -- E-posta
    visitor_message TEXT,                    -- Bloga bıraktığı mesaj
    watched_videos JSONB DEFAULT '[]'::jsonb,
    last_watched_video TEXT,                 -- Son izlediği video
    video_watch_duration INTEGER DEFAULT 0,  -- Video izleme süresi (saniye)
    time_spent_seconds INTEGER DEFAULT 0,    -- Toplam sitede kalma süresi
    max_scroll_depth INTEGER DEFAULT 0,      -- Sayfayı ne kadar aşağı kaydırdı (%)
    clicked_elements JSONB DEFAULT '[]'::jsonb,
    is_submitted BOOLEAN DEFAULT FALSE,      -- Form gönderdi mi?
    user_agent TEXT,                         -- Ham tarayıcı bilgisi
    referrer TEXT,                           -- Nereden geldi?
    url_params JSONB DEFAULT '{}'::jsonb,    -- URL parametreleri
    
    -- ⏰ ZAMAN DAMGALARI
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================================
-- 2) TABLO: cesme_holiday_leads
--    Tatil Sepeti sayfasına WhatsApp linki ile gelen ziyaretçiler
--    Tatilsepeti script.js → DEFAULT_TABLE: 'cesme_holiday_leads'
-- ========================================================================
CREATE TABLE cesme_holiday_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 🔑 KİMLİK & İMZA (Çapraz Eşleştirmenin Temel Anahtarları)
    fingerprint_hash TEXT NOT NULL,          -- Donanımsal parmak izi (Blog ile BİREBİR AYNI algoritma)
    device_signature TEXT,                   -- Zombie ID (4 katmanlı kalıcı kasa)
    target_phone TEXT,                       -- WhatsApp'tan gelen hedef telefon numarası
    campaign_source TEXT DEFAULT 'direct',
    channel TEXT,
    project_domain TEXT DEFAULT 'alacati-cesme-promo',
    
    -- 👤 MÜŞTERİ BİLGİLERİ (Form Doldurursa)
    full_name TEXT,
    phone TEXT,
    email TEXT,
    user_entered_city TEXT,
    user_entered_country TEXT,
    selected_package TEXT,
    check_in_date TEXT,
    check_out_date TEXT,
    adult_count INTEGER DEFAULT 2,
    child_count INTEGER DEFAULT 0,
    special_requests TEXT,
    budget_range TEXT,
    
    -- 📍 COĞRAFİ KONUM & AĞ
    ip_address TEXT,
    city TEXT,
    region TEXT,
    country TEXT,
    latitude TEXT,
    longitude TEXT,
    location_type TEXT DEFAULT 'IP Geolocation',
    timezone TEXT,
    
    -- 💻 CİHAZ, TARAYICI & DONANIMSAL PARMAK İZİ
    device_type TEXT,
    os TEXT,
    os_version TEXT,
    browser TEXT,
    browser_version TEXT,
    browser_languages TEXT,
    browser_platform TEXT,
    gpu_vendor TEXT,
    gpu_renderer TEXT,
    screen_resolution TEXT,
    window_size TEXT,
    color_depth TEXT,
    device_pixel_ratio TEXT,
    hardware_concurrency INTEGER,
    device_memory TEXT,
    battery_level INTEGER,
    battery_charging BOOLEAN,
    connection_type TEXT,                     -- 4g / wifi
    network_type TEXT,                        -- Alternatif ağ tipi alanı
    network_downlink TEXT,
    network_rtt TEXT,
    canvas_hash TEXT,
    audio_hash TEXT,
    touch_support TEXT,
    is_touch_device BOOLEAN DEFAULT FALSE,
    cookies_enabled BOOLEAN DEFAULT TRUE,
    
    -- 📊 DAVRANIŞ & ETKİLEŞİM
    total_visits INTEGER DEFAULT 1,
    form_submitted BOOLEAN DEFAULT FALSE,
    time_spent_seconds INTEGER DEFAULT 0,
    max_scroll_percent INTEGER DEFAULT 0,
    max_scroll_depth INTEGER DEFAULT 0,
    clicked_elements JSONB DEFAULT '[]'::jsonb,
    form_interaction_count INTEGER DEFAULT 0,
    is_submitted BOOLEAN DEFAULT FALSE,
    user_agent TEXT,
    referrer TEXT,
    page_url TEXT,
    url_params JSONB DEFAULT '{}'::jsonb,
    raw_client_info JSONB DEFAULT '{}'::jsonb,
    
    -- ⏰ ZAMAN DAMGALARI
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================================
-- 3) HIZLI SORGULAMA İNDEKSLERİ
--    Çapraz eşleştirme performansı için kritik
-- ========================================================================

-- Facebook Suspect Logs İndeksleri
CREATE INDEX idx_fb_fingerprint ON facebook_suspect_logs(fingerprint_hash);
CREATE INDEX idx_fb_signature ON facebook_suspect_logs(device_signature);
CREATE INDEX idx_fb_gpu ON facebook_suspect_logs(gpu_renderer);
CREATE INDEX idx_fb_ip ON facebook_suspect_logs(ip_address);
CREATE INDEX idx_fb_created ON facebook_suspect_logs(created_at);

-- Cesme Holiday Leads İndeksleri
CREATE INDEX idx_leads_fingerprint ON cesme_holiday_leads(fingerprint_hash);
CREATE INDEX idx_leads_signature ON cesme_holiday_leads(device_signature);
CREATE INDEX idx_leads_target_phone ON cesme_holiday_leads(target_phone);
CREATE INDEX idx_leads_gpu ON cesme_holiday_leads(gpu_renderer);
CREATE INDEX idx_leads_ip ON cesme_holiday_leads(ip_address);
CREATE INDEX idx_leads_created ON cesme_holiday_leads(created_at);

-- ========================================================================
-- 4) RLS (ROW LEVEL SECURITY) POLİTİKALARI
--    Anonim kullanıcıların veri eklemesi, okuması ve güncellemesi için
-- ========================================================================
ALTER TABLE facebook_suspect_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cesme_holiday_leads ENABLE ROW LEVEL SECURITY;

-- facebook_suspect_logs politikaları
CREATE POLICY "anon_insert_fb" ON facebook_suspect_logs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select_fb" ON facebook_suspect_logs FOR SELECT TO anon USING (true);
CREATE POLICY "anon_update_fb" ON facebook_suspect_logs FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- cesme_holiday_leads politikaları
CREATE POLICY "anon_insert_leads" ON cesme_holiday_leads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select_leads" ON cesme_holiday_leads FOR SELECT TO anon USING (true);
CREATE POLICY "anon_update_leads" ON cesme_holiday_leads FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- ========================================================================
-- 5) KONTROL: Tablolar başarıyla oluşturuldu mu?
-- ========================================================================
SELECT 
    '✅ TABLOLAR BAŞARIYLA OLUŞTURULDU!' AS durum,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'facebook_suspect_logs') AS facebook_tablo,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'cesme_holiday_leads') AS cesme_tablo;
