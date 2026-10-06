# Momentra – ชุด Prompt สั่งงาน AI สร้างระบบทีละขั้นตอน

Oct 5, 2026 · @isara chootip

## 1. สรุประบบ Momentra

Momentra (Moment + Era, ชื่อโครงการเดิม HDAM – Historical Digital Asset Management) คือระบบจัดเก็บ ค้นหา และเรียงลำดับเหตุการณ์ของสินทรัพย์ดิจิทัลสำหรับบุคคลหรือองค์กร โดยทุกชิ้นข้อมูลผูกกับ "วันเวลาที่เกิดขึ้นจริง" เพื่อสร้าง Timeline/Roadmap ย้อนหลังได้

**วัตถุประสงค์ 3 ข้อ (จาก Project brief)**

1. จัดเก็บ Information และ Link ต่างๆ (URL, บันทึกข้อความ, อ้างอิงภายนอก)
2. จัดเก็บ Asset จริง เช่น รูปภาพ บทความ วิดีโอ เสียง เอกสาร และไฟล์อื่นๆ
3. สืบค้นได้ และจัดเรียงเป็น Roadmap ตามวันและเวลา

**โมดูลหลักที่ผมแนะนำ**

| โมดูล | หน้าที่ | ความสำคัญ |
| --- | --- | --- |
| Asset Repository | อัปโหลด/จัดเก็บไฟล์, Versioning, Thumbnail, Preview | MVP |
| Link & Information Vault | เก็บ URL, Note, ดึง Metadata (title, og:image), ตรวจ Link เสีย | MVP |
| Metadata & Taxonomy | Tag, Category, Collection, บุคคล, สถานที่, Custom fields | MVP |
| Timeline / Roadmap | จัดเรียงตาม event date (ไม่ใช่ upload date), Milestone, ช่วงเวลา | MVP |
| Search | Full-text, Filter, Faceted search, ค้นตามช่วงวัน | MVP |
| Access Control | ผู้ใช้, องค์กร/Workspace, Role, การแชร์ | MVP |
| Audit & Preservation | Audit log, Checksum, Backup, Export | Phase 2 |
| AI Enrichment | Auto-tag, OCR, Transcribe วิดีโอ, Semantic search | Phase 2 |

**สมมติฐานที่ใช้เขียน Prompt ชุดนี้ (ปรับได้)**

- เป็น Web application รองรับทั้งผู้ใช้รายบุคคลและองค์กร (Multi-tenant แบบ Workspace)
- ภาษาหน้าจอ ไทย + อังกฤษ, Timezone เริ่มต้น Asia/Bangkok, เก็บเวลาเป็น UTC
- วันที่ของเหตุการณ์อาจไม่แน่นอน (เช่น รู้แค่ "ปี 2540" หรือ "ประมาณ ต.ค. 2563") ต้องรองรับ Date precision
- เริ่มด้วย MVP ที่ใช้งานได้จริงก่อน แล้วค่อยเพิ่ม AI Enrichment

**คำถามที่ควรตอบก่อนเริ่ม (ใส่คำตอบใน Prompt 0)**

- [ ] ผู้ใช้หลักคือบุคคล องค์กร หรือทั้งสอง? จำนวนผู้ใช้/ขนาดไฟล์ที่คาดการณ์?
- [ ] Deploy บน Cloud (AWS/GCP/Azure) หรือ On-premise?
- [ ] มี Tech stack ที่ทีมถนัดอยู่แล้วหรือไม่?
- [ ] ต้องปฏิบัติตาม PDPA หรือมาตรฐานจดหมายเหตุ (เช่น Dublin Core) หรือไม่?

## 2. วิธีใช้ชุด Prompt

ใช้ Prompt ตามลำดับ Phase 1 → 9 โดยแนบ Prompt 0 ทุกครั้ง และแนบผลลัพธ์ (Artifact) ของ Phase ก่อนหน้าเป็น Input ของ Phase ถัดไป อย่าข้ามขั้น เพราะแต่ละขั้นเป็นสัญญา (Contract) ของขั้นถัดไป

**หลักการ 5 ข้อจากประสบการณ์**

1. **Context ก่อนคำสั่ง** — วาง Prompt 0 (บทบาท + บริบท + ข้อจำกัด) ไว้ใน System prompt หรือ Project instructions ของ AI
2. **หนึ่ง Phase หนึ่งเป้าหมาย** — ให้ AI ส่งมอบเป็นไฟล์ที่ระบุชื่อชัด เช่น `docs/01-srs.md` แทนการตอบลอยๆ
3. **บังคับให้ถามก่อนเดา** — ทุก Prompt สั่งให้ AI ระบุ Assumption และคำถามค้างไว้ท้ายงาน
4. **Quality Gate ก่อนไปต่อ** — ตรวจตาม Checklist ท้ายแต่ละ Phase ถ้าไม่ผ่าน ใช้ Prompt Review (หัวข้อสุดท้าย) ให้แก้
5. **เก็บ Decision Log** — ทุกการตัดสินใจสำคัญบันทึกใน `docs/adr/` (Architecture Decision Record) เพื่อไม่ให้ AI ตัดสินใจขัดกันข้าม Session

**ตาราง Input / Output ของแต่ละ Phase**

