# SafeRoute Auth API — Manual Testing Guide (cURL & Postman)

This guide documents how to manually test all authentication endpoints and role-check middleware using `curl` or Postman.

---

## 1. Register a New Student (Successful Case - 201 Created)

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Juan Dela Cruz",
    "email": "juan.delacruz@saferoute.edu",
    "password": "SecurePassword123!",
    "role": "student",
    "id_number": "2024-00123",
    "department": "College of Engineering"
  }'
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully.",
  "user": {
    "user_id": 3,
    "full_name": "Juan Dela Cruz",
    "email": "juan.delacruz@saferoute.edu",
    "role": "student",
    "id_number": "2024-00123",
    "department": "College of Engineering",
    "device_token": null,
    "created_at": "2026-08-17T09:40:00.000Z"
  }
}
```

---

## 2. Duplicate Email Registration Rejection (409 Conflict)

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Juan Dela Cruz",
    "email": "juan.delacruz@saferoute.edu",
    "password": "AnotherPassword123!",
    "role": "student"
  }'
```

**Expected Response (409 Conflict):**
```json
{
  "success": false,
  "message": "Email address is already registered."
}
```

---

## 3. Restricted Admin Role Registration Rejection (400 Bad Request)

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Hacker Admin",
    "email": "hacker@saferoute.edu",
    "password": "HackerPassword123!",
    "role": "admin"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Self-registration for 'admin' is prohibited. Public registration is restricted to: student, faculty, staff. Administrative and coordinator accounts must be seeded or created by an admin."
}
```

---

## 4. Login with Seeded Admin User (200 OK)

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@saferoute.edu",
    "password": "AdminPassword123!"
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": 1,
    "full_name": "System Admin",
    "email": "admin@saferoute.edu",
    "role": "admin",
    "id_number": "ADM-001",
    "department": "Emergency Management",
    "device_token": null,
    "created_at": "2026-08-17T09:40:00.000Z"
  }
}
```

---

## 5. Login with Wrong Password Rejection (401 Unauthorized)

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@saferoute.edu",
    "password": "WrongPassword999!"
  }'
```

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid email or password."
}
```

---

## 6. Access Protected Profile Endpoint (`GET /api/auth/me`)

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN_HERE>"
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "user_id": 1,
    "full_name": "System Admin",
    "email": "admin@saferoute.edu",
    "role": "admin",
    "id_number": "ADM-001",
    "department": "Emergency Management",
    "device_token": null,
    "created_at": "2026-08-17T09:40:00.000Z"
  }
}
```

---

## 7. Role-Based Access Control Verification (`GET /api/auth/admin-only`)

### Case A: Student Accessing Admin Endpoint (403 Forbidden)
```bash
curl -X GET http://localhost:5000/api/auth/admin-only \
  -H "Authorization: Bearer <STUDENT_JWT_TOKEN>"
```
**Expected Response (403 Forbidden):**
```json
{
  "success": false,
  "message": "Forbidden: Access restricted to roles [admin, coordinator]. Your role is 'student'."
}
```

### Case B: Admin Accessing Admin Endpoint (200 OK)
```bash
curl -X GET http://localhost:5000/api/auth/admin-only \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
```
**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Access granted to admin/coordinator endpoint for user_id=1 with role 'admin'."
}
```

---

## 8. Create Campus Zone (`POST /api/zones`) — Polonoling NHS

```bash
curl -X POST http://localhost:5000/api/zones \
  -H "Authorization: Bearer <ADMIN_OR_COORDINATOR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Polonoling NHS Gymnasium Evacuation Area",
    "type": "evacuation_point",
    "geometry": {
      "type": "Polygon",
      "coordinates": [
        [
          [124.9505, 6.3615],
          [124.9515, 6.3615],
          [124.9515, 6.3625],
          [124.9505, 6.3625],
          [124.9505, 6.3615]
        ]
      ]
    }
  }'
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Zone created successfully.",
  "zone": {
    "type": "Feature",
    "id": 2,
    "geometry": {
      "type": "Polygon",
      "coordinates": [
        [
          [124.9505, 6.3615],
          [124.9515, 6.3615],
          [124.9515, 6.3625],
          [124.9505, 6.3625],
          [124.9505, 6.3615]
        ]
      ]
    },
    "properties": {
      "zone_id": 2,
      "name": "Polonoling NHS Gymnasium Evacuation Area",
      "type": "evacuation_point",
      "created_by": 1,
      "created_at": "2026-08-17T09:48:00.000Z"
    }
  }
}
```

