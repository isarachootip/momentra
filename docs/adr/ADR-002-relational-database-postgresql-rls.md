# ADR 002: Relational Database Strategy with PostgreSQL, GiST Index, and RLS

## Status
**Accepted** (Baseline for Phase 2)

## Context
Momentra ต้องการจัดเก็บข้อมูลที่มีความสัมพันธ์สูง (Relational Structure) ประกอบด้วย Workspaces, Assets, Links, Events, Collections, Users, Audit Logs โดยมีโจทย์สำคัญ:
- **Historical Imprecise Time Intervals:** ต้องสามารถ Query ช่วงเวลาตัดกัน (Interval Overlapping: `start_utc` ถึง `end_utc`) ได้รวดเร็วระดับ Sub-second บนข้อมูล 1,000,000 รายการ (NFR-PERF-01, NFR-PERF-02)
- **Multi-tenancy Data Isolation:** ป้องกันการรั่วไหลของข้อมูลข้าม Workspace 100% ตามข้อกำหนด PDPA และความปลอดภัยขององค์กร (NFR-SEC-02)
- **Future Vector Support:** Phase 2 ต้องการรองรับ Semantic Vector Search
- **Data Integrity & Consistency:** ต้องรองรับ ACID Transaction สำหรับการจัดการสิทธิ์และคอลเลกชัน

ตัวเลือกที่นำมาพิจารณา:
1. **PostgreSQL 16+:** มี Native GiST Index สำหรับ Interval Overlap (`tsrange` / `tstzrange`), Row-Level Security (RLS) ระดับเคอร์เนล, Full-Text Search ในตัว, และรองรับ `pgvector` extension
2. **MySQL 8.0:** ไม่มี native GiST Index สำหรับ Range Types ต้องจำลองด้วย B-Tree 2 คอลัมน์ซึ่ง Query ช้ากว่าเมื่อข้อมูลระดับล้านแถว ไม่มี Native RLS
3. **MongoDB / NoSQL:** ยืดหยุ่นใน JSON Document แต่การทำ Multi-tenancy RLS และ Relational Cascades ทำได้ยาก ขาด ACID Transactions แบบ Cross-collection ที่แข็งแกร่ง

## Decision
เราตัดสินใจเลือก **PostgreSQL 16+** เป็น Single Primary Database ของระบบ Momentra

กลยุทธ์ทางเทคนิคที่นำมาใช้:
1. **Time Range Indexing (GiST Index):** ใช้ Extension `btree_gist` และประเภทข้อมูล `tstzrange` ร่วมกับคอลัมน์ `event_date_start_utc` และ `event_date_end_utc` เพื่อทำ Interval Overlap Query (`&&`)
2. **PostgreSQL Row-Level Security (RLS):** เปิดใช้งาน RLS บนทุกตารางหลัก โดยใช้ Session Variable `app.current_workspace_id` เป็นตัวกรองระดับฐานข้อมูล
3. **Connection Pooling:** ใช้ **pgBouncer** หรือ Native Connection Pooler ในตัวจัดการ Connections ไม่ให้เกินโควตาแรมบน Hostinger VPS
4. **Vector Ready:** ติดตั้ง Extension `pgvector` รอไว้เพื่อรองรับ Phase 2 โดยไม่ต้องเพิ่ม Database Engine อื่น

## Consequences
### Positive
- **Optimal Time Interval Performance:** การสืบค้นช่วงเวลาในประวัติศาสตร์ทำงานได้เร็วมาก (O(log N)) ผ่าน GiST Index
- **Zero Data Leakage:** RLS การันตีว่าแม้ Application Code จะลืมใส่เงื่อนไข `WHERE workspace_id = ...` ฐานข้อมูลจะไม่อนุญาตให้อ่านข้อมูลข้าม Tenant
- **Unified Engine:** ใช้ PostgreSQL ตัวเดียวจัดการได้ทั้ง Relational Data, Full-Text Search (Phase 1), และ Vector Search (Phase 2)
- **Cost Effective:** รันได้เสถียรบน Hostinger VPS โดยใช้แรมเพียง 1.5–2 GB

### Negative / Trade-offs
- **RLS Overhead:** การเปิด RLS เพิ่ม Latency เล็กน้อยในการตรวจสอบ Session Variable ทุก Query (ประเมินแล้วไม่เกิน 1–2% ซึ่งคุ้มค่ากับความปลอดภัย)
- **Superuser Bypass Risk:** ต้องไม่อนุญาตให้ Application เชื่อมต่อด้วยสิทธิ์ Database Superuser มิฉะนั้น RLS จะถูกข้าม

## Compliance to NFRs
- **NFR-PERF-01 (Search < 800ms) & NFR-PERF-02 (Timeline < 500ms):** B-Tree และ GiST Index ตอบสนองได้ตามเกณฑ์
- **NFR-SEC-02 (Multi-tenant Isolation):** ได้รับการรับรองด้วย RLS ระดับเคอร์เนล
- **NFR-SCALE-01 (1,000 Concurrent Users):** pgBouncer ช่วยรักษาระดับ Connections
