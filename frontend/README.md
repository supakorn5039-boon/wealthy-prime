# PropTech Platform — Frontend

ส่วน Frontend ของแพลตฟอร์มบริหารจัดการและจับคู่อสังหาริมทรัพย์ พัฒนาด้วย React.js (TypeScript) + Tailwind CSS

---

## 🛠️ Tech Stack

| ชั้น | เทคโนโลยี |
|------|-----------|
| UI Framework | React.js (TypeScript) |
| Styling | Tailwind CSS |
| Auth | JWT Token (Role-Based) |

---

## 🔐 Role-Based Access Control (RBAC)

ระบบอ่านค่า Role จาก JWT Token เพื่อแสดง Sidebar / Navbar และควบคุมสิทธิ์การเข้าถึงหน้าต่าง ๆ

| Role | ขอบเขต |
|------|--------|
| `user` | หน้าบ้านหลัก (ค้นหา / จอง / ติดต่อ) |
| `agent` | Agent Dashboard (จัดการทรัพย์ / ลูกค้า) |
| `admin` | Admin Dashboard (ภาพรวมระบบ / อนุมัติ) |

---

## 📋 หน้าและฟีเจอร์หลัก

### 👤 User / Buyer (หน้าบ้านหลัก)

- **Dynamic Search & Filter** — ค้นหาอสังหาฯ แบบ Real-time พร้อมระบบกรองรายละเอียด
- **View History Log** — บันทึกประวัติการดูทรัพย์ล่าสุดของบัญชีผู้ใช้
- **Review System** — แสดงคะแนนและบทรีวิวจากผู้เช่า/ผู้ซื้อเดิม
- **Property Detail Page**
  - ข้อมูล Spec ห้อง, รูปภาพ, แผนที่บริเวณโครงการ
  - ปุ่ม "ถูกใจ" (Wishlist)
  - ปุ่ม "ใส่ตะกร้า" (Cart)
- **Smart Auth Workflow**
  - หน้า Register / Login
  - Redirect กลับหน้าเดิมโดยอัตโนมัติหลังล็อกอิน (เมื่อมีทรัพย์ค้างในตะกร้า)
- **Cart Summary Popup**
  - แสดงรายการทรัพย์ที่เลือก, ลบออกได้
  - ระบบปฏิทินเลือก Slot วัน-เวลานัดหมาย
- **Contact Broker Flow**
  - เปิดประวัติรายละเอียดห้องที่เคยติดต่อ
  - ดึงโปรไฟล์ผู้ใช้ (ชื่อ / เบอร์ / ไลน์) ส่งตรงให้ Seller

---

### 🏢 Seller / Agent Dashboard

- **Dashboard Overview** — การ์ดสรุป: ห้องทั้งหมด / ห้องที่ถูกจอง / ห้องว่าง
- **Add Room Module** — ฟอร์มกรอก Spec ทรัพย์ + อัปโหลดรูปภาพ
- **Contact History Table** — ตารางลูกค้าที่ติดต่อเข้ามา + พิมพ์ Note บันทึกเพิ่มเติม
- **Gen Link Review** — สร้างและคัดลอกลิงก์รีวิวเฉพาะตัวสำหรับส่งให้ลูกค้า
- **Status & Workflow Management**
  - เปลี่ยนสถานะห้องเป็น "ติดจอง" หรือ "จ่ายเต็ม"
  - บังคับอัปโหลดสลิปหลักฐาน + กำหนดระยะเวลาเช่า
  - คำขอจะอยู่ในสถานะ **Pending Admin Approve** รอแอดมินยืนยันก่อนเปลี่ยนหน้าบ้าน

---

### 🛡️ Admin Dashboard

- **Main Dashboard Analytics** — กราฟภาพรวมทรัพย์ทั้งระบบ + Agent Leaderboard (ปิดงานมากสุด)
- **Seller Management** — ตารางจัดการเอเจนต์ทั้งหมด แก้ไขข้อมูล / เพิ่มสิทธิ์ Role
- **User Management** — ตารางลูกค้าทั้งหมด เพิ่ม/แก้ไขโปรไฟล์ + ดูตารางเคสของแต่ละเอเจนต์
- **Case Re-assignment** — โยกย้ายเคส/ลูกค้าระหว่างเอเจนต์
- **Financial Export** — รายรับรวม + Export ออกเป็นไฟล์ Excel (.xlsx)

---

## 🗂️ โครงสร้างโปรเจกต์ (แนะนำ)

```
frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/        # Shared UI components
│   ├── pages/
│   │   ├── user/          # หน้าสำหรับ Buyer
│   │   ├── agent/         # Agent Dashboard
│   │   └── admin/         # Admin Dashboard
│   ├── hooks/
│   ├── services/          # API call functions
│   ├── store/             # Global state (Context / Zustand)
│   ├── types/             # TypeScript interfaces
│   └── utils/
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🚀 วิธีรัน

```bash
# ติดตั้ง dependencies
npm install

# รันในโหมด Development
npm run dev

# Build สำหรับ Production
npm run build
```

> Backend API ต้องรันก่อน — ดูรายละเอียดที่ `../backend/README.md`
