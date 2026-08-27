-- ========================================================================
-- 💬 SADECE WHATSAPP TIKLAMA & SÜRE LOGLARI TABLOSU (Mevcut Tabloları Bozmaz)
-- Versiyon: 1.0
-- Tarih: 2026-08-27
-- ========================================================================
-- Bu SQL kodunu Supabase Dashboard > SQL Editor ekranına yapıştırıp 
-- RUN butonuna basarak sadece bu yeni log tablosunu oluşturabilirsiniz.
-- ========================================================================

-- 1) TABLO: whatsapp_click_logs
CREATE TABLE IF NOT EXISTS public.whatsapp_click_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 🔑 Şüpheli Eşleştirme Kimlikleri
    fingerprint_hash TEXT NOT NULL,          -- Cihazın donanım parmak izi hash'i
    device_signature TEXT,                   -- Zombie ID (Tarayıcı kasası)
    target_id TEXT,                          -- Hedef şüpheli referansı (ör: suspect1)
    
    -- ⏱️ ZAMAN & SÜRE DİLİMİ LOGLARI (EN KRİTİK ALANLAR)
    button_source TEXT,                      -- Tıklanan buton: 'header_action_bar', 'community_banner', 'video_modal', 'guestbook'
    time_to_click_seconds INTEGER,           -- Sayfaya girdikten KAÇ SANİYE SONRA WhatsApp'a bastı? (Örn: 14)
    session_duration_seconds INTEGER,        -- Toplam sitede kalma süresi
    last_watched_video TEXT,                 -- WhatsApp'a basmadan önce izlediği video
    
    -- 📍 Konum Bilgileri
    ip_address TEXT,
    city TEXT,
    region TEXT,
    country TEXT,
    latitude TEXT,
    longitude TEXT,
    
    -- 💻 Cihaz Özeti
    device_type TEXT,                        -- Mobile / Desktop / Tablet
    os TEXT,                                 -- iOS / Android / Windows / macOS
    browser TEXT,                            -- Chrome / Safari / Edge
    gpu_renderer TEXT,                       -- Ekran kartı
    referrer TEXT,                           -- Geldiği kaynak (Facebook / Direct)
    user_agent TEXT,                         -- Tarayıcı User Agent
    
    -- ⏰ Zaman Damgası
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) RLS (ROW LEVEL SECURITY) POLİTİKALARI (Anonim Yazma/Okuma İzinleri)
ALTER TABLE public.whatsapp_click_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_wa_logs" ON public.whatsapp_click_logs;
CREATE POLICY "anon_insert_wa_logs" ON public.whatsapp_click_logs FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_wa_logs" ON public.whatsapp_click_logs;
CREATE POLICY "anon_select_wa_logs" ON public.whatsapp_click_logs FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_update_wa_logs" ON public.whatsapp_click_logs;
CREATE POLICY "anon_update_wa_logs" ON public.whatsapp_click_logs FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- 3) HIZLI SORGULAMA İNDEKSLERİ
CREATE INDEX IF NOT EXISTS idx_wa_log_fingerprint ON public.whatsapp_click_logs(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_wa_log_signature ON public.whatsapp_click_logs(device_signature);
CREATE INDEX IF NOT EXISTS idx_wa_log_ip ON public.whatsapp_click_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_wa_log_created ON public.whatsapp_click_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_wa_log_seconds ON public.whatsapp_click_logs(time_to_click_seconds);

-- 4) DOĞRULAMA KONTROLÜ
SELECT 
    '✅ whatsapp_click_logs TABLOSU BAŞARIYLA OLUŞTURULDU!' AS durum,
    COUNT(*) AS toplam_kayit_sayisi 
FROM public.whatsapp_click_logs;
