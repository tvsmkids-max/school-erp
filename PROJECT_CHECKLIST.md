# School ERP Project Checklist

Project: THAKUR VIRENDRA SINGH MEMORIAL SCHOOL ERP  
Board: MPBSE  
Development Mode: Windows 10/11 + VS Code + PowerShell  
Current Database Mode: Local JSON DB  
Production Database Target: MongoDB Atlas

---

## Status Symbols

- [x] Completed
- [ ] Pending
- [~] In Progress
- [!] Needs Fix / Review

---

## Development Engines / Core Setup

| Item                               | Status | Notes                                                  |
| ---------------------------------- | -----: | ------------------------------------------------------ |
| Windows PowerShell command style   |    [x] | All future commands should be PowerShell compatible    |
| Node.js backend engine             |    [x] | Backend started with Node.js + Express                 |
| Express version fixed              |    [x] | Express 4 required for stable middleware compatibility |
| Local JSON DB engine               |    [x] | Temporary development DB: `backend/data/local-db.json` |
| MongoDB Atlas production readiness |    [ ] | Will be enabled later using `DB_MODE=mongodb`          |
| JWT auth engine                    |    [ ] | To be built in Step 3                                  |
| RBAC permission engine             |    [ ] | To be built after auth foundation                      |
| Frontend React engine              |    [ ] | To be built after backend auth APIs                    |
| Tailwind UI engine                 |    [ ] | Pending frontend setup                                 |
| Deployment engine                  |    [ ] | Production deployment later                            |

---

# PHASE 1 — Foundation

## Step 1 — Backend Foundation Setup

| Work Item                       | Status | Notes                              |
| ------------------------------- | -----: | ---------------------------------- |
| Create `school-erp` folder      |    [x] | Done                               |
| Create `backend` folder         |    [x] | Done                               |
| Initialize npm project          |    [x] | Done                               |
| Install backend modules         |    [x] | Done                               |
| Fix Express 4 version           |    [x] | Done                               |
| Create backend folder structure |    [x] | Done                               |
| Create `.env` file              |    [x] | Done                               |
| Configure local DB mode         |    [x] | `DB_MODE=local`                    |
| Create Express app              |    [x] | Done                               |
| Create server file              |    [x] | Done                               |
| Create environment config       |    [x] | Done                               |
| Create local DB config          |    [x] | Done                               |
| Create DB switch config         |    [x] | Local now, MongoDB later           |
| Add security middleware         |    [x] | Helmet, CORS, rate limit, hpp etc. |
| Add health route                |    [x] | `/api/v1/health` working           |
| Run backend successfully        |    [x] | Done                               |

## Step 2 — Local Database Seed Setup

| Work Item                      | Status | Notes                                                      |
| ------------------------------ | -----: | ---------------------------------------------------------- |
| Create seed folder             |    [x] | `src/seed`                                                 |
| Create role constants          |    [x] | Super Admin, Principal, Administrator, Accountant, Teacher |
| Create permission constants    |    [x] | Phase 1 permission catalog                                 |
| Create class constants         |    [x] | Nursery to Class 12                                        |
| Create ID utility              |    [x] | `nanoid` based local IDs                                   |
| Create password utility        |    [x] | bcrypt hashing                                             |
| Create foundation seed script  |    [x] | Tenant, branch, roles, permissions, classes, session       |
| Create Super Admin seed script |    [x] | Super Admin from `.env`                                    |
| Run foundation seed            |    [x] | Done                                                       |
| Run Super Admin seed           |    [x] | Done                                                       |
| Verify `local-db.json`         |    [x] | Done                                                       |

## Step 3 — Authentication APIs

| Work Item                   | Status | Notes                                    |
| --------------------------- | -----: | ---------------------------------------- |
| JWT utility                 |    [ ] | Access token + refresh token             |
| Token hashing utility       |    [ ] | For refresh token sessions               |
| Auth validation             |    [ ] | Login validation                         |
| Login API                   |    [ ] | `POST /api/v1/auth/login`                |
| Refresh token API           |    [ ] | `POST /api/v1/auth/refresh`              |
| Logout API                  |    [ ] | `POST /api/v1/auth/logout`               |
| Logout all sessions API     |    [ ] | `POST /api/v1/auth/logout-all`           |
| Current user API            |    [ ] | `GET /api/v1/auth/me`                    |
| Own sessions API            |    [ ] | `GET /api/v1/auth/sessions`              |
| Auth middleware             |    [ ] | Protect APIs using JWT                   |
| Local DB session storage    |    [ ] | Store active sessions in `user_sessions` |
| Test login with Super Admin |    [ ] | Username: `superadmin`                   |

