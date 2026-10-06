# Momentra (HDAM) — Security Audit & Vulnerability Assessment Report
## รายงานการตรวจสอบความมั่นคงปลอดภัยและการประเมินช่องโหว่ (Phase 8A)

> **รหัสเอกสาร:** MOMENTRA-SEC-08  
> **เวอร์ชัน:** 1.0.0 (Phase 8 Baseline)  
> **สถานะ:** Adversarial Audit Complete  
> **บทบาทผู้ตรวจสอบ:** Independent Application Security Engineer & QA Lead  
> **กรอบอ้างอิง:** OWASP Top 10 (2021), OWASP API Security Top 10 (2023), PDPA (พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562), ISO/IEC 27001  
> **เอกสารอ้างอิง:** [docs/01-srs.md](file:///c:/atgv/momentra/docs/01-srs.md), [docs/02-architecture.md](file:///c:/atgv/momentra/docs/02-architecture.md), [api/openapi.yaml](file:///c:/atgv/momentra/api/openapi.yaml)  

---

## 1. บทสรุปสำหรับผู้บริหาร (Executive Summary)

ทีมตรวจสอบความมั่นคงปลอดภัยอิสระได้ทำการตรวจสอบสถาปัตยกรรม, ซอร์สโค้ด (Static Analysis), สัญญา API, และการกำหนดค่าฐานข้อมูลของระบบ **Momentra** (**HDAM**) โดยไม่เข้าข้างทีมพัฒนา เพื่อค้นหาจุดบกพร่อง ช่องโหว่ และความเสี่ยงก่อนนำระบบขึ้นสู่สภาวะแวดล้อม Production

### สรุปจำนวนข้อตรวจพบ (Vulnerability Summary Matrix)

| ระดับความรุนแรง (Severity) | จำนวนที่พบ | สถานะปัจจุบัน | ต้องแก้ก่อน Go-Live? (Blocker) |
| :--- | :---: | :---: | :---: |
| **Critical (วิกฤติ)** | 1 | ระบุตำแหน่งและวิธีแก้ชัดเจน | **ใช่ (Blocker)** |
| **High (สูง)** | 3 | ระบุตำแหน่งและวิธีแก้ชัดเจน | **ใช่ (Blocker)** |
| **Medium (ปานกลาง)** | 3 | มีมาตรการบรรเทาความเสี่ยง | ควรแก้ไขก่อน Go-Live |
| **Low / Informational (ต่ำ)** | 2 | มีแนวทางปรับปรุง | ดำเนินการในรอบบำรุงรักษา |
| **รวมทั้งหมด** | **9** | **พร้อมแผนแก้ไข** | **4 Blocker Items** |

---

## 2. รายละเอียดข้อตรวจพบความมั่นคงปลอดภัย (Security Findings)

---

### [SEC-CRIT-01] การยืนยันตัวตน OIDC ยอมรับ Raw Email ทำให้ผู้ไม่หวังดีสวมสิทธิ์ผู้ใช้อื่นได้ (Authentication Bypass)
* **ระดับความรุนแรง:** **CRITICAL** (CVSS 3.1 Score: 9.8 - `AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`)
* **OWASP Classification:** API2:2023 Broken Authentication / A07:2021 Identification and Authentication Failures
* **ตำแหน่งโค้ด:** [`src/modules/auth/auth.service.ts`](file:///c:/atgv/momentra/src/modules/auth/auth.service.ts#L68-L75)
* **ลักษณะช่องโหว่:**  
  ในฟังก์ชัน `loginWithOidc(idToken: string)` มีโค้ดม็อกสำหรับการพัฒนาที่ตรวจสอบเพียงว่า `if (idToken.includes('@')) { email = idToken; }` แล้วนำไปค้นหาผู้ใช้ในฐานข้อมูลและออก Access Token ทันที โดยไม่ได้ตรวจสอบลายเซ็น Cryptographic Signature (JWT verify) กับ Google JWKS Public Key
* **ขั้นตอนการทำซ้ำ (Proof of Concept):**
  1. ผู้โจมตีส่ง HTTP Request:
     ```http
     POST /api/v1/auth/login HTTP/1.1
     Content-Type: application/json

     {
       "provider": "oidc",
       "id_token": "somchai@momentra.app"
     }
     ```
  2. เซิร์ฟเวอร์ส่งกลับ HTTP 200 พร้อม Access Token และ Refresh Token ของ `somchai@momentra.app` (Owner) ทันทีโดยไม่ต้องมีรหัสผ่าน
* **ผลกระทบ:** ผู้โจมตีสามารถเข้ายึดบัญชีของใครก็ได้ในระบบ รวมถึงผู้ดูแลระบบสูงสุด (Account Takeover)
* **วิธีแก้ไข (Remediation):**
  แทนที่ Mock Logic ด้วยการตรวจสอบ Google OAuth2 / OIDC ID Token จริง โดยใช้คลัง `google-auth-library` หรือ `jose` เพื่อตรวจสอบ Header, Issuer (`https://accounts.google.com`), Audience (`GOOGLE_CLIENT_ID`), วันหมดอายุ และลายเซ็น RSA จาก Google Certificates ก่อนดึงอีเมลจริง

---

### [SEC-HIGH-01] ขาดการบล็อก Private IP ทำให้เสี่ยงต่อ Server-Side Request Forgery (SSRF) ในการดึงพรีวิวลิงก์
* **ระดับความรุนแรง:** **HIGH** (CVSS 3.1 Score: 8.6 - `AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:N/A:N`)
* **OWASP Classification:** API7:2023 Server Side Request Forgery / A10:2021 Server-Side Request Forgery (SSRF)
* **ตำแหน่งข้อกำหนดและโค้ด:** [api/openapi.yaml](file:///c:/atgv/momentra/api/openapi.yaml) (`POST /api/v1/links`), [docs/02-architecture.md](file:///c:/atgv/momentra/docs/02-architecture.md)
* **ลักษณะช่องโหว่:**  
  ฟังก์ชันการดึง OpenGraph Metadata จาก URL ภายนอก หาก Worker ทำการ `fetch(url)` โดยตรง ผู้ใช้ที่มีสิทธิ์ Contributor สามารถป้อน URL เครือข่ายภายใน เช่น:
  - `http://169.254.169.254/latest/meta-data/` (Cloud Instance Metadata / IAM Tokens)
  - `http://127.0.0.1:5432` หรือ `http://localhost:6379` (PostgreSQL / Redis ภายใน)
  - `http://10.0.0.0/8` หรือ `http://192.168.0.0/16` (Hostinger VPS Internal Subnet)
* **ขั้นตอนการทำซ้ำ (Proof of Concept):**
  1. ยิงคำขอ `POST /api/v1/links` ด้วย URL `http://169.254.169.254/latest/meta-data/iam/security-credentials/`
  2. หาก Worker ส่งผลลัพธ์ Title หรือ Description กลับมา จะทำให้ข้อมูล Security Credentials ของคลาวด์รั่วไหล
* **ผลกระทบ:** ผู้โจมตีสามารถขโมย IAM Role/Secret Keys ของคลาวด์ หรือสแกนเปิดเผยบริการภายในของโฮสต์ (Internal Port Scanning)
* **วิธีแก้ไข (Remediation):**
  1. ติดตั้ง SSRF Guard ก่อนส่ง HTTP Request:
     - ทำ DNS Resolution ล่วงหน้าเพื่อหา IP ปลายทาง
     - บล็อก IP ที่ตรงกับ RFC 1918 (Private), RFC 3927 (Link-Local `169.254.0.0/16`), Loopback (`127.0.0.0/8`), และ IPv6 (`::1`, `fc00::/7`)
     - ล็อก IP ในการเชื่อมต่อ (IP Pinning) เพื่อป้องกันการโจมตีแบบ **DNS Rebinding**
  2. กำหนด Timeout สั้น (ไม่เกิน 3 วินาที), ปิดการติดตาม HTTP Redirect ข้ามโดเมน, และจำกัด Response Size ไม่เกิน 2 MB

---

### [SEC-HIGH-02] ช่องโหว่ Stored XSS และ Malware ผ่านการอัปโหลดไฟล์จำพวก SVG/HTML และการหลบเลี่ยง Magic Bytes
* **ระดับความรุนแรง:** **HIGH** (CVSS 3.1 Score: 8.2 - `AV:N/AC:L/PR:L/UI:R/S:C/C:H/I:L/A:N`)
* **OWASP Classification:** API8:2023 Security Misconfiguration / A03:2021 Injection
* **ตำแหน่งสถาปัตยกรรม:** [docs/02-architecture.md](file:///c:/atgv/momentra/docs/02-architecture.md#L305-L340), `POST /assets/uploads`
* **ลักษณะช่องโหว่:**  
  1. สถาปัตยกรรมใช้ Presigned URL ให้ Client อัปโหลดตรงเข้า S3 Storage หากผู้ใช้ขอ Presigned URL ด้วย Mime-type `image/svg+xml` หรือ `text/html` แล้วแนบ Payload JavaScript เช่น `<svg onload="alert(document.cookie)">`
  2. เมื่อผู้ใช้อื่นเปิดดูภาพ SVG บนเบราว์เซอร์จากโดเมนหลัก สคริปต์อันตรายจะถูกสั่งรันใน Context ของเบราว์เซอร์เหยื่อ
* **ผลกระทบ:** การขโมย Session Token, การส่งคำขอในนามผู้ใช้อื่น (Cross-Site Scripting), การแพร่กระจายมัลแวร์
* **วิธีแก้ไข (Remediation):**
  1. **Content-Type & Header Hardening:** เมื่อดาวน์โหลดหรือแสดงผลไฟล์ภาพ SVG หรือ HTML ต้องบังคับ Header:
     - `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; sandbox`
     - หรือบังคับดาวน์โหลดเป็น Attachment ด้วย `Content-Disposition: attachment; filename="..."`
  2. **Worker Magic Bytes Verification:** Worker ที่รัน Sharp ต้องตรวจสอบ Magic Bytes จริงของไบนารีไฟล์ ไม่เชื่อ Mime-type จาก Client และแปลงภาพ SVG/PNG ให้เป็น WebP ก่อนแสดงผลบนไทม์ไลน์
  3. **ClamAV Integration:** บังคับสแกนไฟล์ด้วย ClamAV ใน Worker ก่อนปรับสถานะเป็น `ready`

---

### [SEC-HIGH-03] ขาด Rate Limiting ป้องกันการ Brute Force รหัสผ่าน และการยิง DoS ทรัพยากรระบบ
* **ระดับความรุนแรง:** **HIGH** (CVSS 3.1 Score: 7.5 - `AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H`)
* **OWASP Classification:** API4:2023 Unrestricted Resource Consumption / A04:2021 Insecure Design
* **ตำแหน่งโค้ด:** [`src/app.ts`](file:///c:/atgv/momentra/src/app.ts)
* **ลักษณะช่องโหว่:**  
  ใน `src/app.ts` ยังไม่มีการลงทะเบียน `@fastify/rate-limit` ทำให้ Endpoint สำคัญอย่าง:
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
  - `GET /api/v1/search`
  สามารถถูกส่งคำขออย่างต่อเนื่องนับหมื่นครั้งต่อนาทีจาก IP เดียว
* **ผลกระทบ:** การเดารหัสผ่านผู้ใช้ (Credential Stuffing), การทำให้ฐานข้อมูล PostgreSQL และ Redis โอเวอร์โหลดจนระบบหยุดให้บริการ (Denial of Service)
* **วิธีแก้ไข (Remediation):**
  ติดตั้งและตั้งค่า `@fastify/rate-limit` ใน `src/app.ts`:
  - Auth Endpoints (`/auth/login`, `/auth/refresh`): สูงสุด 10 คำขอ / นาที ต่อ IP
  - Search & Timeline (`/search`, `/timeline`): สูงสุด 120 คำขอ / นาที ต่อ IP
  - Public Shares (`/public/shares/*`): สูงสุด 30 คำขอ / นาที ต่อ IP

---

### [SEC-MED-01] การตรวจสอบลายเซ็น JWT ด้วย String Inequality เสี่ยงต่อการโจมตี Timing Attack
* **ระดับความรุนแรง:** **MEDIUM** (CVSS 3.1 Score: 5.3 - `AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:L/A:N`)
* **OWASP Classification:** API2:2023 Broken Authentication / A02:2021 Cryptographic Failures
* **ตำแหน่งโค้ด:** [`src/core/security/token-service.ts`](file:///c:/atgv/momentra/src/core/security/token-service.ts#L71)
* **ลักษณะช่องโหว่:**  
  คำสั่ง `if (signatureB64 !== expectedSig)` เปรียบเทียบสตริงแบบปกติ ซึ่งใน V8 Engine จะคืนค่า `false` ทันทีที่พบไบต์แรกที่ไม่ตรงกัน ทำให้ใช้เวลาสั้นกว่าสตริงที่ตรงกันหลายไบต์ ผู้โจมตีสามารถวัดความต่างของเวลาในระดับไมโครวินาทีเพื่อเดาลายเซ็นได้
* **วิธีแก้ไข (Remediation):**
  ใช้ฟังก์ชันที่ทนทานต่อการโจมตีเชิงเวลา:
  ```typescript
  import { timingSafeEqual } from 'node:crypto';
  
  const sigBuffer = Buffer.from(signatureB64);
  const expectedBuffer = Buffer.from(expectedSig);
  if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
    throw new UnauthorizedError('Invalid token signature');
  }
  ```

---

### [SEC-MED-02] ข้อมูลพิกัดสถานที่ส่วนบุคคล (GPS Latitude/Longitude) ใน EXIF สุ่มเสี่ยงต่อการละเมิด PDPA
* **ระดับความรุนแรง:** **MEDIUM** (CVSS 3.1 Score: 5.3 - `AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N`)
* **การปฏิบัติตามกฎหมาย:** พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) มาตรา 26, 27
* **ลักษณะข้อตรวจพบ:**  
  ภาพถ่ายจากกล้องสมาร์ตโฟนสมัยใหม่มักบันทึกพิกัด GPS ของบ้านพักหรือสถานที่ส่วนบุคคลไว้ใน EXIF หากระบบนำค่า `exif_json` ไปแสดงผลต่อสาธารณะบนนิทรรศการ (Public Exhibition) โดยไม่มีการคัดกรอง อาจเปิดเผยตำแหน่งที่อยู่ของเจ้าของข้อมูลโดยไม่ได้รับความยินยอม
* **วิธีแก้ไข (Remediation):**
  1. เพิ่มตัวเลือกในหน้าอัปโหลด: *"ลบข้อมูลพิกัดส่วนตัว (Strip GPS Metadata)"* โดยให้เปิดเป็นค่าเริ่มต้น (Default True)
  2. เมื่อ Asset ถูกแชร์เป็น `public` หรือเข้าชมผ่าน Guest Share ให้กรองคีย์ `GPSLatitude`, `GPSLongitude`, และ `SerialNumber` ออกจาก Response เสมอ

---

### [SEC-MED-03] การใช้ `pool.query()` โดยตรงในบางจุดอาจข้ามพ้นกลไก Row-Level Security (RLS)
* **ระดับความรุนแรง:** **MEDIUM** (CVSS 3.1 Score: 6.5 - `AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N`)
* **OWASP Classification:** API1:2023 Broken Object Level Authorization (BOLA)
* **ตำแหน่งโค้ด:** [`src/modules/auth/auth.repository.ts`](file:///c:/atgv/momentra/src/modules/auth/auth.repository.ts#L46)
* **ลักษณะข้อตรวจพบ:**  
  ในโมดูลถัดไป (Items, Assets, Collections) หาก Developer เรียก `pool.query()` โดยตรงแทนที่จะใช้ `withWorkspaceContext(workspaceId, ...)` คำสั่ง SQL จะรันภายใต้สิทธิ์ของ `neondb_owner` ซึ่งมีคุณสมบัติ `BYPASSRLS = true` ในเคอร์เนลของ PostgreSQL ทำให้ข้อมูลของทุก Workspace ไม่ถูกแยกจากกัน
* **วิธีแก้ไข (Remediation):**
  สร้าง Architectural Linter หรือ Code Pattern บังคับให้ Repository ที่เกี่ยวข้องกับ Entity ของ Tenant ต้องเรียกใช้ `withWorkspaceContext()` เสมอ และห้าม Export `pool` สู่ Service Layer โดยตรง

---

### [SEC-LOW-01] กลไกการทำลายข้อมูลถาวรในถังขยะ (30-Day Purge) ต้องมี Dead-Man Switch ตรวจสอบ
* **ระดับความรุนแรง:** **LOW**
* **ข้อกำหนดที่เกี่ยวข้อง:** FR-ASSET-03, NFR-PDPA-01
* **ลักษณะข้อตรวจพบ:**  
  ระบบต้องมี Scheduled Worker คอยลบข้อมูลที่ `deleted_at < NOW() - INTERVAL '30 days'` หาก Worker ตัวนี้หยุดทำงาน ข้อมูลจะค้างอยู่ในระบบเกินกว่าที่นโยบายความเป็นส่วนตัวกำหนด
* **วิธีแก้ไข (Remediation):**
  จัดทำ Alert แจ้งเตือนใน Prometheus/Sentry หาก Cron Job สำหรับ Purge ไม่ได้ทำงานภายใน 36 ชั่วโมง

---

### [SEC-LOW-02] ช่องโหว่ระดับปานกลางใน DevDependency (`@vitest/mocker`)
* **ระดับความรุนแรง:** **LOW** (กระทบเฉพาะเวลาทดสอบโค้ดบนเครื่อง Dev ไม่กระทบ Production Runtime)
* **CVE/Advisory:** GHSA-82fw-gwwq-j7x9 (Path Traversal ใน Vitest Mock)
* **วิธีแก้ไข (Remediation):**
  อัปเดต Vitest สู่เวอร์ชันแพตช์ล่าสุดในรอบการบำรุงรักษาถัดไป

---

## 3. รายการสิ่งที่ต้องแก้ไขก่อนเปิดบริการจริง (Pre-Go-Live Blocker List)

| ลำดับ | รหัส Finding | รายละเอียดงานที่ต้องแก้ไข | ผู้รับผิดชอบ | เกณฑ์การผ่าน (Acceptance Criteria) |
| :---: | :--- | :--- | :--- | :--- |
| **B1** | **SEC-CRIT-01** | พัฒนาตัวตรวจสอบ Google OIDC ID Token ด้วย Cryptographic Signature จริง | Backend Lead | ไม่สามารถส่ง Mock Email เข้าสู่ระบบได้ ต้องใช้ Token ที่มีลายเซ็นถูกต้องจาก Google เท่านั้น |
| **B2** | **SEC-HIGH-01** | ติดตั้ง SSRF Protection Middleware บน Link Preview Fetcher | Security Engineer | บล็อก URL เครือข่าย Private IP (`10.*`, `172.16.*`, `192.168.*`, `127.*`, `169.254.*`) ได้ 100% |
| **B3** | **SEC-HIGH-02** | เพิ่ม Content-Security-Policy และจำกัดประเภทไฟล์ภาพ SVG/HTML | Frontend/Infra | ไฟล์ SVG ถูกเรนเดอร์ใน Sandboxed iframe หรือแปลงเป็น WebP ก่อนแสดงผล |
| **B4** | **SEC-HIGH-03** | ติดตั้ง `@fastify/rate-limit` บน Endpoint `/auth/login`, `/auth/refresh`, `/search` | Backend Eng | ส่งคำขอเกิน 10 ครั้ง/นาที บน Login จะต้องได้รับ HTTP 429 Too Many Requests |
| **B5** | **SEC-MED-01** | แก้ไขฟังก์ชันเปรียบเทียบลายเซ็น JWT ให้เป็น `crypto.timingSafeEqual` | Security Eng | โค้ดใน `token-service.ts` ใช้ Constant-time comparison 100% |
| **B6** | **SEC-MED-02** | ทำฟังก์ชัน Strip GPS Coordinates สำหรับภาพที่แชร์แบบ Public | Backend Eng | ดึงข้อมูลภาพในโหมด Public จะต้องไม่พบคีย์ GPS Latitude/Longitude ใน `exif_json` |

---

## 4. สรุปผลการประเมินและการลงนามรับรอง

ระบบ **Momentra** มีโครงสร้างสถาปัตยกรรมด้านการแยก Tenant ด้วย PostgreSQL RLS ที่ยอดเยี่ยม และสัญญา API มีความรัดกุมสูง อย่างไรก็ตาม **ไม่อนุญาตให้นำระบบขึ้น Production จนกว่า Blocker Items ลำดับ B1 ถึง B6 จะได้รับการแก้ไขและตรวจสอบซ้ำ (Re-tested) เรียบร้อยแล้ว**
