# ADR 006: Historical Time Interval Normalization for Imprecise Timelines

## Status
**Accepted** (Baseline for Phase 2)

## Context
ระบบ Momentra มีข้อกำหนดพื้นฐานที่เข้มงวด:
- ต้องแยก `event_date` (วันที่เกิดเหตุการณ์ประวัติศาสตร์จริง) ออกจาก `created_at` (วันที่บันทึกไฟล์เข้าระบบ) โดยเด็ดขาด
- ประวัติศาสตร์มีข้อมูลเวลาที่ไม่แน่นอน:
  - ทราบเฉพาะปี (เช่น ปี พ.ศ. 2480 / ค.ศ. 1937)
  - ทราบเฉพาะเดือนและปี (เช่น พฤษภาคม 2489)
  - วันที่ประมาณ (Circa เช่น circa 2510)
  - ช่วงเวลาเหตุการณ์ (เช่น สงครามโลกครั้งที่สอง 2482 – 2488)
- ฐานข้อมูลต้องการ Index ที่ค้นหาได้อย่างรวดเร็ว (NFR-PERF-01 < 800ms) ขณะที่ UI ต้องสลับแสดงผลระหว่าง พ.ศ. และ ค.ศ. ได้ลื่นไหล

## Decision
เราตัดสินใจใช้โมเดล **Normalized Time Interval with Explicit Imprecision Flags**:

1. **Database Schema Representation:**
   ทุก Record ที่มีมิติเวลา จะเก็บ 5 ฟิลด์หลัก:
   - `event_date_start_utc` (TIMESTAMPTZ): เวลาเริ่มต้นที่เป็นไปได้เร็วที่สุด (Normalized UTC)
   - `event_date_end_utc` (TIMESTAMPTZ): เวลาสิ้นสุดที่เป็นไปได้ช้าที่สุด (Normalized UTC)
   - `date_precision` (ENUM): `'year'`, `'month'`, `'day'`, `'datetime'`
   - `is_circa` (BOOLEAN): ระบุว่าเป็นค่าประมาณหรือไม่
   - `is_range` (BOOLEAN): ระบุว่าเป็นช่วงเวลาต่อเนื่องหรือไม่
   - `event_time_range` (TSTZRANGE GENERATED): คอลัมน์ Generated จาก Start และ End เพื่อสร้าง GiST Index
2. **Normalization Rules (UTC Conversion):**
   - **Year Precision (เช่น ค.ศ. 1950):** `start = 1950-01-01T00:00:00Z`, `end = 1950-12-31T23:59:59.999Z`
   - **Month Precision (เช่น มิ.ย. 1932):** `start = 1932-06-01T00:00:00Z`, `end = 1932-06-30T23:59:59.999Z`
   - **Day Precision (เช่น 24 มิ.ย. 1932):** `start = 1932-06-24T00:00:00Z`, `end = 1932-06-24T23:59:59.999Z`
   - **Circa Buffer Expansion:** หากผู้ใช้ระบุ circa สำหรับปีโดยไม่ระบุช่วง ระบบจะขยาย start/end ออกไป ±5 ปี (หรือตามที่ผู้ใช้กำหนด) เพื่อครอบคลุมการค้นหา
3. **Dual Calendar Display (Presentation Layer):**
   - ฐานข้อมูลและ API สื่อสารด้วย Common Era (ค.ศ. / ISO 8601 UTC) เสมอ
   - Frontend ทำการแปลงเป็น พ.ศ. (ปี ค.ศ. + 543) และแสดงผลตาม Local Timezone `Asia/Bangkok` (+07:00)

## Consequences
### Positive
- **High-Performance Querying:** ใช้คำสั่ง `WHERE event_time_range && tstzrange(query_start, query_end)` ผ่าน GiST Index ได้เร็วในระดับมิลลิวินาที
- **Clean Separation of Concerns:** Core Business Logic ใน Domain Package เป็น Pure Function ที่ทดสอบได้ 100% ด้วย Unit Tests
- **No Data Ambiguity:** ไม่มีการ "สุ่มเดา" วันที่ และเก็บความตั้งใจดั้งเดิมของผู้บันทึก (`date_precision`) ไว้อย่างครบถ้วน

### Negative / Trade-offs
- **Storage Footprint:** จัดเก็บ 2 timestamps แทนที่จะเป็น 1 timestamp (เพิ่มขึ้นเล็กน้อย แต่คุ้มค่ากับความสามารถในการ Query)

## Compliance to NFRs
- **NFR-PERF-01 & NFR-PERF-02:** รองรับการ Query และ Render Timeline ที่รวดเร็ว
- **BR-01, BR-02, BR-03, BR-04:** ตรงตาม Business Rules ใน SRS ทุกประการ