## Step 4 — RBAC Permission Middleware

| Work Item                    | Status | Notes                                      |
| ---------------------------- | -----: | ------------------------------------------ |
| Permission resolver          |    [ ] | Role permissions + user overrides          |
| Super Admin full access rule |    [ ] | Always allow Super Admin                   |
| Deny override priority       |    [ ] | Denied permission beats allowed permission |
| Permission middleware        |    [ ] | `authorize("permission.key")`              |
| Menu permission helper       |    [ ] | Permission-based menu visibility           |
| Test protected route access  |    [ ] | 401 / 403 checks                           |

## Step 5 — User Management APIs

| Work Item              | Status | Notes                            |
| ---------------------- | -----: | -------------------------------- |
| User validation        |    [ ] | Create/update/reset password     |
| List users API         |    [ ] | Search + pagination              |
| Create user API        |    [ ] | Super Admin permission           |
| Update user API        |    [ ] | Edit details, role, class access |
| Disable user API       |    [ ] | Block login                      |
| Enable user API        |    [ ] | Restore login                    |
| Soft delete user API   |    [ ] | No hard delete                   |
| Reset password API     |    [ ] | Super Admin only                 |
| Force logout user API  |    [ ] | Revoke sessions                  |
| View user sessions API |    [ ] | Active sessions                  |

## Step 6 — Role and Permission APIs

| Work Item                   | Status | Notes                   |
| --------------------------- | -----: | ----------------------- |
| List roles API              |    [ ] | System roles            |
| Get role details API        |    [ ] | Permissions included    |
| Update role permissions API |    [ ] | Checkbox UI ready       |
| List permissions API        |    [ ] | Permission catalog      |
| Grouped permissions API     |    [ ] | Module-wise permissions |

## Step 7 — Academic Sessions APIs

| Work Item               | Status | Notes                  |
| ----------------------- | -----: | ---------------------- |
| List sessions API       |    [ ] | Local DB first         |
| Create session API      |    [ ] | June to March rule     |
| Update session API      |    [ ] | Edit name/dates/status |
| Set current session API |    [ ] | Only one current       |
| Delete session API      |    [ ] | Soft delete            |
| Validate overlap        |    [ ] | No duplicate/overlap   |

## Step 8 — Classes APIs

| Work Item         | Status | Notes                       |
| ----------------- | -----: | --------------------------- |
| List classes API  |    [ ] | Nursery to 12th seeded      |
| Create class API  |    [ ] | Configurable                |
| Update class API  |    [ ] | Display name, order, status |
| Disable class API |    [ ] | Hide from active dropdowns  |
| Delete class API  |    [ ] | Soft delete                 |

## Step 9 — Sections APIs

| Work Item           | Status | Notes                  |
| ------------------- | -----: | ---------------------- |
| List sections API   |    [ ] | Filter by class        |
| Create section API  |    [ ] | Example: A, B, C       |
| Update section API  |    [ ] | Name/code/order/status |
| Disable section API |    [ ] | Hide inactive          |
| Delete section API  |    [ ] | Soft delete            |

## Step 10 — Frontend Foundation

| Work Item                 | Status | Notes                          |
| ------------------------- | -----: | ------------------------------ |
| Create frontend Vite app  |    [ ] | React + Vite                   |
| Install frontend modules  |    [ ] | Router, Axios, Query, Tailwind |
| Configure Tailwind CSS    |    [ ] | Light/dark ready               |
| Create Axios client       |    [ ] | API base URL                   |
| Create React Query client |    [ ] | Server state                   |
| Create routing            |    [ ] | Protected routes later         |
| Create UI base components |    [ ] | Button, Input, Modal etc.      |

## Step 11 — Frontend Auth UI

| Work Item                 | Status | Notes                     |
| ------------------------- | -----: | ------------------------- |
| Login page                |    [ ] | Username + password       |
| Auth store                |    [ ] | Store access token/user   |
| Protected route component |    [ ] | Redirect if not logged in |
| Auto refresh handling     |    [ ] | Refresh token flow        |
| Logout button             |    [ ] | Clear session             |

## Step 12 — Dashboard Layout UI

| Work Item                | Status | Notes                      |
| ------------------------ | -----: | -------------------------- |
| Dashboard shell          |    [ ] | Sidebar + topbar           |
| Permission-based sidebar |    [ ] | Menu hidden by permissions |
| Theme toggle             |    [ ] | Light/dark                 |
| User profile display     |    [ ] | Name + role                |
| Responsive layout        |    [ ] | Desktop + mobile           |

