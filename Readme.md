# 📚 BookStore — Library Management System

A full-stack **MERN** library management system. Students can browse the catalogue, track their borrowed books and fines; administrators manage inventory, issue/return/renew books, handle users, and monitor the library through a dashboard.

---
> **Status:** Production Ready (Iterating)

## ✨ Features

### For students
- Register, log in, and stay signed in securely (JWT access + refresh tokens in HTTP-only cookies)
- Browse, search (title / author / ISBN) and filter books by category
- Book details page with live availability
- **My Books** — active issues with due-date status, plus paginated borrowing history with fines
- Profile & settings (update name, change password), forgot/reset password via email
- Light / dark theme, responsive layout
- Contact form, About, Privacy and Terms pages

### For administrators
- **Dashboard overview** — total books, students, active/overdue issues, fines and low-stock books
- **Book stock management** — add books (ISBN lookup via Google Books or manual entry), edit details, adjust stock, delete
- **Issue / return / renew** books with automatic due dates and fine calculation
- **Transactions** — full issue history, mark fines paid/unpaid
- **Manage users** — search students, promote/demote between `STUDENT` and `ADMIN`

### Backend highlights
- Role-based access control (RBAC) middleware
- ACID transactions with MongoDB sessions and atomic operations
- JWT rotation (access + refresh tokens), HTTP-only secure cookies
- Zod validation for all client input
- Reusable pagination utility
- Aggregation pipelines for the admin dashboard
- Centralised error and response handling
- Rate limiting on auth and contact endpoints

---

## 🧰 Tech Stack

| Layer    | Technologies |
|----------|--------------|
| Frontend | React 19, Vite, React Router 7, Tailwind CSS 4, Axios, react-hot-toast |
| Backend  | Node.js, Express 5, Mongoose, Zod, JWT, bcrypt, Nodemailer, express-rate-limit |
| Database | MongoDB (replica set / Atlas — required for transactions) |
| External | Google Books API (ISBN lookup), SMTP provider (emails) |

---

## 📁 Project Structure

```
.
├── client/                     # React + Vite frontend
│   └── src/
│       ├── api/                # Axios instance + refresh-token interceptor
│       ├── components/         # Layout, admin, common (Modal, ConfirmDialog...), cards
│       ├── context/            # AuthContext, ThemeContext
│       ├── pages/              # Public, user, admin, books, company pages
│       ├── routes/             # ProtectedRoute, AdminRoute
│       ├── services/           # API service functions
│       └── utils/
├── server/                     # Express + MongoDB backend
│   └── src/
│       ├── controllers/        # user, book, issue, dashboard, contact
│       ├── db/                 # MongoDB connection
│       ├── middleware/         # auth (JWT + roles), validate (Zod), rate limiter
│       ├── models/             # User, Book, Issue, Contact
│       ├── routes/
│       ├── schemas/            # Zod schemas
│       ├── utils/              # apiError, apiResponse, asyncHandler, paginate, sendEmail
│       ├── app.js
│       └── server.js
├── .env.sample                 # Copy to server/.env
└── README.md
```

---

## ✅ Prerequisites

- **Node.js** v20.19+ (or v22.12+) and npm
- **MongoDB** running as a **replica set** (MongoDB Atlas free tier works out of the box). Transactions are used when issuing/returning books and adjusting stock, so a standalone `mongod` will fail on those operations.
- A **Google Books API key** (for the admin ISBN lookup)
- An **SMTP account** (e.g. Gmail with an App Password) for contact and password-reset emails

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd <your-repo-folder>
```

### 2. Set up the server

```bash
cd server
npm install
cp ../.env.sample .env      # then fill in the values (see table below)
npm run dev                 # starts on http://localhost:5001 with nodemon
```

### 3. Set up the client

```bash
cd client
npm install
npm run dev                 # starts on http://localhost:5173
```

Optional: if your API is not at `http://localhost:5001/api/v1`, create `client/.env`:

```env
VITE_APP_BASE_URL=https://your-api-domain.com/api/v1
```

### 4. Create your first admin

Every new registration is created as a `STUDENT`. To get your first admin:

1. Register an account through the app.
2. In MongoDB (Atlas UI, Compass or `mongosh`), open the `lms` database → `users` collection and change that user's `role` to `"ADMIN"`.
3. Log in again. From then on, admins can promote other users from **Admin → Manage Users**.

