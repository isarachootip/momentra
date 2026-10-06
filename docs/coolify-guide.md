# คู่มือการติดตั้งและ Deploy Momentra (HDAM) ด้วย Coolify บน VPS

> **เวอร์ชัน:** 1.0.0  
> **หมวดหมู่:** DevOps, Self-hosted PaaS, Production Deployment  
> **อ้างอิง:** `docker-compose.coolify.yaml`, `docs/09-runbook.md`

---

## 1. ทำไม Coolify จึงเหมาะสมอย่างยิ่งสำหรับ Momentra

**Coolify** (Self-hosted Heroku / Vercel alternative) มอบข้อได้เปรียบสูงสุดในการดูแลรักษาระบบ Momentra:
1. **หน้าต่างควบคุม Web UI ที่ทันสมัย**: ดู Log, สถานะ CPU/RAM, Restart, Rollback ได้ในคลิกเดียว
2. **จัดการ SSL (HTTPS) อัตโนมัติ**: มี Reverse Proxy (Traefik) คอยต่ออายุใบรับรอง Let's Encrypt ให้อัตโนมัติ
3. **Git Auto-Deploy (CI/CD ในตัว)**: เมื่อ Push โค้ดขึ้น GitHub/GitLab ระบบ Coolify จะ Build Docker และ Deploy แบบ Zero-downtime ทันที
4. **บริหารจัดการ Environment Variables ง่ายและปลอดภัย**: ไม่ต้องเขียน Secret ลงบน Server โดยตรง
5. **ประหยัดค่าใช้จ่าย**: ติดตั้งบน VPS เครื่องเดียว สามารถรันได้ทั้ง Frontend, Backend, Redis และ Database

---

## 2. การเตรียมความพร้อม (Prerequisites)

### 2.1 สเปก VPS ที่แนะนำ
- **OS**: Ubuntu 22.04 LTS หรือ Ubuntu 24.04 LTS (Clean install)
- **CPU**: อย่างน้อย 2 vCPU
- **RAM**: อย่างน้อย 4 GB (แนะนำ 4-8 GB เพื่อรองรับ Docker Build Next.js ได้อย่างราบรื่น)
- **Disk**: SSD อย่างน้อย 30 GB
- **Open Ports**: 22 (SSH), 80 (HTTP), 443 (HTTPS), 8000 (Coolify Dashboard เริ่มต้น)

### 2.2 การตั้งค่า DNS Records
ชี้ A Record ที่ Domain Registrar (เช่น Cloudflare, GoDaddy, Namecheap) ไปยัง IP ของ VPS:
- `momentra.yourdomain.com` $\rightarrow$ `<IP_เครื่อง_VPS>` (สำหรับ Frontend Web App)
- `api.momentra.yourdomain.com` $\rightarrow$ `<IP_เครื่อง_VPS>` (สำหรับ Backend Core API)

---

## 3. ขั้นตอนที่ 1: ติดตั้ง Coolify บน VPS (คำสั่งเดียว)

SSH เข้าสู่ VPS ของคุณในฐานะ `root` แล้วสั่งคำสั่งติดตั้งอัตโนมัติ:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

เมื่อติดตั้งเสร็จ (ใช้เวลาประมาณ 2-3 นาที) จะปรากฏข้อความแจ้งว่า Coolify ทำงานแล้ว:
- เปิดเบราว์เซอร์ไปที่: `http://<IP_เครื่อง_VPS>:8000`
- ลงทะเบียนบัญชี Admin คนแรก และกำหนดรหัสผ่านเพื่อเข้าใช้งาน

---

## 4. ขั้นตอนที่ 2: Deploy Momentra บน Coolify

ในโปรเจกต์ได้เตรียมไฟล์คอนฟิก **`docker-compose.coolify.yaml`** ที่ปรับจูนเครือข่ายภายใน (Internal Network) และ Healthcheck มาให้พร้อมแล้ว

### วิธีการ Deploy ผ่าน Docker Compose (แนะนำที่สุด):