## Step 13 — User Management UI

| Work Item                | Status | Notes                |
| ------------------------ | -----: | -------------------- |
| Users table              |    [ ] | Search, pagination   |
| User create form         |    [ ] | Full user details    |
| User edit form           |    [ ] | Update details       |
| Reset password modal     |    [ ] | Super Admin only     |
| Permission checkbox grid |    [ ] | Allow/deny overrides |
| Active sessions modal    |    [ ] | Force logout support |

## Step 14 — Settings UI

| Work Item              | Status | Notes               |
| ---------------------- | -----: | ------------------- |
| Academic sessions page |    [ ] | CRUD + set current  |
| Classes page           |    [ ] | CRUD                |
| Sections page          |    [ ] | CRUD + class filter |

---

# PHASE 2 — Student Management

| Work Item                | Status | Notes                               |
| ------------------------ | -----: | ----------------------------------- |
| Student profile backend  |    [ ] | Pending Phase 1 approval/completion |
| Dynamic student fields   |    [ ] | Visible/hidden/mandatory/read-only  |
| Student list UI          |    [ ] | Quick + advanced filters            |
| Student create/edit UI   |    [ ] | All required fields                 |
| Student import via Excel |    [ ] | Bulk operations                     |
| Student promotion        |    [ ] | Session/class promotion             |

---

# PHASE 3 — Attendance

| Work Item                  | Status | Notes                                 |
| -------------------------- | -----: | ------------------------------------- |
| Student attendance backend |    [ ] | Pending                               |
| Daily attendance UI        |    [ ] | Present/Absent/Leave                  |
| Bulk attendance entry      |    [ ] | Pending                               |
| Attendance reports         |    [ ] | Daily/monthly/yearly                  |
| Attendance analytics       |    [ ] | Low attendance, consecutive absentees |

---

# PHASE 4 — Fee Analytics

| Work Item             | Status | Notes                    |
| --------------------- | -----: | ------------------------ |
| Fee import template   |    [ ] | Pending                  |
| Excel upload          |    [ ] | Weekly accountant upload |
| Import validation     |    [ ] | Pending                  |
| Preview before import |    [ ] | Pending                  |
| Duplicate detection   |    [ ] | Pending                  |
| Import history        |    [ ] | Pending                  |
| Rollback support      |    [ ] | Pending                  |
| Fee analytics reports |    [ ] | Pending                  |

---

# PHASE 5 — Examination

| Work Item         | Status | Notes                            |
| ----------------- | -----: | -------------------------------- |
| Exam type setup   |    [ ] | Unit/Quarterly/Half-Yearly/etc.  |
| Custom exam types |    [ ] | Super Admin                      |
| Marks entry       |    [ ] | Teacher access                   |
| Auto calculations |    [ ] | Total, %, grade, rank, pass/fail |
| Exam analytics    |    [ ] | Subject/class/top/fail reports   |

---

# PHASE 6 — Reports Center

| Work Item          | Status | Notes   |
| ------------------ | -----: | ------- |
| Student reports    |    [ ] | Pending |
| Attendance reports |    [ ] | Pending |
| Fee reports        |    [ ] | Pending |
| Exam reports       |    [ ] | Pending |
| Excel export       |    [ ] | Pending |
| PDF export         |    [ ] | Pending |
| Print support      |    [ ] | Pending |

---

# PHASE 7 — Dashboards

| Work Item              | Status | Notes               |
| ---------------------- | -----: | ------------------- |
| Principal dashboard    |    [ ] | Analytics first     |
| Admin dashboard        |    [ ] | Operations focus    |
| Accountant dashboard   |    [ ] | Fee analytics focus |
| Charts                 |    [ ] | Pending             |
| Filters and drilldowns |    [ ] | Pending             |

---

# PHASE 8 — System Governance

| Work Item      | Status | Notes   |
| -------------- | -----: | ------- |
| Activity logs  |    [ ] | Pending |
| Audit logs     |    [ ] | Pending |
| Manual backup  |    [ ] | Pending |
| Restore backup |    [ ] | Pending |
| Backup history |    [ ] | Pending |

---

# Future Modules — Not Building Now

| Module                | Status | Notes       |
| --------------------- | -----: | ----------- |
| Certificate Generator |    [ ] | Future only |
| ID Card Generator     |    [ ] | Future only |

---

# Excluded Modules

These are intentionally not part of this ERP version:

- Library
- Inventory
- Hostel
- Visitor Management
- Payroll
- HRMS
- SMS Module
- WhatsApp Module