| Phase | Input ที่ต้องแนบ | Output ที่ได้ |
| --- | --- | --- |
| 1 Requirement | Prompt 0 + คำตอบคำถามเบื้องต้น | `docs/01-srs.md`, User stories |
| 2 Architecture | SRS | `docs/02-architecture.md`, ADR |
| 3 Data Model | SRS + Architecture | ERD, `schema.sql`, Migration |
| 4 API | SRS + Data model | `openapi.yaml` |
| 5 Backend | Architecture + Schema + OpenAPI | Source code backend + Unit test |
| 6 Search & Timeline | Schema + OpenAPI + Backend | Search index, Timeline service |
| 7 Frontend | OpenAPI + User stories | Web app (UI) |
| 8 Security & QA | Source code ทั้งหมด | Test suite, Security report |
| 9 Deployment | Architecture + Source code | Docker, CI/CD, Runbook |

**รูปแบบการใช้งาน:** คัดลอกข้อความในกล่อง Prompt ไปวาง แล้วแทนที่ส่วน `{{...}}` ด้วยข้อมูลจริง

## 3. Prompt 0 — Master Context (แนบทุกครั้ง)

วาง Prompt นี้เป็น System prompt หรือ Project instructions ก่อนเริ่มทุก Phase

```text
# ROLE
คุณคือทีมพัฒนาซอฟต์แวร์ระดับ Senior ที่ประกอบด้วย:
- Senior System Analyst / Solution Architect (ประสบการณ์ 25 ปี)
- Senior Full-stack Engineer
- AI/Search Engineer
- QA & Security Engineer
คุณทำงานแบบมืออาชีพ: วิเคราะห์ก่อนลงมือ อธิบายเหตุผลของการตัดสินใจ และไม่เดาเมื่อข้อมูลไม่พอ

# PROJECT
ชื่อระบบ: Momentra (Moment + Era; ชื่อโครงการเดิม HDAM – Historical Digital Asset Management)
นิยาม: ระบบบริหารจัดการสินทรัพย์ดิจิทัลของบุคคลหรือองค์กร ที่ผูกทุกชิ้นข้อมูลกับวันเวลาของเหตุการณ์จริง
วัตถุประสงค์:
1. จัดเก็บ Information และ Link ต่างๆ
2. จัดเก็บ Asset (รูปภาพ บทความ วิดีโอ เสียง เอกสาร และอื่นๆ)
3. สืบค้นได้ และจัดเรียงเป็น Timeline/Roadmap ตามวันและเวลา

# BUSINESS CONTEXT (กรอกข้อมูลจริง)
- กลุ่มผู้ใช้: {{บุคคล / องค์กร / ทั้งสอง}}
- จำนวนผู้ใช้คาดการณ์: {{เช่น 1,000 users ปีแรก}}
- ปริมาณข้อมูลคาดการณ์: {{เช่น 5 TB, ไฟล์ใหญ่สุด 4 GB}}
- การ Deploy: {{Cloud ระบุผู้ให้บริการ / On-premise}}
- Tech stack ที่ต้องการ: {{ระบุ หรือ "ให้เสนอ"}}
- กฎหมาย/มาตรฐาน: PDPA, {{อื่นๆ เช่น Dublin Core}}
- ภาษา UI: ไทย และ อังกฤษ | Timezone: Asia/Bangkok (เก็บใน DB เป็น UTC)

# KEY DOMAIN RULES (ห้ามละเลย)
1. แยก "event_date" (วันที่เหตุการณ์เกิด) ออกจาก "created_at" (วันที่บันทึกเข้าระบบ) เสมอ
2. event_date ต้องรองรับความไม่แน่นอน: date_precision = year | month | day | datetime และช่วงเวลา (start/end) และ flag "circa" (ประมาณ)
3. รองรับการแสดงปี พ.ศ. และ ค.ศ. แต่เก็บข้อมูลเป็น ค.ศ.
4. Asset ต้องมี checksum (SHA-256) และไม่ลบถาวรทันที (soft delete + retention)
5. ข้อมูลต้องแยกตาม Workspace (multi-tenant) และตรวจสิทธิ์ทุก request

# WORKING RULES
- ทำเฉพาะ Phase ที่ได้รับคำสั่ง ห้ามข้ามไปทำ Phase อื่น
- ส่งมอบผลงานเป็นไฟล์ตามชื่อที่กำหนด ในรูปแบบ Markdown/โค้ดที่ใช้งานได้จริง
- ทุกการตัดสินใจสำคัญ ให้เขียน ADR สั้นๆ (Context / Decision / Consequences)
- ท้ายงานทุกครั้ง ให้มีหัวข้อ: "Assumptions", "Open Questions", "Risks", "Next Step"
- หากข้อมูลไม่พอจนตัดสินใจไม่ได้ ให้ถามคำถามไม่เกิน 5 ข้อก่อนเริ่มงาน
- ใช้ภาษาไทยในเอกสาร ใช้ภาษาอังกฤษในโค้ด ชื่อตัวแปร และ comment
```

## 4. Phase 1 — Requirement Analysis

เป้าหมาย: เปลี่ยน Brief 3 ข้อให้เป็น SRS ที่วัดผลได้ และกำหนดขอบเขต MVP ชัดเจน

