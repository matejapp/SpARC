# SpARC

**Personal finance tracker for iPhone.** Record what comes in and what goes out, never miss a
recurring bill, see where the money actually went — and photograph a receipt instead of
typing it.

**Sp**ending · **A**nalytics · **R**ecurring · **C**apture

<!-- Screenshot: hero image — dashboard on an iPhone frame -->
![SpARC dashboard](docs-assets/screenshots/hero.png)

---

## Contents

- [Screenshots](#screenshots)
- [What SpARC does](#what-sparc-does)
- [Features](#features)
- [How money is handled](#how-money-is-handled)
- [Security](#security)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Data model](#data-model)
- [API](#api)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Deliberately out of scope](#deliberately-out-of-scope)
- [About the project](#about-the-project)

---

## Screenshots

| | | |
|---|---|---|
| <!-- Screenshot: sign in --> ![Sign in](docs-assets/screenshots/sign-in.png) | <!-- Screenshot: dashboard --> ![Dashboard](docs-assets/screenshots/dashboard.png) | <!-- Screenshot: transaction list --> ![Transactions](docs-assets/screenshots/transactions.png) |
| **Sign in** | **Dashboard** | **Transactions** |
| <!-- Screenshot: add transaction --> ![Add transaction](docs-assets/screenshots/add-transaction.png) | <!-- Screenshot: filters --> ![Filters](docs-assets/screenshots/filters.png) | <!-- Screenshot: analytics charts --> ![Analytics](docs-assets/screenshots/analytics.png) |
| **Add a transaction** | **Filters** | **Analytics** |
| <!-- Screenshot: bills calendar --> ![Bills calendar](docs-assets/screenshots/calendar.png) | <!-- Screenshot: bill reminder notification --> ![Reminder](docs-assets/screenshots/reminder.png) | <!-- Screenshot: receipt review --> ![Receipt capture](docs-assets/screenshots/receipt.png) |
| **Bills calendar** | **Reminder** | **Receipt capture** |

---

## What SpARC does

SpARC is built for one person tracking their own money on their own phone. It makes three
promises, in this order:

1. **Recording a transaction is fast enough that you actually do it.** A few taps, or a photo
   of the receipt.
2. **Recurring bills are never forgotten.** Rent, utilities and subscriptions appear on a
   calendar and remind you before they are due.
3. **The dashboard answers "where did my money go"** without you doing arithmetic — in the
   currency you think in.

It is not a budgeting advisor, a bank aggregator or a shared household ledger. Every record
belongs to exactly one account and is visible to no one else.

---

## Features

### Accounts
- Register with username, email and password, and choose a preferred display currency
- Email verification, with resend if the link doesn't arrive
- Sign in with email or username; stay signed in across app restarts
- Forgot password → reset by email
- Sign out everywhere it matters — the session is revoked on the server, not just cleared on the phone

### Transactions
- Add income or an expense: amount, currency, date, category, optional description
- Edit and delete (deleting always asks for confirmation)
- Validation errors are shown per field before anything is saved
- A new transaction appears immediately in the list and on the dashboard

### Browsing
- Transaction list, newest first, with paging as you scroll and pull to refresh
- Transaction detail view
- Filter by type, date range, category and currency — and clear them all in one action

### Dashboard and analytics
- Total income, total expense and what's left, for any period
- Trend chart of income vs expense over time
- Spending broken down by category
- Upcoming unpaid bills at a glance
- A friendly empty state for a brand-new account

### Categories
- A built-in set of income and expense categories, shared by every account and protected
  from changes
- Your own categories on top; delete one and its transactions are kept, uncategorised

### Recurring bills
- Add a bill with name, amount, currency, category and due date, repeating monthly
- Calendar of upcoming due dates; open any date to see what's due and its status
- Mark one month as paid — SpARC records the expense for you, exactly once
- Each month stands alone: paying October doesn't touch November
- Edit a bill and only future months change; delete it and its future due dates go with it,
  while paid history stays

### Reminders
- A local notification 5 days before an unpaid bill is due, and again 24 hours before
- Tapping a reminder opens that bill
- Reminders stop as soon as the bill is marked paid
- Notifications are optional: deny the permission and the calendar still works

### Multiple currencies
- Enter transactions in **RSD, EUR or USD**
- The exchange rate is frozen at the moment of entry
- Totals and charts appear in your preferred currency — change it any time without altering
  a single stored record

### Receipt capture
- Photograph a receipt right after a purchase
- SpARC suggests the date, total, store name and a category
- Review and correct everything before saving — nothing is stored without your confirmation
- Retake an unreadable photo, or fall back to manual entry with a clear explanation
- Manual entry works in full even if camera access is denied

### Sync
- All data is tied to the account and available after signing in again or on a second device
- A clear message when a save fails for lack of connection

---

## How money is handled

Finance apps lose trust when numbers drift. SpARC is built so they can't.

- **Exact arithmetic.** Amounts are `decimal` in C# and `numeric(18,2)` in PostgreSQL —
  never floating point, anywhere.
- **Money never loses its origin.** Every transaction keeps the amount and currency it was
  entered in.
- **RSD is the pivot currency.** Each transaction also stores its rate to RSD and its RSD
  value, both frozen at entry time and never recalculated.
- **History never changes.** A rate that moves next week cannot change last month's totals,
  and switching your preferred currency rewrites zero rows — it only changes what is shown.
- **One sum, one conversion.** Every total is a sum of RSD values, converted once for display.
- **A payment is counted exactly once.** A paid bill creates one expense linked to that
  month's occurrence, and a unique index in the database makes a second one impossible.

---

## Security

The main risk in a finance app is one user reading another user's money. SpARC treats that
as the one rule that cannot break.

- **Ownership on every query.** The user id comes only from the signed JWT, never from the
  request body, query or route. Every query is filtered by it, and every single-record read
  or write checks ownership first.
- **Someone else's record is a 404, not a 403** — a 403 would confirm the record exists.
- **Authorized by default.** Every endpoint requires a valid token unless it is explicitly
  public (register, sign in, refresh, email verification, password reset).
- **Passwords** are handled only by ASP.NET Core Identity's hasher. Passwords, tokens and
  reset links are never logged.
- **Tokens:** a short-lived access token plus a refresh token that rotates on every use and
  is stored hashed on the server. Reusing an old refresh token invalidates the chain.
- **On the phone** both tokens live in the iOS keychain via `expo-secure-store` — never in
  plain-text storage.
- **Rate limiting** on sign in, registration and password reset.
- **No information leaks in errors.** Every failure is returned as RFC 9457
  `ProblemDetails` with a trace id; stack traces, EF messages and SQL never reach the client.
- **Database-level guarantees**: unique email, unique username and one-expense-per-bill are
  enforced by unique indexes, not only by application code.
- **Secrets** live in user-secrets during development and environment variables when
  deployed — never in the repository.

---

## Architecture

```
┌─────────────────┐      HTTPS / JSON      ┌──────────────────────┐
│   SpARC app     │ ─────────────────────► │   SpARC API          │
│   Expo, iOS     │ ◄───────────────────── │   ASP.NET Core 10    │
│   TypeScript    │     JWT in header      │   Controllers        │
└─────────────────┘                        │   Services           │
                                           │   Repositories       │
                                           └──────┬───────┬───────┘
                                    EF Core/Npgsql│       │HTTP
                                                  ▼       ▼
                             ┌──────────────────────┐   ┌──────────────────────┐
                             │  PostgreSQL (Neon)   │   │  Receipt service     │
                             └──────────────────────┘   │  Python, OCR         │
                                                        └──────────────────────┘
```

- **The app never talks to the database** and never holds a database credential. All
  business rules live in the API, because the client is the one thing an attacker controls.
- **The API is strictly layered:** Controller → Service → Repository → EF Core. Controllers
  handle HTTP only and exchange DTOs; entities never cross the API boundary.
- **One error path:** services throw typed exceptions; a single global handler turns every
  failure into `ProblemDetails`.
- **Receipt parsing** runs in a separate Python service, because that ecosystem is where the
  OCR and vision models are. The API calls it; the app never does.

<!-- Screenshot (optional): architecture diagram -->

---

## Tech stack

| Part | Technology |
|---|---|
| Mobile app | React Native with Expo, TypeScript, expo-router, TanStack Query |
| On-device storage | `expo-secure-store` (tokens) |
| Device features | Local notifications, camera |
| API | ASP.NET Core 10 Web API (controllers) |
| Data access | Entity Framework Core 10 + Npgsql |
| Database | PostgreSQL on Neon |
| Auth | ASP.NET Core Identity + JWT access and rotating refresh tokens |
| Receipt service | Python (separate repository) |
| Exchange rates | Daily rates from a public FX API, cached, with fallback to the last known rate |
| Hosting | API in a container behind a TLS reverse proxy on a Proxmox VE homelab |

---

## Data model

| Table | Purpose |
|---|---|
| `AspNetUsers` | Identity users, extended with the preferred display currency |
| `Categories` | Shared system categories (`UserId` NULL) plus each user's own |
| `Transactions` | Amount + currency as entered, rate to RSD and RSD value frozen at entry, date, category, optional link to a paid bill |
| `RecurringBills` | A bill's current name, amount, currency, category, first due date and interval |
| `BillOccurrences` | One row per bill per month, with its own status and the amount at due — so editing a bill never rewrites the past |
| `FxRates` | One rate per currency per day |
| `RefreshTokens` | Hashed refresh tokens with expiry and rotation chain |

All timestamps are stored in UTC (`timestamptz`); calendar dates such as a transaction's day
or a bill's due date are stored as `date`. Every schema change is an EF Core migration.

---

## API

All endpoints are under `/api` and require `Authorization: Bearer <token>` unless marked
public. Errors are always `ProblemDetails`.

| Area | Endpoint | |
|---|---|---|
| Auth | `POST /api/auth/register` | public |
| | `POST /api/auth/login` | public |
| | `POST /api/auth/refresh` | public |
| | `POST /api/auth/logout` | |
| | `POST /api/auth/verify-email`, `POST /api/auth/resend-verification` | public |
| | `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` | public |
| Account | `GET /api/users/me`, `PUT /api/users/me` | preferred currency |
| Categories | `GET /api/categories`, `POST /api/categories`, `DELETE /api/categories/{id}` | |
| Transactions | `GET /api/transactions` | paged; filter by type, date range, category, currency |
| | `POST /api/transactions` | |
| | `GET`, `PUT`, `DELETE /api/transactions/{id}` | |
| Dashboard | `GET /api/dashboard/summary?from=&to=` | income, expense, difference |
| | `GET /api/dashboard/trend`, `GET /api/dashboard/by-category` | |
| Bills | `GET /api/bills`, `POST /api/bills` | |
| | `PUT`, `DELETE /api/bills/{id}` | |
| | `GET /api/bills/occurrences?from=&to=` | calendar |
| | `POST /api/bills/occurrences/{id}/pay` | creates exactly one expense |
| Receipts | `POST /api/receipts/scan` | returns suggestions only — nothing is saved |
| Health | `GET /health` | public; checks the database |

Example error:

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.5",
  "title": "Not found.",
  "status": 404,
  "detail": "Transaction was not found.",
  "traceId": "00-c886ba392a44861bd26e460956656f59-972e2afc7b721aec-00"
}
```

---

## Project structure

```
sparc/
  api/
    Sparc.slnx
    Sparc.Api/
      Controllers/      thin, HTTP only; all inherit BaseController ([Authorize] by default)
      Services/         business rules — the only place they live
      Repositories/     EF queries, always filtered by the current user
      Models/           EF entities, mapped with attributes
        Types/          enums
      Dto/              request and response shapes
      Validators/       request validation
      Common/           exception types services throw
      Middleware/       global exception handler → ProblemDetails
      Data/             DbContext, seed data, health check
      Migrations/       EF Core migrations
  app/
    app/                expo-router screens
      (auth)/           sign in, register, verify, reset
      (tabs)/           dashboard, transactions, calendar, settings
    components/
    api/                typed API client, one file per resource
    hooks/
    lib/                money and date formatting, secure storage
    types/
  dotnet-tools.json     pinned dotnet-ef
```

---

## Getting started

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) LTS
- A PostgreSQL database — a free [Neon](https://neon.tech) project works
- An iPhone with [Expo Go](https://expo.dev/go), or an EAS development build for camera
  features

### API

```powershell
git clone <repository-url> sparc
cd sparc
dotnet tool restore

# Connection string in Npgsql key=value form (Neon's ".NET" option), not a postgresql:// URL
dotnet user-secrets set "ConnectionStrings:Sparc" "Host=<host>;Database=<db>;Username=<user>;Password=<password>;SSL Mode=VerifyFull;Channel Binding=Require" --project api/Sparc.Api
dotnet user-secrets set "Jwt:SigningKey" "<at least 32 random bytes, base64>" --project api/Sparc.Api

# Create the schema and seed the system categories
$env:ASPNETCORE_ENVIRONMENT = "Development"
dotnet ef database update --project api/Sparc.Api

dotnet run --project api/Sparc.Api
```

Open `http://localhost:5263/health` — `Healthy` means the API is up and reaching the database.

<!-- Placeholder: email (SMTP) and receipt-service settings, once finalised -->

### App

```powershell
cd app
npm install
```

Create `app/.env` (it is git-ignored). The phone's `localhost` is the phone, so point it at
your PC's LAN address:

```
EXPO_PUBLIC_API_URL=https://<your-pc-lan-ip>:<port>
```

```powershell
npx expo start
```

Scan the QR code with the iPhone camera to open the app in Expo Go. Allow the API port
through the Windows firewall, and serve the API over HTTPS with a certificate the phone
trusts — iOS blocks plain HTTP.

### Receipt service

The receipt service lives in its own repository: <!-- Placeholder: link to the receipt service repository -->

---

## Deliberately out of scope

- Connecting to banks or importing transactions automatically
- Paying bills through the app
- Parsing every line item of a receipt (only date, total and store)
- Offline mode — the app needs a connection
- Shared or household accounts
- Budgets, savings goals or financial advice
- Currencies beyond RSD, EUR and USD
- Export to PDF or Excel

---

## About the project

SpARC was built as the course project for *Програмирање апликација за мобилне уређаје*
(Mobile Application Programming) at MEF, Belgrade.

<!-- Placeholder: author, year, license -->
