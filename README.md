# HireFlow

HireFlow is a premium, production-grade recruitment job board and AI-driven candidate screening platform built on the modern MERN stack. It features robust authentication, fine-grained Role-Based Access Controls (RBAC), and automatic resume screening utilizing advanced natural language processing.

---

## 🚀 Key Features

*   **Rotating Sessions & Security:** Full JSON Web Token (JWT) workflow featuring cookie-based Rotating Refresh Tokens, sliding session limits, and programmatic token reuse breach detection.
*   **Role-Based Access Control (RBAC):** Strict operational boundaries for `applicant`, `employer`, and `admin` roles, secured via declarative API and route-level authorization guards.
*   **Smart Candidate Screening:** Instant asynchronous candidate screening. Analyzes raw text parsed directly from PDF resume uploads against target job parameters using OpenAI `gpt-4o-mini`, with high-fidelity, skill-matching local offline fallbacks.
*   **Aesthetic User Interface:** Premium responsive glassmorphic interfaces, Outfit/Inter typography hierarchies, soft mesh background styling, color-coded badges, dynamic timeline trackers, and a seamless light/dark mode switch.
*   **Scalable Architecture:** Built following clean MVC + Service Layer patterns, keeping database interaction decoupled from client controllers. Fully virtualized using Docker Compose.

---

## 🛠️ Technology Stack

*   **Frontend:** React 18 (Vite), Zustand, Tailwind CSS, Lucide Icons, Axios (with rotating 401 interception retry loops).
*   **Backend:** Node.js, Express, Winston Logger, Zod Schemas, Multer.
*   **Database:** MongoDB 7, Mongoose (indexing, compound keys, and text indexes).
*   **Storage:** Cloudinary API (with automatic local uploads fallback).
*   **AI screener:** OpenAI API (with robust local skill-matching fallback).
*   **Transactional Email:** Nodemailer (with Winston console output fallback).
*   **Containerization:** Docker Compose (multi-container isolation: mongo, backend, frontend).

---

## 📂 Project Structure

```text
HireFlow/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   ├── src/
│   │   ├── app.js
│   │   ├── config/          # db, logger, cloudinary configuration
│   │   ├── controllers/     # Express route handlers
│   │   ├── middleware/      # auth, rbac, error, validation, limits
│   │   ├── models/          # Mongoose database models
│   │   ├── routes/          # Express routing pathways
│   │   ├── services/        # token, email, and AI logic layers
│   │   ├── utils/           # standardized errors, response forms
│   │   └── validations/     # Zod request validators
│   └── public/uploads/      # Local uploads fallback directory
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── src/
│   │   ├── App.jsx          # Routes definition and session checks
│   │   ├── main.jsx
│   │   ├── index.css        # Core styles & animations
│   │   ├── api/             # Axios instance + 401 response retry loops
│   │   ├── store/           # Zustand state managers (auth, theme)
│   │   ├── components/      # Glassmorphic UI layout components
│   │   └── pages/           # Candidate, Employer, and Admin portals
└── docker-compose.yml       # Orchestration build file
```

---

## ⚙️ Configuration & Setup

### Environment Variables
Configure the environment variables by creating `.env` in the `backend/` directory or copying `.env.example` in the root. If external integrations are missing, HireFlow will automatically activate high-fidelity offline mock modes for frictionless evaluation.

| Variable Name | Description | Default / Example Value |
| :--- | :--- | :--- |
| `NODE_ENV` | Running environment mode | `development` |
| `PORT` | Backend application port | `5000` |
| `MONGO_URI` | MongoDB Connection String | `mongodb://root:rootpassword@mongo:27017/jobboard?authSource=admin` |
| `JWT_ACCESS_SECRET` | 32+ character JWT Access Secret | `change_me_in_production_min_32_characters` |
| `JWT_REFRESH_SECRET` | 64+ character JWT Refresh Secret | `change_me_in_production_min_64_characters` |
| `OPENAI_API_KEY` | OpenAI API integration key (Optional) | `sk-proj-...` *(Mocks automatically fallback if empty)* |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Account ID (Optional) | `your_cloudinary_cloud_name` *(Mocks save files locally)* |
| `SMTP_HOST` | Transactional email provider host (Optional)| `smtp.mailtrap.io` *(Mocks write emails to console)* |
| `CLIENT_URL` | Frontend connection URL origin | `http://localhost:3000` |

---

## 🐳 Docker Deployment

To launch the full environment out-of-the-box in detached mode, run:

```bash
docker compose up --build -d
```

This starts three isolated containers:
1.  **job-board-mongo** at `mongodb://localhost:27017`
2.  **job-board-backend** at `http://localhost:5000`
3.  **job-board-frontend** at `http://localhost:3000`

### Additional Container Controls

*   **View active containers:** `docker ps`
*   **Stream application logs:** `docker logs -f job-board-backend`
*   **Shut down application services:** `docker compose down`

---

## 🛡️ API Roadmap

### Auth Routes (`/api/auth`)
*   `POST /register` - Register a new candidate or recruiter
*   `POST /login` - Sign-in & receive access token + refresh cookie
*   `POST /logout` - Wipe active session & revoke refresh keys
*   `POST /refresh` - Perform rotating silent refresh token exchange

### Jobs Routes (`/api/jobs`)
*   `GET /` - Dynamic search feed with paginated filtering options
*   `POST /` - Create a new vacancy *(Recruiter only)*
*   `GET /:id` - View full details of a specific job
*   `PUT /:id` - Modify an existing vacancy *(Job owner/Admin)*
*   `DELETE /:id` - Soft-delete a active vacancy *(Job owner/Admin)*

### Applications Routes (`/api/applications`)
*   `POST /` - Submit application (includes direct resume attachment stream) *(Applicant only)*
*   `GET /my` - List candidates personal applications history *(Applicant only)*
*   `GET /job/:jobId` - Rank and list applicants sorted by AI match scores *(Recruiter/Admin)*
*   `PATCH /:id/status` - Transition candidate status & issue email notifications *(Recruiter/Admin)*

### Admin Routes (`/api/admin`)
*   `GET /stats` - Access system health charts and platform growth stats
*   `GET /users` - Paginated user management dashboard
*   `PATCH /users/:id/status` - Suspend/unsuspend user account access
*   `GET /jobs` - Paginated global moderation list of all active vacancies

---

## 🧪 Integration Verification

Verify system availability using the built-in Mongoose database health endpoint:

```bash
# In PowerShell:
Invoke-RestMethod -Uri http://localhost:5000/api/health | ConvertTo-Json
```

Successful response layout:
```json
{
  "success": true,
  "message": "System is healthy.",
  "data": {
    "status": "ok",
    "db": "connected",
    "uptime": 120.4,
    "timestamp": "2026-05-20T11:05:00.000Z"
  }
}
```

---

## 🎨 Design Systems & UI Colors

*   **Light Mode:** Premium `slate-50` backdrop with dynamic glass cards (`white/80` backdrop-blur).
*   **Dark Mode:** harmonious tailored HSL tones (`bg-darkbg-200` with subtle glassmorphic elevation gradients).
*   **Brand Highlights:** Sleek blue-indigo accents (`brand-500` to `brand-600` gradients) for buttons and active headers.
*   **Status Indicators:** Color-coded status markers (`status-badge-pending`, `status-badge-shortlisted`, `status-badge-rejected`, `status-badge-reviewed`) providing clear visual states.