```text
[แนบ Prompt 0]

# TASK: Phase 1 — Requirement Analysis
ในบทบาท Senior System Analyst ให้วิเคราะห์ความต้องการของระบบ Momentra และจัดทำเอกสาร SRS

# DELIVERABLE: docs/01-srs.md ประกอบด้วย
1. Executive Summary และ Problem Statement
2. Stakeholders & Personas (อย่างน้อย: Owner บุคคล, Admin องค์กร, Contributor, Viewer, Guest ที่ได้รับลิงก์แชร์)
3. Scope: In-scope / Out-of-scope / MVP vs Phase 2
4. Functional Requirements แบ่งตามโมดูล (FR-ASSET, FR-LINK, FR-META, FR-TIMELINE, FR-SEARCH, FR-ACCESS, FR-AUDIT)
   - แต่ละข้อมีรหัส, คำอธิบาย, Priority (MoSCoW), Acceptance Criteria แบบ Given/When/Then
5. User Stories อย่างน้อย 25 เรื่อง รูปแบบ "As a ... I want ... so that ..."
   ต้องครอบคลุม: อัปโหลดไฟล์หลายไฟล์, บันทึกลิงก์พร้อมดึง preview, ระบุวันที่เหตุการณ์แบบไม่แน่นอน,
   ค้นหาตามช่วงเวลา, ดู Timeline แบบซูม ปี/เดือน/วัน, สร้าง Collection, แชร์แบบจำกัดสิทธิ์, Export
6. Non-Functional Requirements พร้อมตัวเลข: Performance (เช่น ค้นหา < 1 วินาที ที่ 1 ล้านรายการ),
   Availability, Scalability, Security, PDPA, Accessibility (WCAG 2.1 AA), Data retention, Backup (RPO/RTO)
7. Business Rules และ Domain Glossary (Asset, Link, Event, Collection, Milestone, Workspace ฯลฯ)
8. Use Case Diagram และ Activity Diagram ของ Flow หลัก 3 Flow (อัปโหลด, ค้นหา, ดู Timeline) ในรูปแบบ Mermaid
9. Requirement Traceability Matrix (วัตถุประสงค์ 3 ข้อ → FR → User Story)
10. Assumptions / Open Questions / Risks

# CONSTRAINTS
- ทุก Requirement ต้องทดสอบได้ หลีกเลี่ยงคำกำกวม เช่น "รวดเร็ว" "ใช้งานง่าย" โดยไม่มีตัวเลข
- แยก event_date กับ created_at ให้ชัดใน Requirement
- ถ้าข้อมูลใน Prompt 0 ยังไม่ครบ ให้ถามก่อนไม่เกิน 5 ข้อ
```

**Quality Gate Phase 1**

- [ ] ทุก FR มี Acceptance Criteria ที่ทดสอบได้
- [ ] Traceability ครอบคลุมวัตถุประสงค์ครบ 3 ข้อ
- [ ] ขอบเขต MVP ชัด และผู้มีส่วนได้ส่วนเสียยืนยันแล้ว

## 5. Phase 2 — System Architecture & Tech Stack

เป้าหมาย: ได้สถาปัตยกรรมที่รองรับไฟล์ขนาดใหญ่ การค้นหา และ Timeline โดยเลือก Tech stack พร้อมเหตุผล

```text
[แนบ Prompt 0] + [แนบ docs/01-srs.md]

# TASK: Phase 2 — System Architecture
ในบทบาท Solution Architect ให้ออกแบบสถาปัตยกรรมระบบ Momentra จาก SRS ที่แนบ

# DELIVERABLE: docs/02-architecture.md และ docs/adr/ADR-001..00N.md
1. Architecture Style: เปรียบเทียบ Modular Monolith vs Microservices สำหรับ MVP แล้วเลือกพร้อมเหตุผล
   (แนะนำเริ่ม Modular Monolith ที่แยก Module ชัด เพื่อแยกเป็น Service ภายหลังได้)
2. C4 Model ด้วย Mermaid: Level 1 Context, Level 2 Container, Level 3 Component ของ Asset และ Timeline module
3. Tech Stack Recommendation พร้อมตารางเปรียบเทียบอย่างน้อย 2 ทางเลือกต่อชั้น:
   - Frontend (เช่น Next.js/React + TypeScript)
   - Backend (เช่น NestJS / FastAPI / Go)
   - Database (เช่น PostgreSQL)
   - Object Storage (S3-compatible เช่น AWS S3 / MinIO)
   - Search (PostgreSQL FTS / OpenSearch / Meilisearch) + Vector search สำหรับ Phase 2 (pgvector)
   - Queue/Worker (เช่น Redis + BullMQ / Celery) สำหรับ thumbnail, transcode, metadata extraction
   - Cache, Auth (OIDC/OAuth2), CDN
4. File Upload Architecture: Presigned URL + Multipart/Resumable upload, Virus scan, Checksum, การสร้าง derivative
   (thumbnail, video preview HLS) แบบ asynchronous
5. Data Flow ของ 3 Flow หลัก (Upload, Search, Timeline render) เป็น Sequence Diagram
6. Multi-tenancy Strategy (row-level ด้วย workspace_id + Row Level Security) และเหตุผล
7. Cross-cutting: Logging, Monitoring, Tracing, Config, Error handling, i18n
8. Scalability & Capacity estimate จากตัวเลขใน Prompt 0 (storage, bandwidth, ค่าใช้จ่ายโดยประมาณต่อเดือน)
9. Project folder structure ของ repository (monorepo แนะนำ)
10. Assumptions / Open Questions / Risks / ADR list

# CONSTRAINTS
- เลือกเทคโนโลยีที่ทีมขนาด 2–5 คนดูแลได้ หลีกเลี่ยง Over-engineering
- ทุกการเลือกต้องอ้างอิง NFR ใน SRS
```

**Quality Gate Phase 2**

