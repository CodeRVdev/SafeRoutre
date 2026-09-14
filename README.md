# SafeRoute — Campus Evacuation & Safety Management System

**Target Institution**: Polonoling National High School  
**Location**: Barangay Polonoling, Tupi, South Cotabato, Philippines (Zipcode 9505)  
**Coordinates**: `6.3615° N, 124.9502° E`

SafeRoute is an end-to-end real-time emergency evacuation and safety management platform built specifically for educational institution campuses. It consists of a **PostgreSQL/PostGIS Express Backend**, an **Interactive GIS Web Admin Application**, and a **Cross-Platform Mobile Application** with real-time audio siren broadcasts and offline safety check-in queueing.

---

## 🏗️ System Architecture & Stack

```
                               ┌────────────────────────────────────────┐
                               │     Express + Node.js Backend API      │
                               │      (TypeScript / Socket.IO)          │
                               └──────────────────┬─────────────────────┘
                                                  │
                                 ┌────────────────┴────────────────┐
                                 │ PostgreSQL + PostGIS Database   │
                                 └─────────────────────────────────┘
                                                  ▲
                       ┌──────────────────────────┴──────────────────────────┐
                       │                                                     │
         ┌─────────────┴─────────────┐                         ┌─────────────┴─────────────┐
         │   SafeRoute Web Admin     │                         │   SafeRoute Mobile App    │
         │  (React / Vite / Leaflet) │                         │     (Flutter / Dart)      │
         └───────────────────────────┘                         └───────────────────────────┘
```

- **Backend**: Node.js, Express, TypeScript, PostgreSQL, PostGIS, Socket.IO (`ws://localhost:5000`), JWT Authentication, bcryptjs.
- **Web Admin**: React.js (Vite), TypeScript, Leaflet.js GIS Map, TailwindCSS, Socket.IO Client.
- **Mobile App**: Flutter (Dart), `flutter_map` (OpenStreetMap GIS), `socket_io_client`, `audioplayers` (looping siren), `flutter_local_notifications`, `flutter_secure_storage`, `geolocator`.

---

## 🛠️ PostgreSQL & PostGIS Database Setup in pgAdmin 4

### 1. Install & Open pgAdmin 4
Ensure PostgreSQL (v14+) and PostGIS extension are installed on your machine.

### 2. Create Database
1. Open pgAdmin 4 -> Connect to your local PostgreSQL server instance.
2. Right-click **Databases** -> **Create** -> **Database...**
3. Database Name: `saferoute_db` -> Click **Save**.

### 3. Enable PostGIS Extension
1. Right-click `saferoute_db` -> Select **Query Tool**.
2. Run the following SQL query:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
3. Confirm output message: `CREATE EXTENSION`.

---

## 🚀 Running the Backend (`backend/`)

1. Open terminal inside `backend/`:
   ```bash
   cd backend
   ```
2. Copy environment file:
   ```bash
   cp .env.example .env
   ```
   *(Update `.env` with your PostgreSQL password if different from `postgres`).*

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run Database Migrations & Seed Data:
   ```bash
   npm run migrate
   npm run seed
   ```
   *Seeds Polonoling NHS campus boundary polygon, evacuation center, active structural hazard, default emergency alert, and test users.*

5. Start Backend Server:
   ```bash
   npm run dev
   ```
   - REST API running at: `http://localhost:5000/api`
   - Socket.IO running at: `ws://localhost:5000`

6. (Optional) Run Integration Test Suite:
   ```bash
   npm test
   ```

---

## 💻 Running the Web Admin Application (`web-admin/`)

1. Open terminal inside `web-admin/`:
   ```bash
   cd web-admin
   ```
2. Copy environment file:
   ```bash
   cp .env.example .env
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start Web Admin Dev Server:
   ```bash
   npm run dev
   ```
   - Open browser at `http://localhost:5173`.
   - Log in with Safety Coordinator credentials:
     - **Email**: `coordinator@saferoute.edu`
     - **Password**: `CoordinatorPassword123!`