---

## 9. List All Zones (`GET /api/zones`)

```bash
curl -X GET http://localhost:5000/api/zones \
  -H "Authorization: Bearer <ADMIN_OR_COORDINATOR_JWT_TOKEN>"
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "id": 1,
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [124.95, 6.361],
              [124.951, 6.361],
              [124.951, 6.362],
              [124.95, 6.362],
              [124.95, 6.361]
            ]
          ]
        },
        "properties": {
          "zone_id": 1,
          "name": "Polonoling NHS Main Oval Evacuation Area",
          "type": "evacuation_point",
          "created_by": 1,
          "created_at": "2026-08-17T09:48:00.000Z"
        }
      }
    ]
  }
}
```

---

## 10. Pin a Campus Hazard (`POST /api/hazards`) — Polonoling NHS

```bash
curl -X POST http://localhost:5000/api/hazards \
  -H "Authorization: Bearer <ADMIN_OR_COORDINATOR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Electrical Hazard",
    "description": "Exposed power line near Senior High Building entrance",
    "severity": "critical",
    "location": {
      "type": "Point",
      "coordinates": [124.9504, 6.3618]
    }
  }'
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Hazard reported and pinned successfully.",
  "hazard": {
    "type": "Feature",
    "id": 2,
    "geometry": {
      "type": "Point",
      "coordinates": [124.9504, 6.3618]
    },
    "properties": {
      "hazard_id": 2,
      "type": "Electrical Hazard",
      "description": "Exposed power line near Senior High Building entrance",
      "severity": "critical",
      "reported_by": 1,
      "status": "active",
      "created_at": "2026-08-17T09:48:00.000Z",
      "resolved_at": null
    }
  }
}
```

---

## 11. List Active Campus Hazards (`GET /api/hazards/active`) — Accessible to Students & Staff

```bash
curl -X GET http://localhost:5000/api/hazards/active \
  -H "Authorization: Bearer <ANY_AUTHENTICATED_USER_JWT_TOKEN>"
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "id": 2,
        "geometry": {
          "type": "Point",
          "coordinates": [124.9504, 6.3618]
        },
        "properties": {
          "hazard_id": 2,
          "type": "Electrical Hazard",
          "description": "Exposed power line near Senior High Building entrance",
          "severity": "critical",
          "reported_by": 1,
          "status": "active",
          "created_at": "2026-08-17T09:48:00.000Z",
          "resolved_at": null
        }
      }
    ]
  }
}
```

---

## 12. Mark Hazard as Resolved (`PATCH /api/hazards/:id/resolve`)

```bash
curl -X PATCH http://localhost:5000/api/hazards/2/resolve \
  -H "Authorization: Bearer <ADMIN_OR_COORDINATOR_JWT_TOKEN>"
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Hazard marked as resolved successfully.",
  "hazard": {
    "type": "Feature",
    "id": 2,
    "geometry": {
      "type": "Point",
      "coordinates": [124.9504, 6.3618]
    },
    "properties": {
      "hazard_id": 2,
      "type": "Electrical Hazard",
      "description": "Exposed power line near Senior High Building entrance",
      "severity": "critical",
      "reported_by": 1,
      "status": "resolved",
      "created_at": "2026-08-17T09:48:00.000Z",
      "resolved_at": "2026-08-17T09:49:00.000Z"
    }
  }
}
```

---

## 13. Broadcast Emergency Alert (`POST /api/alerts`)

```bash
curl -X POST http://localhost:5000/api/alerts \
  -H "Authorization: Bearer <ADMIN_OR_COORDINATOR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "hazard_id": 1,
    "title": "EMERGENCY EVACUATION: Polonoling NHS Main Campus",
    "message": "Please proceed immediately to the Main Oval Evacuation Area due to falling debris."
  }'
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Emergency alert created and broadcasted successfully.",
  "alert": {
    "alert_id": 2,
    "hazard_id": 1,
    "title": "EMERGENCY EVACUATION: Polonoling NHS Main Campus",
    "message": "Please proceed immediately to the Main Oval Evacuation Area due to falling debris.",
    "sent_by": 1,
    "sent_at": "2026-08-17T09:55:00.000Z",
    "is_active": true
  }
}
```

---

## 14. List Active Emergency Alerts (`GET /api/alerts/active`)