- [ ] ทุก NFR ใน SRS มีคำตอบเชิงสถาปัตยกรรม
- [ ] มี ADR สำหรับ Database, Storage, Search, Auth อย่างน้อย
- [ ] ประเมินค่าใช้จ่ายรายเดือนแล้ว และอยู่ในงบ

## 6. Phase 3 — Data Model & Database Design

เป้าหมาย: Schema ที่รองรับวันที่ไม่แน่นอน, Metadata ยืดหยุ่น และค้นหาได้เร็ว

```text
[แนบ Prompt 0] + [แนบ docs/01-srs.md, docs/02-architecture.md]

# TASK: Phase 3 — Data Model & Database Design
ในบทบาท Data Architect ให้ออกแบบฐานข้อมูลของ Momentra บน {{PostgreSQL หรือ DB ที่เลือกใน Phase 2}}

# DELIVERABLE
- docs/03-data-model.md (คำอธิบาย + ERD แบบ Mermaid + Data Dictionary)
- db/schema.sql และ db/migrations/ (ใช้ migration tool ตาม stack)
- db/seed.sql ข้อมูลตัวอย่างภาษาไทยอย่างน้อย 30 รายการ ครอบคลุมทุกประเภท asset และช่วงเวลาหลายสิบปี

# ENTITIES ขั้นต่ำ
- workspaces, users, workspace_members (role)
- items (ตารางแม่ของทุกสิ่งที่อยู่บน Timeline): id, workspace_id, type (asset | link | note | event),
  title, description, event_start, event_end, date_precision, is_circa, location, created_by, created_at,
  updated_at, deleted_at, visibility
- assets: item_id, storage_key, original_filename, mime_type, size_bytes, checksum_sha256,
  width, height, duration_sec, exif_json, status (uploading | processing | ready | failed)
- asset_derivatives: thumbnail, preview, transcoded video
- asset_versions: เก็บประวัติเวอร์ชันไฟล์
- links: item_id, url, normalized_url, domain, og_title, og_image, last_checked_at, http_status, archived_snapshot_key
- tags, item_tags | collections, collection_items (มีลำดับ sort_order)
- people / entities (บุคคล องค์กร สถานที่ที่ปรากฏในข้อมูล), item_entities
- milestones / timelines (Roadmap ที่ผู้ใช้สร้าง และจัดกลุ่ม items)
- custom_field_definitions และ item_custom_values (JSONB)
- shares (ลิงก์แชร์, วันหมดอายุ, สิทธิ์)
- audit_logs (ใคร ทำอะไร กับอะไร เมื่อไร, ค่าเดิม/ค่าใหม่)

# REQUIREMENTS
1. อธิบายการเก็บวันที่ไม่แน่นอน และวิธี sort/filter ให้ถูกต้อง (เช่น sort_key ที่คำนวณจาก event_start + precision)
2. Index ที่จำเป็น: (workspace_id, event_start), GIN สำหรับ full-text ภาษาไทยและอังกฤษ, GIN สำหรับ JSONB, trigram
3. ระบุวิธีตัดคำภาษาไทยสำหรับ full-text search (เช่น ใช้ search engine ภายนอก หรือ pre-tokenize)
4. Row Level Security แยกตาม workspace_id พร้อมตัวอย่าง policy
5. Soft delete, retention policy และ constraint ป้องกันข้อมูลผิด (เช่น event_end >= event_start)
6. เตรียมคอลัมน์ embedding (pgvector) สำหรับ Semantic search ใน Phase ถัดไป (nullable)
7. ตัวอย่าง Query 5 แบบ: Timeline ตามช่วงปี, ค้นหาข้อความ + filter tag, รายการใน Collection,
   นับจำนวนต่อเดือน (สำหรับ heatmap), ประวัติการแก้ไขของ item
```

**Quality Gate Phase 3**

- [ ] Migration รันผ่านบนฐานข้อมูลเปล่า และ seed ข้อมูลได้
- [ ] Query Timeline ช่วง 10 ปี บนข้อมูลจำลอง 1 ล้านแถวตอบ < 300 ms (EXPLAIN ANALYZE)
- [ ] ทดสอบแล้วว่า User ของ Workspace A มองไม่เห็นข้อมูล Workspace B

## 7. Phase 4 — API Design (OpenAPI)

เป้าหมาย: สัญญา API ที่ Frontend และ Backend ใช้ร่วมกัน ก่อนเขียนโค้ดจริง (API-first)

