# CST Zhabto

IT service requests for the ACM Club, College of Science and Technology.
Built with Next.js 14 (App Router) and SQLite.

## Pages

| Page | Who | What it does |
| --- | --- | --- |
| `/` | Students | Service menu with prices, request form, public queue of active requests |
| `/admin/login` | Club admin | Password sign-in |
| `/admin` | Club admin | Spreadsheet of every request: student details, status, cost, notes, confirmation |

## Run it

```bash
npm install
cp .env.example .env.local     # then set ADMIN_PASSWORD and AUTH_SECRET
npm run dev                    # http://localhost:3000
```

For production: `npm run build && npm start`.

## How requests work

1. A student picks a service and sends the form. The server validates it and calculates the price itself.
2. The request appears in the public queue as **Pending** (ticket code, service, first name, status only).
3. The admin changes it to **In progress** in the sheet and can edit the cost, meeting place, date and a private note.
4. The admin clicks **Confirm completed**. The request is then locked, removed from the public queue, and can only be seen and changed in `/admin`. **Reopen to edit** unlocks it again.

Students have no endpoint that can change a request. Every change goes through `PATCH /api/admin/requests/[id]`, which requires the admin cookie.

## Change prices or services

Edit `lib/services.js`. Prices there are used by the form and by the server.

## Notes for deployment

- SQLite stores data in `data/zhabto.db` (or `DB_PATH`). Host it somewhere with a persistent disk, such as a VPS or a college server. Serverless hosts like Vercel do not keep the file between requests.
- Set a strong `ADMIN_PASSWORD` and a random `AUTH_SECRET`. The login cookie lasts 8 hours.
- Back up the `data` folder regularly.

## Project layout

```
app/page.js                       public page
app/admin/page.js                 admin sheet (server-checks the login cookie)
app/admin/login/page.js           admin login form
app/api/requests/route.js         public: list active requests, create a request
app/api/admin/login|logout        admin session
app/api/admin/requests/           admin: list all, edit, confirm, reopen
components/Home.js                public page UI
components/AdminSheet.js          spreadsheet UI
lib/db.js  lib/auth.js  lib/services.js
```


## Updated ACM Zhabto features

- Blue/cyan visual theme inspired by the ACM logo; Zhabto remains orange in the brand treatment where applicable.
- ACM logo is available at `public/acm-logo.png`.
- Student request form focuses on full name, student ID, contact number, requested software, estimated cost, and preferred date.
- The student request list is filtered on the server using the submitted student ID and contact number; it does not show a public queue of everyone’s requests.
- Admin request sheet includes an editable **In-charge** column and includes it in CSV export.
- Students and admins can exchange messages in a request-specific chat. Accepted requests show an in-app acceptance notice and the assigned in-charge on the student view.

### Identity note

This version uses the student ID plus contact number as a lightweight ownership check, not a full authentication system. Before production deployment with real student data, add verified sign-in or an OTP flow, apply rate limiting, and use a persistent production database/hosting configuration.