1. **เชื่อมต่อ Git Repository**:
   - ในหน้า Dashboard ของ Coolify คลิก **Sources** $\rightarrow$ เพิ่ม GitHub App หรือ Private Deploy Key สำหรับคลังโค้ด Momentra

2. **สร้าง Application Stack**:
   - ไปที่แท็บ **Projects** $\rightarrow$ เลือกหรือสร้างโปรเจกต์ใหม่ (เช่น `Momentra Production`)
   - คลิก **+ New** $\rightarrow$ เลือก **Docker Compose**
   - เลือก Source: **GitHub / GitLab** และเลือก Repository `momentra`
   - ในช่อง **Branch**: ใส่ `main` (หรือ branch ที่ต้องการ)
   - ในช่อง **Custom Docker Compose Path**: ระบุ `docker-compose.coolify.yaml`

3. **กำหนด Domain ให้กับ Services**:
   ในแท็บการตั้งค่าของแต่ละ Service ใน Coolify:
   - **`web` Service**:
     - Domains: `https://momentra.yourdomain.com`
   - **`api` Service**:
     - Domains: `https://api.momentra.yourdomain.com`

---

## 5. ขั้นตอนที่ 3: กำหนด Environment Variables ใน Coolify

ในหน้าตั้งค่าโปรเจกต์บน Coolify ไปที่หัวข้อ **Environment Variables** และใส่ค่าดังต่อไปนี้:

```ini
# Core Configuration
NODE_ENV=production
CORS_ORIGIN=https://momentra.yourdomain.com

# Database Connection (Neon Cloud หรือ Self-hosted Postgres)
DATABASE_URL=postgresql://neondb_owner:npg_yZnoLR05TqQW@ep-weathered-cake-a142l6vv-pooler.ap-southeast-1.aws.neon.tech/momentra_db?sslmode=require
DATABASE_SSL=true

# Security Secrets
JWT_SECRET=super_secret_momentra_production_jwt_key_2026_secure_minimum_32_chars
REDIS_PASSWORD=momentra_secure_redis_pass_2026

# S3 Compatible Object Storage (Cloudflare R2 / AWS S3 / MinIO)
S3_ENDPOINT=https://your-s3-or-r2-endpoint.com
S3_BUCKET=momentra-assets
S3_ACCESS_KEY=your_access_key_here
S3_SECRET_KEY=your_secret_key_here
```

---

## 6. ขั้นตอนที่ 4: สั่ง Deploy และตรวจสอบสถานะ

1. คลิกปุ่ม **Deploy** สีน้ำเงินที่มุมขวาบนของ Coolify
2. Coolify จะดำเนินการ:
   - Clone Source Code
   - Build Image ของ Frontend (`web/Dockerfile`) และ Backend (`Dockerfile`)
   - Run Container: `web`, `api`, `redis`
   - ตรวจสอบ Healthcheck (`/health` และ `/`)
   - ขอใบรับรอง SSL ผ่าน Traefik ให้อัตโนมัติ
3. เมื่อขึ้นสถานะ **Healthy / Running**:
   - เข้าใช้งาน Web App ได้ทันทีที่: `https://momentra.yourdomain.com`
   - API Docs และ Healthcheck ได้ที่: `https://api.momentra.yourdomain.com/health`

---

## 7. การตั้งค่า CI/CD Auto-Deploy เมื่อ Push โค้ด

ในหน้า Coolify Application:
1. ไปที่แท็บ **Webhooks**
2. คัดลอก **Manual Deploy Webhook URL** ไปใส่ใน GitHub:
   - เข้า GitHub Repository $\rightarrow$ **Settings** $\rightarrow$ **Webhooks** $\rightarrow$ **Add webhook**
   - Payload URL: วาง URL ที่ได้จาก Coolify
   - Content type: `application/json`
   - Event: `Just the push event`
3. ต่อไปนี้ ทุกครั้งที่ทีมงาน `git push origin main` Coolify จะทำการ Rebuild และ Deploy ให้โดยอัตโนมัติแบบ Zero Downtime!
