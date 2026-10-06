# ADR 005: Multi-tenant Auth & Role-Based Access Control (RBAC)

## Status
**Accepted** (Baseline for Phase 2)

## Context
ระบบ Momentra ต้องรองรับทั้งผู้ใช้เดี่ยว (Personal Archive) และผู้ใช้องค์กร (Organization Archive) โดยมีข้อกำหนด:
- 1 User Account สามารถสร้างและเข้าร่วมได้หลาย Workspace
- บทบาทภายใน Workspace แยกเป็น 4 ระดับ: `Owner`, `Admin`, `Contributor`, `Viewer` (ตาม SRS FR-ACCESS-02)
- ต้องรองรับการเข้าถึงของบุคคลภายนอกผ่าน Guest Share Link ที่มี Passcode และวันหมดอายุ (FR-ACCESS-04)
- ต้องมีความปลอดภัยสูงตามมาตรฐาน OWASP Top 10 และ PDPA โดยไม่สร้างความซับซ้อนเกินกว่าที่ทีมขนาด 2–5 คนจะดูแลได้

ตัวเลือกที่พิจารณา:
1. **Third-party SaaS Auth (Auth0, Clerk):** ใช้งานสะดวก แต่มีค่าใช้จ่ายผูกขาดรายเดือนสูงเมื่อผู้ใช้ขยายตัว และไม่สามารถผสานการทำ RLS บน PostgreSQL ได้แนบแน่น
2. **Keycloak (Self-hosted):** มีฟีเจอร์ระดับองค์กรครบ แต่ใช้ทรัพยากรเครื่องสูงมาก (Java JVM กินแรม 1–2 GB) ไม่เหมาะกับ Hostinger VPS
3. **In-house Session/Token-based Auth with Argon2id + RLS Binding:** จัดเก็บ User และ Workspace ในฐานข้อมูลเดียวกัน เข้ารหัสรหัสผ่านด้วย Argon2id ออก Session Token เก็บใน HTTP-only Secure Cookie และส่งต่อ `workspace_id` เข้าสู่ PostgreSQL RLS

## Decision
เราตัดสินใจเลือก **In-house Multi-tenant Session Engine** ควบคู่กับ **HMAC-signed Guest Tokens**:

1. **Authentication:**
   - ใช้ Session-based Authentication เก็บข้อมูล Session ใน Redis และ PostgreSQL
   - บันทึกลงใน **HTTP-only, Secure, SameSite=Lax Cookie** เพื่อป้องกัน XSS และ CSRF
   - รหัสผ่านเข้ารหัสด้วยอัลกอริทึม **Argon2id** (มาตรฐานความปลอดภัยสูงสุด)
2. **Multi-tenancy & Context Injection:**
   - ทุกคำขอผ่าน Web/API ต้องส่ง Header `x-workspace-id` (หรือคุกกี้ที่เลือก)
   - API Middleware ตรวจสอบสิทธิ์ในตาราง `workspace_members` ว่าผู้ใช้มีสิทธิ์และมีบทบาทใด (Owner, Admin, Contributor, Viewer)
   - Middleware สั่งตั้งค่า Session ใน Transaction: `SET LOCAL app.current_workspace_id = '...';` และ `SET LOCAL app.current_user_role = '...';`
3. **Guest Link Access (Passcode Protected):**
   - เมื่อสร้าง Share Link ระบบจะสร้าง `share_tokens` ที่เก็บ Hash ของ Passcode และวันหมดอายุ
   - เมื่อ Guest ป้อน Passcode ถูกต้อง ระบบจะออก Scoped Short-lived JWT (อายุตามที่เหลือของลิงก์) อนุญาตให้อ่านเฉพาะ Resource ใน Collection ที่ระบุเท่านั้น

## Consequences
### Positive
- **Zero Additional License Cost:** ไม่มีค่าใช้จ่ายรายเดือนเพิ่มสำหรับ External Auth Provider
- **Deep PostgreSQL RLS Integration:** เชื่อมต่อตรงกับ Database Context ทำให้การบังคับสิทธิ์ในระดับตารางเป็นเนื้อเดียวกัน
- **High Security:** ป้องกันการโจรกรรม Token ผ่าน XSS ได้ 100% ด้วย HTTP-only Cookie
- **Independent & Portable:** ข้อมูลผู้ใช้เป็นกรรมสิทธิ์ของระบบ ไม่ผูกขาดกับ Vendor ภายนอก (สอดคล้องกับ PDPA)

### Negative / Trade-offs
- **Password Reset & Email Infrastructure:** ทีมงานต้องดูแล Email Delivery (SMTP/Transactional Email เช่น Resend หรือ Hostinger SMTP) สำหรับ Reset Password เอง

## Compliance to NFRs
- **NFR-SEC-01 & NFR-SEC-02 (Security & Multi-tenant Isolation):** ป้องกันการเข้าถึงข้าม Workspace 100%
- **NFR-SEC-04 (Brute Force Protection):** Rate Limiting 5 ครั้งต่อ 15 นาที ด้วย Redis
