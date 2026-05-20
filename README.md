# HireFlow

A production-grade recruitment platform and AI-powered applicant screening system built on the MERN stack.

---

## Features

- **Session Security:** JWT access tokens and HTTP-only rotating refresh tokens with automatic token reuse breach detection.
- **Role-Based Access Control (RBAC):** Dedicated dashboards and route-level authorization guards for applicants, recruiters, and administrators.
- **Asynchronous AI Screening:** Automated parsing of PDF resumes evaluated against job criteria via OpenAI `gpt-4o-mini`, with a local fallback algorithm.
- **Vacancy Moderation & Search:** Dynamic job board supporting full-text search, salary ranges, location parameters, and remote tags.
- **Analytics:** Employer dashboards with metrics for active postings, applicant counts, and score distributions.

---

## Tech Stack

- **Frontend:** React 18, Vite, Zustand, Tailwind CSS, Axios
- **Backend:** Node.js, Express, Winston, Zod
- **Database:** MongoDB 7, Mongoose ODM
- **Services:** OpenAI API, Cloudinary API, Nodemailer
- **Containerization:** Docker, Docker Compose

---

## Project Structure

```text
HireFlow/
├── backend/
│   ├── src/
│   │   ├── config/          # Client & db setups (mongo, winston, cloudinary)
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth, RBAC, validations, rate limiters
│   │   ├── models/          # Mongoose database models
│   │   ├── routes/          # Express route paths
│   │   ├── services/        # Logic handlers (Token lifecycle, Email, AI)
│   │   └── validations/     # Zod request validators
│   └── server.js            # Entry point
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios client with 401 retry loops
│   │   ├── store/           # Zustand stores (Auth, Theme)
│   │   ├── components/      # UI components
│   │   └── pages/           # Candidate, recruiter, and admin portals
│   └── vite.config.js
└── docker-compose.yml
```

---

## Quick Start (Local Development)

### Prerequisites
- Node.js v20+
- MongoDB instance running locally (or running in Docker)

### Installation
1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd HireFlow
   ```
2. **Setup backend environment:**
   Create a `.env` file inside `backend/` (see **Environment Variables** below).
   *Note: If MongoDB is running on your host, use `localhost` in the connection string:*
   `MONGO_URI=mongodb://root:rootpassword@localhost:27017/jobboard?authSource=admin`

3. **Start backend server:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   Server starts on `http://localhost:5000`.

4. **Start frontend dev server:**
   Open a new terminal window:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Vite dev server starts on `http://localhost:3000`.

---

## Docker Setup

Deploy the entire stack with isolated multi-container virtualization:

1. **Verify Docker is running.**
2. **Build and launch services:**
   ```bash
   docker compose up --build -d
   ```
   This automatically runs MongoDB (`job-board-mongo`), the Express API (`job-board-backend`), and the React SPA (`job-board-frontend`). The app will be live at `http://localhost:3000`.

---

## Environment Variables

Configure a `.env` file in the `backend/` directory:

```env
# Server Config
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# Database
MONGO_URI=mongodb://root:rootpassword@mongo:27017/jobboard?authSource=admin

# Security (Secrets should be min 32/64 characters)
JWT_ACCESS_SECRET=your_32_char_access_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_64_char_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# Third-Party APIs (Optional fallbacks apply if left blank)
OPENAI_API_KEY=sk-proj-yourOpenAiApiKey
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Notifications
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
EMAIL_FROM=noreply@hireflow.com
```

---

## API Summary

| Method | Endpoint | Access Guard | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Public | Register candidate or employer account |
| **POST** | `/api/auth/login` | Public | Create user session and issue refresh cookies |
| **POST** | `/api/auth/logout` | Protected | Terminate session and clear credentials |
| **POST** | `/api/auth/refresh` | Protected | Exchange expired access token using refresh cookie |
| **GET** | `/api/jobs` | Public | Paginated job search feed with filters |
| **POST** | `/api/jobs` | Recruiter | Publish a new job vacancy |
| **PUT** | `/api/jobs/:id` | Owner / Admin | Modify an existing job listing |
| **DELETE**| `/api/jobs/:id` | Owner / Admin | Soft-delete a job listing |
| **POST** | `/api/applications` | Applicant | Submit resume & cover letter to a job |
| **GET** | `/api/applications/my`| Applicant | Get submission history for the applicant |
| **GET** | `/api/applications/job/:jobId` | Recruiter | Get job applications sorted by AI fit scores |
| **PATCH** | `/api/applications/:id/status`| Recruiter | Transition application status and notify applicant |
| **GET** | `/api/admin/stats` | Admin | Access platform metrics and system state |
| **PATCH** | `/api/admin/users/:id/status`| Admin | Suspend or unsuspend user accounts |

---

## Authentication & RBAC

Secure route access is maintained via Express middlewares implementing strict boundary guards:

- **Dual-Token Scheme:** API access requires a short-lived bearer JWT. Silent session renewal is handled via cryptographically secure, rotating HTTP-only cookies.
- **Replay Protection:** If an already-used refresh token is presented, the system detects a breach and instantly revokes all active refresh tokens for that user.
- **Roles:**
  - `applicant`: Can view jobs, manage their profile, upload a PDF resume, and submit/track applications.
  - `employer`: Can create job posts, view candidates sorted by AI-match scoring, update application statuses, and view metrics.
  - `admin`: Has system-wide visibility, can moderate job listings, and suspend users.

---

## Deployment Notes

- **Reverse Proxy:** Route requests through Nginx to map `/api` to the backend Express container while serving frontend build outputs as static files.
- **Security Headers:** Ensure standard HTTP protection using Helmet. Set cookie configurations to `Secure` in production environments.
- **Clustering:** Scale backend services using isolated stateless nodes and transition MongoDB to clustered Replica Sets.
