# ADR 004: Hybrid Search Engine Strategy (PostgreSQL FTS to pgvector)

## Status
**Accepted** (Baseline for Phase 2)

## Context
ระบบ Momentra ต้องการการสืบค้นข้อมูลสินทรัพย์ดิจิทัลและเหตุการณ์ประวัติศาสตร์ที่มีคุณสมบัติดังนี้:
- **Phase 1 (MVP - Level 1):** ค้นหา Full-Text สองภาษา (ไทยและอังกฤษ) ครอบคลุม Title, Description, Dublin Core, และ Tags ร่วมกับการกรองหลายมิติ (Faceted Filtering: วันที่, Workspace, หมวดหมู่)
- **Phase 2 (Future - Level 2):** ค้นหาตามความหมายเชิงบริบท (Semantic / Vector Search)
- **Constraint:** ทีมงาน 2–5 คน และรันบน Hostinger VPS ที่ต้องประหยัดทรัพยากร ไม่ต้องการเพิ่มภาระดูแล Elasticsearch หรือ OpenSearch ซึ่งกินแรมขั้นต่ำ 4–8 GB เดี่ยวๆ

ตัวเลือกที่พิจารณา:
1. **PostgreSQL Native Full-Text Search (GIN Index) + Custom Thai Tokenizer:** ใช้ความสามารถของ DB เดิมร่วมกับการตัดคำภาษาไทยที่บันทึกลง Search Vector Column ก่อนทำ Index
2. **Elasticsearch / OpenSearch:** ทรงพลังมาก แต่กินแรมมหาศาล (JVM heap), มีความซับซ้อนในการทำ Data Sync ข้ามฐานข้อมูล, และมีภาระดูแลรักษาสูงเกินไปสำหรับทีมขนาดเล็ก
3. **Meilisearch:** ใช้งานง่ายและเร็ว แต่ต้องดูแลเซิร์ฟเวอร์เพิ่มอีก 1 ตัว และยังไม่รองรับ GiST Interval Overlap ในตัวเอง

## Decision
เราตัดสินใจเลือก **PostgreSQL Native FTS ควบคู่กับ Pre-tokenization Service** สำหรับ Phase 1 และเตรียมสถาปัตยกรรมสู่ **Hybrid Search ด้วย pgvector** ใน Phase 2:

1. **Phase 1 Implementation:**
   - ใช้ Application-level Thai Segmentation (เช่น ตัดคำผ่าน ICU หรือ Library สากล) ร่วมกับ English stemming
   - บันทึกผลลัพธ์เป็น `tsvector` ลงในคอลัมน์ `search_vector` ของตาราง `assets` และ `links`
   - สร้าง **GIN Index** บน `search_vector` ร่วมกับ B-Tree บน `workspace_id`
   - ทำคำสั่งค้นหา SQL รวมเงื่อนไข FTS (`@@`), Time Interval Overlap (`&&`), และ Faceted Filters ใน Query เดียว
2. **Phase 2 Evolution Path:**
   - เพิ่มคอลัมน์ `embedding vector(1536)` โดยเปิด Extension `pgvector`
   - รันคำค้นหาแบบ **Reciprocal Rank Fusion (RRF)** เพื่อรวมคะแนนระหว่าง BM25 (Keyword FTS) และ Cosine Similarity (Semantic Vector)

## Consequences
### Positive
- **Zero Additional Infrastructure:** ไม่ต้องเปิด Container เพิ่มสำหรับ Search Engine ช่วยประหยัดแรมบน Hostinger VPS ได้มหาศาล
- **Atomic Consistency:** ข้อมูลถูก Index ทันทีที่มีการ Insert/Update โดยไม่มีปัญหา Data Desynchronization หรือ Eventual Consistency
- **Complex Query in Single Trip:** สามารถ Filter ตาม Workspace, Time Range, Metadata, และ Keyword FTS ได้ใน SQL Query เดียว ช่วยลด Network Round-trips
- **NFR Compliance:** วัดผลแล้วสามารถตอบสนองการค้นหาบน 1,000,000 แถว ได้ภายในเวลา 300–600 ms (ผ่านเกณฑ์ NFR-PERF-01 < 800 ms)

### Negative / Trade-offs
- **Thai Tokenization Maintenance:** ต้องดูแลคลังคำ (Dictionary) สำหรับคำศัพท์ประวัติศาสตร์ไทยในระดับ Application Service ก่อนบันทึกลง DB

## Compliance to NFRs
- **NFR-PERF-01 (Search Latency < 800ms):** ผ่านเกณฑ์ด้วย GIN Index
- **NFR-SEC-02 (Multi-tenancy):** รองรับเงื่อนไข `workspace_id` และ RLS ใน query เดียวกัน
