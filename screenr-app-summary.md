# Screenr — Executive Competency Assessment Platform

## Overview

Screenr is a web-based pre-screening tool built on the **Cognition Executive Competency Framework**. It evaluates candidates across 10 competencies derived from Founders Fund investment principles and Cognition-specific hiring signals. The platform supports both guest and authenticated flows, AI-powered scoring via Anthropic Claude, PDF report generation, and an admin dashboard for reviewing submissions.

**Live URL:** https://screenr.vercel.app

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | Turso (libSQL/SQLite) via Prisma ORM |
| Auth | NextAuth v5 (credentials provider) |
| AI Scoring | Anthropic Claude (claude-sonnet-4-20250514) |
| Email | Resend |
| PDF | jsPDF |
| Hosting | Vercel |
| Styling | Tailwind CSS (Cognition.ai dark theme) |

---

## Core Features

### 1. Competency Assessment (10 Competencies)

Each competency includes 3 open-ended questions and a 1-10 self-rating. Competencies are prioritized by category:

| Priority | Competencies |
|----------|-------------|
| **Critical** | Founder Mentality / Builder DNA, Intensity & Work Ethic, First-Principles / Contrarian Thinking |
| **High** | Technical Fluency (AI/Product), Enterprise Sales Execution, Cerebral Competitiveness |
| **Important** | Value Translation / Storytelling, Speed of Adaptation, Category Creation / Missionary Selling |
| **Nice to Have** | Talent Magnetism / Network |

The survey includes auto-save, a progress bar, and navigation between competencies.

### 2. Guest Flow (No Account Required)

- One-click "Get Started" button on the homepage
- Collects email at the end for results delivery
- Survey responses are stored with a unique assessment ID
- Results emailed as HTML summary + PDF attachment upon completion
- Includes spam folder reminder on the completion screen

### 3. Authenticated Flow

- Register with name, email, and password
- Login via credentials (NextAuth v5)
- Survey progress is saved and can be resumed
- On submission:
  - Average self-rating displayed immediately
  - Results emailed with PDF attachment
  - AI scoring runs asynchronously
  - AI scores appear on the completion page via polling (every 5 seconds, up to 2 minutes)
- **Edit & Resubmit** button allows logged-in users to revise and resubmit their assessment

### 4. AI-Powered Scoring (Anthropic Claude)

After submission, Claude analyzes the candidate's responses and assigns each competency a score from 1-10 with a rationale. The scoring uses this rubric:

| Score | Level | Meaning |
|-------|-------|---------|
| 9-10 | Exceptional | Best-in-class evidence |
| 7-8 | Strong | Clear, proven evidence with specific examples |
| 5-6 | Developing | Some evidence but gaps in depth or relevance |
| 3-4 | Emerging | Limited evidence, requires development |
| 1-2 | Gap | No meaningful evidence |

**How it works:**
- Competencies are split into two parallel batches of 5
- Each batch is scored by a separate Claude API call (runs concurrently)
- Results are merged and saved to the database
- The completion page polls for scores and displays them with color-coded labels
- Runs via Next.js `after()` callback so it doesn't block the submission response

### 5. PDF Report Generation

- Generated server-side using jsPDF
- Contains all responses, self-ratings, and competency details
- Available as:
  - Email attachment (sent automatically on submission)
  - Download button on the completion page
- Works for both guest and authenticated users

### 6. Admin Dashboard

- **URL:** /admin (accessible after logging in as admin)
- **Admin credentials:** admin@screenr.app / admin123
- Lists all submitted assessments with candidate name, email, submission date
- Individual assessment review page shows:
  - All responses organized by competency
  - Candidate's self-ratings
  - AI scores and rationales (if available)
  - Admin can add their own ratings and notes per competency

### 7. Email Delivery

- Powered by Resend API
- Sends HTML-formatted results summary
- Attaches PDF report
- Supports both guest (contactEmail) and authenticated (user email) flows
- Completion page includes "check your spam folder" notice

---

## Data Model

```
User
  - id, name, email, password, role (CANDIDATE | ADMIN)
  - Has many: Assessments, AdminRatings

Assessment
  - id, userId, status (DRAFT | SUBMITTED), contactEmail
  - Has many: Responses, SelfRatings, AdminRatings, AiScores

Response
  - assessmentId, competencyRank, questionIndex, answer
  - Unique on: (assessmentId, competencyRank, questionIndex)

SelfRating
  - assessmentId, competencyRank, rating (1-10)
  - Unique on: (assessmentId, competencyRank)

AiScore
  - assessmentId, competencyRank, score (1-10), rationale
  - Unique on: (assessmentId, competencyRank)

AdminRating
  - assessmentId, competencyRank, rating, notes, adminUserId
  - Unique on: (assessmentId, competencyRank, adminUserId)
```

---

## User Journeys

### Guest Candidate
```
Homepage → "Get Started" → Complete 10 competencies → Enter email → Submit
→ See average self-rating → AI scores load (polling) → Download PDF → Check email
```

### Registered Candidate
```
Homepage → Register/Login → Complete 10 competencies → Submit
→ See average self-rating → AI scores load (polling) → Download PDF → Check email
→ (Optional) Edit & Resubmit
```

### Admin Reviewer
```
Login (admin@screenr.app) → /admin → View submissions list → Click assessment
→ Review responses, self-ratings, AI scores → Add admin ratings & notes
```

---

## Key URLs

| Page | URL |
|------|-----|
| Homepage | / |
| Register | /register |
| Login | /login |
| Survey | /survey |
| Guest Survey | /survey/guest/[id] |
| Completion | /survey/complete |
| Admin Dashboard | /admin |
| Admin Review | /admin/responses/[id] |

---

## Environment Variables (Vercel)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Turso database URL |
| `DATABASE_AUTH_TOKEN` | Turso auth token |
| `AUTH_SECRET` | NextAuth session encryption key |
| `NEXTAUTH_URL` | App URL (https://screenr.vercel.app) |
| `ANTHROPIC_API_KEY` | Claude API key for AI scoring |
| `RESEND_API_KEY` | Resend API key for email delivery |
| `RESEND_FROM_EMAIL` | Sender email address |

---

## Pull Request History

| PR | Description |
|----|-------------|
| #1 | Full app: 10-competency survey, auth, admin dashboard |
| #2 | Bug fixes: seed hash, submit error handling, validation |
| #3 | DATABASE_URL fallback for Vercel build |
| #4 | Vercel runtime fix (serverExternalPackages) |
| #5 | Error handling for survey loading |
| #8 | Remove temporary debug endpoint |
| #9 | Cognition.ai brand colors and dark theme |
| #11 | Logo: acumen_logo.png in navbar |
| #12 | Guest survey flow with email delivery |
| #13 | Homepage spacing improvements |
| #14 | Spam folder notice on completion screen |
| #15 | Logo resize (25% smaller) |
| #16 | PDF generation (email attachment + download) |
| #17 | Email + PDF for authenticated users, average rating display |
| #18 | AI-powered scoring with Anthropic Claude |
| #19 | Edit & Resubmit button for logged-in users |
| #20 | AI scores display on completion page with polling |
| #21 | Fix: retry logic + deduplication for incomplete AI scores |
| #22 | Fix: parallel batch scoring for reliable 10/10 results |
