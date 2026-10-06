# ADR 003: Object Storage Strategy with S3-compatible Direct Presigned Upload

## Status
**Accepted** (Baseline for Phase 2)

## Context
ระบบ Momentra ต้องจัดเก็บไฟล์ภาพความละเอียดสูง, สแกนเอกสาร PDF, คลิปเสียง และวิดีโอ (ขนาดไฟล์สูงสุด 4 GB ต่อไฟล์, ข้อมูลรวมเริ่มต้น 5 TB และขยายสู่ 50 TB)
ข้อจำกัดและข้อกำหนด:
- โฮสต์บน Hostinger VPS ซึ่งมีพื้นที่ Local NVMe เพียง 200–400 GB ไม่เพียงพอสำหรับจัดเก็บข้อมูล 5–50 TB
- หากไฟล์ 4 GB ไหลผ่าน Application Server จะทำให้ Bandwidth เต็ม และเกิดปัญหา Node.js / Server RAM Out-of-Memory (OOM)
- ต้องควบคุมค่าใช้จ่ายด้าน Bandwidth Egress ไม่ให้บานปลาย

ตัวเลือก Object Storage ที่พิจารณา:
1. **Cloudflare R2 (S3-compatible):** ค่าจัดเก็บ $0.015/GB/เดือน และที่สำคัญคือ **$0 Data Egress Fees (ฟรีค่าถ่ายโอนข้อมูล)**
2. **Hostinger Object Storage:** ค่าจัดเก็บถูก (~$0.012/GB) แต่อาจมีข้อจำกัดด้านความเร็วในการทำ Multi-region CDN
3. **AWS S3 Standard:** ความเสถียรสูงสุด แต่ค่า Egress สูงมาก ($0.09/GB) หากมีการดาวน์โหลดสินทรัพย์ 2 TB/เดือน จะเสียค่า Egress เพิ่มถึง $180/เดือน
4. **Self-hosted MinIO บน VPS:** กินพื้นที่ดิสก์และแรมของ VPS อย่างหนัก ไม่เหมาะกับปริมาณ 5 TB+

## Decision
เราตัดสินใจเลือก **Cloudflare R2 (หรือ Hostinger S3-compatible Storage)** ร่วมกับสถาปัตยกรรม **Client Direct-to-Storage Presigned Upload**:

1. **Direct Presigned URL Ingestion:**
   - สำหรับไฟล์ขนาด < 100 MB: ใช้ S3 Presigned `PUT` URL อัปโหลดโดยตรงจาก Web Browser เข้าสู่ Bucket
   - สำหรับไฟล์ขนาดใหญ่ 100 MB – 4 GB: ใช้ **S3 Multipart Upload with Presigned URLs** (แบ่งชิ้นละ 10–50 MB) พร้อมรองรับ Resumable Upload
2. **Storage Partitioning:**
   - `temp-uploads/`: จัดเก็บไฟล์ชั่วคราวที่เพิ่งอัปโหลดเสร็จ รอ Background Worker เข้ามาประมวลผล (มี Lifecycle Policy ลบทิ้งอัตโนมัติหากเกิน 24 ชั่วโมง)
   - `permanent-assets/{workspace_id}/{sha256}/`: จัดเก็บไฟล์ตัวจริงที่ผ่านการตรวจสอบ SHA-256 และสแกนไวรัสแล้ว
   - `derivatives/{workspace_id}/{sha256}/`: จัดเก็บไฟล์ขนาดเล็ก เช่น WebP Thumbnails, Waveforms, HLS Previews

## Consequences
### Positive
- **Zero Web Server Load:** VPS ของ Hostinger ไม่ต้องแบกรับทราฟฟิกข้อมูล 4 GB ต่อไฟล์ ทำให้ Web Server เสถียรและตอบสนองเร็ว (NFR-PERF-04)
- **Predictable & Lowest Cost:** การเลือก Cloudflare R2 ทำให้เสียเฉพาะค่าจัดเก็บ $75/เดือน สำหรับ 5 TB โดยไม่มีบิลค่า Egress Bandwidth บานปลาย
- **Infinite Scalability:** ขยายพื้นที่จาก 5 TB เป็น 50 TB ได้ทันทีโดยไม่ต้องย้ายเครื่องหรือขยายขนาดเซิร์ฟเวอร์ VPS (NFR-SCALE-02)

### Negative / Trade-offs
- **Orphaned File Clean-up:** หากผู้ใช้อัปโหลดไฟล์เข้า Storage สำเร็จ แต่ปิดบราวเซอร์ก่อนเรียก API ยืนยัน ระบบต้องมี S3 Lifecycle Rule เพื่อล้าง `temp-uploads/` ทิ้งอัตโนมัติ

## Compliance to NFRs
- **NFR-PERF-04 (Upload Throughput):** อัปโหลดตรงผ่าน Cloudflare Network ด้วยความเร็วสูงสุดตามเน็ตของผู้ใช้
- **NFR-SCALE-02 (Storage 5 TB -> 50 TB):** รองรับได้ไม่จำกัด
- **NFR-SEC-01 (Encryption at Rest AES-256):** Cloudflare R2 เข้ารหัส AES-256 เป็นมาตรฐาน
