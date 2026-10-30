# 📚 BookStore — Server

Express + MongoDB REST API for the BookStore library management system.

## 🧰 Tech Stack

Node.js · Express 5 · Mongoose · Zod · JWT · bcrypt · express-rate-limit · Brevo (transactional email) · Google Books API

## ✨ Highlights

- Role-based access control (RBAC) middleware
- ACID transactions with MongoDB sessions and atomic operations
- JWT rotation (access + refresh tokens) in HTTP-only secure cookies
- Zod validation for all client input
- Reusable pagination utility
- Aggregation pipelines for the admin dashboard
- Centralised error and response handling
- Rate limiting on auth and contact endpoints

## ✅ Prerequisites

- Node.js v20.19+ (or v22.12+) and npm
- MongoDB as a **replica set** (Atlas free tier works). Issue/return and stock updates use transactions, so a standalone `mongod` will fail.
- A Google Books API key (admin ISBN lookup)
- A Brevo account + API key (contact and password-reset emails)

## 🚀 Getting Started

```bash
cd server
npm install
cp ../.env.sample .env     # fill in the values below
npm run dev                # http://localhost:5001 (nodemon)
```

Production: `npm start`.

### Create your first admin

Every registration is a `STUDENT`. To get the first admin:

1. Register through the app.
2. In MongoDB, open the `lms` database → `users` and set that user's `role` to `"ADMIN"`.
3. Log in again. Admins can then promote others from **Admin → Manage Users**.

## 🔐 Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default `5001`) |
| `CORS_ORIGIN` | Frontend origin allowed by CORS, e.g. `http://localhost:5173` |
| `CLIENT_URL` | Frontend base URL used to build password-reset links |
| `MONGODB_URI` | Connection string **without** a database name (the app appends `/lms`) |
| `ACCESS_TOKEN_SECRET` / `ACCESS_TOKEN_EXPIRY` | Access token secret and lifetime (e.g. `15m`) |
| `REFRESH_TOKEN_SECRET` / `REFRESH_TOKEN_EXPIRY` | Refresh token secret (different from access) and lifetime (e.g. `7d`) |
| `GOOGLE_BOOKS_API_KEY` | Google Books API key for ISBN lookup |
| `BREVO_API_KEY` | Brevo API key for sending email |
| `EMAIL_FROM` | Verified sender address in Brevo |
| `CONTACT_RECEIVER_EMAIL` | Inbox that receives contact-form messages |

Generate strong secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

> Never commit `.env`. Keep real secrets in your host's environment variables.

## 📁 Structure

```
server/src/
├── controllers/    # user, book, issue, dashboard, contact
├── db/             # MongoDB connection
├── middleware/     # auth (JWT + roles), validate (Zod), rate limiter
├── models/         # User, Book, Issue, Contact
├── routes/
├── schemas/        # Zod schemas
├── utils/          # apiError, apiResponse, asyncHandler, paginate, sendEmail
├── app.js
└── server.js
```

## 🔌 API Overview

Base URL: `/api/v1` — 🔒 = login required, 🛡️ = admin only

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

### Response shape

```json
{ "status": 200, "data": {}, "message": "Success", "success": true }
```
Errors: `{ "success": false, "message": "..." }` (validation errors also include an `errors[]` array of `{ field, message }`).

## 📏 Library Rules (current defaults)

- Loan period: **14 days**
- Renewals: up to **2**, each +**7 days** (overdue books can't be renewed)
- Borrowing limit: **3** books per user, one copy per title
- Fine: **₹50 per day** overdue, calculated on return
- Books currently issued can't be deleted

## 🛠️ Production Notes

- `trust proxy` is set in `app.js` so rate limiting sees real client IPs behind a reverse proxy; adjust the hop count to match your host.
- Cookies use `secure: true` and `sameSite: "strict"`, so serve over HTTPS (ideally same-site with the frontend).
- Set `CORS_ORIGIN` and `CLIENT_URL` to the deployed frontend URL.