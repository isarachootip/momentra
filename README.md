# Momentra (HDAM) — Backend API & Domain Engine

> **Historical Digital Asset Management Platform**  
> บริหารจัดการสินทรัพย์ดิจิทัลและข้อมูลประวัติศาสตร์ที่ผูกโยงกับแกนเวลาจริง

---

## 1. Architecture Overview

ระบบ Backend ของ Momentra พัฒนาขึ้นด้วยสถาปัตยกรรม **Modular Monolith (Clean / Layered Architecture)**:

```
src/
├── config/             # Zod-validated Environment Variables
├── core/               # Cross-cutting Concerns
│   ├── errors/         # RFC 9457 Problem Details & AppError Hierarchy
│   ├── i18n/           # Thai & English Localized Error & System Messages
│   ├── logger/         # Structured Pino JSON Logger (Correlation ID)
│   ├── middleware/     # Fastify Hooks (Request ID, Auth Guard, Error Handler)
│   └── security/       # Argon2/Scrypt Passwords & HMAC-SHA256 JWT Service
├── db/                 # PostgreSQL Pool & RLS Context Isolation Helper
├── modules/
│   ├── foundation/     # Health Checks & System Probes (GET /health, GET /api/v1/health)
│   └── auth/           # Login, Refresh Token Rotation, Logout, GET /me
├── app.ts              # Fastify App Assembly
└── server.ts           # Server Entrypoint
```

---

## 2. Requirements & Tech Stack

- **Node.js**: v22 LTS หรือใหม่กว่า
- **Package Manager**: npm v10+
- **Framework**: Fastify v5 (TypeScript Strict Mode)
- **Database**: PostgreSQL 16+ (พร้อมส่วนขยาย `pgcrypto`, `btree_gist`, `vector`)
- **Testing**: Vitest v3 with V8 Coverage Engine

---

## 3. Quick Start

### 3.1 Clone & Install Dependencies
```bash
git clone <repository_url>
cd momentra
npm install
```

### 3.2 Environment Setup
คัดลอกไฟล์ `.env.example` ไปเป็น `.env` และกำหนดค่าการเชื่อมต่อฐานข้อมูล:
```bash
cp .env.example .env
```

ตัวอย่างการตั้งค่า `.env`:
```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

DATABASE_URL=postgresql://user:password@localhost:5432/momentra_db?sslmode=disable
DATABASE_SSL=false
DATABASE_MAX_CONNECTIONS=10

JWT_SECRET=super_secret_momentra_development_jwt_key_2026_secure_minimum_32_chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_DAYS=7

LOG_LEVEL=info
CORS_ORIGIN=*
```

### 3.3 Database Migrations & Seeds
หากยังไม่ได้รัน Migration ให้รันคำสั่ง SQL ใน `db/migrations/`:
```bash
psql $DATABASE_URL -f db/migrations/001_initial_schema.sql
psql $DATABASE_URL -f db/migrations/002_user_sessions.sql
psql $DATABASE_URL -f db/seed.sql
```

### 3.4 Development Server
```bash
npm run dev
```
เซิร์ฟเวอร์จะเริ่มทำงานที่ `http://localhost:3000`

---

## 4. Testing & Quality Verification

```bash
# Typecheck
npm run typecheck

# Run All Tests
npm run test

# Run Tests with Coverage Report (Coverage Target >= 80%)
npm run test:coverage
```

---

## 5. API Endpoints (Module 1: Foundation + Auth)

| Method | Endpoint | สิทธิ์ | คำอธิบาย |
| :--- | :--- | :---: | :--- |
| `GET` | `/health` | Public | System Health Probe & Database Ping |
| `GET` | `/api/v1/health` | Public | System Health Probe ละเอียด |
| `POST` | `/api/v1/auth/login` | Public | ล็อกอิน (Local / OIDC) รับ Access Token + Refresh Token |
| `POST` | `/api/v1/auth/refresh` | Public | หมุนเวียน Refresh Token (RTR) เพื่อรับ Access Token ใหม่ |
| `POST` | `/api/v1/auth/logout` | Public | เพิกถอน Refresh Token และยกเลิก Session |
| `GET` | `/api/v1/me` | Bearer Token | ดึงข้อมูลโปรไฟล์ผู้ใช้ และรายการ Workspace ที่สังกัด |

---

## 6. Security & Standards

1. **RFC 9457 Problem Details**: ทุก Error ตอบกลับในรูปแบบ `application/problem+json`
2. **Refresh Token Rotation (RTR)**: ป้องกัน Token Replay Attack โดยหากตรวจพบการใช้ Token ซ้ำ ระบบจะยกเลิก Session ทั้งหมดของผู้ใช้นั้นทันที
3. **PostgreSQL Row Level Security (RLS)**: แยกการเข้าถึงข้อมูลของแต่ละ Tenant ด้วย `SET LOCAL app.current_workspace_id = :workspaceId` ผ่าน `withWorkspaceContext()`
