# Momentra (HDAM) — Comprehensive Test Strategy & QA Master Plan
## แผนแม่บทการทดสอบและการประกันคุณภาพซอฟต์แวร์ (Phase 8B)

> **รหัสเอกสาร:** MOMENTRA-QA-08  
> **เวอร์ชัน:** 1.0.0 (Phase 8 Baseline)  
> **บทบาทผู้จัดทำ:** QA Lead & Senior Test Automation Engineer  
> **สอดคล้องกับ:** [docs/01-srs.md](file:///c:/atgv/momentra/docs/01-srs.md), [docs/02-architecture.md](file:///c:/atgv/momentra/docs/02-architecture.md), [api/openapi.yaml](file:///c:/atgv/momentra/api/openapi.yaml)  

---

## 1. ยุทธศาสตร์การทดสอบ (Multi-Layer Test Strategy)

การประกันคุณภาพของระบบ **Momentra** แบ่งออกเป็น 7 ระดับตามพีระมิดการทดสอบ (Testing Pyramid):

```
                     / \
                    /   \
                   / UAT \          -> การทดสอบกับผู้ใช้งานจริง (5 Personas)
                  /-------\
                 / Security\        -> DAST, SAST, Penetration Testing (OWASP)
                /-----------\
               / Performance \      -> k6 Load Testing (1,000 Concurrent, P95 < 300ms)
              /---------------\
             /   E2E Testing   \    -> Playwright (จำลองการทำงานบนเบราว์เซอร์จริง)
            /-------------------\
           /   Contract Testing  \  -> Spectral & Prism (ความสอดคล้องกับ OpenAPI 3.1)
          /-----------------------\
         /   Integration Testing   \-> Fastify Injector + Neon PostgreSQL + RLS Context
        /---------------------------\
       /        Unit Testing         \-> Vitest (Pure Domain Services, Coverage >= 80%)
      /-------------------------------\
```

---

## 2. ตารางแผนการทดสอบครอบคลุมทุกความต้องการ (Test Case Traceability Matrix)

| Test ID | Traceable FR | โมดูล | วัตถุประสงค์และขั้นตอนการทดสอบ | ผลลัพธ์ที่คาดหวัง (Acceptance Criteria) | ประเภทการทดสอบ |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **TC-AST-01** | FR-ASSET-01 | Asset | อัปโหลดไฟล์ภาพ/วิดีโอ/PDF ขนาดปกติ และขนาดใหญ่สูงสุด 4 GB แบบ Multipart | ไบนารีส่งตรงเข้า S3 สำเร็จ พร้อมคืนรหัส `asset_id` สถานะ `processing` | Integration / S3 |
| **TC-AST-02** | FR-ASSET-02 | Asset | ส่งไฟล์ที่มี SHA-256 Checksum ซ้ำกับไฟล์เดิมใน Workspace เดียวกัน | ระบบปฏิเสธพร้อมส่ง HTTP 409 Conflict และระบุ `existing_item_id` | Contract / Unit |
| **TC-AST-03** | FR-ASSET-03 | Asset | สั่งลบ Asset (Soft Delete) | ย้ายเข้าถังขยะ `deleted_at != NULL` หายไปจาก Timeline ทันที | Integration / DB |
| **TC-AST-04** | FR-ASSET-04 | Asset | ผู้ใช้ระดับ Admin สั่งกู้คืน Asset จากถังขยะภายใน 30 วัน | เคลียร์ค่า `deleted_at = NULL` และกลับมาแสดงผลบนไทม์ไลน์ปกติ | Integration |
| **TC-AST-05** | FR-ASSET-05 | Asset | อัปโหลดไฟล์ปลอม Mime-type (เช่น ไฟล์ `.exe` ที่เปลี่ยนนามสกุลเป็น `.jpg`) | Worker ตรวจสอบ Magic Bytes ล้มเหลว ปรับสถานะเป็น `quarantined` | Worker / Security |
| **TC-LNK-01** | FR-LINK-01 | Link | บันทึก URL ที่รูปแบบไม่ถูกต้อง (เช่น `htp:/invalid`) | ระบบแจ้งเตือน 400 Bad Request RFC 9457 ทันที | Unit / Schema |
| **TC-LNK-02** | FR-LINK-02 | Link | บันทึก URL บทความประวัติศาสตร์ที่ถูกต้อง | Worker ดึง Title, Description, Image Preview ภายใน 2 วินาที | Integration |
| **TC-LNK-03** | FR-LINK-03 | Link | ทดสอบ Periodic Health Check กับลิงก์ที่เซิร์ฟเวอร์ปลายทางปิดตัวลง | อัปเดต `is_broken = true` และแสดงป้ายเตือนสีส้มบนหน้าจอ | Worker / Cron |
| **TC-LNK-04** | FR-LINK-04 | Link | ผู้ใช้พยายามบันทึกลิงก์ Private IP (`http://169.254.169.254`) | ระบบ SSRF Guard ดักจับและบล็อกคำขอ ปฏิเสธด้วย HTTP 400 | Security |
| **TC-TIM-01** | FR-TIMELINE-01 | Timeline | บันทึกเหตุการณ์ที่ทราบเพียงปี (`date_precision = 'year'`) | ระบบคำนวณ `event_start` เป็น 1 ม.ค. และ `event_end` เป็น 31 ธ.ค. อัตโนมัติ | Unit / Domain |
| **TC-TIM-02** | FR-TIMELINE-02 | Timeline | ส่งข้อมูลเหตุการณ์ที่ `event_end < event_start` | ระบบปฏิเสธด้วย HTTP 400 Validation Error ทันที | Unit / Constraint |
| **TC-TIM-03** | FR-TIMELINE-03 | Timeline | เรียกดู `/api/v1/timeline?granularity=year` ครอบคลุมช่วง 2470 – 2480 | ส่งกลับ Buckets รายปี พร้อมจำนวนนับและตัวอย่าง Items ตรงตามช่วงเวลา | Integration / GiST |
| **TC-TIM-04** | FR-TIMELINE-04 | Timeline | เรียกดู Timeline พร้อมระบุ `calendar=be` และ `calendar=ce` | คืนค่า `display_label` สลับระหว่างปี พ.ศ. (+543) และ ค.ศ. ถูกต้อง | Presentation / i18n |
| **TC-TIM-05** | FR-TIMELINE-05 | Timeline | บันทึกเหตุการณ์แบบประมาณการณ์ (`is_circa = true`) | ระบบส่งกลับป้าย `[ประมาณ]` หน้าวันที่ในภาษาไทย และ `Circa` ในภาษาอังกฤษ | Presentation |
| **TC-SCH-01** | FR-SEARCH-01 | Search | ค้นหาคำภาษาไทยที่มีการเขียนติดกัน เช่น `"การเปลี่ยนแปลงการปกครอง"` | Tokenizer ตัดคำได้ถูกต้อง และดึงผลลัพธ์ที่ตรงกันผ่าน FTS GIN | Search / FTS |
| **TC-SCH-02** | FR-SEARCH-02 | Search | ค้นหาคำที่มีคำพ้องความหมาย เช่น `"ภาพถ่าย"` | ระบบขยายคำค้น (Synonym) และส่งผลลัพธ์ที่มีคำว่า `"รูป"` หรือ `"ภาพ"` กลับมาด้วย | Search / Synonym |
| **TC-SCH-03** | FR-SEARCH-03 | Search | ค้นหาคำที่พิมพ์ผิดเล็กน้อย เช่น `"รัดทำนูญ"` | Trigram Similarity ค้นหาคำว่า `"รัฐธรรมนูญ"` เจอ (Typo Tolerance) | Search / Trigram |
| **TC-SCH-04** | FR-SEARCH-04 | Search | ค้นหาพร้อมตัวกรองหลายมิติ (`type=asset&from_year=2475&to_year=2480`) | กรองข้อมูลตามเงื่อนไขพร้อมส่งค่าสรุป Facets ถูกต้อง | Integration |
| **TC-ACC-01** | FR-ACCESS-01 | Access | ผู้ใช้จาก Workspace A พยายามเข้าถึง Resource ของ Workspace B | RLS บล็อกการเข้าถึง ส่งกลับ HTTP 404 Not Found (ไม่มีข้อมูลรั่วไหล) | Security / RLS |
| **TC-ACC-02** | FR-ACCESS-02 | Access | ผู้ใช้บทบาท Viewer พยายามส่งคำขอ `DELETE /items/:id` | ระบบส่งกลับ HTTP 403 Forbidden | Security / RBAC |
| **TC-ACC-03** | FR-ACCESS-03 | Access | เข้าชมลิงก์แชร์ที่กำหนดรหัสผ่านโดยไม่ใส่รหัส | ปฏิเสธด้วย HTTP 401 และร้องขอ Passcode Verification | Security / Share |
| **TC-ACC-04** | FR-ACCESS-04 | Access | เข้าชมลิงก์แชร์ที่วันหมดอายุผ่านไปแล้ว (`expires_at < NOW()`) | ส่งกลับ HTTP 410 Gone แจ้งว่าลิงก์หมดอายุแล้ว | Integration |
| **TC-AUD-01** | FR-AUDIT-01 | Audit | แก้ไขข้อมูล Item (Title, Description, Event Date) | บันทึกรายการลงตาราง `audit_logs` พร้อมค่า Before/After JSON | Integration / Audit |

---

## 3. การทดสอบกรณีขอบเขตทางประวัติศาสตร์ (Domain-Specific Edge Cases)

ระบบจดหมายเหตุและสินทรัพย์ประวัติศาสตร์มีกรณีขอบเขตเฉพาะตัวที่ต้องผ่านการตรวจสอบอย่างรัดกุม:

### 3.1 กรณีวันที่ในประวัติศาสตร์ก่อน ค.ศ. 1900 (Pre-1900 Historical Dates)
* **ปัญหาที่มักพบในซอฟต์แวร์ทั่วไป:** ไลบรารีวันที่หลายตัว (เช่น Unix Timestamp แบบ 32-bit หรือบางฟังก์ชันของ JavaScript Date) ทำงานผิดพลาดกับปีก่อน ค.ศ. 1970 หรือก่อน ค.ศ. 1900
* **เงื่อนไขทดสอบ:** บันทึกเอกสาร *"สนธิสัญญาเบาว์ริง พ.ศ. 2398 (ค.ศ. 1855)"* และ *"การสถาปนากรุงรัตนโกสินทร์ พ.ศ. 2325 (ค.ศ. 1782)"*
* **เกณฑ์การผ่าน:** PostgreSQL `TIMESTAMPTZ` และคำนวณ `sort_key` (Negative Epoch หรือ BigInt Offset) สามารถจัดเรียงตามลำดับเวลาในอดีตได้ถูกต้อง 100%

### 3.2 กรณีสับสนระหว่างปี พ.ศ. และ ค.ศ. (Calendar Misconfiguration)
* **ปัญหาที่มักพบ:** ผู้ใช้กรอกปี พ.ศ. `2475` ลงในช่องที่ระบบคาดหวังเป็นปี ค.ศ. ทำให้กลายเป็นปี ค.ศ. 2475 (ซึ่งตรงกับ พ.ศ. 3018 ในอนาคต)
* **เงื่อนไขทดสอบ:** ป้อนปี ค.ศ. ที่มากกว่าปีปัจจุบัน + 50 ปี (เช่น > 2076)
* **เกณฑ์การผ่าน:** ระบบต้องแจ้งเตือนอัจฉริยะ (Smart Prompt): *"คุณกำลังกรอกปี พ.ศ. 2475 ในช่องปี ค.ศ. ใช่หรือไม่? คลิกที่นี่เพื่อแปลงเป็น ค.ศ. 1932 อัตโนมัติ"*

### 3.3 กรณีชื่อไฟล์ภาษาไทยยาวและมีสระ/วรรณยุกต์ซ้อน (Thai Unicode Combining Characters)
* **ปัญหาที่มักพบ:** ชื่อไฟล์ภาษาไทยยาวเกิน 255 ไบต์ หรือเกิดปัญหาความไม่เข้ากันของ Unicode Normalization (NFC vs NFD) ระหว่าง macOS, Windows และ Linux S3
* **เงื่อนไขทดสอบ:** อัปโหลดไฟล์ชื่อ `พระราชพิธีพุทธาภิเษก_สมเด็จพระพุฒาจารย์(โต_พฺรหฺมรํสี)_วัดระฆังโฆสิตาราม_พ.ศ.๒๔๑๕_ฉบับสมบูรณ์พิเศษ.pdf`
* **เกณฑ์การผ่าน:** ระบบทำ Unicode NFC Normalization และ Sanitization สำหรับ S3 Storage Key ได้อย่างปลอดภัยโดยที่ชื่อแสดงผลภาษาไทยยังคงรูปวรรณยุกต์ถูกต้อง

### 3.4 กรณี URL ที่มี Canonical Form ต่างกันแต่เป็นหน้าเดียวกัน
* **เงื่อนไขทดสอบ:** บันทึก URL 3 รูปแบบ:
  1. `https://example.com/history/`
  2. `https://example.com/history?utm_source=facebook&utm_medium=cpc`
  3. `http://example.com/history`
* **เกณฑ์การผ่าน:** ระบบทำ URL Normalization (ลบ Tracking query params, ตัด trailing slash, บังคับ Lowercase domain) เพื่อตรวจจับและป้องกันลิงก์ซ้ำใน Workspace

---

## 4. สคริปต์ทดสอบประสิทธิภาพภายใต้โหลดหนัก (k6 Load Test Script)

เพื่อตรวจสอบว่าระบบปฏิบัติตาม **NFR-PERF-01** (ค้นหา < 800ms ที่ 1M รายการ), **NFR-PERF-03** (API P95 < 300ms) และ **NFR-SCALE-01** (1,000 ผู้ใช้พร้อมกัน):

สคริปต์ k6 ถูกจัดทำไว้ที่:  
👉 [`load-tests/k6-load-test.js`](file:///c:/atgv/momentra/load-tests/k6-load-test.js)

```javascript
// ตัวอย่างการจำลองโหลดแบบ Ramp-up สู่ 1,000 VUs
export const options = {
  stages: [
    { duration: '30s', target: 200 },   // Warm up
    { duration: '1m',  target: 1000 },  // Ramp-up to peak 1,000 users
    { duration: '2m',  target: 1000 },  // Sustained load test
    { duration: '30s', target: 0 },     // Cool down
  ],
  thresholds: {
    'http_req_duration{type:timeline}': ['p(95)<300'], // P95 Timeline < 300ms
    'http_req_duration{type:search}':   ['p(95)<500'], // P95 Search < 500ms
    'http_req_failed':                  ['rate<0.01'], // อัตรา Error < 1%
  },
};
```

---

## 5. เกณฑ์การประเมินและการลงนามรับมอบ (Quality Gate Sign-off)

- [ ] **Automated Test Suite**: ผ่าน 100% (Unit, Integration, Contract) พร้อม Service Layer Coverage ≥ 80%
- [ ] **Security Blocker Items**: แก้ไขและ Re-test Blocker B1 ถึง B6 จนได้ผลลัพธ์ผ่านทั้งหมด
- [ ] **Load Test**: ผ่านเกณฑ์ SLA Latency P95 < 300ms ภายใต้โหลด 1,000 Virtual Users
- [ ] **UAT (User Acceptance Testing)**: ตัวแทนผู้ใช้งานจริง 5 คน (Owner, Admin, Contributor, Viewer, Guest) ทดสอบใช้งาน Flow หลัก 8 Flow สำเร็จโดยสมบูรณ์