5. Production Build Verification:
   ```bash
   npm run build
   ```

---

## 📱 Running the Mobile App (`mobile-app/`)

1. Open terminal inside `mobile-app/`:
   ```bash
   cd mobile-app
   ```

2. Fetch Flutter Packages:
   ```bash
   flutter pub get
   ```

3. Run Mobile App:
   - **Android Emulator**:
     ```bash
     flutter run -d android
     ```
   - **Windows Desktop / Web Test**:
     ```bash
     flutter run -d windows
     ```

4. Log in or Register:
   - **Student Account**: `student@saferoute.edu` / `StudentPassword123!`
   - **Registration**: Registration restricts selection strictly to Student, Faculty, or Staff roles.

---

## 🧪 End-to-End Evacuation Simulation & Verification Guide

Follow this step-by-step procedure to test the complete real-time safety flow:

1. **Log in on Web Admin**:
   - Open `http://localhost:5173` -> Log in as `coordinator@saferoute.edu`.
   - View the Polonoling NHS Campus GIS Map.

2. **Pin a New Hazard**:
   - Click **Pin Hazard** on the map toolbar -> Set Severity to `CRITICAL` -> Description: `Sagging Live Electrical Wire near Grade 10 Block` -> Click **Save**.
   - Confirm red pulsing marker appears instantly on the GIS map.

3. **Broadcast Emergency Alert**:
   - Go to **Emergency Alerts** tab -> Click **Broadcast New Alert**.
   - Title: `EMERGENCY EVACUATION: Electrical Hazard` -> Link the hazard -> Click **Broadcast Now**.

4. **Confirm Siren on Mobile App**:
   - The phone immediately receives the Socket.IO `alert:broadcast` event.
   - Full-screen red emergency alert opens automatically on phone.
   - Looping siren audio (`siren.mp3`) plays continuously.

5. **Tap "I AM SAFE" on Mobile App**:
   - Student taps **"I AM SAFE — CHECK IN NOW"**.
   - Siren audio stops **immediately**.
   - Status updates to `SAFETY CHECK-IN RECORDED!`.

6. **Verify Real-Time Live Dashboard**:
   - In Web Admin app -> Click **Live Dashboard** tab.
   - Confirm student's name, role, department, evacuation zone name, and timestamp appear under **Safe / Checked-In Roster** via Socket.IO `checkin:new` emission.
   - Progress bar updates automatically.

7. **Generate Evacuation Report**:
   - In Web Admin app -> Click **Evacuation Reports** tab -> Select Alert -> Click **Generate Report**.
   - Report is saved and displayed in historical audit logs.

---

## 📝 Capstone Documentation Summary: Known Edge Cases & Recommendations

| Category | Finding / Edge Case | System Handling / Future Recommendation |
|---|---|---|
| **Role Restriction** | `admin` & `coordinator` accounts cannot self-register from mobile. | Handled server-side (`auth.controller.ts`) and client-side dropdown. Prevents rogue admin registration. |
| **Offline Safety Check-In** | User taps "I Am Safe" while offline / no cell signal. | Handled gracefully (`emergency_alert_screen.dart`). Immediately mutes siren, queues check-in locally, and provides manual/auto retry sync when network restores. |
| **Background Push Notifications** | App closed / killed when alert is broadcasted. | Local notification triggers ongoing alert (`flutter_local_notifications`). Production recommendation: integrate Firebase Cloud Messaging (FCM) or Apple Push Notification Service (APNs) for remote background push wakeups. |
| **Past Check-in Query (`GET /api/users/me/history`)** | Backend code freeze preserved without modifying DB schema. | Mobile app queries active alert dashboard check-ins (`GET /api/dashboard/checkins/:alertId`) filtered for user ID alongside secure local device storage. |
