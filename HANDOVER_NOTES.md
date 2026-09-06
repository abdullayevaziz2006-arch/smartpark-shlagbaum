# SmartPark Shlagbaum — Loyiha Holati va Antigravity Yo'riqnomasi

## 1. Loyiha Haqida
SmartPark — avtoturargoh shlagbaumlarini boshqarish, avto-raqamlarni aniqlash (ANPR/LPR) va to'lovlarni hisoblash tizimi.
- **Backend:** Node.js (Express, Socket.IO, Prisma ORM, SQLite `backend/prisma/dev.db`) — Port: 3001
- **Frontend:** React (Vite, TailwindCSS) — build qilingan fayllar `backend/public/` da joylashgan.
- **Customer-app:** Mijozlar uchun alohida ilova.

## 2. Kameralar va Ulanish Parametrlari
Tizim bir vaqtning o'zida bir nechta kamera modellarini qo'llab-quvvatlaydi:

| Model | ISAPI Barrier Open Endpoint | Allowlist (Oq ro'yxat) Endpoints |
|---|---|---|
| **DS-TCG205-E** | `PUT /ISAPI/ITC/Entrance/channels/1/manualControl` (XML) | **Add:** `PUT /ISAPI/Traffic/channels/1/licensePlateAuditData/record?format=json`<br>**Del:** `PUT /ISAPI/Traffic/channels/1/DelLicensePlateAuditData?format=json` |
| **DS-TCG406** | `PUT /ISAPI/ITC/Entrance/channels/1/manualControl` (XML) | JSON format (DS-TCG205-E kabi) |
| **iDS-TCM203-A** | `PUT /ISAPI/Parking/channels/1/manualControl` (XML) | `PUT /ISAPI/ITC/Entrance/VCL` (XML) |

### Hozirgi ulangan kamera ma'lumotlari:
- **IP:** `10.70.7.205`
- **Login:** `admin`
- **Parol:** `Q135246q`
- **Model:** `DS-TCG205-E`
- **Muhim sozlama:** Kamera sozlamalarida (`System -> Security -> Security Service`) **SDK Protocol Mode** = **`Compatible Mode`** qilingan. Bu tashqi ISAPI Digest autentifikatsiyasini ochadi.

## 3. Qilingan Ishlar (So'nggi holat)
1. `backend/config/cameraModels.js` yaratildi — barcha kamera modellari va ularning endpointlari markazlashtirildi.
2. `backend/services/barrierService.js` yangilandi — kamera modeliga qarab to'g'ri buyruq yuboradi.
3. `backend/services/syncService.js` yangilandi — DS-TCG205-E uchun rasmiy JSON ISAPI ulandi, Allowlist sinxronizatsiyasi sinovdan o'tdi (`200 OK`).
4. `backend/controllers/cameraController.js` da snapshot va streamdagi parollar bazadan olinadigan qilindi (kamerani qulflab qo'ymasligi uchun).
5. `frontend/src/pages/Devices.jsx` da yangi kamera qo'shishda modelni (`DS-TCG205-E`, `DS-TCG406`, `iDS-TCM203-A`) tanlash imkoniyati qo'shildi va `backend/public/` ga build qilindi.

## 4. Yangi Kompyuterda Ishga Tushirish
1. Papkani oching (`cd` buyrug'isiz Antigravity workspace sifatida).
2. Terminalda `install.bat` ni ishga tushiring (`npm install` va `npx prisma generate` qiladi).
3. `start.bat` ni ishga tushiring yoki terminalda `cd backend; node index.js` bilan ishga tushiring.
4. Brauzerda: `http://localhost:3001`.
