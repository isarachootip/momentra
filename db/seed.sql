-- ============================================================================
-- Seed Data: db/seed.sql
-- Project: Momentra (Historical Digital Asset Management - HDAM)
-- Description: Authentic Thai historical data spanning from B.E. 2475 (1932 C.E.)
--              to B.E. 2565 (2022 C.E.) covering images, documents, audio, video,
--              links, notes, events, tags, entities, collections, and custom fields.
-- ============================================================================

-- Fix workspace and user UUIDs for deterministic testing
DO $$
DECLARE
    ws_org_id UUID := '11111111-1111-1111-1111-111111111111';
    ws_personal_id UUID := '22222222-2222-2222-2222-222222222222';
    
    u_somchai_id UUID := 'a1111111-1111-1111-1111-111111111111';
    u_nonglak_id UUID := 'a2222222-2222-2222-2222-222222222222';
    u_piti_id UUID := 'a3333333-3333-3333-3333-333333333333';
    u_oranong_id UUID := 'a4444444-4444-4444-4444-444444444444';

    tag_politics_id UUID := gen_random_uuid();
    tag_culture_id UUID := gen_random_uuid();
    tag_infra_id UUID := gen_random_uuid();
    tag_family_id UUID := gen_random_uuid();

    ent_pridi_id UUID := gen_random_uuid();
    ent_bangkoko_id UUID := gen_random_uuid();
    ent_bts_id UUID := gen_random_uuid();

    col_2475_id UUID := gen_random_uuid();
    col_infra_id UUID := gen_random_uuid();

    item_id_var UUID;
