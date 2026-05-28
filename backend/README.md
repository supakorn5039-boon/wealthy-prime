# PropTech Platform — Backend

ส่วน Backend API ของแพลตฟอร์มบริหารจัดการและจับคู่อสังหาริมทรัพย์ พัฒนาด้วย Golang + Gin Gonic Framework

---

## 🛠️ Tech Stack

| ชั้น | เทคโนโลยี |
|------|-----------|
| Language | Go (Golang) |
| Framework | Gin Gonic |
| Database | PostgreSQL |
| Auth | JWT Token |

---

## ⚙️ Business Logic หลัก

### 🤖 Auto-assign Engine

เมื่อ User ส่งคำขอนัดหมายหรือติดต่อเข้ามา ระบบจะประมวลผล Algorithm กระจายเคสให้เอเจนต์โดยอัตโนมัติ:

- คัดเลือกตามพื้นที่ทำเลที่เอเจนต์รับผิดชอบ
- หรือใช้ระบบ **Round-Robin** ตามปริมาณโหลดงานปัจจุบัน

### ✅ Admin Approval Workflow

| สถานะ | ความหมาย |
|-------|---------|
| `available` | ห้องว่าง พร้อมแสดงหน้าบ้าน |
| `pending_approve` | เอเจนต์อัปโหลดสลิป รอแอดมินอนุมัติ |
| `reserved` | แอดมิน Approve มัดจำแล้ว |
| `sold` | ปิดการขาย/เช่าสมบูรณ์ |

เมื่อแอดมินกด `Approve` ระบบจะอัปเดต DB และเปลี่ยน Tag สถานะหน้าบ้านทันที

### 🔒 Duplicate Property Protection

API ตรวจสอบคู่ `[project_name + owner_info]` ก่อนบันทึกทรัพย์ใหม่ หากซ้ำจะบังคับให้เอเจนต์กรอกรายละเอียดเพิ่มเติม

---

## 🗄️ Database Schema (PostgreSQL)

```sql
-- 1. ผู้ใช้งานและ RBAC
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    line_id VARCHAR(50),
    role VARCHAR(20) DEFAULT 'user', -- 'user', 'agent', 'admin'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. คลังอสังหาริมทรัพย์
CREATE TABLE properties (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    location TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    type VARCHAR(10) NOT NULL, -- 'buy' หรือ 'rent'
    size_sqm NUMERIC(6, 2),
    agent_id INT REFERENCES users(id) ON DELETE SET NULL,
    owner_info TEXT NOT NULL,       -- คู่ดักจับห้องซ้ำ [project_name + owner_info]
    rental_period_months INT,       -- กรณีห้องเช่า
    slip_url TEXT,                  -- หลักฐานการจอง
    status VARCHAR(20) DEFAULT 'available', -- 'available', 'pending_approve', 'reserved', 'sold'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ตะกร้าและการนัดหมาย
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    property_id INT REFERENCES properties(id) ON DELETE CASCADE,
    appointment_date TIMESTAMP NOT NULL,
    note TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'assigned', 'completed', 'cancelled'
    assigned_agent_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. รีวิว
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    property_id INT REFERENCES properties(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🗂️ โครงสร้างโปรเจกต์ (แนะนำ)

```
backend/
├── cmd/
│   └── main.go
├── internal/
│   ├── handler/       # Gin route handlers
│   ├── middleware/    # JWT auth, RBAC
│   ├── model/         # Struct definitions
│   ├── repository/    # DB queries
│   └── service/       # Business logic (auto-assign, approval)
├── pkg/
│   └── database/      # DB connection
├── migrations/        # SQL migration files
├── go.mod
└── go.sum
```

---

## 🔌 API Endpoints (ภาพรวม)

| Method | Path | Role | คำอธิบาย |
|--------|------|------|----------|
| POST | `/auth/register` | Public | สมัครสมาชิก |
| POST | `/auth/login` | Public | เข้าสู่ระบบ / รับ JWT |
| GET | `/properties` | Public | ดึงรายการทรัพย์ทั้งหมด |
| GET | `/properties/:id` | Public | ดูรายละเอียดทรัพย์ |
| POST | `/properties` | Agent | เพิ่มทรัพย์ใหม่ |
| PATCH | `/properties/:id/status` | Agent | เปลี่ยนสถานะ (พร้อมสลิป) |
| POST | `/bookings` | User | สร้างนัดหมาย (Auto-assign) |
| GET | `/agent/contacts` | Agent | ดูประวัติการติดต่อ |
| GET | `/admin/dashboard` | Admin | ภาพรวมระบบ |
| PATCH | `/admin/properties/:id/approve` | Admin | อนุมัติสถานะทรัพย์ |
| GET | `/admin/financial` | Admin | รายงานการเงิน |

---

## 🚀 วิธีรัน

```bash
# 1. คัดลอก environment config
cp .env.example .env

# 2. รัน PostgreSQL (Docker)
docker compose up -d postgres

# 3. รันเซิร์ฟเวอร์ (migration + seeder จะรันอัตโนมัติเมื่อ start)
make dev
# หรือ: go run ./src
```

### Available make targets

| Command | What it does |
|---------|--------------|
| `make dev` | Start the API server (auto-runs migration + seeder) |
| `make migrate` | Run database migration only |
| `make seed` | Run seeders only (creates admin user) |
| `make build` | Compile production binary `./server` |

### Local config

- `config.ini` holds defaults for local dev. Environment variables override every value.
- The config loader walks up to 3 parent directories looking for `config.ini`, so `go run .` works from both `backend/` and `backend/src/`.
- Default `ssl_mode=disable` is for local Postgres. Production sets `DATABASE_URL` (Neon) which carries its own `sslmode=require`.

> Frontend ดูรายละเอียดที่ `../frontend/README.md`
