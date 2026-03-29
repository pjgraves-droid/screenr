# Testing Screenr App

## Overview
Screenr is a Next.js competency assessment app with auth (NextAuth v5), SQLite/Turso database, and admin dashboard.

## Local Dev Setup
```bash
cd /home/ubuntu/repos/screenr
npm install
npm run dev
# App runs on http://localhost:3000
```

If port 3000 is busy, kill existing processes first:
```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null
```

## Test Accounts
- **Admin**: admin@screenr.app / admin123
- **Candidate**: Register a new account via /register

## Key Routes to Test
| Route | Description | Auth Required |
|-------|-------------|---------------|
| / | Homepage with competency cards and scoring guide | No |
| /login | Login form | No |
| /register | Registration form | No |
| /survey | Competency assessment survey (30 questions) | Yes (candidate) |
| /survey/complete | Post-submission success page | Yes |
| /admin | Admin dashboard with submissions table | Yes (admin) |
| /admin/responses/[id] | Individual response detail with admin rating | Yes (admin) |

## Visual Testing Checklist
When testing UI styling changes:
1. Check all routes listed above
2. Verify dark/light theme consistency across pages
3. Check form inputs are visible and distinguishable from backgrounds
4. Verify text contrast (especially on dark backgrounds)
5. Check category badge colors (Critical=red, High=orange, Important=blue, Nice to Have=purple)
6. Verify scoring guide table colors match rating levels
7. Check admin dashboard rating badges use appropriate colors
8. Verify interactive elements (buttons, links) have visible hover/focus states

## Browser Setup
Chrome may need to be launched manually:
```bash
/opt/.devin/chrome/chrome/linux-133.0.6943.126/chrome-linux64/chrome --no-sandbox --remote-debugging-port=29229 http://localhost:3000 &
```
The `google-chrome` wrapper script connects to an existing Chrome instance via CDP on port 29229. If Chrome is already running, just use the wrapper.

## Vercel Deployment
- Production: https://screenr.vercel.app
- Preview URLs generated per-branch by Vercel
- Database: Turso (libsql) — tables must be created manually via Turso shell
- Required env vars: DATABASE_URL, DATABASE_AUTH_TOKEN, AUTH_SECRET, NEXTAUTH_URL

## Common Issues
- If survey page shows "Loading assessment..." forever, check that all 5 database tables exist (User, Assessment, Response, SelfRating, AdminRating)
- If login fails silently, check AUTH_SECRET env var is set
- Port conflicts: kill existing processes on port 3000 before starting dev server
- Chrome launch failures: use the full binary path, not the wrapper script

## Devin Secrets Needed
No secrets required for local testing. For production Vercel deployment testing, the following would be needed:
- TURSO_DATABASE_URL
- TURSO_AUTH_TOKEN