BEGIN

    -- 1. Insert Workspaces
    INSERT INTO workspaces (id, slug, name, type, settings)
    VALUES 
    (ws_org_id, 'national-archives', 'หอจดหมายเหตุประวัติศาสตร์และวัฒนธรรมไทย', 'organization', '{"default_calendar":"be","storage_quota_bytes":5497558138880}'::jsonb),
    (ws_personal_id, 'somchai-family-archive', 'คลังประวัติศาสตร์และตระกูลของคุณสมชาย', 'personal', '{"default_calendar":"be","storage_quota_bytes":536870912000}'::jsonb)
    ON CONFLICT (id) DO NOTHING;

    -- 2. Insert Users (Password: Momentra@2026 hashed with bcrypt/argon dummy)
    INSERT INTO users (id, email, password_hash, full_name, avatar_url)
    VALUES
    (u_somchai_id, 'somchai@momentra.app', '$argon2id$v=19$m=65536,t=3,p=4$dummyhashsomchai', 'สมชาย วิจิตรานันท์', 'https://avatar.momentra.app/somchai.png'),
    (u_nonglak_id, 'nonglak@archives.or.th', '$argon2id$v=19$m=65536,t=3,p=4$dummyhashnonglak', 'นงลักษณ์ รัตนเจริญผล', 'https://avatar.momentra.app/nonglak.png'),
    (u_piti_id, 'piti@archives.or.th', '$argon2id$v=19$m=65536,t=3,p=4$dummyhashpiti', 'ปิติ พงษ์สยาม', 'https://avatar.momentra.app/piti.png'),
    (u_oranong_id, 'oranong@univ.ac.th', '$argon2id$v=19$m=65536,t=3,p=4$dummyhashoranong', 'ดร. อรอนงค์ สุทธิประภา', 'https://avatar.momentra.app/oranong.png')
    ON CONFLICT (id) DO NOTHING;

    -- 3. Insert Workspace Members (RBAC)
    INSERT INTO workspace_members (workspace_id, user_id, role)
    VALUES
    -- Org Workspace roles
    (ws_org_id, u_nonglak_id, 'admin'),
    (ws_org_id, u_piti_id, 'contributor'),
    (ws_org_id, u_oranong_id, 'viewer'),
    (ws_org_id, u_somchai_id, 'viewer'),
    -- Personal Workspace roles
    (ws_personal_id, u_somchai_id, 'owner')
    ON CONFLICT (workspace_id, user_id) DO NOTHING;

    -- 4. Insert Tags
    INSERT INTO tags (id, workspace_id, name, color) VALUES
    (tag_politics_id, ws_org_id, 'การเมืองและประชาธิปไตย', '#EF4444'),
    (tag_culture_id, ws_org_id, 'ศิลปวัฒนธรรมและวิถีชีวิต', '#F59E0B'),
    (tag_infra_id, ws_org_id, 'การคมนาคมและโครงสร้างพื้นฐาน', '#3B82F6'),
    (tag_family_id, ws_personal_id, 'บันทึกตระกูลและบ้านโบราณ', '#10B981')
    ON CONFLICT DO NOTHING;

    -- 5. Insert Entities
    INSERT INTO entities (id, workspace_id, name, type, description) VALUES
    (ent_pridi_id, ws_org_id, 'ศาสตราจารย์ ดร. ปรีดี พนมยงค์', 'person', 'รัฐบุรุษอาวุโส ผู้นำคณะราษฎรสายพลเรือน'),
    (ent_bangkoko_id, ws_org_id, 'กรุงเทพมหานครและปริมณฑล', 'location', 'ศูนย์กลางการบริหารราชการแผ่นดินและประวัติศาสตร์'),
    (ent_bts_id, ws_org_id, 'บริษัท ระบบขนส่งมวลชนกรุงเทพ จำกัด (มหาชน)', 'organization', 'ผู้ให้บริการระบบรถไฟฟ้าบีทีเอสแห่งแรกของไทย')
    ON CONFLICT DO NOTHING;

    -- 6. Insert Collections
    INSERT INTO collections (id, workspace_id, title, description, created_by) VALUES
    (col_2475_id, ws_org_id, 'จดหมายเหตุการอภิวัฒน์สยาม พ.ศ. 2475', 'รวมเอกสารสำคัญ ภาพถ่าย และบันทึกคำประกาศในการเปลี่ยนแปลงการปกครอง', u_nonglak_id),
    (col_infra_id, ws_org_id, 'วิวัฒนาการคมนาคมขนส่งไทยใน 100 ปี', 'ภาพถ่ายสะพาน ถนน รถราง และรถไฟฟ้าในมหานครกรุงเทพ', u_piti_id)
    ON CONFLICT DO NOTHING;

    -- ========================================================================
    -- 7. Items, Assets, Links, Notes (33 Distinct Historical Records)
    -- ========================================================================

    -- [Item 1] การเปลี่ยนแปลงการปกครอง 24 มิถุนายน 2475 (Event)
    item_id_var := '30000000-0000-0000-0000-000000000001';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, dublin_core, created_by)
    VALUES (item_id_var, ws_org_id, 'event', 'การเปลี่ยนแปลงการปกครอง 24 มิถุนายน 2475',
            'คณะราษฎรได้ดำเนินการเปลี่ยนแปลงการปกครองของสยามจากระบอบสมบูรณาญาสิทธิราชย์มาเป็นระบอบประชาธิปไตยอันมีพระมหากษัตริย์ทรงเป็นประมุข ณ ลานพระบรมรูปทรงม้า',
            '1932-06-24 05:00:00+07', '1932-06-24 18:00:00+07', 'datetime', false, -118411200004,
            '{"creator":"คณะราษฎร","subject":"ประชาธิปไตย สยาม 2475","coverage":"กรุงเทพมหานคร"}'::jsonb, u_piti_id)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO item_tags (item_id, tag_id) VALUES (item_id_var, tag_politics_id) ON CONFLICT DO NOTHING;
    INSERT INTO collection_items (collection_id, item_id, sort_order) VALUES (col_2475_id, item_id_var, 1) ON CONFLICT DO NOTHING;
    INSERT INTO item_entities (item_id, entity_id, role_in_event) VALUES (item_id_var, ent_pridi_id, 'leader') ON CONFLICT DO NOTHING;

    -- [Item 2] ภาพถ่ายหมุดคณะราษฎร ณ ลานพระบรมรูปทรงม้า (Asset - Image)
    item_id_var := '30000000-0000-0000-0000-000000000002';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, created_by)
    VALUES (item_id_var, ws_org_id, 'asset', 'ภาพถ่ายหมุดกำเนิดรัฐธรรมนูญจำลอง พ.ศ. 2479',
            'ภาพถ่ายฟิล์มกระจกบันทึกจุดที่หมุดทองเหลืองถูกฝังลงบนถนน ณ จุดที่พระยาพหลพลพยุหเสนาอ่านประกาศคณะราษฎร',
            '1936-01-01 00:00:00+00', '1936-12-31 23:59:59+00', 'year', false, -107291520001, u_piti_id)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO assets (item_id, storage_key, original_filename, mime_type, size_bytes, checksum_sha256, width, height, status)
    VALUES (item_id_var, 'permanent-assets/ws-org/2479_pin.png', '2479_plaque_monument.png', 'image/png', 14502800,
            'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 4000, 3000, 'ready')
    ON CONFLICT (item_id) DO NOTHING;
    INSERT INTO collection_items (collection_id, item_id, sort_order) VALUES (col_2475_id, item_id_var, 2) ON CONFLICT DO NOTHING;
    INSERT INTO item_tags (item_id, tag_id) VALUES (item_id_var, tag_politics_id) ON CONFLICT DO NOTHING;

    -- [Item 3] พระราชบัญญัติธรรมนูญการปกครองแผ่นดินสยามชั่วคราว (Asset - PDF)
    item_id_var := '30000000-0000-0000-0000-000000000003';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, created_by)
    VALUES (item_id_var, ws_org_id, 'asset', 'เอกสารลายพระหัตถ์ พระราชบัญญัติธรรมนูญการปกครองแผ่นดินสยามชั่วคราว 2475',
            'สแกนเอกสารรัฐธรรมนูญฉบับแรกของสยามที่พระบาทสมเด็จพระปกเกล้าเจ้าอยู่หัวทรงลงพระปรมาภิไธยเมื่อ 27 มิถุนายน 2475',
            '1932-06-27 00:00:00+00', '1932-06-27 23:59:59+00', 'day', false, -118385280003, u_piti_id)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO assets (item_id, storage_key, original_filename, mime_type, size_bytes, checksum_sha256, status)
    VALUES (item_id_var, 'permanent-assets/ws-org/doc_constitution_2475.pdf', 'constitution_june_1932.pdf', 'application/pdf', 38902000,
            '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08', 'ready')
    ON CONFLICT (item_id) DO NOTHING;
    INSERT INTO collection_items (collection_id, item_id, sort_order) VALUES (col_2475_id, item_id_var, 3) ON CONFLICT DO NOTHING;
    INSERT INTO item_tags (item_id, tag_id) VALUES (item_id_var, tag_politics_id) ON CONFLICT DO NOTHING;

    -- [Item 4] ภาพถ่ายโบราณสถานวัดพระศรีรัตนมหาธาตุ พิษณุโลก (circa พ.ศ. 2480, is_circa: true)
    item_id_var := '30000000-0000-0000-0000-000000000004';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, created_by)
    VALUES (item_id_var, ws_org_id, 'asset', 'ภาพถ่ายวิหารพระพุทธชินราช พิษณุโลก (ประมาณปี พ.ศ. 2480)',
            'ภาพถ่ายขาวดำสภาพวิหารหลวงและแม่น้ำน่านก่อนการสร้างสะพานนเรศวร บันทึกโดยนักสำรวจโบราณคดี',
            '1932-01-01 00:00:00+00', '1942-12-31 23:59:59+00', 'year', true, -104137920001, u_oranong_id)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO assets (item_id, storage_key, original_filename, mime_type, size_bytes, checksum_sha256, width, height, status)
    VALUES (item_id_var, 'permanent-assets/ws-org/phitsanulok_1937.jpg', 'phitsanulok_shrine_circa1937.jpg', 'image/jpeg', 8401200,
            '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b', 3200, 2400, 'ready')
    ON CONFLICT (item_id) DO NOTHING;

    -- [Item 5] จดหมายเหตุสงครามมหาเอเชียบูรพา (Asset - PDF Range 1941 - 1945)
    item_id_var := '30000000-0000-0000-0000-000000000005';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, created_by)
    VALUES (item_id_var, ws_org_id, 'asset', 'รายงานสถานการณ์ทางทหารช่วงสงครามมหาเอเชียบูรพาในประเทศไทย (2484 - 2488)',
            'รวมเอกสารการเคลื่อนพลและการเจรจาทางการทูตระหว่างไทยกับกองทัพญี่ปุ่นตลอดช่วงสงครามโลกครั้งที่สอง',
            '1941-12-08 00:00:00+00', '1945-08-16 23:59:59+00', 'year', false, -88577280001, u_piti_id)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO assets (item_id, storage_key, original_filename, mime_type, size_bytes, checksum_sha256, status)
    VALUES (item_id_var, 'permanent-assets/ws-org/ww2_thailand_report.pdf', 'ww2_southeast_asia_thai_military.pdf', 'application/pdf', 95201000,
            'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35', 'ready')
    ON CONFLICT (item_id) DO NOTHING;

    -- [Item 6] เสียงบันทึกแถลงการณ์น้ำท่วมใหญ่กรุงเทพฯ พ.ศ. 2485 (Asset - Audio)
    item_id_var := '30000000-0000-0000-0000-000000000006';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, created_by)
    VALUES (item_id_var, ws_org_id, 'asset', 'เสียงแถลงการณ์วิทยุกระจายเสียงแห่งประเทศไทย กรณีอุทกภัยกรุงเทพฯ ตุลาคม 2485',
            'บันทึกเสียงประวัติศาสตร์การรายงานระดับน้ำท่วมท้นฝั่งพระนครและธนบุรี นานกว่า 1 เดือน',
            '1942-10-01 00:00:00+00', '1942-10-31 23:59:59+00', 'month', false, -85993920002, u_nonglak_id)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO assets (item_id, storage_key, original_filename, mime_type, size_bytes, checksum_sha256, duration_sec, status)
    VALUES (item_id_var, 'permanent-assets/ws-org/audio_flood_1942.mp3', 'broadcast_flood_bangkok_oct1942.mp3', 'audio/mpeg', 18450000,
            '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce', 720.50, 'ready')
    ON CONFLICT (item_id) DO NOTHING;

    -- [Item 7] ลิงก์หอสมุดแห่งชาติ: ดิจิทัลคอลเลกชันหนังสือพิมพ์โบราณ (Link)
    item_id_var := '30000000-0000-0000-0000-000000000007';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, created_by)
    VALUES (item_id_var, ws_org_id, 'link', 'หอสมุดแห่งชาติ: จดหมายเหตุดิจิทัลหนังสือพิมพ์ศรีกรุง พ.ศ. 2475 - 2485',
            'คลังหนังสือพิมพ์เก่าและบทความวิพากษ์สังคมการเมืองช่วงทศวรรษแรกแห่งการเปลี่ยนแปลงการปกครอง',
            '1932-01-01 00:00:00+00', '1942-12-31 23:59:59+00', 'year', false, -119914560001, u_oranong_id)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO links (item_id, url, normalized_url, domain, og_title, og_description)
    VALUES (item_id_var, 'https://digital.nlt.go.th/archive/srikrung', 'https://digital.nlt.go.th/archive/srikrung', 'digital.nlt.go.th',
            'คลังจดหมายเหตุหนังสือพิมพ์โบราณ - หอสมุดแห่งชาติ', 'เข้าถึงสำเนาดิจิทัลความละเอียดสูงของหนังสือพิมพ์ศรีกรุง')
    ON CONFLICT (item_id) DO NOTHING;

    -- [Item 8] ภาพถ่ายสะพานเฉลิมโลก ประตูน้ำ ยุคสามล้อเครื่อง (circa พ.ศ. 2495)
    item_id_var := '30000000-0000-0000-0000-000000000008';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, created_by)
    VALUES (item_id_var, ws_org_id, 'asset', 'ภาพถ่ายสะพานเฉลิมโลกและคลองแสนแสบ ประตูน้ำ (circa พ.ศ. 2495)',
            'วิถีชีวิตชาวบางกอกบริเวณย่านประตูน้ำ การสัญจรทางเรือในคลองแสนแสบและการเริ่มเข้ามาของรถสามล้อเครื่อง',
            '1947-01-01 00:00:00+00', '1957-12-31 23:59:59+00', 'year', true, -56808000001, u_piti_id)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO assets (item_id, storage_key, original_filename, mime_type, size_bytes, checksum_sha256, width, height, status)
    VALUES (item_id_var, 'permanent-assets/ws-org/pratunam_1952.jpg', 'pratunam_canal_bridge_circa1952.jpg', 'image/jpeg', 12300400,
            '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a', 3600, 2700, 'ready')
    ON CONFLICT (item_id) DO NOTHING;
    INSERT INTO collection_items (collection_id, item_id, sort_order) VALUES (col_infra_id, item_id_var, 1) ON CONFLICT DO NOTHING;

    -- [Item 9] บันทึกความทรงจำการก่อตั้งธนาคารแห่งประเทศไทย (Note)
    item_id_var := '30000000-0000-0000-0000-000000000009';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, created_by)
    VALUES (item_id_var, ws_org_id, 'note', 'บันทึกวันเปิดทำการธนาคารแห่งประเทศไทย 10 ธันวาคม 2485',
            'พระองค์เจ้าวิวัฒนไชย ทรงดำรงตำแหน่งผู้ว่าการพระองค์แรก ท่ามกลางภาวะสงครามโลกที่ทวีความตึงเครียดด้านเงินสำรองระหว่างประเทศ',
            '1942-12-10 00:00:00+00', '1942-12-10 23:59:59+00', 'day', false, -85397760003, u_nonglak_id)
    ON CONFLICT (id) DO NOTHING;

    -- [Item 10] พิธีเปิดสะพานสมเด็จพระปิ่นเกล้า (Asset - Image 1973)
    item_id_var := '30000000-0000-0000-0000-000000000010';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, created_by)
    VALUES (item_id_var, ws_org_id, 'asset', 'ภาพถ่ายพิธีเปิดสะพานสมเด็จพระปิ่นเกล้า 24 กันยายน 2516',
            'สะพานข้ามแม่น้ำเจ้าพระยาแห่งสำคัญที่เชื่อมการจราจรระหว่างฝั่งพระนครและฝั่งธนบุรี บรรเทาความแออัดของสะพานพุทธ',
            '1973-09-24 09:00:00+07', '1973-09-24 17:00:00+07', 'day', false, 11770560003, u_piti_id)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO assets (item_id, storage_key, original_filename, mime_type, size_bytes, checksum_sha256, width, height, status)
    VALUES (item_id_var, 'permanent-assets/ws-org/pinklao_bridge_1973.jpg', 'pinklao_bridge_opening_1973.jpg', 'image/jpeg', 16500000,
            'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d', 4200, 2800, 'ready')
    ON CONFLICT (item_id) DO NOTHING;
    INSERT INTO collection_items (collection_id, item_id, sort_order) VALUES (col_infra_id, item_id_var, 2) ON CONFLICT DO NOTHING;

    -- [Item 11] ขบวนการนักศึกษา 14 ตุลาคม 2516 (Event)
    item_id_var := '30000000-0000-0000-0000-000000000011';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, created_by)
    VALUES (item_id_var, ws_org_id, 'event', 'เหตุการณ์ 14 ตุลาคม 2516: วันมหาวิปโยคและชัยชนะของประชาชน',
            'การชุมนุมประท้วงเรียกร้องรัฐธรรมนูญของนักศึกษา ประชาชนกว่า 500,000 คน บริเวณถนนราชดำเนิน นำไปสู่การสิ้นสุดของรัฐบาลทหาร',
            '1973-10-14 06:00:00+07', '1973-10-15 18:00:00+07', 'day', false, 11943360003, u_oranong_id)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO item_tags (item_id, tag_id) VALUES (item_id_var, tag_politics_id) ON CONFLICT DO NOTHING;

    -- [Item 12] แถลงการณ์เรียกร้องรัฐธรรมนูญ 13 ตุลาคม 2516 (Asset - PDF)
    item_id_var := '30000000-0000-0000-0000-000000000012';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, created_by)
    VALUES (item_id_var, ws_org_id, 'asset', 'ใบปลิวและแถลงการณ์ศูนย์กลางนิสิตนักศึกษาแห่งประเทศไทย 13 ตุลาคม 2516',
            'เอกสารประวัติศาสตร์แจกจ่ายประชาชนเพื่อชี้แจงข้อเรียกร้องให้ปล่อยตัว 13 ขบถรัฐธรรมนูญทันที',
            '1973-10-13 00:00:00+00', '1973-10-13 23:59:59+00', 'day', false, 11934720003, u_piti_id)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO assets (item_id, storage_key, original_filename, mime_type, size_bytes, checksum_sha256, status)
    VALUES (item_id_var, 'permanent-assets/ws-org/doc_oct14_leaflet.pdf', 'oct14_student_manifesto_1973.pdf', 'application/pdf', 12450000,
            '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'ready')
    ON CONFLICT (item_id) DO NOTHING;

    -- [Item 13] วิดีโอบันทึกคำให้การพยานปากคำประวัติศาสตร์ 2516 (Asset - Video)
    item_id_var := '30000000-0000-0000-0000-000000000013';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, created_by)
    VALUES (item_id_var, ws_org_id, 'asset', 'สารคดีประวัติศาสตร์บอกเล่า: เสียงจากพยานเหตุการณ์เดือนตุลาคม 2516',
            'บทสัมภาษณ์ผู้นำนักศึกษาและประชาชนผู้ร่วมเดินขบวน บันทึกความทรงจำและผลกระทบต่อสังคมไทย',
            '1973-10-06 00:00:00+00', '1973-10-15 23:59:59+00', 'datetime', false, 11874240004, u_piti_id)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO assets (item_id, storage_key, original_filename, mime_type, size_bytes, checksum_sha256, duration_sec, status)
    VALUES (item_id_var, 'permanent-assets/ws-org/video_oct14_documentary.mp4', 'oral_history_october_1973.mp4', 'video/mp4', 850300000,
            '1b4f0e985197199f8232427d72f13f86078e281353da1cbd04743772ec20ddc0', 3600.00, 'ready')
    ON CONFLICT (item_id) DO NOTHING;

    -- [Item 14] ภาพถ่ายวิถีชีวิตชาวสวนคลองบางกอกน้อย (circa พ.ศ. 2510 - 2515)
    item_id_var := '30000000-0000-0000-0000-000000000014';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, created_by)
    VALUES (item_id_var, ws_org_id, 'asset', 'ภาพถ่ายวิถีชีวิตชาวสวนผลไม้และตลาดน้ำคลองบางกอกน้อย (circa 2510 - 2515)',
            'บรรยากาศเรือพายขายผลไม้ การทำสวนส้มบางมด และบ้านทรงไทยริมน้ำก่อนการตัดถนนจรัญสนิทวงศ์',
            '1967-01-01 00:00:00+00', '1972-12-31 23:59:59+00', 'year', true, -9469440001, u_oranong_id)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO assets (item_id, storage_key, original_filename, mime_type, size_bytes, checksum_sha256, width, height, status)
    VALUES (item_id_var, 'permanent-assets/ws-org/bangkoknoi_1970.jpg', 'bangkoknoi_canal_life_circa1970.jpg', 'image/jpeg', 9800000,
            '3f79bb7b435b05321651daefd374cdc681dc06faa65e374e38337b88ca046dea', 3000, 2000, 'ready')
    ON CONFLICT (item_id) DO NOTHING;
    INSERT INTO item_tags (item_id, tag_id) VALUES (item_id_var, tag_culture_id) ON CONFLICT DO NOTHING;

    -- [Item 15] บันทึกความทรงจำโรงภาพยนตร์ศาลาเฉลิมไทย (Note 1957)
    item_id_var := '30000000-0000-0000-0000-000000000015';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, created_by)
    VALUES (item_id_var, ws_org_id, 'note', 'บันทึกตำนานโรงภาพยนตร์ศาลาเฉลิมไทย ยุคทองแห่งภาพยนตร์ไทย 2500',
            'สถาปัตยกรรมโมเดิร์นแบบสากลริมถนนราชดำเนินกลาง ศูนย์รวมความบันเทิงยุคภาพยนตร์ 16 มม.',
            '1957-01-01 00:00:00+00', '1957-12-31 23:59:59+00', 'year', false, -41022720001, u_oranong_id)
    ON CONFLICT (id) DO NOTHING;

    -- [Item 16] ภาพถ่ายงานสมโภชกรุงรัตนโกสินทร์ 200 ปี (Asset - Image เม.ย. 2525)
    item_id_var := '30000000-0000-0000-0000-000000000016';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, created_by)
    VALUES (item_id_var, ws_org_id, 'asset', 'ภาพถ่ายริ้วขบวนพยุหยาตราทางชลมารค งานสมโภชกรุงรัตนโกสินทร์ 200 ปี (เมษายน 2525)',
            'ความงดงามตระการตาของเรือพระที่นั่งสุพรรณหงส์กลางลำน้ำเจ้าพระยาในพระราชพิธีฉลอง 2 ศตวรรษแห่งราชธานี',
            '1982-04-01 00:00:00+00', '1982-04-30 23:59:59+00', 'month', false, 38646720002, u_nonglak_id)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO assets (item_id, storage_key, original_filename, mime_type, size_bytes, checksum_sha256, width, height, status)
    VALUES (item_id_var, 'permanent-assets/ws-org/bangkok_bicentennial_1982.jpg', 'royal_barge_procession_1982.jpg', 'image/jpeg', 24100000,
            '252f10c83610ebca1a059c0bae8255eba2f95be4d1d7bcfa89d7248a82d9f111', 5400, 3600, 'ready')
    ON CONFLICT (item_id) DO NOTHING;

    -- [Item 17] ลิงก์บทความสารคดียุคโชติช่วงชัชวาล (Eastern Seaboard 2524)
    item_id_var := '30000000-0000-0000-0000-000000000017';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, created_by)
    VALUES (item_id_var, ws_org_id, 'link', 'บทความวิเคราะห์: การค้นพบก๊าซธรรมชาติอ่าวไทยและจุดเริ่มต้นยุคโชติช่วงชัชวาล 2524',
            'จุดเปลี่ยนสำคัญทางเศรษฐกิจและอุตสาหกรรมปิโตรเคมีที่พลิกโฉมหน้าประเทศไทยสู่ประเทศอุตสาหกรรมใหม่ (NICs)',
            '1981-01-01 00:00:00+00', '1981-12-31 23:59:59+00', 'year', false, 34715520001, u_piti_id)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO links (item_id, url, normalized_url, domain, og_title, og_description)
    VALUES (item_id_var, 'https://www.thaieconhistory.org/eastern-seaboard-1981', 'https://www.thaieconhistory.org/eastern-seaboard-1981', 'thaieconhistory.org',
            'กำเนิดอีสเทิร์นซีบอร์ด: พลิกโฉมเศรษฐกิจไทย', 'สารคดีประวัติศาสตร์การวางท่อก๊าซธรรมชาติและการสร้างท่าเรือมาบตาพุด')
    ON CONFLICT (item_id) DO NOTHING;

    -- [Item 18] สัญญาณดาวเทียมไทยคม 1 ยิงขึ้นสู่อวกาศ (Asset - Video 2536)
    item_id_var := '30000000-0000-0000-0000-000000000018';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, created_by)
    VALUES (item_id_var, ws_org_id, 'asset', 'วิดีโอบันทึกการปล่อยจรวดส่งดาวเทียมไทยคม 1 ณ ฐานส่งคูรู เฟรนช์เกียนา 2536',
            'ก้าวแรกของกิจการอวกาศและการสื่อสารโทรคมนาคมแห่งชาติของไทยผ่านดาวเทียมดวงแรกในประวัติศาสตร์',
            '1993-12-18 00:00:00+00', '1993-12-18 23:59:59+00', 'day', false, 75617280003, u_piti_id)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO assets (item_id, storage_key, original_filename, mime_type, size_bytes, checksum_sha256, duration_sec, status)
    VALUES (item_id_var, 'permanent-assets/ws-org/thaicom1_launch_1993.mp4', 'thaicom1_rocket_launch_kourou.mp4', 'video/mp4', 450200000,
            'f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2', 1800.00, 'ready')
    ON CONFLICT (item_id) DO NOTHING;

    -- [Item 19] เอกสารแผนแม่บทเทคโนโลยีสารสนเทศ IT 2000 (Asset - PDF 2539)
    item_id_var := '30000000-0000-0000-0000-000000000019';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, created_by)
    VALUES (item_id_var, ws_org_id, 'asset', 'เอกสารนโยบายเทคโนโลยีสารสนเทศแห่งชาติ: IT 2000 สู่สังคมสารสนเทศ (พ.ศ. 2539)',
            'พิมพ์เขียวการสร้างทางด่วนข้อมูล (National Information Superhighway) และการก่อตั้งศูนย์เทคโนโลยีอิเล็กทรอนิกส์และคอมพิวเตอร์แห่งชาติ',
            '1996-01-01 00:00:00+00', '1996-12-31 23:59:59+00', 'year', false, 82045440001, u_oranong_id)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO assets (item_id, storage_key, original_filename, mime_type, size_bytes, checksum_sha256, status)
    VALUES (item_id_var, 'permanent-assets/ws-org/doc_it2000_policy.pdf', 'it2000_national_it_plan_thailand.pdf', 'application/pdf', 18340000,
            'fb8e20fc2e4c3f248c60c39bd652f3c1347298ab977b8b4d79f03a8a532234f4', 'ready')
    ON CONFLICT (item_id) DO NOTHING;

    -- [Item 20] วิกฤตการณ์การเงินต้มยำกุ้งและการลอยตัวค่าเงินบาท (Event 2 ก.ค. 2540)
    item_id_var := '30000000-0000-0000-0000-000000000020';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, created_by)
    VALUES (item_id_var, ws_org_id, 'event', 'การประกาศลอยตัวค่าเงินบาทและวิกฤตต้มยำกุ้ง 2 กรกฎาคม 2540',
            'ธนาคารแห่งประเทศไทยปรับเปลี่ยนระบบอัตราแลกเปลี่ยนจากตะกร้าเงินมาเป็นระบบลอยตัวที่มีการจัดการ ส่งผลสะเทือนระบบการเงินทั่วโลก',
            '1997-07-02 08:30:00+07', '1997-07-02 18:00:00+07', 'day', false, 86780160003, u_nonglak_id)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO item_tags (item_id, tag_id) VALUES (item_id_var, tag_politics_id) ON CONFLICT DO NOTHING;

    -- [Item 21] บันทึกการประชุมฉุกเฉินและแถลงข่าวลอยตัวค่าเงินบาท (Asset - PDF)
    item_id_var := '30000000-0000-0000-0000-000000000021';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, created_by)
    VALUES (item_id_var, ws_org_id, 'asset', 'แถลงการณ์กระทรวงการคลังและธนาคารแห่งประเทศไทย ฉบับที่ 1/2540 เรื่องการลอยตัวค่าเงินบาท',
            'สำเนาเอกสารแถลงข่าวฉบับประวัติศาสตร์ที่แจกจ่ายให้สื่อมวลชน ณ สำนักงานใหญ่ ธปท. บางขุนพรหม',
            '1997-07-02 00:00:00+00', '1997-07-02 23:59:59+00', 'day', false, 86780160003, u_nonglak_id)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO assets (item_id, storage_key, original_filename, mime_type, size_bytes, checksum_sha256, status)
    VALUES (item_id_var, 'permanent-assets/ws-org/bot_statement_july1997.pdf', 'bot_managed_float_july1997.pdf', 'application/pdf', 8400000,
            'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb', 'ready')
    ON CONFLICT (item_id) DO NOTHING;

    -- [Item 22] พิธีเปิดให้บริการรถไฟฟ้าบีทีเอส (BTS SkyTrain) สายแรกของไทย (Asset - Image 2542)
    item_id_var := '30000000-0000-0000-0000-000000000022';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, created_by)
    VALUES (item_id_var, ws_org_id, 'asset', 'ภาพถ่ายพิธีเปิดให้บริการรถไฟฟ้าบีทีเอส (BTS) เฉลิมพระเกียรติ 5 ธันวาคม 2542',
            'ขบวนรถไฟฟ้าขบวนแรกวิ่งออกจากสถานีสยาม เปิดฉากการเดินทางระบบรางลอยฟ้าสายแรกที่พลิกชีวิตคนกรุงเทพฯ สู่ยุคใหม่',
            '1999-12-05 06:00:00+07', '1999-12-05 23:59:59+07', 'day', false, 94435200003, u_piti_id)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO assets (item_id, storage_key, original_filename, mime_type, size_bytes, checksum_sha256, width, height, status)
    VALUES (item_id_var, 'permanent-assets/ws-org/bts_opening_1999.jpg', 'bts_skytrain_first_run_siam.jpg', 'image/jpeg', 28500000,
            '5891b5b522d5df086d0ff0b110fbd9d21bb4fc7163af34d08286a2e846f6be03', 4800, 3200, 'ready')
    ON CONFLICT (item_id) DO NOTHING;
    INSERT INTO item_tags (item_id, tag_id) VALUES (item_id_var, tag_infra_id) ON CONFLICT DO NOTHING;
    INSERT INTO collection_items (collection_id, item_id, sort_order) VALUES (col_infra_id, item_id_var, 3) ON CONFLICT DO NOTHING;
    INSERT INTO item_entities (item_id, entity_id, role_in_event) VALUES (item_id_var, ent_bts_id, 'operator') ON CONFLICT DO NOTHING;

    -- [Item 23] ลิงก์บทความอุโมงค์ยักษ์ระบายน้ำ กทม. (Link 2548)
    item_id_var := '30000000-0000-0000-0000-000000000023';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, created_by)
    VALUES (item_id_var, ws_org_id, 'link', 'บทความวิศวกรรม: กำเนิดอุโมงค์ยักษ์ระบายน้ำพระรามเก้าแก้ปัญหาน้ำท่วม กทม. 2548',
            'โครงการระบบป้องกันน้ำท่วมขนาดใหญ่ผ่านอุโมงค์ใต้ดินระบายน้ำลงสู่แม่น้ำเจ้าพระยาอย่างรวดเร็ว',
            '2005-01-01 00:00:00+00', '2005-12-31 23:59:59+00', 'year', false, 110453760001, u_piti_id)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO links (item_id, url, normalized_url, domain, og_title, og_description)
    VALUES (item_id_var, 'https://www.bangkokdrainage.go.th/tunnel-history-2005', 'https://www.bangkokdrainage.go.th/tunnel-history-2005', 'bangkokdrainage.go.th',
            'ระบบอุโมงค์ระบายน้ำยักษ์กรุงเทพมหานคร', 'รายละเอียดทางวิศวกรรมการขุดเจาะอุโมงค์เส้นผ่านศูนย์กลาง 5 เมตร')
    ON CONFLICT (item_id) DO NOTHING;

    -- [Item 24] ภาพถ่ายเหตุการณ์มหาอุทกภัย 2554 บริเวณดอนเมือง (Asset - Image ต.ค. 2554)
    item_id_var := '30000000-0000-0000-0000-000000000024';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, created_by)
    VALUES (item_id_var, ws_org_id, 'asset', 'ภาพถ่ายทางอากาศมหาอุทกภัยน้ำท่วมใหญ่ท่าอากาศยานดอนเมือง (ตุลาคม 2554)',
            'เครื่องบินโดยสารจอดแช่น้ำบนรันเวย์สนามบินดอนเมืองหลังคันกั้นน้ำตอนเหนือของกรุงเทพมหานครพังทลาย',
            '2011-10-01 00:00:00+00', '2011-10-31 23:59:59+00', 'month', false, 131742720002, u_oranong_id)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO assets (item_id, storage_key, original_filename, mime_type, size_bytes, checksum_sha256, width, height, status)
    VALUES (item_id_var, 'permanent-assets/ws-org/donmuang_flood_2011.jpg', 'donmuang_airport_flood_oct2011.jpg', 'image/jpeg', 31200000,
            '38407ff679914c9361d02eab8f18e470f131f62ac1162d5634f434778f630ad8', 6000, 4000, 'ready')
    ON CONFLICT (item_id) DO NOTHING;

    -- [Item 25] ภาพถ่ายสตรีทอาร์ตย่านเจริญกรุงกับการฟื้นฟูย่านเก่า (Asset - Image 2559)
    item_id_var := '30000000-0000-0000-0000-000000000025';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, created_by)
    VALUES (item_id_var, ws_org_id, 'asset', 'ภาพถ่ายงานศิลปะบนกำแพงตึกเก่าย่านเจริญกรุง - ตลาดน้อย (พ.ศ. 2559)',
            'การฟื้นฟูถนนสายแรกของกรุงเทพมหานครสู่ย่านสร้างสรรค์ (Charoenkrung Creative District) และเทศกาลออกแบบกรุงเทพฯ',
            '2016-01-01 00:00:00+00', '2016-12-31 23:59:59+00', 'year', false, 145160640001, u_oranong_id)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO assets (item_id, storage_key, original_filename, mime_type, size_bytes, checksum_sha256, width, height, status)
    VALUES (item_id_var, 'permanent-assets/ws-org/charoenkrung_art_2016.jpg', 'charoenkrung_taladnoi_streetart_2016.jpg', 'image/jpeg', 19400000,
            'a80b568a42f6d0f948f219159981e4b857ef0c5549079be80c7ea5d1ff39a8aa', 4500, 3000, 'ready')
    ON CONFLICT (item_id) DO NOTHING;
    INSERT INTO item_tags (item_id, tag_id) VALUES (item_id_var, tag_culture_id) ON CONFLICT DO NOTHING;

    -- [Item 26] วิดีโอบันทึกงานพระราชพิธีบรมราชาภิเษก (Asset - Video 4 พ.ค. 2562)
    item_id_var := '30000000-0000-0000-0000-000000000026';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, created_by)
    VALUES (item_id_var, ws_org_id, 'asset', 'บันทึกภาพประวัติศาสตร์ พระราชพิธีบรมราชาภิเษก พุทธศักราช 2562 (4 พฤษภาคม 2562)',
            'พระราชพิธีสรงพระมุรธาภิเษกและทรงรับน้ำอภิเษก ณ พระที่นั่งไพศาลทักษิณ พระบรมมหาราชวัง',
            '2019-05-04 10:00:00+07', '2019-05-04 18:00:00+07', 'day', false, 155692800003, u_nonglak_id)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO assets (item_id, storage_key, original_filename, mime_type, size_bytes, checksum_sha256, duration_sec, status)
    VALUES (item_id_var, 'permanent-assets/ws-org/coronation_2019.mp4', 'royal_coronation_thailand_may2019.mp4', 'video/mp4', 1240000000,
            '4a060144f808f02931a7ff77f88461719b1652494957e8498877bc89d2d0c644', 4200.00, 'ready')
    ON CONFLICT (item_id) DO NOTHING;

    -- [Item 27] บันทึกมาตรการรับมือการระบาดของโควิด-19 ระลอกแรก (Note มี.ค. 2563)
    item_id_var := '30000000-0000-0000-0000-000000000027';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, created_by)
    VALUES (item_id_var, ws_org_id, 'note', 'บันทึกประวัติศาสตร์: การประกาศสถานการณ์ฉุกเฉินและล็อกดาวน์รับมือ COVID-19 (มีนาคม 2563)',
            'ความเงียบสงบอย่างไม่เคยปรากฏมาก่อนของย่านการค้าสยามสแควร์ ถนนสีลม และการปรับตัวของประชาชนสู่การทำงานจากที่บ้าน',
            '2020-03-26 00:00:00+00', '2020-03-26 23:59:59+00', 'day', false, 158518080003, u_piti_id)
    ON CONFLICT (id) DO NOTHING;

    -- [Item 28] ภาพถ่ายดาวเทียมสำรวจทรัพยากร THEOS-2 (Asset - Image 2565)
    item_id_var := '30000000-0000-0000-0000-000000000028';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, created_by)
    VALUES (item_id_var, ws_org_id, 'asset', 'ภาพถ่ายดาวเทียมความละเอียดสูงลุ่มน้ำเจ้าพระยา จากดาวเทียม THEOS-2 (พ.ศ. 2565)',
            'ภาพสแกนดิจิทัลความละเอียด 50 เซนติเมตรเพื่อการบริหารจัดการทรัพยากรน้ำและการวางผังเมืองของประเทศ',
            '2022-01-01 00:00:00+00', '2022-12-31 23:59:59+00', 'year', false, 164099520001, u_piti_id)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO assets (item_id, storage_key, original_filename, mime_type, size_bytes, checksum_sha256, width, height, status)
    VALUES (item_id_var, 'permanent-assets/ws-org/theos2_chaophraya_2022.tiff', 'theos2_satellite_chaophraya_basin_2022.tiff', 'image/tiff', 88400000,
            '7286d9a1846b08053a4732152aa00f40d3a7e584f3ab666014457b3223058866', 8000, 8000, 'ready')
    ON CONFLICT (item_id) DO NOTHING;

    -- [Item 29] นิทรรศการเสมือนจริง: พัฒนาการสะพานข้ามแม่น้ำเจ้าพระยา 100 ปี (Note - Range 1932 - 2022)
    item_id_var := '30000000-0000-0000-0000-000000000029';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, created_by)
    VALUES (item_id_var, ws_org_id, 'note', 'บทความคัดสรร: 9 ทศวรรษแห่งสะพานข้ามแม่น้ำเจ้าพระยา จากสะพานพุทธสู่สะพานคู่ขนานพระราม 9',
            'การศึกษาเชิงเปรียบเทียบการขยายตัวของกรุงเทพมหานครและเมืองบริวารผ่านการสร้างสะพานและอุโมงค์คมนาคม',
            '1932-04-06 00:00:00+00', '2022-12-31 23:59:59+00', 'year', false, -119093760001, u_oranong_id)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO collection_items (collection_id, item_id, sort_order) VALUES (col_infra_id, item_id_var, 4) ON CONFLICT DO NOTHING;

    -- ========================================================================
    -- Personal Workspace (Workspace A: somchai-family-archive)
    -- Crucial for verifying Multi-Tenancy Row-Level Security!
    -- ========================================================================

    -- [Item 30] จดหมายส่วนตัวของคุณทวดเรื่องการสร้างบ้านไม้สักริมคลอง (Asset - PDF circa 2488)
    item_id_var := '30000000-0000-0000-0000-000000000030';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, created_by)
    VALUES (item_id_var, ws_personal_id, 'asset', 'จดหมายลายมือคุณทวดเขียนสั่งไม้สักทองสร้างเรือนไทยริมคลองบางกอกน้อย (circa พ.ศ. 2488)',
            'จดหมายครอบครัวบันทึกราคาค่าจ้างช่างไม้และการขนส่งซุงทางแพล่องจากเมืองเหนือหลังสิ้นสุดสงคราม',
            '1940-01-01 00:00:00+00', '1950-12-31 23:59:59+00', 'year', true, -78891840001, u_somchai_id)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO assets (item_id, storage_key, original_filename, mime_type, size_bytes, checksum_sha256, status)
    VALUES (item_id_var, 'permanent-assets/ws-somchai/letter_teakhouse_1945.pdf', 'great_grandfather_letter_teakhouse.pdf', 'application/pdf', 15400000,
            '7d793037a0760186574b0282f2f435e7b1e50774690f697b49dac838febd9e90', 'ready')
    ON CONFLICT (item_id) DO NOTHING;
    INSERT INTO item_tags (item_id, tag_id) VALUES (item_id_var, tag_family_id) ON CONFLICT DO NOTHING;

    -- [Item 31] ภาพถ่ายงานแต่งงานรุ่นคุณปู่คุณย่าที่ท่าน้ำศิริราช (Asset - Image 12 ส.ค. 2498)
    item_id_var := '30000000-0000-0000-0000-000000000031';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, created_by)
    VALUES (item_id_var, ws_personal_id, 'asset', 'ภาพถ่ายพิธีมงคลสมรสคุณปู่จำรัสและคุณย่าละม่อม ณ ท่าน้ำศิริราช 12 สิงหาคม 2498',
            'ภาพขาวดำชุดไทยศิวาลัยและชุดราชปะแตน สมาชิกตระกูลร่วมถ่ายภาพหน้าแพริมน้ำ บันทึกโดยช่างภาพห้องภาพสยามพาณิชย์',
            '1955-08-12 09:00:00+07', '1955-08-12 17:00:00+07', 'day', false, -45403200003, u_somchai_id)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO assets (item_id, storage_key, original_filename, mime_type, size_bytes, checksum_sha256, width, height, status)
    VALUES (item_id_var, 'permanent-assets/ws-somchai/wedding_grandparents_1955.jpg', 'grandparents_wedding_siriraj_1955.jpg', 'image/jpeg', 18900000,
            '1277a80b72a6bc80482aa0fe8b2eb59573887019794bf299a912bbbc155fa6ba', 4000, 3000, 'ready')
    ON CONFLICT (item_id) DO NOTHING;
    INSERT INTO item_tags (item_id, tag_id) VALUES (item_id_var, tag_family_id) ON CONFLICT DO NOTHING;

    -- [Item 32] บันทึกรายรับ-รายจ่ายร้านขายยาไทยโบราณตระกูลสมชาย (Asset - PDF Range 2505 - 2515)
    item_id_var := '30000000-0000-0000-0000-000000000032';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, created_by)
    VALUES (item_id_var, ws_personal_id, 'asset', 'สมุดบัญชีเทียบยาสมุนไพรและรายรับร้านขายยาโอสถโบราณ (พ.ศ. 2505 - 2515)',
            'สมุดข่อยและกระดาษฟุลสแก๊ปบันทึกตำรับยาหอม ยาลม และการติดต่อซื้อขายสมุนไพรจากเยาวราช',
            '1962-01-01 00:00:00+00', '1972-12-31 23:59:59+00', 'year', false, -25246080001, u_somchai_id)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO assets (item_id, storage_key, original_filename, mime_type, size_bytes, checksum_sha256, status)
    VALUES (item_id_var, 'permanent-assets/ws-somchai/herbal_pharmacy_ledger.pdf', 'somchai_traditional_pharmacy_ledger.pdf', 'application/pdf', 42100000,
            'd98cf53e77864c2a49f7e51c8a16dbd7831f13b6cb64c7d0d0f6fd35a0f6789b', 'ready')
    ON CONFLICT (item_id) DO NOTHING;

    -- [Item 33] ลิงก์แผนที่ประวัติศาสตร์คลองโบราณฝั่งธนบุรี (Link 2520, Workspace A)
    item_id_var := '30000000-0000-0000-0000-000000000033';
    INSERT INTO items (id, workspace_id, type, title, description, event_start, event_end, date_precision, is_circa, sort_key, created_by)
    VALUES (item_id_var, ws_personal_id, 'link', 'แผนที่ภาพถ่ายดาวเทียมจำลองคลองโบราณและแปลงที่ดินฝั่งธนบุรี พ.ศ. 2520',
            'ข้อมูลภูมิศาสตร์เปรียบเทียบแนวคลองถมกับถนนตัดใหม่บริเวณคลองสานและบางกอกใหญ่',
            '1977-01-01 00:00:00+00', '1977-12-31 23:59:59+00', 'year', false, 22092480001, u_somchai_id)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO links (item_id, url, normalized_url, domain, og_title, og_description)
    VALUES (item_id_var, 'https://maps.arcgis.com/apps/thonburi-canals-1977', 'https://maps.arcgis.com/apps/thonburi-canals-1977', 'maps.arcgis.com',
            'แผนที่โครงข่ายคลองโบราณธนบุรี 2520', 'สำรวจร่องรอยคูคลองและสวนผลไม้โบราณก่อนการพัฒนาเมือง')
    ON CONFLICT (item_id) DO NOTHING;

    -- 8. Insert Milestones on Timeline
    INSERT INTO milestones (workspace_id, title, description, target_date_start, target_date_end, color) VALUES
    (ws_org_id, 'การอภิวัฒน์สยาม 2475', 'จุดเริ่มต้นของระบอบประชาธิปไตยไทย', '1932-06-24 00:00:00+00', '1932-06-24 23:59:59+00', '#DC2626'),
    (ws_org_id, 'เหตุการณ์ 14 ตุลาคม 2516', 'การตื่นตัวทางการเมืองของนิสิตนักศึกษาประชาชน', '1973-10-14 00:00:00+00', '1973-10-14 23:59:59+00', '#B91C1C'),
    (ws_org_id, 'วิกฤตต้มยำกุ้ง 2540', 'วิกฤตเศรษฐกิจและการลอยตัวค่าเงินบาท', '1997-07-02 00:00:00+00', '1997-07-02 23:59:59+00', '#D97706'),
    (ws_org_id, 'กำเนิดระบบรถไฟฟ้าขนส่งมวลชน BTS 2542', 'การเปิดศักราชการเดินทางระบบรางในมหานคร', '1999-12-05 00:00:00+00', '1999-12-05 23:59:59+00', '#2563EB')
    ON CONFLICT DO NOTHING;

    -- 9. Insert Custom Fields & Dynamic Values
    INSERT INTO custom_field_definitions (id, workspace_id, field_name, field_type, options, is_required) VALUES
    ('44444444-4444-4444-4444-444444444441', ws_org_id, 'historical_era', 'select', '["รัตนโกสินทร์ตอนต้น","ปฏิรูปประเทศ ร.5","ประชาธิปไตยช่วงแรก","สงครามเย็นและยุคพัฒนา","ยุคสารสนเทศและดิจิทัล"]'::jsonb, true),
    ('44444444-4444-4444-4444-444444444442', ws_org_id, 'physical_storage_location', 'text', '{}'::jsonb, false)
    ON CONFLICT DO NOTHING;

    INSERT INTO item_custom_values (item_id, field_definition_id, value_json) VALUES
    ('30000000-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444441', '"ประชาธิปไตยช่วงแรก"'::jsonb),
    ('30000000-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444442', '"ตู้เอกสารชั้น 3 ห้องนิรภัย A"'::jsonb),
    ('30000000-0000-0000-0000-000000000010', '44444444-4444-4444-4444-444444444441', '"สงครามเย็นและยุคพัฒนา"'::jsonb)
    ON CONFLICT DO NOTHING;

    -- 10. Insert Shares (Passcode-protected Link)
    INSERT INTO shares (workspace_id, collection_id, share_token, passcode_hash, permission, expires_at, max_uses) VALUES
    (ws_org_id, col_2475_id, 'share_2475_revolution_demo_token', '$argon2id$v=19$m=65536,t=3,p=4$dummyhashpasscode', 'view', NOW() + INTERVAL '30 days', 100)
    ON CONFLICT DO NOTHING;

    -- 11. Insert Audit Logs
    INSERT INTO audit_logs (workspace_id, actor_id, action, entity_type, entity_id, new_values) VALUES
    (ws_org_id, u_nonglak_id, 'WORKSPACE_INITIALIZED', 'workspace', ws_org_id, '{"name":"หอจดหมายเหตุประวัติศาสตร์และวัฒนธรรมไทย"}'::jsonb),
    (ws_org_id, u_piti_id, 'ITEM_CREATED', 'item', '30000000-0000-0000-0000-000000000001', '{"title":"การเปลี่ยนแปลงการปกครอง 24 มิถุนายน 2475"}'::jsonb),
    (ws_org_id, u_piti_id, 'ASSET_UPLOADED', 'asset', '30000000-0000-0000-0000-000000000002', '{"filename":"2479_plaque_monument.png","size":14502800}'::jsonb),
    (ws_personal_id, u_somchai_id, 'ITEM_CREATED', 'item', '30000000-0000-0000-0000-000000000030', '{"title":"จดหมายส่วนตัวของคุณทวดเขียนสั่งไม้สักทองสร้างเรือนไทยริมคลองบางกอกน้อย"}'::jsonb)
    ON CONFLICT DO NOTHING;

END $$;