```text
[แนบ Prompt 0] + [แนบ docs/01-srs.md, docs/03-data-model.md]

# TASK: Phase 4 — API Design
ในบทบาท API Architect ให้ออกแบบ REST API ของ Momentra ตามแนวทาง API-first

# DELIVERABLE
- api/openapi.yaml (OpenAPI 3.1 ที่ validate ผ่าน)
- docs/04-api-guidelines.md

# ENDPOINT GROUPS ขั้นต่ำ (prefix /api/v1)
- Auth & Me: login (OIDC), refresh, /me
- Workspaces & Members: CRUD, invite, เปลี่ยน role
- Items: CRUD, bulk update tag/collection, restore จาก soft delete
- Assets: POST /assets/uploads (ขอ presigned URL / multipart), POST /assets/{id}/complete,
  GET /assets/{id}/download (signed URL อายุสั้น), versions, derivatives
- Links: POST /links (รับ URL แล้วดึง metadata แบบ async), POST /links/{id}/recheck
- Tags, Collections, Entities, Custom fields
- Timeline: GET /timeline?from&to&granularity=year|month|day&filters... (คืนค่าเป็น bucket + items)
- Search: GET /search?q&type&tags&from&to&sort&page (faceted results)
- Shares: สร้าง/ยกเลิกลิงก์แชร์, GET /public/shares/{token}
- Export: POST /exports (ZIP + metadata JSON/CSV) แบบ async job + GET /jobs/{id}
- Audit logs

# GUIDELINES ที่ต้องกำหนด
1. Naming, versioning, HTTP status codes, รูปแบบ error มาตรฐาน (RFC 9457 Problem Details)
2. Pagination แบบ cursor สำหรับ Timeline/Search, filtering, sorting
3. Idempotency-Key สำหรับการสร้างข้อมูลและ upload
4. รูปแบบวันที่: ISO 8601 + date_precision + is_circa ทุก response ที่มี event date
5. Authorization matrix: role × endpoint (Owner, Admin, Contributor, Viewer, Public share)
6. Rate limiting และขนาด request สูงสุด
7. ตัวอย่าง request/response ทุก endpoint (ภาษาไทยในข้อมูลตัวอย่าง)
8. Webhook/Event ภายใน (asset.ready, link.checked) สำหรับ worker
```

**Quality Gate Phase 4**

- [ ] openapi.yaml ผ่าน linter (เช่น Spectral) และสร้าง Mock server ได้
- [ ] ทุก User story ใน SRS มี endpoint รองรับ
- [ ] Authorization matrix ได้รับการทบทวนแล้ว

## 8. Phase 5 — Backend Implementation

เป้าหมาย: Backend ที่ทำงานได้จริงตาม OpenAPI โดยแบ่งเขียนทีละ Module เพื่อคุมคุณภาพ

แนะนำให้สั่งทีละ Module ตามลำดับ: (1) Foundation + Auth → (2) Workspace/Access → (3) Items + Metadata → (4) Assets + Worker → (5) Links → (6) Shares/Export/Audit

```text
[แนบ Prompt 0] + [แนบ docs/02-architecture.md, db/schema.sql, api/openapi.yaml]

# TASK: Phase 5 — Backend Implementation | Module: {{ชื่อ Module}}
ในบทบาท Senior Backend Engineer ให้พัฒนา Backend ของ Momentra ด้วย {{stack จาก Phase 2}}
ทำเฉพาะ Module ที่ระบุ แต่ให้ยึดโครงสร้างโปรเจกต์และ convention เดิม

# STEP
1. สรุปแผนงานของ Module นี้: ไฟล์ที่จะสร้าง/แก้ และ endpoint ที่ครอบคลุม (รอการยืนยันถ้าเป็น Module แรก)
2. เขียนโค้ดตาม Clean/Layered architecture: controller → service → repository, DTO validation
3. เขียน Unit test และ Integration test (coverage ของ service layer ≥ 80%)
4. อัปเดต README และ .env.example

# REQUIREMENTS เฉพาะของ Module สำคัญ
- Foundation: config, logging แบบ structured JSON, error handler ตาม Problem Details, health check,
  request id, i18n ข้อความ error ไทย/อังกฤษ
- Access: ตรวจสิทธิ์ทุก request ตาม Authorization matrix และตั้ง workspace context ให้ RLS
- Items: validate event date (precision, circa, start <= end), คำนวณ sort_key, บันทึก audit log ทุกการแก้ไข
- Assets:
  * ออก presigned URL แบบ multipart/resumable, ตรวจ mime type จริง (magic bytes) ไม่เชื่อ extension
  * เมื่อ complete: ตรวจ checksum, สแกนไวรัส (ClamAV), ส่ง job ให้ worker
  * Worker: สร้าง thumbnail, ดึง EXIF (วันที่ถ่ายใช้เสนอเป็น event_date ให้ผู้ใช้ยืนยัน), แปลงวิดีโอเป็น HLS preview,
    ดึงข้อความจาก PDF/DOCX เพื่อใช้ค้นหา
  * retry แบบ exponential backoff และสถานะ failed ที่ผู้ใช้เห็นได้
- Links: normalize URL, ป้องกันลิงก์ซ้ำใน workspace, ดึง Open Graph แบบ async,
  ป้องกัน SSRF (block private IP, จำกัด redirect/timeout/size), ตรวจลิงก์เสียตามรอบ
- Export: ZIP ไฟล์จริง + metadata.json/csv ตามมาตรฐาน {{เช่น Dublin Core}}

# OUTPUT FORMAT
- แสดงโค้ดครบทุกไฟล์ที่สร้าง/แก้ พร้อม path
- คำสั่งรันและทดสอบ
- Assumptions / Open Questions / Next Step
```

**Quality Gate Phase 5 (ต่อ Module)**

- [ ] Test ผ่านทั้งหมด และ API ตรงกับ openapi.yaml (contract test)
- [ ] อัปโหลดไฟล์ 2 GB แบบ resumable สำเร็จ และหยุด/ต่อได้
- [ ] ไม่มี Secret ในโค้ด, Lint ผ่าน

## 9. Phase 6 — Search & Timeline/Roadmap Engine

เป้าหมาย: หัวใจของวัตถุประสงค์ข้อ 3 — ค้นหาแม่นยำ (รวมภาษาไทย) และแสดง Timeline ได้เร็วแม้ข้อมูลมาก