---

## 🔐 Environment Variables

Defined in `server/.env` (see [`.env.sample`](./.env.sample) for full comments).

| Variable | Description |
|----------|-------------|
| `PORT` | Port the API runs on (default `5001`) |
| `CORS_ORIGIN` | Frontend origin allowed by CORS, e.g. `http://localhost:5173` |
| `CLIENT_URL` | Frontend base URL used to build password-reset links |
| `MONGODB_URI` | MongoDB connection string **without** a database name (the app appends `/lms`) |
| `ACCESS_TOKEN_SECRET` | Secret for signing access tokens |
| `ACCESS_TOKEN_EXPIRY` | Access token lifetime, e.g. `15m` |
| `REFRESH_TOKEN_SECRET` | Secret for signing refresh tokens (different from the access secret) |
| `REFRESH_TOKEN_EXPIRY` | Refresh token lifetime, e.g. `7d` |
| `GOOGLE_BOOKS_API_KEY` | Google Books API key for ISBN lookup |
| `SMTP_HOST` / `SMTP_PORT` | SMTP server and port (`587` STARTTLS, `465` SSL) |
| `SMTP_USER` / `SMTP_PASS` | SMTP credentials (use an app password where possible) |
| `SMTP_FROM` | Sender address for outgoing emails (falls back to `SMTP_USER`) |
| `CONTACT_RECEIVER_EMAIL` | Inbox that receives contact-form messages |

Generate strong secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 📜 Available Scripts

**Server** (`/server`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the API with nodemon |

**Client** (`/client`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Lint with Oxlint |

---

## 🔌 API Overview

Base URL: `/api/v1`  — 🔒 = login required, 🛡️ = admin only

### Users — `/users`
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/register`, `/login` | Public (rate limited) |
| POST | `/logout` | 🔒 |
| POST | `/refresh-token` | Public (uses refresh cookie) |
| POST | `/forgot-password`, `/reset-password/:token` | Public |
| POST | `/change-password` | 🔒 |
| GET | `/current-user` | 🔒 |
| PATCH | `/update-account` | 🔒 |
| GET | `/history` | 🔒 |
| GET | `/all-users`, `/search-students` | 🛡️ |
| PATCH | `/update-role` | 🛡️ |

### Books — `/books`
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/most-issued`, `/recently-added` | Public |
| GET | `/all-books`, `/search?q=`, `/category/:category`, `/book/:bookId` | 🔒 |
| GET | `/search/:isbn` (Google Books lookup) | 🛡️ |
| POST | `/add` | 🛡️ |
| PATCH | `/update/:bookId`, `/update-stock/:bookId` | 🛡️ |
| DELETE | `/delete/:bookId` | 🛡️ |

### Issues — `/issues`
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/issue-book` | 🛡️ |
| PATCH | `/return-book/:issueId`, `/renew-book/:issueId`, `/update-fine-status` | 🛡️ |
| GET | `/overdue-books` | 🛡️ |
| GET | `/my-active-issues`, `/my-history` | 🔒 |

### Dashboard — `/dashboard` (🛡️)
`GET /stats`, `GET /active-issues`, `GET /transactions`

### Contact — `/contact`
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/` | Public (rate limited) |
| GET | `/all`, `/:messageId` | 🛡️ |
| PATCH | `/:messageId/status` | 🛡️ |

List endpoints accept `?page=` and `?limit=` and return `{ data, metadata }` with pagination info.

---

## 📏 Library Rules (current defaults)

- Loan period: **14 days**
- Renewals: up to **2**, each extending the due date by **7 days** (overdue books can't be renewed)
- Borrowing limit: **3** books per user at a time, one copy of each title
- Fine: **₹50 per day** overdue, calculated on return
- Books currently issued can't be deleted

---

## 🛠️ Production Notes

- Uncomment `app.set('trust proxy', 1)` in `server/src/app.js` when deploying behind a reverse proxy, so rate limiting sees real client IPs.
- Cookies are set with `secure: true` and `sameSite: "strict"`, so serve the frontend and API over HTTPS (and ideally on the same site) in production.
- Set `CORS_ORIGIN` and `CLIENT_URL` to your deployed frontend URL, and `VITE_APP_BASE_URL` in the client build.

---

## 📄 License

ISC