# DocVerify — Secure Document Verification Platform

A full-stack platform for uploading documents, generating cryptographic hashes, and verifying document integrity. Built as a technical assessment project.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Security Decisions](#security-decisions)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Installation & Setup](#installation--setup)
- [API Reference](#api-reference)
- [Demo Walkthrough](#demo-walkthrough)

---

## Overview

DocVerify allows users to:
- Register and log in securely
- Upload documents (PDF, PNG, JPG) — a SHA256 hash is computed client-side and verified server-side
- Verify any document by re-uploading it — the system compares its hash against stored records
- Detect tampered or modified documents instantly

Admins can:
- View all uploaded documents across all users
- Search documents by hash, filename, or uploader email
- Delete suspicious files
- View all registered users and platform stats

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Browser                        │
│  Next.js 14 (App Router) · Tailwind CSS · Axios         │
│                                                          │
│  /login  /register  /dashboard  /upload  /verify  /admin│
└───────────────────┬─────────────────────────────────────┘
                    │ HTTP REST (JWT in Authorization header)
                    ▼
┌─────────────────────────────────────────────────────────┐
│                 Backend API (Express + TypeScript)        │
│  Port 5000                                               │
│                                                          │
│  Middleware Stack (in order):                            │
│  Helmet → CORS → Rate Limiter → Body Parser →            │
│  Sanitizer → Routes → Error Handler                      │
│                                                          │
│  Routes:                                                 │
│  /api/auth      → AuthController                         │
│  /api/documents → DocumentController                     │
│  /api/admin     → AdminController (admin only)           │
│                                                          │
│  Services:                                               │
│  AuthService · DocumentService · HashService · AdminService│
└───────────────────┬─────────────────────────────────────┘
                    │ pg (node-postgres)
                    ▼
┌─────────────────────────────────────────────────────────┐
│               PostgreSQL Database (Port 5432)            │
│                                                          │
│  users table      → id, email, password, role, timestamps│
│  documents table  → id, user_id, file_name, file_hash,   │
│                     storage_path, file_size, mime_type,  │
│                     created_at                           │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│            Local File System  ./backend/uploads/         │
│  Files renamed to UUID on save (path traversal prevention)│
└─────────────────────────────────────────────────────────┘
```

### Request Lifecycle — Document Upload

```
Browser selects file
    → Web Crypto API computes SHA256 hash client-side
    → FormData sent to POST /api/documents/upload
        → JWT middleware verifies token
        → Rate limiter checks upload quota
        → Multer saves file to /uploads/<uuid>.<ext>
        → HashService recomputes SHA256 from saved file
        → Compares client hash vs server hash (timing-safe)
        → If match: metadata saved to documents table
        → Response: { document: { id, fileName, fileHash, ... } }
```

### Request Lifecycle — Document Verification

```
Browser selects file for verification
    → Web Crypto API computes SHA256 hash client-side
    → FormData sent to POST /api/documents/verify
        → JWT middleware verifies token
        → Multer saves file temporarily
        → HashService computes SHA256 from temp file
        → DocumentModel.findByHash() queries database
        → Temp file deleted immediately (not stored)
        → Response: VERIFIED | NOT_FOUND with metadata
```

---

## Security Decisions

### 1. Password Hashing (bcrypt, 12 rounds)
Passwords are never stored in plain text. bcrypt with 12 salt rounds is used, providing strong protection against brute-force attacks even if the database is compromised. The cost factor of 12 was chosen to balance security and performance (~300ms per hash).

### 2. JWT Authentication
- Tokens expire in 7 days
- Signed with a secret key stored only in environment variables
- Verified on every protected request via `authenticate` middleware
- Token expiry is checked both server-side (JWT verification) and client-side (decoded exp claim in middleware)
- On 401 responses, the client automatically clears the session and redirects to login

### 3. Role-Based Access Control
Two roles: `user` and `admin`. The `requireAdmin` middleware checks `req.user.role` after JWT verification. Admin routes are completely inaccessible to regular users — a 403 is returned at the middleware level before any controller logic runs.

### 4. SHA256 Hash Verification (Client + Server)
The client computes a SHA256 hash using the native Web Crypto API before upload. The server independently recomputes the hash after receiving the file. If they differ, the file is deleted and the request is rejected. This detects tampering in transit.

### 5. File Upload Security
- **Whitelist only**: MIME type AND file extension are both checked independently — a renamed `.exe` with a PDF MIME type is rejected
- **Size limit**: 5MB maximum per file
- **UUID filenames**: Original filenames are never used on disk — files are saved as `<uuid>.<ext>` to prevent path traversal attacks
- **Rate limited**: Max 20 uploads per hour per IP

### 6. SQL Injection Prevention
All database queries use parameterized statements via `node-postgres` (`$1, $2, ...` placeholders). Raw string interpolation into SQL is never used anywhere in the codebase.

### 7. Rate Limiting
Three tiers of rate limiting:
- **Global**: 100 requests per 15 minutes (all routes)
- **Auth**: 10 failed attempts per 15 minutes (login/register only, successful requests not counted)
- **Upload**: 20 uploads per hour

### 8. Security Headers (Helmet)
- `X-Frame-Options: DENY` — prevents clickjacking
- `X-Content-Type-Options: nosniff` — prevents MIME sniffing
- `Strict-Transport-Security` — enforces HTTPS
- `Content-Security-Policy` — restricts resource origins
- `X-Powered-By` header removed — hides Express

### 9. CORS
Only `http://localhost:3000` is whitelisted. All other origins receive a 403. Preflight responses are cached for 24 hours.

### 10. Input Sanitization
All request bodies and query parameters are sanitized before reaching controllers — NoSQL injection patterns, `<script>` tags, and `javascript:` protocols are stripped.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL 15 |
| Auth | JWT (jsonwebtoken), bcryptjs |
| File Upload | Multer |
| Hashing | Node.js `crypto` module (server), Web Crypto API (client) |
| Validation | express-validator (backend), Zod + React Hook Form (frontend) |
| Security | Helmet, express-rate-limit, cors |
| HTTP Client | Axios |

---

## Project Structure

```
doc-verify-platform/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.ts           # PostgreSQL connection pool
│   │   │   ├── env.ts          # Environment variable loader
│   │   │   ├── migrate.ts      # Schema migration + admin seed
│   │   │   └── schema.sql      # Database schema
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── document.controller.ts
│   │   │   └── admin.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts      # JWT verification
│   │   │   ├── admin.middleware.ts     # Role check
│   │   │   ├── upload.middleware.ts    # Multer + file validation
│   │   │   ├── validate.middleware.ts  # express-validator errors
│   │   │   ├── sanitize.middleware.ts  # XSS / injection strip
│   │   │   ├── rateLimiter.middleware.ts
│   │   │   ├── cors.middleware.ts
│   │   │   └── helmet.middleware.ts
│   │   ├── models/
│   │   │   ├── user.model.ts
│   │   │   └── document.model.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── document.routes.ts
│   │   │   └── admin.routes.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── document.service.ts
│   │   │   ├── hash.service.ts
│   │   │   └── admin.service.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── app.ts
│   ├── uploads/                # Stored files (git-ignored)
│   ├── .env                    # Backend env vars (git-ignored)
│   ├── tsconfig.json
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── upload/page.tsx
│   │   │   ├── verify/page.tsx
│   │   │   ├── admin/page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── FormInput.tsx
│   │   │   ├── Alert.tsx
│   │   │   ├── FileDropzone.tsx
│   │   │   ├── HashDisplay.tsx
│   │   │   └── FilePreview.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   └── hashFile.ts
│   │   └── middleware.ts
│   ├── .env.local              # Frontend env vars (git-ignored)
│   ├── tailwind.config.ts
│   └── package.json
│
└── README.md
```

---

## Environment Variables

### Backend — `backend/.env`

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `docverify` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `your_password` |
| `JWT_SECRET` | Secret key for signing JWTs | `a_long_random_string` |
| `JWT_EXPIRES_IN` | Token expiry duration | `7d` |
| `MAX_FILE_SIZE` | Max upload size in bytes | `5242880` (5MB) |
| `UPLOAD_PATH` | File storage directory | `./uploads` |

### Frontend — `frontend/.env.local`

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:5000/api` |

---

## Installation & Setup

### Prerequisites

- Node.js v18 or higher
- PostgreSQL 14 or higher running locally
- npm v9 or higher

### 1. Clone the repository

```bash
git clone <repository-url>
cd doc-verify-platform
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create the `.env` file:
```bash
cp .env.example .env
# Edit .env and set your DB_PASSWORD and JWT_SECRET
```

Create the PostgreSQL database:
```bash
psql -U postgres -c "CREATE DATABASE docverify;"
```

Run migrations (creates tables + seeds admin user):
```bash
npm run migrate
```

Start the backend server:
```bash
npm run dev
```

Backend runs at: `http://localhost:5000`

### 3. Set up the frontend

```bash
cd ../frontend
npm install
```

Create the `.env.local` file:
```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local
```

Start the frontend:
```bash
npm run dev
```

Frontend runs at: `http://localhost:3000`

### 4. Verify both are running

- Backend health check: `http://localhost:5000/health`
- Frontend: `http://localhost:3000`

---

## API Reference

### Auth

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/api/auth/register` | None | `{ email, password }` | Register new user |
| POST | `/api/auth/login` | None | `{ email, password }` | Login, returns JWT |
| GET | `/api/auth/me` | JWT | — | Get current user info |

### Documents

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/api/documents/upload` | JWT | `FormData: file, clientHash` | Upload document |
| GET | `/api/documents` | JWT | — | Get my documents |
| POST | `/api/documents/verify` | JWT | `FormData: file` | Verify document integrity |
| DELETE | `/api/documents/:id` | JWT | — | Delete own document |

### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/stats` | Admin | Platform statistics |
| GET | `/api/admin/documents` | Admin | All documents |
| GET | `/api/admin/documents/search?q=term` | Admin | Search by hash/email/filename |
| DELETE | `/api/admin/documents/:id` | Admin | Delete any document |
| GET | `/api/admin/users` | Admin | All registered users |

---

## Demo Walkthrough

For the live demonstration, follow this sequence:

### Step 1 — User Registration
1. Open `http://localhost:3000/register`
2. Register with email `demo@example.com` and password `Demo@1234`
3. Show automatic redirect to dashboard

### Step 2 — Login
1. Logout, go to `/login`
2. Login with the registered credentials
3. Show redirect to dashboard

### Step 3 — Document Upload
1. Go to `/upload`
2. Drag and drop a PDF file
3. Show the SHA256 hash computed instantly in the browser
4. Click Upload — show the progress bar
5. Show the success screen with the stored hash

### Step 4 — Document Verification
1. Go to `/verify`
2. Upload the same original file — show "Document Verified" ✅
3. Open the file, add a space, save it
4. Upload the modified file — show "Document Not Verified" ❌

### Step 5 — Admin Access
1. Logout
2. Login as `admin@docverify.com` / `Admin@1234`
3. Show auto-redirect to `/admin`
4. Show stats cards, documents table, search by email
5. Show users tab
6. Delete a document — show it removed from the list
7. Try accessing `/admin` as a regular user — show redirect to dashboard

---

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@docverify.com` | `Admin@1234` |

> **Note:** Change all credentials and secrets before any production deployment.