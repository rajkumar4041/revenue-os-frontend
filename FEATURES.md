# RevenueOS — Feature List

A modern, NetSuite-style platform for running a services company end to end —
**onboard → win work → deliver → log time → bill → collect → offboard** — with a
clean UI and a few features that go beyond the incumbents.

Legend: ✅ shipped · 🟡 in progress · ⬜ planned

---

## Platform & Access
- ✅ Company self-registration (multi-tenant; each company's data isolated)
- ✅ JWT authentication — access + rotating refresh tokens, silent refresh
- ✅ Login, logout, forgot/reset password, current-user (`/me`)
- ✅ Dynamic RBAC — permissions → roles → users, enforced on every endpoint
- ✅ Default roles per company (Company Admin, Manager, Sales, Account Manager, Employee, Finance)
- ✅ Custom roles with granular permission assignment
- ✅ User management (invite, edit, assign roles)
- ✅ Organization settings
- ✅ Tenant isolation — org id taken from the token, never trusted from the client
- ✅ Audit log + global activity timeline
- ✅ Transactional email (password reset, welcome) via SMTP
- ⬜ In-app notifications

## People / HR
- ✅ Departments (create, edit, delete)
- ✅ Employees with HR profile (designation, employment type, cost & billable rates)
- ✅ Onboarding → offboarding lifecycle (ONBOARDING · ACTIVE · ON_LEAVE · OFFBOARDING · OFFBOARDED)
- ✅ Offboarding stamps the end date and removes from active roster

## CRM
- ✅ Clients (full CRM record: company, industry, contacts, contract terms, account manager)
- ✅ Client search, status, archive
- ✅ Leads (CRUD + convert to opportunity)
- ✅ Opportunities / sales pipeline (stage board, move stage)
- ✅ Won-deal → client handover workflow

## Projects & Delivery
- ✅ Projects (code, client, manager, members, budget, billing type, status, priority)
- ✅ Tasks (assignee, priority, status, estimated hours, due dates)
- ✅ Task filtering by project/status and inline status changes
- ⬜ Milestones
- ⬜ Project profitability (revenue − labour cost − expenses)

## Time Tracking
- ✅ Weekly timesheets (draft → submitted → approved/rejected)
- ✅ Manual time entries (project, task, hours, billable flag, description)
- ✅ **Live work timer** — start/stop, one running timer per user, auto-computes hours
- ✅ Timesheet submit → manager approve/reject with notes
- 🟡 Billable vs non-billable hour rollups (per timesheet done; org-wide analytics planned)

## Billing & Finance
- ⬜ Contracts (fixed / hourly / retainer / recurring)
- ✅ Invoices (line items, draft → sent → partially/paid, void)
- ✅ Payments & collection tracking
- ✅ Expenses & project costs (with approval)
- ✅ Invoiced vs collected vs outstanding (kept strictly separate)

## Analytics & Reporting
- ✅ Dashboard with live metric cards (clients, projects, tasks, team) + task completion
- ✅ Revenue summary + invoiced-vs-collected chart (Recharts)
- 🟡 Executive / manager / employee role dashboards
- ⬜ Reports with CSV / Excel / PDF export

## Unique / modern touches
- ✅ Live work timer with real-time elapsed display
- ✅ Dark mode with a refined neutral + indigo theme
- ✅ Fully type-safe, auto-generated API client + hooks (OpenAPI → Kubb)
- ✅ ⌘K command palette — keyboard-driven navigation + quick actions
- ✅ Smart approvals inbox — timesheets + expenses in one place with bulk actions
- ✅ Global activity timeline backed by the audit log
- ⬜ Saved views + inline filters across tables

---

## Tech stack
**Backend:** Java 21, Spring Boot 3, Spring Security + JWT, Spring Data JPA,
PostgreSQL, Flyway, MapStruct, Lombok, springdoc/OpenAPI, JUnit 5.
**Frontend:** React 18, TypeScript, Vite, Tailwind + shadcn/ui, TanStack Query,
`redux-toolkit-state`, React Router, React Hook Form + Zod; API client & hooks
generated with Kubb from the backend's OpenAPI document.
