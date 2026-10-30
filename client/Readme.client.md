# 📚 BookStore — Client

React frontend for the BookStore library management system. Students browse and track books; admins manage inventory, issues, users and fines through a dashboard.

## 🧰 Tech Stack

React 19 · Vite · React Router 7 · Tailwind CSS 4 · Axios · react-hot-toast · lucide-react · Oxlint

## ✨ Features

### Students
- Register, log in, stay signed in (JWT in HTTP-only cookies, auto refresh via Axios interceptor)
- Browse, search (title / author / ISBN) and filter by category
- Book details page with live availability
- **My Books** — active issues with due-date status, plus paginated history with fines
- Profile & settings (update name, change password), forgot/reset password
- Light / dark theme, responsive layout
- Contact, About, Privacy and Terms pages

### Admins
- **Overview** — totals, active/overdue issues, fines, low-stock books
- **Book Stock** — add (ISBN lookup or manual), edit, adjust stock, delete
- **Active Issues** — issue, renew and return books
- **Transactions** — full history, mark fines paid/unpaid
- **Manage Users** — search students, promote/demote between `STUDENT` and `ADMIN`

## ✅ Prerequisites

- Node.js v20.19+ (or v22.12+) and npm
- The [server](../server/README.md) running (default `http://localhost:5001`)

## 🚀 Getting Started

```bash
cd client
npm install
npm run dev        # http://localhost:5173
```

If your API is not at `http://localhost:5001/api/v1`, create `client/.env`:

```env
VITE_APP_BASE_URL=https://your-api-domain.com/api/v1
```

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Lint with Oxlint |

## 📁 Structure

```
client/
├── public/
├── vercel.json            # /api rewrite to backend + SPA fallback
└── src/
    ├── api/               # Axios instance + refresh-token interceptor
    ├── components/        # layout, admin, common (Modal, ConfirmDialog...), cards
    ├── context/           # AuthContext, ThemeContext
    ├── pages/             # public, user, admin, books, company
    ├── routes/            # ProtectedRoute, AdminRoute
    ├── services/          # API service functions
    ├── utils/
    └── main.jsx           # router + providers
```

## 🗺️ Routes

| Path | Access |
|------|--------|
| `/`, `/login`, `/register`, `/forgot-password`, `/reset-password/:token` | Public |
| `/contact`, `/about-us`, `/privacy`, `/terms` | Public |
| `/get-books`, `/books/:bookId`, `/my-books`, `/profile` | Login required |
| `/admin/overview`, `/admin/books`, `/admin/users`, `/admin/issues`, `/admin/transactions` | Admin only |

## 🔐 Auth Notes

- Tokens live in HTTP-only cookies; the client never reads them. `AuthContext` calls `/users/current-user` on load to restore the session.
- On a 401, the Axios interceptor calls `/users/refresh-token` once and retries the original request.
- Because cookies are `secure` and `sameSite: "strict"`, the app and API must be served over HTTPS in production (the included `vercel.json` rewrites `/api/*` to the backend so both appear same-site).

## 🚢 Deployment (Vercel)

1. Set the project root to `client/`.
2. Update the `destination` in `vercel.json` to your backend URL.
3. Build command `npm run build`, output directory `dist`.