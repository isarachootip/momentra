# ADR 008: Personal Social Portal, Link Ingestion & Bento Showcase

## Status
**Accepted** · ขยายขีดความสามารถ Personal Use ของ Momentra (HDAM)

## Context
- ผู้ใช้ต้องการพื้นที่สาธารณะส่วนบุคคล (Personal Link / Showcase) เมื่อสมัครสมาชิก Momentra
- ผู้ใช้ต้องการรวบรวม Digital Footprint จาก Social Media ต่างๆ (Facebook, Instagram, YouTube, TikTok, ฯลฯ) มาไว้ในหน้าเดียว
- ปัญหาหลัก:
  1. **API Lockout**: Meta และ TikTok ปิดกั้น Public Search API แบบบุคคลภายนอกโดยเด็ดขาด
  2. **ลิขสิทธิ์และ Storage Cost**: การดาวน์โหลดวิดีโอ/เพลง/รูปภาพของแพลตฟอร์มอื่นมาเก็บใน Server เสี่ยงต่อการละเมิดลิขสิทธิ์และสร้างภาระค่า Storage มหาศาล
  3. **Event Date Integrity**: โซเชียลมีเดียบันทึกเฉพาะ "วันที่โพสต์ (Post Date)" ซึ่งบ่อยครั้งไม่ตรงกับ "วันที่เหตุการณ์เกิดจริง (Historical Event Date)"
  4. **Multi-tenant RLS**: เดิมระบบออกแบบเป็น Workspace-isolated ไม่อนุญาตให้ Anonymous เข้าถึงข้อมูล

## Decision

### 1. Ingestion Model (ค้นหาและนำเข้าโดยไม่ละเมิดลิขสิทธิ์)
- **Search Discovery**: ใช้ SERP API / Google Custom Search เพื่อค้นหา Public Mentions ของชื่อ-นามสกุล โดยแบ่งเป็น 4 หมวด: Facebook/IG, YouTube, TikTok, และ Other Web
- **Embed-only Policy**: จัดเก็บเฉพาะ URL, OpenGraph metadata, และ oEmbed Player snippet (ไม่มีการดาวน์โหลดไฟล์ media ลง Server)
- **Historical Event Date First**: นำ Publish Date จาก OpenGraph/oEmbed มาเป็น Default Event Date และบังคับ/เปิดช่องให้ผู้ใช้แก้ไขวันที่เกิดเหตุการณ์จริง พร้อมระบุ `date_precision` และ `is_circa` ตาม Core Domain Rule

### 2. Personal Public Page (`/@username` หรือ `/p/[username]`)
- **Opt-in Publication**: หน้า Profile เป็น Private โดยค่าเริ่มต้น (`is_page_published = false`) ผู้ใช้ต้องกดยืนยันเผยแพร่ด้วยตนเอง ป้องกัน PDPA / Impersonation
- **Dual Display Template**:
  - `bento`: Modular Card Grid แสดง Bio, ช่องทางติดต่อโซเชียล, และ Media Embeds เด่น
  - `timeline`: Historical Living Timeline เรียงตาม `event_date` แบบตามลำดับเวลาประวัติศาสตร์
- **Grouping**: ใช้ Table `collections` เดิม โดยเพิ่ม `is_public` เพื่อแสดงผลเป็น Section กลุ่มข้อมูลบนหน้าเพจ

### 3. Data Model Extensions
- `users`: เพิ่ม `username` (unique slug), `is_page_published`, `page_template`, `page_theme`, `page_bio`, `social_links` (JSONB)
- `items`: เพิ่ม `is_public` (boolean), `embed_metadata` (JSONB)
- `collections`: เพิ่ม `is_public` (boolean), `display_order` (int)

### 4. Row Level Security (RLS) สำหรับ Public Access
- เพิ่ม Permissive Policy บนตาราง `items` และ `collections`:
  - อนุญาต `SELECT` หาก `is_public = TRUE` และผู้สร้างมี `is_page_published = TRUE`
  - หากมี Session ใน Workspace จะใช้ Workspace RLS เดิมตามปกติ

### 5. Security & Isolation Guardrails
- **SSRF Guard**: ตรวจสอบ URL ปลายทางก่อน Fetch Metadata ป้องกันการยิงหา Internal IP (RFC 1918), Localhost (127.0.0.1) และ Cloud Metadata (169.254.169.254)
- **Sandboxed Embed Player**: จำกัด iframe ด้วย sandbox attribute และ Allowlist เฉพาะ Trusted Domains (`*.youtube-nocookie.com`, `*.tiktok.com`, `*.instagram.com`) ป้องกัน XSS

## Consequences

### Positive
- ปลอดภัยต่อกฎหมายลิขสิทธิ์ 100% เพราะอาศัย Embedded Player และ Public OpenGraph
- ไม่เพิ่มภาระค่าใช้จ่าย Storage และ Bandwidth ของ Server
- คงคุณค่าหลักของ Momentra: จัดเรียงข้อมูลโซเชียลตามวันเวลาของเหตุการณ์จริง ไม่ใช่วันที่โพสต์
- เพิ่มความน่าใช้งานและขยายฐานผู้ใช้ประเภทบุคคลทั่วไป (Personal branding / Portfolio / Bio-link)

### Negative / Trade-offs
- หากต้นทางบน YouTube/TikTok ลบคลิป หรือตั้งเป็น Private ตัว Embed ใน Momentra จะเล่นไม่ได้ (ต้องมี Graceful Fallback UI)
- การค้นหาชื่อ-นามสกุลอาจได้ผลลัพธ์ปะปนกับบุคคลอื่นที่มีชื่อเดียวกัน ผู้ใช้ต้องเป็นคน Curate และเลือกเองเสมอ
