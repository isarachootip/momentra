# ADR 001: Modular Monolith Architecture Pattern

## Status
**Accepted** (Baseline for Phase 2)

## Context
ระบบ Momentra (Historical Digital Asset Management) ต้องการระบบบริหารจัดการสินทรัพย์ดิจิทัลและไทม์ไลน์ประวัติศาสตร์ โดยมีข้อกำหนดเริ่มต้น:
- ทีมพัฒนาขนาดเล็ก 2–5 คน (Senior Full-stack, SA, AI/Search, QA/Security)
- ผู้ใช้งานปีแรกคาดการณ์ 1,000 users และจัดเก็บข้อมูล 5 TB (ขยายได้ในอนาคต)
- โฮสต์บน **Hostinger KVM VPS** (ทรัพยากร 4–8 vCPU, 16–32 GB RAM)
- ต้องรองรับ NFR-PERF-03 (API P95 < 300ms) และ NFR-AVAIL-01 (Uptime 99.9%)

ทางเลือกทางสถาปัตยกรรมหลักมี 2 ทางเลือก:
1. **Microservices Architecture:** แยก Asset Service, Timeline Service, Search Service, Auth Service อิสระออกจากกันโดยใช้ gRPC/REST และ Event Broker
2. **Modular Monolith Architecture:** รวมโค้ดเบสทั้งหมดเป็นแอปพลิเคชันเดียว แต่แบ่งแยกโดเมนโมดูลภายในอย่างเคร่งครัด (In-process Boundaries / Hexagonal Architecture) พร้อมแยก Background Worker สำหรับงานหนัก

## Decision
เราตัดสินใจเลือก **Modular Monolith Architecture** ควบคู่กับแยก Process **Background Worker** สำหรับประมวลผล Asset โดยใช้ Docker Compose บน Hostinger VPS

หลักการของสถาปัตยกรรม:
1. **Strict Domain Boundaries:** ทุกโดเมน (Asset, Timeline, Search, Access, Audit) สื่อสารกันผ่าน Service Interfaces ภายใน process ห้าม Query ข้ามตารางของโมดูลอื่นโดยตรง
2. **Decoupled Asynchronous Worker:** งานที่กิน CPU/RAM สูง (SHA-256 calculation verification, Image thumbnailing, Video preview, ClamAV virus scan) จะถูกผลักออกไปยัง Worker ผ่าน Redis Queue (BullMQ)
3. **Microservices Ready:** การกำหนด Domain Boundary ที่ชัดเจนจะทำให้สามารถแยกบางโมดูล (เช่น Search หรือ Media Processing) ออกเป็น Microservice ได้ทันทีในอนาคตเมื่อทราฟฟิกหรือขนาดทีมขยายตัว

## Consequences
### Positive
- **Low Operational Overhead:** ไม่ต้องดูแล Kubernetes, Service Mesh, หรือ Distributed Tracing ที่ซับซ้อน ทีมงาน 2–5 คนดูแลได้ง่ายผ่าน Docker Compose
- **Zero Network Latency Between Modules:** การเรียกฟังก์ชันข้ามโดเมนเกิดขึ้น In-memory ภายในเวลาไม่ถึง 1 ms สอดคล้องกับ NFR-PERF-03
- **Transactional Consistency:** สามารถทำ ACID Database Transactions ภายในโมดูลได้ง่ายโดยไม่ต้องใช้ Distributed 2-Phase Commit หรือ Saga Pattern
- **Cost Effective:** ใช้งานทรัพยากรบน Hostinger VPS ได้อย่างคุ้มค่าที่สุด

### Negative / Trade-offs
- **Shared Process Failure:** หากเกิด Unhandled Exception รุนแรงใน Web/API Process อาจกระทบทั้งระบบ (แก้ไขโดยมี Caddy/Traefik คอยรีสตาร์ท และแยก Worker ไปรันอีก container)
- **Discipline Required:** ต้องการวินัยในการพัฒนาสูงเพื่อไม่ให้เกิด Spaghetti Code หรือการเรียกข้าม Layer (ป้องกันด้วย ESLint Boundary Rules และ TypeScript Project References)

## Compliance to NFRs
- **NFR-PERF-03 (P95 Latency < 300ms):** ตอบสนองได้อย่างรวดเร็วเพราะไม่มี Overhead ของ Network Hop
- **NFR-AVAIL-01 (99.9% Uptime):** ลดจุดเสี่ยงที่ระบบจะล่ม (Single failure point จาก network partitioned)
- **NFR-SCALE-01 (1,000 Concurrent Users):** สามารถ Scale แนวตั้งบน VPS ได้อย่างสบาย
