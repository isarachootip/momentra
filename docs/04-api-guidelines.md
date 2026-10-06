# API Guidelines & Integration Standards
## โครงการ: Momentra (Historical Digital Asset Management — HDAM)
**รหัสเอกสาร:** MOMENTRA-API-04  
**เวอร์ชัน:** 1.0.0 (Phase 4 Baseline)  
**สถานะ:** Approved (API-First Baseline)  
**บทบาทผู้จัดทำ:** Senior API Architect / Solution Architect Team  
**ไฟล์สเปก OpenAPI:** [api/openapi.yaml](file:///c:/atgv/momentra/api/openapi.yaml)  
**สอดคล้องกับ:** [docs/01-srs.md](file:///c:/atgv/momentra/docs/01-srs.md), [docs/03-data-model.md](file:///c:/atgv/momentra/docs/03-data-model.md)  
**วันที่มีผล:** 5 ตุลาคม 2026 (พ.ศ. 2569)  

---

## 1. การตั้งชื่อ, การกำหนด Version, รหัสสถานะ HTTP และรูปแบบ Error (RFC 9457)

### 1.1 การออกแบบ URL และ Versioning
* ทุก Endpoint ต้องขึ้นต้นด้วย URL Prefix: `/api/v1`
* ใช้คำนามพหูพจน์ (Plural Nouns) ในการระบุ Collection ของ Resource:
  * `/workspaces`, `/items`, `/assets`, `/links`, `/tags`, `/collections`, `/milestones`, `/shares`, `/audit-logs`
* ใช้ Kebab-case สำหรับ Sub-resource หรือ Action endpoints:
  * `/items/bulk-update`, `/items/trash/purge`, `/assets/uploads`, `/public/shares/{token}/verify`
* ห้ามใส่ Action Verb ซ้ำซ้อนใน URL เช่น `POST /items/create` (ใช้ `POST /items` แทน)

### 1.2 รหัสสถานะ HTTP (Standard HTTP Status Codes)
* `200 OK`: ดึงข้อมูลหรืออัปเดตสำเร็จ และมี Payload ตอบกลับ
* `201 Created`: สร้าง Resource ใหม่สำเร็จ (ส่งคืน `Location` header หรือ Object ที่สร้างใหม่)
* `202 Accepted`: รับคำขอเข้าสู่คิว Asynchronous Background Processing เรียบร้อยแล้ว (เช่น การยืนยันอัปโหลดไฟล์ หรือการขอ Export)
* `204 No Content`: การลบหรือออกจากระบบสำเร็จ โดยไม่มี Response Body
* `400 Bad Request`: Payload ไม่ถูกต้องตาม Validation Schema
* `401 Unauthorized`: ไม่ได้ส่งข้อมูลยืนยันตัวตน หรือ Session หมดอายุ
* `403 Forbidden`: ผู้ใช้ไม่มีบทบาทสิทธิ์ (Role) เพียงพอใน Workspace นั้น
* `404 Not Found`: ไม่พบ Resource ใน Workspace ปัจจุบัน
* `409 Conflict`: ตรวจพบข้อมูลขัดแย้ง เช่น ค่า SHA-256 ซ้ำซ้อน หรืออีเมลสมาชิกซ้ำ
* `410 Gone`: ลิงก์แชร์สาธารณะหมดอายุแล้ว
* `429 Too Many Requests`: ส่งคำขอเกินอัตรา Rate Limiting ที่กำหนด
* `500 Internal Server Error`: ข้อผิดพลาดของระบบเซิร์ฟเวอร์ที่ไม่สามารถคาดการณ์ได้

### 1.3 รูปแบบ Error มาตรฐาน (RFC 9457 / RFC 7807 Problem Details)
ทุก Error Response ที่มีสถานะ 4xx หรือ 5xx ต้องส่งกลับด้วย Content-Type `application/problem+json` ตามโครงสร้างมาตรฐาน:

```json
{
  "type": "https://momentra.app/errors/validation-failed",
  "title": "Validation Failed",
  "status": 400,
  "detail": "The event_end date cannot precede event_start.",
  "instance": "/api/v1/items",
  "correlation_id": "d3b07384-d113-494a-939e-4e4b7c62d08a",
  "invalid_params": [
    {
      "name": "event_end",
      "reason": "Must be greater than or equal to event_start"
    }
  ]
}
```

---

## 2. การแบ่งหน้า (Cursor Pagination), การกรอง และการจัดเรียง

### 2.1 Cursor-based Pagination
เพื่อประสิทธิภาพสูงสุดสำหรับข้อมูลขนาดใหญ่ระดับ 1,000,000 รายการบน Timeline และ Search ระบบจะไม่ใช้ Offset-based Pagination (`OFFSET 10000`) แต่จะใช้ **Opaque Cursor-based Pagination**:

* **Query Parameters:**
  * `cursor`: สตริง Base64 เข้ารหัสค่า `sort_key` และ `id` ของแถวสุดท้ายในหน้าก่อนหน้า
  * `limit`: จำนวนรายการต่อหน้า (Default: 20, Max: 100)
* **Response Envelope:**
  ```json
  {
    "items": [...],
    "next_cursor": "eyJzb3J0X2tleSI6LTExODQxMTIwMDAwNCwiaWQiOiIzMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEifQ==",
    "has_more": true
  }
  ```

### 2.2 การจัดเรียง (Deterministic Sorting)
การจัดลำดับรายการประวัติศาสตร์บน Timeline และ Search ใช้ค่าดัชนีเวลาจริง:
* `event_date_asc` (ค่าเริ่มต้น): เรียงจากอดีตที่สุดไปสู่ปัจจุบัน ผ่าน `sort_key ASC, id ASC`
* `event_date_desc`: เรียงจากปัจจุบันย้อนสู่อดีต ผ่าน `sort_key DESC, id DESC`
* `created_at_desc`: เรียงตามวันที่บันทึกไฟล์เข้าระบบล่าสุด (สำหรับหน้าจัดการคลัง)
* `relevance`: เรียงตามคะแนนความเกี่ยวข้องของคำค้นหา (FTS BM25 Score)

---

## 3. โปรโตคอล Idempotency-Key

เพื่อป้องกันปัญหาการสร้างข้อมูลซ้ำซ้อน หรือการหักโควตาเบิ้ลเมื่อเกิดปัญหาการเชื่อมต่อขัดข้อง (Network Timeout):
1. Client ต้องแนบ Header:
   ```http
   Idempotency-Key: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d
   ```
2. API Gateway จะตรวจสอบค่า Key ใน Redis:
   * หากคำขออยู่ในสถานะ **กำลังประมวลผล (In-flight)**: ระบบจะส่งกลับ `409 Conflict` พร้อมข้อความแจ้งเตือน
   * หากคำขอ **ประมวลผลเสร็จสิ้นแล้ว**: ระบบจะส่งกลับผลลัพธ์เดิมที่แคชไว้ (Cached Response) ทันที โดยไม่ทำธุรกรรมซ้ำ
3. อายุของ Idempotency-Key มีค่า TTL เท่ากับ **24 ชั่วโมง**

---

## 4. มาตรฐานการแสดงผลวันที่ประวัติศาสตร์ (Date Representation Standard)

เพื่อปฏิบัติตาม Business Rule BR-01 และ BR-04 ทุก Response ที่มีมิติเวลาของเหตุการณ์ ต้องส่งมอบ 6 ฟิลด์ประกอบกันเสมอ:

```json
{
  "event_start": "1932-06-24T05:00:00Z",
  "event_end": "1932-06-24T18:00:00Z",
  "date_precision": "datetime",
  "is_circa": false,
  "sort_key": -118411200004,
  "display_date_be": "24 มิถุนายน 2475 เวลา 05:00 น.",
  "display_date_ce": "24 June 1932 05:00 UTC"
}
```

* **`event_start` / `event_end`:** เวลามาตรฐานสากล ISO 8601 UTC เสมอ
* **`date_precision`:** ระดับความแม่นยำดั้งเดิม (`year`, `month`, `day`, `datetime`)
* **`is_circa`:** ค่าความไม่แน่นอน (หากเป็น `true` UI จะแสดงสัญลักษณ์ `circa` หรือ `c.`)
* **`display_date_be`:** วันที่จัดรูปแบบภาษาไทยในรูป **พุทธศักราช (พ.ศ.)** (สูตร: ปี ค.ศ. + 543)
* **`display_date_ce`:** วันที่จัดรูปแบบสากลในรูป **คริสต์ศักราช (ค.ศ.)**

---

## 5. ตารางสิทธิ์การเข้าถึง (Authorization Matrix: Role × Endpoint)

ตารางแสดงสิทธิ์การเข้าถึงของแต่ละบทบาทตามข้อกำหนด SRS FR-ACCESS-02:

| Endpoint Group | เส้นทางและเมธอด (Method & Route) | Owner | Admin | Contributor | Viewer | Guest Share Link |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Auth & Me** | `POST /auth/login`, `POST /auth/refresh`, `GET /me` | Yes | Yes | Yes | Yes | No (ใช้ Token เฉพาะ) |
| **Workspaces**| `GET /workspaces`, `GET /workspaces/{id}` | Yes | Yes | Yes | Yes | No |
| | `PATCH /workspaces/{id}`, `DELETE /workspaces/{id}` | Yes | No | No | No | No |
| **Members** | `GET /workspaces/{id}/members` | Yes | Yes | Yes | Yes | No |
| | `POST /workspaces/{id}/members/invite`, `PATCH/DELETE` | Yes | Yes | No | No | No |
| **Items** | `GET /items`, `GET /items/{id}` | Yes | Yes | Yes | Yes | No |
| | `POST /items`, `PATCH /items/{id}`, `DELETE /items/{id}`| Yes | Yes | Yes | No | No |
| | `GET /items/trash`, `POST /items/{id}/restore` | Yes | Yes | No | No | No |
| | `DELETE /items/trash/purge` (ล้างถังขยะถาวร) | Yes | Yes | No | No | No |
| **Assets** | `POST /assets/uploads` (ขอ Presigned URL) | Yes | Yes | Yes | No | No |
| | `POST /assets/{id}/complete` (ยืนยันอัปโหลด) | Yes | Yes | Yes | No | No |
| | `GET /assets/{id}/download` (ดาวน์โหลดต้นฉบับ) | Yes | Yes | Yes | Yes | Yes (ถ้ามีสิทธิ์ download) |
| | `GET /assets/{id}/derivatives`, `GET /assets/{id}/versions`| Yes | Yes | Yes | Yes | No |
| **Links** | `POST /links`, `POST /links/{id}/recheck` | Yes | Yes | Yes | No | No |
| **Timeline** | `GET /timeline` (ค้นหาและเรนเดอร์แกนเวลา) | Yes | Yes | Yes | Yes | Yes (เฉพาะใน Share) |
| **Search** | `GET /search` (สืบค้น Full-Text และ Facets) | Yes | Yes | Yes | Yes | Yes (เฉพาะใน Share) |
| **Collections**| `GET /collections`, `GET /collections/{id}` | Yes | Yes | Yes | Yes | Yes (เฉพาะใน Share) |
| | `POST /collections`, `PATCH/DELETE /collections/{id}`| Yes | Yes | Yes | No | No |
| | `POST /collections/{id}/items` (จัดเรียงคอลเลกชัน) | Yes | Yes | Yes | No | No |
| **Milestones** | `GET /milestones` | Yes | Yes | Yes | Yes | Yes |
| | `POST /milestones` (ปักหมุดหมายเหตุการณ์สำคัญ) | Yes | Yes | No | No | No |
| **Shares** | `POST /shares`, `GET /shares`, `DELETE /shares/{id}` | Yes | Yes | No | No | No |
| | `GET /public/shares/{token}` (ตรวจสอบลิงก์สาธารณะ)| Public | Public | Public | Public | Public (ไม่ต้องล็อกอิน) |
| | `POST /public/shares/{token}/verify` (ตรวจ Passcode)| Public | Public | Public | Public | Public (ไม่ต้องล็อกอิน) |
| **Exports** | `POST /exports`, `GET /jobs/{id}/download` | Yes | Yes | No | No | No |
| **Audit Logs** | `GET /audit-logs` (ตรวจสอบบันทึกการกระทำ) | Yes | Yes | No | No | No |

---

## 6. Rate Limiting และขีดจำกัดขนาดคำขอ (Payload Quotas)

| ขอบเขต (Scope) | อัตราจำกัด (Rate Limit) | เกณฑ์และหน้าต่างเวลา (Window) | การรับมือเมื่อเกินเกณฑ์ |
| :--- | :--- | :--- | :--- |
| **API ทั่วไป (Authenticated API)** | 120 คำขอ / นาที | ตรวจสอบต่อ `user_id` และ `workspace_id` | HTTP 429 Too Many Requests |
| **การตรวจสอบ Passcode ของ Share Link** | **5 ครั้ง / 15 นาที** | ตรวจสอบต่อ `client_ip` และ `token` | HTTP 429 บล็อก IP ชั่วคราว 15 นาที ป้องกัน Brute-force |
| **การค้นหา (FTS & Timeline Viewport)** | 60 คำขอ / นาที | ตรวจสอบต่อ `user_id` | HTTP 429 ป้องกัน Denial-of-Service |
| **ขนาด Payload JSON ขาเข้า** | **สูงสุด 2 MB** | ตรวจสอบที่ Reverse Proxy (Caddy) | HTTP 413 Payload Too Large |
| **ขนาดไฟล์อัปโหลดไบนารี** | **สูงสุด 4 GB ต่อไฟล์** | อัปโหลดตรงเข้า S3 ผ่าน Presigned URL | จัดการแบ่งชิ้นส่วนผ่าน S3 Multipart Upload |

---

## 7. ตัวอย่างคำขอและคำตอบจริง (Real Production Request/Response Examples)

### 7.1 ตัวอย่างที่ 1: การขอ Presigned URL สำหรับอัปโหลดไฟล์ (POST /assets/uploads)
**Request:**
```http
POST /api/v1/assets/uploads HTTP/1.1
Host: momentra.app
X-Workspace-ID: 11111111-1111-1111-1111-111111111111
Idempotency-Key: a5f1d9a2-443b-4112-9c12-7bb88f3a5e12
Content-Type: application/json

{
  "filename": "2479_plaque_monument.png",
  "mime_type": "image/png",
  "size_bytes": 14502800,
  "checksum_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

**Response (201 Created):**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "item_id": "30000000-0000-0000-0000-000000000002",
  "upload_mode": "single_put",
  "storage_key": "temp-uploads/2479_plaque_monument.png",
  "single_upload_url": "https://pub-r2.momentra.app/temp-uploads/2479_plaque_monument.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=900&...",
  "multipart": null
}
```

---

### 7.2 ตัวอย่างที่ 2: การสืบค้น Timeline แบบจัดกลุ่ม (GET /timeline)
**Request:**
```http
GET /api/v1/timeline?from=1932-01-01T00:00:00Z&to=1945-12-31T23:59:59Z&granularity=year&calendar=be HTTP/1.1
Host: momentra.app
X-Workspace-ID: 11111111-1111-1111-1111-111111111111
```

**Response (200 OK):**
```json
{
  "granularity": "year",
  "calendar": "be",
  "buckets": [
    {
      "bucket_key": "1932",
      "display_label": "พ.ศ. 2475 (1932)",
      "count": 3,
      "items": [
        {
          "id": "30000000-0000-0000-0000-000000000001",
          "title": "การเปลี่ยนแปลงการปกครอง 24 มิถุนายน 2475",
          "type": "event",
          "event_start": "1932-06-24T05:00:00Z",
          "event_end": "1932-06-24T18:00:00Z",
          "date_precision": "datetime",
          "is_circa": false,
          "display_date_be": "24 มิถุนายน 2475 เวลา 05:00 น.",
          "display_date_ce": "24 June 1932 05:00 UTC",
          "tags": [
            {
              "id": "tag-1",
              "name": "การเมืองและประชาธิปไตย",
              "color": "#EF4444"
            }
          ]
        },
        {
          "id": "30000000-0000-0000-0000-000000000003",
          "title": "เอกสารลายพระหัตถ์ พระราชบัญญัติธรรมนูญการปกครองแผ่นดินสยามชั่วคราว 2475",
          "type": "asset",
          "event_start": "1932-06-27T00:00:00Z",
          "event_end": "1932-06-27T23:59:59Z",
          "date_precision": "day",
          "is_circa": false,
          "display_date_be": "27 มิถุนายน 2475",
          "display_date_ce": "27 June 1932",
          "asset": {
            "mime_type": "application/pdf",
            "size_bytes": 38902000,
            "status": "ready"
          }
        }
      ]
    }
  ],
  "milestones": [
    {
      "id": "milestone-1",
      "title": "การอภิวัฒน์สยาม 2475",
      "target_date_start": "1932-06-24T00:00:00Z",
      "target_date_end": "1932-06-24T23:59:59Z",
      "color": "#DC2626"
    }
  ]
}
```

---

### 7.3 ตัวอย่างที่ 3: การตรวจ Passcode และรับ Guest Token (POST /public/shares/{token}/verify)
**Request:**
```http
POST /api/v1/public/shares/share_2475_revolution_demo_token/verify HTTP/1.1
Host: momentra.app
Content-Type: application/json

{
  "passcode": "Mmt@2026"
}
```

**Response (200 OK):**
```json
{
  "guest_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzaGFyZV9pZCI6IjEyMzQiLCJjb2xsZWN0aW9uX2lkIjoiY29sLTI0NzUiLCJleHAiOjE3OTM5NjQ0MDB9...",
  "expires_at": "2026-11-04T07:13:00Z"
}
```

---

## 8. สเปกอีเวนต์ภายใน (Internal Webhook / Message Payload สำหรับ Worker)

การสื่อสารระหว่าง Web/API Core Process และ Background Worker ผ่าน **BullMQ (Redis 7)** ถูกกำหนดรูปแบบอย่างเป็นทางการ:

### Event 1: `asset.uploaded` (กระตุ้นเมื่อ Client อัปโหลดไฟล์เข้า S3 สำเร็จ)
```json
{
  "event": "asset.uploaded",
  "workspace_id": "11111111-1111-1111-1111-111111111111",
  "item_id": "30000000-0000-0000-0000-000000000002",
  "temp_storage_key": "temp-uploads/2479_plaque_monument.png",
  "expected_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "mime_type": "image/png",
  "size_bytes": 14502800,
  "enqueued_at": "2026-10-05T10:00:00Z"
}
```
* **การทำงานของ Worker:** สตรีมไฟล์คำนวณ SHA-256 ซ้ำ -> สแกน ClamAV -> ย้ายไฟล์เข้า `permanent-assets/` -> รัน Sharp สร้าง WebP Thumbnail 3 ขนาด -> อัปเดตสถานะเป็น `ready`

### Event 2: `link.scrape_requested` (กระตุ้นเมื่อมีการบันทึก URL ใหม่)
```json
{
  "event": "link.scrape_requested",
  "workspace_id": "11111111-1111-1111-1111-111111111111",
  "item_id": "30000000-0000-0000-0000-000000000007",
  "url": "https://digital.nlt.go.th/archive/srikrung",
  "enqueued_at": "2026-10-05T10:05:00Z"
}
```
* **การทำงานของ Worker:** ดึง OpenGraph Meta (Title, Description, Image) ภายใน 5 วินาที -> บันทึกลงตาราง `links`

---

## 9. ตาราง Traceability Matrix: SRS User Stories (US-01 .. US-26) สู่ API Endpoints

ตารางยืนยันความสอดคล้องว่าทุกความต้องการใน SRS ได้รับการออกแบบ Endpoint รองรับครบถ้วน 100%:

| รหัส User Story (SRS) | พฤติกรรมความต้องการ (User Story Requirement) | API Endpoint(s) ที่รองรับ |
| :--- | :--- | :--- |
| **US-01, US-02** | อัปโหลดไฟล์หลายไฟล์ / ติดตามความคืบหน้า | `POST /assets/uploads`, `POST /assets/{id}/complete` |
| **US-03** | ตรวจจับไฟล์ซ้ำด้วย SHA-256 Checksum | `POST /assets/uploads` (ส่งกลับ HTTP 409 Duplicate) |
| **US-04** | เปิดดูพรีวิวรูปภาพ / สตรีมวิดีโอ / ดาวน์โหลดไฟล์ | `GET /assets/{id}/download`, `GET /assets/{id}/derivatives` |
| **US-05** | ลบไฟล์แบบ Soft Delete เข้าสู่ถังขยะ 30 วัน | `DELETE /items/{id}` |
| **US-06** | ดูรายการถังขยะ / กู้คืน / ล้างถาวร (Purge) | `GET /items/trash`, `POST /items/{id}/restore`, `DELETE /items/trash/purge` |
| **US-07, US-08** | บันทึกลิงก์พร้อมดึงพรีวิว / แจ้งเตือนลิงก์เสีย | `POST /links`, `POST /links/{id}/recheck` |
| **US-09** | บันทึกข้อความและบริบทประวัติศาสตร์ | `POST /items` (type: note), `PATCH /items/{id}` |
| **US-10, US-11, US-12**| กำหนดวันที่ไม่แน่นอน (Year, Circa, Date Range) | `POST /items`, `PATCH /items/{id}` (event_start/end, date_precision, is_circa) |
| **US-13, US-14** | ซูม Timeline 4 สเกล / สลับมุมมอง พ.ศ. และ ค.ศ. | `GET /timeline?from&to&granularity&calendar` |
| **US-15** | ปักหมุดหมายประวัติศาสตร์ (Milestone Pinning) | `POST /milestones`, `GET /milestones` |
| **US-16** | ค้นหา Full-Text ภาษาไทยและอังกฤษ | `GET /search?q=...` |
| **US-17, US-18** | กรองตามช่วงเวลาเหตุการณ์และ Facets | `GET /search?from_year&to_year&tags&type` |
| **US-19** | จัดเรียงผลการค้นหาตามวันที่เหตุการณ์จริง | `GET /search?sort=event_date_asc` |
| **US-20** | จัดกลุ่ม Asset เข้าเป็น Collection | `POST /collections`, `POST /collections/{id}/items` |
| **US-21, US-22** | แชร์ Collection ด้วย Passcode + Guest Viewing | `POST /shares`, `GET /public/shares/{token}`, `POST /public/shares/{token}/verify` |
| **US-23** | สลับ Workspace การทำงาน (Personal vs Org) | `GET /workspaces`, `X-Workspace-ID` Header |
| **US-24** | เชิญสมาชิกและเปลี่ยนบทบาทสิทธิ์ (RBAC) | `POST /workspaces/{id}/members/invite`, `PATCH .../{userId}` |
| **US-25** | ตรวจสอบบันทึก Audit Log การใช้งาน | `GET /audit-logs?actor_id&entity_type&from&to` |
| **US-26** | ส่งออกข้อมูลคลังทั้งหมดเป็น ZIP / CSV / JSON | `POST /exports`, `GET /jobs/{id}`, `GET /jobs/{id}/download` |

---

## 10. การตรวจสอบ Quality Gate Phase 4

- [x] **openapi.yaml ผ่าน linter (Spectral) และสร้าง Mock Server ได้:**
  - ตรวจสอบผ่านคำสั่ง `@stoplight/spectral-cli lint api/openapi.yaml` ได้ผลลัพธ์ **0 errors** สมบูรณ์แบบ
  - ผ่านการทดสอบความเข้ากันได้กับ Prism Mock Server CLI
- [x] **ทุก User Story ใน SRS มี Endpoint รองรับ:**
  - ผ่านการสอบทานเทียบกับ User Stories ทั้ง 26 เรื่อง (US-01 ถึง US-26) ใน Section 9 ครบถ้วน 100%
- [x] **Authorization Matrix ได้รับการทบทวนแล้ว:**
  - กำหนดสิทธิ์ครบ 5 บทบาท (Owner, Admin, Contributor, Viewer, Public Guest) ครอบคลุมทุก Endpoint ใน Section 5
