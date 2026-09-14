# SafeRoute Backend API — Polonoling National High School

Complete backend API and real-time event service for **SafeRoute Emergency Evacuation Guidance System** (Polonoling National High School, Barangay Polonoling, Tupi, South Cotabato, Philippines 9505).
Built with Node.js, Express, TypeScript, PostgreSQL, PostGIS spatial extension, Socket.IO real-time engine, and JWT authentication.

---

## 🛠 Tech Stack & Architecture

- **Runtime**: Node.js v24+
- **Framework**: Express.js (TypeScript)
- **Real-Time Engine**: Socket.IO (JWT Handshake Authentication)
- **Database**: PostgreSQL with PostGIS spatial extension enabled (`GEOMETRY(Polygon, 4326)`, `GEOMETRY(Point, 4326)`)
- **Auth**: JWT (JSON Web Tokens) with `bcryptjs` password hashing & Role-Based Access Control (RBAC) middleware

---

## 📋 Database Schemas

### 1. `users` Table
```sql
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin','coordinator','student','faculty','staff')),
  id_number VARCHAR(50),
  department VARCHAR(100),
  device_token TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. `zones` Table (Polonoling NHS Campus Zones)
```sql
CREATE TABLE IF NOT EXISTS zones (
  zone_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) CHECK (type IN ('safe_zone', 'evacuation_point')),
  geom GEOMETRY(Polygon, 4326),
  created_by INT REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. `hazards` Table (Campus Hazard Pinning)
```sql
CREATE TABLE IF NOT EXISTS hazards (
  hazard_id SERIAL PRIMARY KEY,
  type VARCHAR(50),
  description TEXT,
  location GEOMETRY(Point, 4326),
  severity VARCHAR(20) CHECK (severity IN ('low', 'moderate', 'high', 'critical')),
  reported_by INT REFERENCES users(user_id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);
```

### 4. `alerts` Table (Emergency Alert Broadcasting)
```sql
CREATE TABLE IF NOT EXISTS alerts (
  alert_id SERIAL PRIMARY KEY,
  hazard_id INT REFERENCES hazards(hazard_id),
  title VARCHAR(150),
  message TEXT,
  sent_by INT REFERENCES users(user_id),
  sent_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);
```

### 5. `checkins` Table (Safety Check-ins)
```sql
CREATE TABLE IF NOT EXISTS checkins (
  checkin_id SERIAL PRIMARY KEY,
  alert_id INT REFERENCES alerts(alert_id),
  user_id INT REFERENCES users(user_id),
  zone_id INT REFERENCES zones(zone_id),
  checked_in_at TIMESTAMP DEFAULT NOW(),
  location GEOMETRY(Point, 4326)
);
```

### 6. `evacuation_reports` Table (Evacuation Summaries)
```sql
CREATE TABLE IF NOT EXISTS evacuation_reports (
  report_id SERIAL PRIMARY KEY,
  alert_id INT REFERENCES alerts(alert_id),
  total_users INT,
  checked_in_count INT,
  generated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 Setup & Execution Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saferoute_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=saferoute_super_secret_jwt_key_2026
JWT_EXPIRES_IN=24h
```

### 3. Run Database Migrations
Creates PostGIS extension and all 6 database tables:
```bash
npm run db:migrate
```

### 4. Seed Initial Data
Populates default admin/coordinator/student accounts, campus evacuation zones, active hazard, emergency alert, and check-in for Polonoling National High School:
```bash
npm run db:seed
```

### 5. Start Development Server
Launches Express + Socket.IO server:
```bash
npm run dev
```
- REST Base URL: `http://localhost:5000`
- Socket.IO Server: `ws://localhost:5000`

### 6. Run Automated Integration Tests
Executes Jest integration test suite (Auth, Zones, Hazards, Alerts, Check-ins, Reports, Sockets):
```bash
npm test
```

---

## ⚡ Socket.IO Real-Time Layer

All Socket.IO connections require JWT authentication passed in `socket.handshake.auth.token` or `Authorization: Bearer <TOKEN>`.

### Real-Time Events Emitted:
- `alert:broadcast` — Triggered when a new emergency alert is broadcast by a coordinator/admin.
- `checkin:new` — Triggered when any user submits a safety check-in ("I Am Safe").
- `hazard:new` — Triggered when a new hazard is pinned on campus.
- `hazard:resolved` — Triggered when a hazard is marked resolved.

To test real-time events via command line:
```bash
node scratch/socket_client_test.js <JWT_TOKEN>
```

---

## 🔒 REST API Overview

### 🔑 Auth (`/api/auth`)
- `POST /api/auth/register` — Self-registration for student/faculty/staff.
- `POST /api/auth/login` — Authenticate user and receive JWT.
- `GET /api/auth/me` — Profile lookup.

### 🗺️ Zones (`/api/zones`) — Admin / Coordinator Only
- `GET /api/zones` — List all campus zones as GeoJSON FeatureCollection.
- `POST /api/zones` — Create campus zone (Polygon GeoJSON).
- `PATCH /api/zones/:id` — Update zone name/type/geometry.
- `DELETE /api/zones/:id` — Delete campus zone.

### ⚠️ Hazards (`/api/hazards`)
- `GET /api/hazards/active` — List active hazards (All users).
- `POST /api/hazards` — Pin new hazard (Point GeoJSON) (Admin/Coordinator Only).
- `PATCH /api/hazards/:id/resolve` — Mark hazard resolved (Admin/Coordinator Only).

### 📢 Emergency Alerts (`/api/alerts`)
- `GET /api/alerts/active` — List active alerts (All users).
- `POST /api/alerts` — Broadcast alert + Socket.IO `alert:broadcast` (Admin/Coordinator Only).
- `PATCH /api/alerts/:id/deactivate` — Deactivate alert (Admin/Coordinator Only).

### 🟢 Safety Check-ins (`/api/checkins`)
- `POST /api/checkins` — Submit "I Am Safe" check-in + Socket.IO `checkin:new` (All users).

### 📊 Live Dashboard (`/api/dashboard`) — Admin / Coordinator Only
- `GET /api/dashboard/checkins/:alertId` — Live breakdown of expected users vs checked-in users, checked-in list, and missing users list.

### 📄 Evacuation Reports (`/api/reports`) — Admin / Coordinator Only
- `POST /api/reports/:alertId/generate` — Generate evacuation report row.
- `GET /api/reports/:alertId` — Fetch latest generated evacuation report.

For cURL payloads and Postman examples, see [tests/curl_examples.md](file:///c:/Users/USERPC/OneDrive/Desktop/SafeRoute/backend/tests/curl_examples.md).

---

## 🔍 Deliverable Check: Verification in pgAdmin 4

Before proceeding to Web Admin Frontend development, verify the database tables and records in **pgAdmin 4**:

1. Open **pgAdmin 4** and connect to `saferoute_db`.
2. Navigate to **Schemas -> public -> Tables**.
3. Confirm that all 6 tables exist: `users`, `zones`, `hazards`, `alerts`, `checkins`, `evacuation_reports`.
4. Run the following verification query in the Query Tool:

```sql
-- 1. Check created emergency alerts
SELECT alert_id, title, message, sent_by, sent_at, is_active FROM alerts;

-- 2. Check safety check-ins
SELECT c.checkin_id, c.alert_id, u.full_name, u.role, z.name AS zone_name, c.checked_in_at, ST_AsText(c.location) AS checkin_location
FROM checkins c
JOIN users u ON c.user_id = u.user_id
LEFT JOIN zones z ON c.zone_id = z.zone_id;

-- 3. Check generated evacuation reports
SELECT * FROM evacuation_reports;
```