```text
[แนบ Prompt 0] + [แนบ db/schema.sql, api/openapi.yaml, โค้ด Backend ปัจจุบัน]

# TASK: Phase 6 — Search & Timeline Engine
ในบทบาท Search/AI Engineer ให้พัฒนา Search service และ Timeline service ของ Momentra

# PART A: SEARCH
1. ออกแบบ Index document: title, description, tags, entities, ข้อความที่ extract จากไฟล์, domain ของลิงก์,
   event_start, event_end, type, workspace_id, visibility
2. การตัดคำภาษาไทย (เช่น ICU tokenizer / PyThaiNLP / analyzer ของ search engine ที่เลือก) และรองรับคำผสมไทย-อังกฤษ
3. Features: full-text + highlight, typo tolerance, synonym (เช่น "รูป" = "ภาพ"), faceted filter (type, tag, ปี, บุคคล),
   ค้นหาตามช่วงวันที่แบบ overlap กับ event range, sort ตาม relevance หรือ event date
4. กลไก sync DB → Search index (outbox pattern หรือ event) พร้อม reindex ทั้งหมดได้
5. ทุก query ต้องกรอง workspace_id และสิทธิ์ (ห้ามรั่วข้ามสิทธิ์)
6. [Phase 2 option] Semantic search ด้วย embedding (pgvector) และ Hybrid ranking

# PART B: TIMELINE / ROADMAP
1. API /timeline คืนค่าแบบ bucket ตาม granularity (ปี/เดือน/วัน) พร้อมจำนวนและ items ตัวอย่างต่อ bucket
2. วางตำแหน่ง item ที่ date_precision ต่างกันอย่างถูกต้อง (เช่น precision=year แสดงเป็นช่วงทั้งปี และมีป้าย "ประมาณ" ถ้า is_circa)
3. รองรับ item ที่เป็นช่วงเวลา (start–end) และ Milestone
4. Roadmap ที่ผู้ใช้สร้าง: เลือก items มาเรียงเป็นเรื่องราว, เพิ่มหมายเหตุ, ลำดับเอง, แชร์ได้
5. Aggregation สำหรับ heatmap/histogram (จำนวนต่อเดือน/ปี) เพื่อใช้ซูม
6. การแปลงปี พ.ศ./ค.ศ. และ timezone ในชั้นแสดงผลเท่านั้น
7. Caching ผลลัพธ์ bucket ที่ถูกเรียกบ่อย และ invalidation เมื่อข้อมูลเปลี่ยน

# DELIVERABLE
- โค้ด search module + timeline module + test
- docs/06-search-timeline.md: การออกแบบ index, analyzer, ranking, ตัวอย่าง query และผล benchmark
- ชุดทดสอบความแม่นยำการค้นหา (อย่างน้อย 20 query ภาษาไทย/อังกฤษ พร้อมผลที่คาดหวัง)
```

**Quality Gate Phase 6**

- [ ] ค้นหาคำไทยที่ไม่มีเว้นวรรคเจอถูกต้อง (เช่น "งานบวช" ในประโยคยาว)
- [ ] Search p95 < 1 วินาที และ Timeline p95 < 500 ms ที่ 1 ล้านรายการ
- [ ] Item วันที่ไม่แน่นอนแสดงตำแหน่งและป้ายถูกต้อง

## 10. Phase 7 — Frontend UI/UX

เป้าหมาย: หน้าจอที่ทำให้ "เก็บง่าย หาเจอ เห็นเป็นเรื่องราว" แบ่งเป็น 2 Prompt: ออกแบบ UX ก่อน แล้วค่อยพัฒนา

**Prompt 7A — UX Design**

```text
[แนบ Prompt 0] + [แนบ docs/01-srs.md (User stories)]

# TASK: Phase 7A — UX/UI Design
ในบทบาท Senior UX Designer ให้ออกแบบประสบการณ์ผู้ใช้ของ Momentra

# DELIVERABLE: docs/07-ux.md
1. Information Architecture และ Sitemap
2. User Flow ของ: Onboarding/สร้าง Workspace, อัปโหลดหลายไฟล์ (drag & drop), บันทึกลิงก์,
   ระบุวันที่เหตุการณ์แบบไม่แน่นอน, ค้นหา + filter, สำรวจ Timeline, สร้าง Roadmap, แชร์
3. Wireframe แบบข้อความ/ASCII หรือ HTML mockup ของหน้า: Dashboard, Library (grid/list), Item detail,
   Upload panel, Timeline view, Roadmap editor, Search results, Settings/Members
4. Component สำคัญ: Date input ที่เลือก precision ได้ (ปี / เดือน / วัน / ช่วง / ประมาณ) และสลับ พ.ศ./ค.ศ.
5. Design tokens (สี, typography รองรับฟอนต์ไทย, spacing), Dark mode, Responsive (มือถือ/แท็บเล็ต/เดสก์ท็อป)
6. Empty state, Loading, Error state และ Accessibility (WCAG 2.1 AA, keyboard navigation)
```

**Prompt 7B — Frontend Implementation**

