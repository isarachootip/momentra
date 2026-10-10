# ADR 007: Platform User Management & Two-Layer Role Model

## Status
**Proposed** (Change Request — รออนุมัติก่อนเริ่มเขียนโค้ด) · ขยายจาก ADR-005 ไม่ได้แทนที่

## Context
- ผู้ใช้ต้องการระบบบริหารจัดการผู้ใช้ด้วยบทบาท `sysadmin`, `admin`, `user`
- ระบบปัจจุบัน (ADR-005, SRS FR-ACCESS-02) มีเฉพาะบทบาท **ระดับ Workspace** (`owner | admin | contributor | viewer`) ใน `workspace_members`
- ตาราง `users` ไม่มี role/status ระดับแพลตฟอร์ม → ไม่มีผู้ดูแลระบบภาพรวม, ระงับบัญชีไม่ได้
- `audit_logs.workspace_id` เป็น `NOT NULL` + RLS → บันทึกเหตุการณ์ระดับแพลตฟอร์มไม่ได้
- ข้อกำหนด PDPA / ISO 27001: Least privilege, แยกหน้าที่ผู้ดูแลระบบออกจากการเข้าถึงเนื้อหา

ทางเลือกที่พิจารณา:
1. **แทนที่ 4 role เดิมด้วย 3 role ระดับระบบ** — กระทบ SRS, ADR-005, RLS, Test ทั้งชุด (ขนาด L) และเสีย Multi-tenant semantics
2. **Two-layer model (เลือก)** — เพิ่มชั้นแพลตฟอร์มโดยไม่แตะ RBAC ระดับ Workspace (ขนาด M)

## Decision

### 1. Role Model (สองชั้น)
| ชั้น | ที่เก็บ | ค่า | ความหมาย |
|---|---|---|---|
| Platform | `users.system_role` | `sysadmin` \| `user` (default `user`) | ผู้ดูแลระบบทั้งหมด / ผู้ใช้ทั่วไป |
| Workspace | `workspace_members.role` | `owner` \| `admin` \| `contributor` \| `viewer` (คงเดิม) | "admin" ตามคำขอ = Workspace Admin |

### 2. ขอบเขตสิทธิ์ sysadmin (Metadata-only)
- **ทำได้:** ดู/ค้นหารายชื่อผู้ใช้ (email, ชื่อ, สถานะ, system_role, จำนวน Workspace, last login), สร้าง/เชิญผู้ใช้, ระงับ/คืนสถานะ, บังคับ logout, รีเซ็ตรหัสผ่าน (ส่งลิงก์ ไม่เห็นรหัส), เลื่อน/ลดระดับ sysadmin, ดู System Audit Log, ดูรายการ Workspace และ quota
- **ทำไม่ได้:** อ่าน items/assets/collections ของ Workspace ที่ตนไม่ได้เป็นสมาชิก (RLS ไม่ถูก bypass) · ไม่มี break-glass ในรุ่นนี้

### 3. การเข้าระบบ (Onboarding)
- Self-signup ควบคุมด้วย env `HDAM_ALLOW_SIGNUP` (default `false` ในระยะ VPS ทดสอบ)
- sysadmin สร้างหรือเชิญผู้ใช้ทางอีเมล · Workspace Owner/Admin เชิญสมาชิกเข้า Workspace
- Invitation token: สุ่ม 32 bytes, เก็บเฉพาะ SHA-256 hash, ใช้ได้ครั้งเดียว, หมดอายุ 72 ชั่วโมง
- เชิญอีเมลที่มีบัญชีอยู่แล้ว → เมื่อยอมรับจะเพิ่มเป็นสมาชิก Workspace (ไม่สร้างบัญชีซ้ำ)
- บัญชีใหม่ได้ Personal Workspace อัตโนมัติ (role `owner`)
- First sysadmin สร้างผ่าน CLI `scripts/create-sysadmin` อ่านค่าจาก env/prompt (ห้าม hardcode ใน seed)

### 4. Lifecycle & สถานะ
- `users.status`: `pending` (ยังไม่ยืนยัน/ยังไม่ตั้งรหัส) → `active` ⇄ `suspended`
- Suspend → revoke ทุก session ทันที (`user_sessions.is_revoked = true` + ลบ Redis) และ login ไม่ได้
- Delete (PDPA Right to Erasure) → soft delete (`deleted_at`) + revoke session → purge/anonymize ภายใน 30 วันโดย job
- **บล็อกการลบ** หากผู้ใช้เป็น Owner คนเดียวของ Organization Workspace → ต้องโอน ownership ก่อน · Personal Workspace ถูก soft delete ตามผู้ใช้

### 5. Guardrails
- ห้ามลด/ระงับ/ลบ **sysadmin คนสุดท้ายที่ active** และ **owner คนสุดท้าย** ของ Workspace
- ห้ามแก้ role/สถานะของตนเอง (ป้องกัน self-lockout / self-escalation)
- No privilege escalation: Owner มอบได้ถึง `admin` (โอน owner ผ่าน flow แยก) · Admin มอบได้เฉพาะ `contributor`/`viewer` และจัดการได้เฉพาะสมาชิกที่ระดับต่ำกว่าตน
- sysadmin บังคับ MFA (TOTP) — ส่งมอบเป็น increment แยกถัดไป

### 6. Audit
- เหตุการณ์ระดับ Workspace (เชิญ, เปลี่ยน role, ถอดสมาชิก) → `audit_logs` เดิม
- เหตุการณ์ระดับแพลตฟอร์ม → ตารางใหม่ `system_audit_logs` (ไม่มี workspace_id, append-only, อ่านได้เฉพาะ sysadmin)

### 7. Data Model Changes (Migration `003_user_management.sql`)
- `users`: เพิ่ม `system_role`, `status`, `last_login_at`, `suspended_at`, `suspended_reason`
- ตารางใหม่: `invitations` (email, workspace_id NULL, role, token_hash, invited_by, expires_at, accepted_at, revoked_at)
- ตารางใหม่: `system_audit_logs`
- Middleware ใหม่ `requireSystemRole('sysadmin')` แยกจาก Workspace guard เดิม

## Consequences
### Positive
- ไม่กระทบ RLS, SRS FR-ACCESS-02 และ Test เดิม
- แยกหน้าที่ผู้ดูแลระบบออกจากเนื้อหา สอดคล้อง PDPA / ISO 27001 A.5.15, A.8.2
- รองรับ onboarding ที่ควบคุมได้ในระยะทดสอบ

### Negative / Trade-offs
- ต้องมี Email delivery สำหรับ invitation/reset (ADR-005 trade-off เดิม)
- sysadmin ช่วยแก้ปัญหาเนื้อหาของผู้ใช้โดยตรงไม่ได้ ต้องให้ Owner เชิญเข้า Workspace
- เพิ่มตาราง audit แยก 2 แหล่ง