```bash
curl -X GET http://localhost:5000/api/alerts/active \
  -H "Authorization: Bearer <ANY_AUTHENTICATED_USER_JWT_TOKEN>"
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "alert_id": 1,
      "hazard_id": 1,
      "title": "EMERGENCY EVACUATION: Polonoling NHS Main Campus",
      "message": "Please proceed immediately to the Main Oval Evacuation Area due to falling debris.",
      "sent_by": 1,
      "sent_by_name": "System Admin",
      "sent_at": "2026-08-17T09:55:00.000Z",
      "is_active": true,
      "hazard_location": {
        "type": "Point",
        "coordinates": [124.9501, 6.3612]
      }
    }
  ]
}
```

---

## 15. Submit Safety Check-in ("I Am Safe") (`POST /api/checkins`)

```bash
curl -X POST http://localhost:5000/api/checkins \
  -H "Authorization: Bearer <STUDENT_OR_STAFF_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "alert_id": 1,
    "zone_id": 1,
    "location": {
      "type": "Point",
      "coordinates": [124.9505, 6.3612]
    }
  }'
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Safety check-in recorded successfully.",
  "checkin": {
    "checkin_id": 2,
    "alert_id": 1,
    "user_id": 3,
    "user_name": "Maria Santos",
    "user_email": "student@polonoling.edu.ph",
    "role": "student",
    "department": "Grade 10 - Sampaguita",
    "zone_id": 1,
    "zone_name": "Polonoling NHS Main Oval Evacuation Area",
    "checked_in_at": "2026-08-17T09:56:00.000Z",
    "location": {
      "type": "Point",
      "coordinates": [124.9505, 6.3612]
    }
  }
}
```

---

## 16. View Live Coordinator Dashboard Data (`GET /api/dashboard/checkins/:alertId`)

```bash
curl -X GET http://localhost:5000/api/dashboard/checkins/1 \
  -H "Authorization: Bearer <ADMIN_OR_COORDINATOR_JWT_TOKEN>"
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "alert": {
      "alert_id": 1,
      "title": "EMERGENCY EVACUATION: Polonoling NHS Main Campus",
      "is_active": true
    },
    "alert_id": 1,
    "total_expected_users": 3,
    "checked_in_count": 1,
    "missing_count": 2,
    "checked_in_users": [
      {
        "checkin_id": 1,
        "user_id": 3,
        "full_name": "Maria Santos",
        "email": "student@polonoling.edu.ph",
        "role": "student",
        "id_number": "PNHS-2026-042",
        "department": "Grade 10 - Sampaguita",
        "zone_name": "Polonoling NHS Main Oval Evacuation Area",
        "checked_in_at": "2026-08-17T09:56:00.000Z"
      }
    ],
    "missing_users": [
      {
        "user_id": 2,
        "full_name": "Campus Safety Coordinator",
        "email": "coordinator@saferoute.edu",
        "role": "coordinator"
      }
    ]
  }
}
```

---

## 17. Generate Evacuation Report (`POST /api/reports/:alertId/generate`)

```bash
curl -X POST http://localhost:5000/api/reports/1/generate \
  -H "Authorization: Bearer <ADMIN_OR_COORDINATOR_JWT_TOKEN>"
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Evacuation report generated successfully.",
  "report": {
    "report_id": 1,
    "alert_id": 1,
    "total_users": 3,
    "checked_in_count": 1,
    "generated_at": "2026-08-17T09:57:00.000Z"
  }
}
```

---

## 18. Retrieve Evacuation Report (`GET /api/reports/:alertId`)

```bash
curl -X GET http://localhost:5000/api/reports/1 \
  -H "Authorization: Bearer <ADMIN_OR_COORDINATOR_JWT_TOKEN>"
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "report": {
    "report_id": 1,
    "alert_id": 1,
    "total_users": 3,
    "checked_in_count": 1,
    "generated_at": "2026-08-17T09:57:00.000Z"
  }
}
```

---

## ⚡ How to Test Socket.IO Real-Time Events

You can test real-time events (`alert:broadcast`, `hazard:new`, `hazard:resolved`, `checkin:new`) using our included test client:

```bash
# Run test client with a valid JWT token
node scratch/socket_client_test.js <ADMIN_OR_STUDENT_JWT_TOKEN>
```

Or using **Postman Socket.IO Connection**:
1. Create a new Socket.IO Request in Postman to `ws://localhost:5000`.
2. Under **Handshake Details -> Auth**, select `token` and paste your Bearer JWT token.
3. Click **Connect**.
4. Listen to events: `alert:broadcast`, `hazard:new`, `hazard:resolved`, `checkin:new`.