```text
[แนบ Prompt 0] + [แนบ docs/07-ux.md, api/openapi.yaml]

# TASK: Phase 7B — Frontend Implementation | หน้าจอ: {{ชื่อหน้าจอ}}
ในบทบาท Senior Frontend Engineer ให้พัฒนา Web app ด้วย {{เช่น Next.js + TypeScript + Tailwind}}

# REQUIREMENTS
1. สร้าง API client แบบ type-safe จาก openapi.yaml (codegen) ห้ามเขียน type ซ้ำเอง
2. State/Data fetching ด้วย {{เช่น TanStack Query}} พร้อม cache, optimistic update
3. Upload: หลายไฟล์พร้อมกัน, แสดง progress, resumable, ยกเลิก/ลองใหม่ได้
4. Timeline view: ซูม ปี ↔ เดือน ↔ วัน, virtualized rendering รองรับหลายหมื่นรายการ,
   heatmap ด้านบน, คลิกเปิด preview ได้โดยไม่ออกจากหน้า
5. Media preview: รูป (zoom), วิดีโอ (HLS player), PDF viewer, Link card
6. i18n ไทย/อังกฤษ, แสดงวันที่ตาม locale และปฏิทินที่ผู้ใช้เลือก
7. Component test + E2E test (Playwright) ของ Flow หลัก
8. ส่งโค้ดครบทุกไฟล์พร้อม path และวิธีรัน
```

**Quality Gate Phase 7**

- [ ] ผู้ใช้ทดสอบ 5 คน ทำงานหลัก (อัปโหลด, ค้นหา, ดู Timeline) สำเร็จโดยไม่ต้องช่วย
- [ ] Lighthouse: Performance ≥ 85, Accessibility ≥ 95
- [ ] Timeline 50,000 รายการเลื่อนลื่น (≥ 50 fps)

## 11. Phase 8 — Security, Testing & QA

เป้าหมาย: ให้ AI อีกบทบาทหนึ่งตรวจงานแบบไม่เข้าข้างตัวเอง ก่อนขึ้น Production (แนะนำให้ใช้ Session ใหม่ที่ไม่เห็นการเขียนโค้ด)

```text
[แนบ Prompt 0] + [แนบ docs/01-srs.md, api/openapi.yaml, source code ทั้งหมด]

# TASK: Phase 8 — Security Review & QA
ในบทบาท QA Lead และ Application Security Engineer ที่เป็นอิสระจากทีมพัฒนา
ให้ตรวจสอบ Momentra อย่างเข้มงวด เป้าหมายคือหาจุดบกพร่องให้มากที่สุด ไม่ใช่ยืนยันว่าดีแล้ว

# PART A: SECURITY (อ้างอิง OWASP Top 10 และ OWASP API Security Top 10)
ตรวจอย่างน้อย:
- Broken access control / IDOR ข้าม workspace และข้ามสิทธิ์ role, ลิงก์แชร์หมดอายุแล้วยังเข้าได้หรือไม่
- File upload: ไฟล์ปลอม mime, ไฟล์อันตราย (SVG/HTML ที่มี script), zip bomb, path traversal
- SSRF จากฟีเจอร์ดึง preview ลิงก์, XSS จาก metadata/OG tag, Injection
- Authentication/session, JWT, CSRF, rate limiting, secret management
- PDPA: การเก็บข้อมูลส่วนบุคคล (EXIF GPS, ใบหน้า), สิทธิ์ขอลบ/ส่งออกข้อมูล, data retention
- Dependency vulnerability (SCA) และ container image scan

# PART B: TEST STRATEGY & TEST CASES
1. Test plan: unit, integration, contract, E2E, performance, security, UAT
2. Test case ตาราง (ID, Requirement ที่ trace, ขั้นตอน, ผลที่คาดหวัง) ครอบคลุมทุก FR
3. Edge case เฉพาะโดเมน: วันที่ก่อน ค.ศ. 1900, ปี พ.ศ. ที่กรอกผิดเป็น ค.ศ., event_end < event_start,
   ไฟล์ชื่อภาษาไทยยาว, ลิงก์ซ้ำต่างรูปแบบ, ไฟล์ซ้ำ checksum เดียวกัน
4. Load test script (k6 หรือ Locust) สำหรับ upload, search, timeline ตาม NFR

# DELIVERABLE
- docs/08-security-report.md: Findings ระดับ Critical/High/Medium/Low พร้อมตำแหน่งโค้ด, วิธีทำซ้ำ, วิธีแก้
- docs/08-test-plan.md และโค้ด test ที่เพิ่ม
- รายการสิ่งที่ต้องแก้ก่อน Go-live (Blocker list)
```

**Quality Gate Phase 8**

- [ ] ไม่มี Finding ระดับ Critical/High ค้าง
- [ ] Load test ผ่านตาม NFR ทุกข้อ
- [ ] UAT กับผู้ใช้จริงผ่านและลงนามรับ

## 12. Phase 9 — Deployment, DevOps & Operations

เป้าหมาย: Deploy ซ้ำได้อัตโนมัติ มี Backup ที่กู้คืนได้จริง และมีคู่มือดูแลระบบ

