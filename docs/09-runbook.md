# Momentra (HDAM) — Operational Runbook & DevOps Playbook
## คู่มือการติดตั้ง ดูแลรักษา และรับมือเหตุฉุกเฉิน (Phase 9)

> **รหัสเอกสาร:** MOMENTRA-OPS-09  
> **เวอร์ชัน:** 1.0.0 (Phase 9 Baseline)  
> **สถานะ:** Approved for Production  
> **บทบาทผู้จัดทำ:** Senior DevOps & Site Reliability Engineer (SRE)  
> **สอดคล้องกับ:** [docs/02-architecture.md](file:///c:/atgv/momentra/docs/02-architecture.md), [docs/08-security-report.md](file:///c:/atgv/momentra/docs/08-security-report.md)  

---

## 1. ภาพรวมสถาปัตยกรรมระบบการติดตั้ง (Production Deployment Architecture)

ระบบ **Momentra** บน **Hostinger KVM VPS** ทำงานในรูปแบบ **Multi-Container Stack** ที่แยกสัดส่วนชัดเจน:

```
[ Client Web / Mobile ]
        │ HTTPS (Port 443) / HTTP (Port 80)
        ▼
┌──────────────────────────────────────────────────────────────┐
│ Hostinger KVM VPS (4–8 vCPU, 16–32 GB RAM, 100–200 GB NVMe)  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Caddy Reverse Proxy (TLS 1.3, Let's Encrypt, Security) │  │
│  └───────────────────┬────────────────────────────────────┘  │
│                      │ Internal HTTP                         │
│         ┌────────────┴────────────┐                          │
│         ▼                         ▼                          │
│  ┌───────────────┐         ┌───────────────┐                 │
│  │ Momentra Core │         │ Momentra Web  │                 │
│  │ API (Port 3000│         │ (Next.js 15)  │                 │
│  └──────┬────────┘         └───────────────┘                 │
│         │                                                    │
│         ├──────────────────────────┐                         │
│         ▼                          ▼                         │
│  ┌───────────────┐          ┌───────────────┐                │
│  │ PostgreSQL 16 │          │ Redis 7       │                │
│  │ (RLS, GiST)   │          │ (Cache/Queue) │                │
│  └───────────────┘          └──────┬────────┘                │
│                                    │ Consume                 │
│                             ┌──────┴────────┐                │
│                             │ BullMQ Worker │                │
│                             │ (Sharp/ClamAV)│                │
│                             └───────────────┘                │
└─────────────────────────────────────┬────────────────────────┘
                                      │ S3 Presigned API
                                      ▼
             [ Cloudflare R2 / S3 Object Storage ] (Assets, 5 TB)
```

---

## 2. ขั้นตอนการติดตั้งและการนำขึ้นระบบ (Deployment & Rollback)

> 💡 **ทางเลือกการ Deploy ด้วย Coolify (Self-hosted PaaS):**  
> สามารถดูคู่มือการติดตั้งแบบ 1-Click ด้วย Coolify พร้อม Web UI, Auto SSL และ Git Webhook ได้ที่ [`docs/coolify-guide.md`](file:///c:/atgv/momentra/docs/coolify-guide.md)

### 2.1 การติดตั้งครั้งแรกบนเครื่อง VPS ใหม่ (Initial Setup แบบ Docker Compose โดยตรง)

```bash
# 1. ติดตั้ง Docker Engine และ Docker Compose v2 บน VPS (Ubuntu 22.04 / 24.04 LTS)
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 2. เตรียมโฟลเดอร์สำหรับแอปพลิเคชัน
sudo mkdir -p /opt/momentra && cd /opt/momentra

# 3. โคลนคลังโค้ดและเตรียมไฟล์คอนฟิก
git clone https://github.com/momentra/momentra.git .
cp .env.example .env.production

# 4. แก้ไขค่าความปลอดภัยใน .env.production (ห้ามใช้ค่า Default)
nano .env.production

# 5. เริ่มต้นระบบด้วย Docker Compose
docker compose -f docker-compose.prod.yml up -d
```

### 2.2 การ Deploy เวอร์ชันใหม่แบบอัตโนมัติ (CI/CD Automated Deployment)
กระบวนการ Deploy ทำงานอัตโนมัติผ่าน GitHub Actions (`.github/workflows/ci-cd.yml`):
1. นักพัฒนาผลักโค้ดขึ้นกิ่ง `main`
2. GitHub Actions รัน Lint, Automated Tests (46 Tests), และ Trivy Container Security Scan
3. Build และ Push Image ไปยัง GitHub Container Registry (`ghcr.io`)
4. สั่งรันคำสั่งรีโมตผ่าน SSH ไปยัง VPS เพื่อ Pull Image ล่าสุด และรัน Rolling Restart

### 2.3 ขั้นตอนการถอยกลับเมื่อเกิดข้อผิดพลาด (Automated & Manual Rollback)
หากหลัง Deploy แล้ว Health Check ไม่ตอบสนอง HTTP 200 ภายใน 30 วินาที ระบบจะถอยกลับอัตโนมัติ:

```bash
# คำสั่ง Manual Rollback กรณีฉุกเฉิน
cd /opt/momentra

# 1. สั่งสลับกลับไปใช้ Image Tag ก่อนหน้า
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build momentra_api_prod:<PREVIOUS_GIT_SHA>

# 2. ตรวจสอบสถานะการฟื้นตัว
curl -I http://localhost:3000/health
```

---

## 3. แผนงานการสำรองและกู้คืนข้อมูล (Backup & Disaster Recovery)

### 3.1 ดัชนีชี้วัดความต่อเนื่องทางธุรกิจ (SLAs & Targets)
* **Recovery Point Objective (RPO):** $\le 15$ นาที (ข้อมูลสูญหายได้ไม่เกิน 15 นาที)
* **Recovery Time Objective (RTO):** $\le 30$ นาที (กู้คืนระบบให้กลับมาออนไลน์ได้ภายใน 30 นาที)

### 3.2 การรันสำรองข้อมูลอัตโนมัติ (Automated Daily & Hourly Backup)
ติดตั้ง Cron Job บน VPS เพื่อรันสคริปต์ `scripts/backup.sh`:

```bash
# เปิด crontab ของ root
sudo crontab -e

# สำรองข้อมูลฐานข้อมูลทุกชั่วโมง พร้อม Sync ไปยัง Cloudflare R2 / AWS S3
0 * * * * /opt/momentra/scripts/backup.sh >> /var/log/momentra_backup.log 2>&1
```

### 3.3 ขั้นตอนการกู้คืนข้อมูลจริง (Disaster Recovery Step-by-Step)

```bash
# 1. ตรวจสอบไฟล์สำรองล่าสุดและค่า Checksum
cd /opt/momentra/backups
ls -lh momentra_db_*.dump

# 2. รันสคริปต์กู้คืนฐานข้อมูล
/opt/momentra/scripts/restore.sh /opt/momentra/backups/momentra_db_20261005_120000.dump

# 3. รัน Health Check เพื่อยืนยันว่าข้อมูลกลับมาครบถ้วน
curl -s http://localhost:3000/api/v1/health | jq .
```

---

## 4. แผนงานจดหมายเหตุดิจิทัล (Digital Preservation & Fixity Check)

ตามมาตรฐานจดหมายเหตุดิจิทัล ISO 16363 ระบบต้องตรวจสอบความคงสภาพของไฟล์ไบนารีใน Object Storage ว่าไม่เกิดปรากฏการณ์ **Data Bit Rot** (ข้อมูลเสื่อมสภาพตามกาลเวลา):

```bash
# รัน Fixity Check ทุกวันที่ 1 ของเดือน เวลา 02:00 น.
0 2 1 * * docker exec momentra_api_prod node dist/scripts/fixity-check.js >> /var/log/momentra_fixity.log 2>&1
```

สคริปต์ [scripts/fixity-check.ts](file:///c:/atgv/momentra/scripts/fixity-check.ts) จะทำการ:
1. ดึงรายการ Asset ทั้งหมดในฐานข้อมูล
2. คำนวณค่า SHA-256 ของไฟล์ไบนารีใน Storage ซ้ำ
3. เปรียบเทียบกับค่า `checksum_sha256` ที่บันทึกไว้ในวันแรกที่อัปโหลด
4. หากพบความไม่ตรงกัน จะบันทึก Alert ส่งต่อไปยัง SRE ทีมทันที

---

## 5. การตรวจวัดและการแจ้งเตือน (Observability, Metrics & SLO Alerts)

### 5.1 ดัชนีชี้วัดระดับการให้บริการ (Service Level Objectives - SLO)

| ตัวชี้วัด (SLI) | เป้าหมาย SLO | การตั้งเตือน (Alert Rule) |
| :--- | :---: | :--- |
| **Availability (Uptime)** | $\ge 99.9\%$ | Uptime < 99.9% ภายใน 1 ชั่วโมง |
| **API Latency (Timeline & Search)** | P95 < 300 ms | P95 > 500 ms ต่อเนื่อง 5 นาที |
| **Error Rate (5xx Responses)** | $< 0.5\%$ | 5xx Rate > 1.0% ต่อเนื่อง 3 นาที |
| **BullMQ Worker Queue Backlog** | $< 100$ jobs | Job ค้างเกิน 500 jobs หรือล้มเหลวติดต่อกัน 5 ครั้ง |
| **Disk Storage Consumption** | $< 80\%$ | พื้นที่ดิสก์ VPS หรือโควตา Storage เหลือ < 15% |

### 5.2 การรวมศูนย์บันทึกประวัติ (Centralized JSON Logging)
โค้ดใน [src/core/logger/index.ts](file:///c:/atgv/momentra/src/core/logger/index.ts) พ่น Log ในรูปแบบ Structured JSON:
```json
{
  "level": "error",
  "time": "2026-10-05T09:05:00.123Z",
  "correlationId": "f78d91c2-3e4a-4b92-8f12-094321abcd89",
  "req": { "method": "POST", "url": "/api/v1/assets/uploads" },
  "err": { "message": "S3 connection timeout" }
}
```
สามารถนำ Log ไปรวมศูนย์ผ่าน Grafana Loki, Datadog หรือ Cloudwatch ได้ทันที

---

## 6. คู่มือการรับมือเหตุการณ์ฉุกเฉิน (Incident Playbooks)

### Playbook 1: ฐานข้อมูลเกิดปัญหา Connection Pool เต็ม (Connection Pool Exhaustion)
* **อาการ:** API ตอบกลับ HTTP 500 หรือค้างช้า, Log ขึ้น `TimeoutError: Resource pool exhausted`
* **การสืบสวน:**
  ```sql
  SELECT count(*), state FROM pg_stat_activity GROUP BY state;
  ```
* **วิธีแก้ไขด่วน:**
  1. ตรวจสอบการปล่อย Connection ในโค้ดว่ามีจุดที่ลืมเรียก `client.release()` หรือไม่
  2. รีสตาร์ท Connection Pool หรือปรับ `DATABASE_MAX_CONNECTIONS` ใน `.env.production`
  3. หากเกิดจากคิวรี่ช้า ให้ใช้คำสั่ง `SELECT pg_cancel_backend(pid);` กับคิวรี่ที่กินเวลานานผิดปกติ

### Playbook 2: อัปโหลดไฟล์ขนาดใหญ่ไม่ผ่าน หรือ S3 Timeout
* **อาการ:** ผู้ใช้อัปโหลดไฟล์ขนาด 1–4 GB แล้วค้างที่ 99% หรือเกิด Network Failure
* **การสืบสวน:** ตรวจสอบว่า Multipart Upload ETag และ Part Number ตรงกันหรือไม่ และตรวจ CORS Policy ของ Cloudflare R2 / S3 Bucket
* **วิธีแก้ไขด่วน:**
  1. ยืนยันว่า S3 Bucket มี CORS Rule อนุญาต `PUT`, `POST`, `HEAD` จากโดเมน Momentra
  2. ตรวจสอบว่า S3 Lifecycle Rule ได้เปิดใช้งานการล้าง Incomplete Multipart Uploads ที่ค้างเกิน 7 วัน เพื่อคืนพื้นที่

### Playbook 3: คิวงานเบื้องหลัง (BullMQ Worker) ติดขัด
* **อาการ:** Asset ค้างสถานะ `processing` นานเกิน 10 นาที รูปย่อ Thumbnail ไม่ถูกสร้าง
* **การสืบสวน:**
  ```bash
  docker logs --tail 100 momentra_worker_prod
  docker exec -it momentra_redis_prod redis-cli -a $REDIS_PASSWORD LLEN bull:assets:wait
  ```
* **วิธีแก้ไขด่วน:**
  1. ตรวจสอบว่า ClamAV Daemon หรือ FFmpeg เกิด Out of Memory (OOM) หรือไม่
  2. สั่งรีสตาร์ท Worker Container: `docker compose -f docker-compose.prod.yml restart worker`

---

## 7. ตารางงานดูแลรักษาระบบตามรอบ (Routine Maintenance Schedule)

| ความถี่ | กิจกรรมที่ต้องทำ | คำสั่งหรือเครื่องมือ |
| :--- | :--- | :--- |
| **ประจำวัน (Daily)** | • ตรวจสอบสถานะ Backup ล่าสุดใน S3<br>• ตรวจสอบ Error Rate Dashboard | `/opt/momentra/scripts/backup.sh`<br>Grafana / Prometheus |
| **ประจำสัปดาห์ (Weekly)** | • รัน Script ตรวจสอบลิงก์เสีย (Broken Link Recheck)<br>• ล้าง Docker dangling images เพื่อคืนพื้นที่ดิสก์ | `docker image prune -f`<br>Worker Cron Job |
| **ประจำเดือน (Monthly)** | • รัน Digital Preservation Fixity Check<br>• ซ้อมกู้คืนฐานข้อมูลบนเครื่อง Staging (DR Drill)<br>• ตรวจสอบและอัปเดต Security Patches บน VPS | `scripts/fixity-check.ts`<br>`scripts/restore.sh`<br>`sudo apt update && sudo apt upgrade` |

---

## 8. ประมาณการค่าใช้จ่ายรายเดือนและแนวทางลดต้นทุน (Cost Estimation)

### 8.1 สรุปค่าใช้จ่ายปีแรกบน Hostinger VPS + Cloudflare R2 (สำหรับ 5 TB / 1,000 Users)

| บริการ / ทรัพยากร | รายละเอียดสเปก | ค่าใช้จ่ายรายเดือน (USD) | ค่าใช้จ่ายรายปี (THB) |
| :--- | :--- | :---: | :---: |
| **Hostinger KVM VPS** | 4 vCPU, 16 GB RAM, 200 GB NVMe | ~$14.99 / เดือน | ~5,900 บาท / ปี |
| **Cloudflare R2 Storage** | จัดเก็บข้อมูล 5 TB (ฟรีค่าส่งออก Egress 100%) | ~$75.00 / เดือน | ~29,700 บาท / ปี |
| **Transactional Email (Resend)**| ส่งอีเมลคำเชิญและรีเซ็ตรหัสผ่าน 10,000 ฉบับ/เดือน | $0.00 (Free Tier) | 0 บาท |
| **Domain Name (.app / .org)** | ชื่อโดเมนระบบ พร้อม Cloudflare Free SSL/DNS | ~$1.25 / เดือน | ~500 บาท / ปี |
| **รวมค่าใช้จ่ายทั้งหมด** | **พร้อมใช้งานเต็มประสิทธิภาพ 5 TB** | **~$91.24 / เดือน** | **~36,100 บาท / ปี** |

> **เปรียบเทียบกับ AWS / GCP:** หากใช้สเปกเท่ากันบน AWS (EC2 t4g.xlarge + AWS S3 พร้อมค่า Bandwidth Egress 2 TB/เดือน) จะมีค่าใช้จ่ายสูงถึง **$295–$380 / เดือน** (มากกว่า 120,000 บาท/ปี) การเลือกสถาปัตยกรรมแบบ **Hostinger VPS + Cloudflare R2** จึงช่วยประหยัดงบประมาณโครงการได้มากกว่า **70%**

---

## 9. สรุปเกณฑ์การส่งมอบงาน (Quality Gate Sign-off Phase 9)

- [x] **Containerization ครบถ้วน**: Multi-stage `Dockerfile` (Non-root, Alpine) และ `docker-compose.yml` ทดสอบรันบริการครบทุกตัว (API, DB, Redis, MinIO, ClamAV, Caddy)
- [x] **CI/CD Pipeline พร้อมใช้งาน**: `.github/workflows/ci-cd.yml` ตรวจสอบทั้ง Lint, Test Coverage, Trivy Security Scan และ SSH Deploy พร้อม Rollback
- [x] **Disaster Recovery ได้รับการพิสูจน์**: มีสคริปต์ `backup.sh` และ `restore.sh` รองรับ RPO $\le 15$ นาที และ RTO $\le 30$ นาที
- [x] **Digital Preservation Fixity Check**: สคริปต์ `scripts/fixity-check.ts` ตรวจสอบความสมบูรณ์ของ Checksum ป้องกันไฟล์เสื่อมสภาพ
- [x] **คู่มือ Runbook & Incident Playbook**: [docs/09-runbook.md](file:///c:/atgv/momentra/docs/09-runbook.md) ครอบคลุมการปฏิบัติงานทั้ง 9 หมวด