```text
[แนบ Prompt 0] + [แนบ docs/02-architecture.md, source code, docs/08-security-report.md]

# TASK: Phase 9 — Deployment & Operations
ในบทบาท DevOps/SRE Engineer ให้เตรียม Momentra สำหรับ Production บน {{Cloud/On-premise ที่เลือก}}

# DELIVERABLE
1. Containerization: Dockerfile แบบ multi-stage (non-root, image เล็ก) และ docker-compose สำหรับ Local dev
   (app, db, object storage MinIO, search, redis, worker, clamav)
2. Infrastructure as Code: {{Terraform / Helm chart / Kubernetes manifests}} แยก environment dev / staging / prod
3. CI/CD pipeline ({{GitHub Actions / GitLab CI}}): lint → test → security scan (SAST, SCA, image scan)
   → build → migrate DB → deploy staging → smoke test → approve → deploy prod, พร้อม rollback
4. Observability: metrics (Prometheus/Grafana หรือของ Cloud), log รวมศูนย์, tracing (OpenTelemetry),
   Alert ตาม SLO (เช่น error rate, upload failure, queue backlog, disk/storage ใกล้เต็ม)
5. Backup & Disaster Recovery: backup DB (PITR), versioning + lifecycle ของ object storage
   (ย้ายไฟล์เก่าไป cold storage), ทดสอบ restore จริงพร้อมขั้นตอน, ระบุ RPO/RTO
6. Digital preservation: ตรวจ checksum ของไฟล์ทั้งหมดตามรอบ (fixity check) และรายงานไฟล์เสียหาย
7. Secret management, TLS, WAF/CDN สำหรับ media
8. docs/09-runbook.md: วิธี deploy, rollback, scale, กู้คืนข้อมูล, รับมือเหตุการณ์ (incident playbook),
   งานดูแลประจำวัน/สัปดาห์/เดือน
9. ประมาณค่าใช้จ่ายรายเดือนตามปริมาณจริง และแนวทางลดต้นทุน
```

**Quality Gate Phase 9**

- [ ] Deploy จาก commit ไปถึง staging อัตโนมัติ < 15 นาที
- [ ] ทดสอบ Restore DB และไฟล์จาก Backup สำเร็จภายใน RTO
- [ ] Alert ทำงานจริงเมื่อจำลองความผิดพลาด

## 13. Prompt เสริม และ Checklist ส่งมอบ

ใช้ 3 Prompt นี้ได้ทุก Phase เมื่องานไม่ผ่าน Quality Gate, เกิด Bug หรือ Requirement เปลี่ยน

**Prompt R — Review งานของ Phase**

```text
[แนบ Prompt 0] + [แนบผลงานของ Phase {{N}}] + [แนบเอกสารต้นทาง เช่น SRS]

ในบทบาท Principal Architect ที่ไม่ได้เป็นผู้เขียนงานนี้ ให้ Review ผลงาน Phase {{N}} อย่างเข้มงวด
1. ตรวจความสอดคล้องกับ SRS, Architecture และ ADR ที่มี (ระบุจุดที่ขัดกัน)
2. ตรวจตาม Quality Gate ของ Phase นี้: {{วาง checklist}}
3. หาช่องโหว่ด้าน Security, Performance, Maintainability และ Edge case ของ event date
4. จัดลำดับ Findings เป็น Must fix / Should fix / Nice to have พร้อมวิธีแก้ที่เจาะจง
5. สรุปผล: ผ่าน หรือ ไม่ผ่าน Gate พร้อมเหตุผล
```

**Prompt D — Debug**

```text
[แนบ Prompt 0] + [แนบโค้ดที่เกี่ยวข้อง]

อาการ: {{สิ่งที่เกิดขึ้น}}
สิ่งที่คาดหวัง: {{ผลที่ควรเป็น}}
ขั้นตอนทำซ้ำ: {{steps}}
Error log / Stack trace: {{วาง log}}
Environment: {{local/staging/prod, version}}

ให้วิเคราะห์ Root cause ก่อนแก้ โดยเสนอสมมติฐานเรียงตามความน่าจะเป็น และวิธีพิสูจน์แต่ละข้อ
จากนั้นแก้ไขแบบแตะโค้ดน้อยที่สุด เพิ่ม Regression test ที่ fail ก่อนแก้และ pass หลังแก้
ห้ามแก้ไขส่วนที่ไม่เกี่ยวข้อง
```

**Prompt C — Change Request**

```text
[แนบ Prompt 0] + [แนบ SRS, Architecture, Schema, OpenAPI ปัจจุบัน]

Change Request: {{อธิบายความต้องการใหม่}}
เหตุผลทางธุรกิจ: {{why}}

ในบทบาท Senior System Analyst ให้:
1. วิเคราะห์ผลกระทบ (Impact analysis) ต่อ Requirement, Data model, API, UI, Test, Migration ข้อมูลเดิม
2. ประเมินขนาดงาน (S/M/L) และความเสี่ยง
3. เสนอทางเลือกอย่างน้อย 2 แบบพร้อมข้อดีข้อเสีย และแนะนำ 1 แบบ
4. ระบุเอกสารที่ต้องอัปเดตและเขียน ADR ใหม่
ยังไม่ต้องเขียนโค้ดจนกว่าจะได้รับการอนุมัติ
```

**Checklist ส่งมอบระบบ (Definition of Done ทั้งโครงการ)**

- [ ] วัตถุประสงค์ 1: บันทึก Information/Link ได้ ดึง Preview และตรวจลิงก์เสียได้
- [ ] วัตถุประสงค์ 2: เก็บรูป บทความ วิดีโอ เสียง เอกสาร ได้ครบ มี Preview และ Checksum
- [ ] วัตถุประสงค์ 3: ค้นหาภาษาไทย/อังกฤษได้แม่นยำ และดู Timeline/Roadmap ตามวันเวลาได้
- [ ] เอกสารครบ: SRS, Architecture + ADR, Data model, OpenAPI, UX, Test plan, Security report, Runbook
- [ ] ผ่าน Quality Gate ทุก Phase และ UAT ได้รับการลงนาม
- [ ] Backup/Restore ทดสอบจริงแล้ว และมีผู้รับผิดชอบดูแลระบบหลังส่งมอบ
