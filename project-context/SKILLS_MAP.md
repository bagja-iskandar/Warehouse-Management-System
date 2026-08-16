# Skill Library Mapping — Warehouse Management System

Dokumen ini memetakan keahlian (*skill suite*) yang diaktifkan untuk memandu perancangan, pengembangan, pengujian, dan pemeliharaan Warehouse Management System (WMS) sesuai standar industri dan best practices.

---

## 1. Matrix Pemetaan Skill per Domain & Siklus Hidup

| Domain | Skill Identifier | Peran Utama & Tanggung Jawab | Status Aktivasi |
| :--- | :--- | :--- | :---: |
| **Requirements & Business** | `business-analyst` | Validasi requirement SRS, use-case traceability, perancangan matriks fungsional, dan identifikasi KPI operasional. | **Active** |
| **Architecture & Governance** | `architect-review`<br>`architecture-patterns`<br>`architecture-decision-records`<br>`context-driven-development` | Evaluasi integritas arsitektur, dokumentasi ADR, pemisahan bounded context (Admin, Customer, Driver), dan pencegahan code smell. | **Active** |
| **Frontend Core & App Router** | `frontend-developer`<br>`nextjs-app-router-patterns`<br>`react-modernization` | Implementasi Next.js 15 App Router, React Server Components (RSC), Client Components, Error Boundaries, dan Suspense. | **Active (Phase 1+)** |
| **Design System & UI/UX** | `tailwind-design-system`<br>`ui-ux-designer`<br>`ui-visual-validator`<br>`accessibility-compliance-accessibility-audit` | Standardisasi design tokens (WMS dark/light theme), integrasi shadcn/ui, micro-interactions, responsivitas multi-device, dan audit WCAG AA. | **Active (Phase 1+)** |
| **Type Safety & Domain Model** | `typescript-pro`<br>`typescript-advanced-types` | Strict typing domain models (Warehouse, Slots, Goods, Orders, Invoices, Vehicles), Zod schemas, dan type-safe contracts. | **Active (Phase 1+)** |
| **State Management & Caching** | `react-state-management` | Manajemen server-state dengan TanStack Query v5, query key factories, optimistic updates, dan lightweight client store (Zustand). | **Active (Phase 1+)** |
| **API Abstraction & Mock Engine** | `api-design-principles`<br>`api-documenter`<br>`api-testing-observability-api-mock` | Desain kontrak REST API terstruktur, in-memory stateful mock engine, dan adapter layer tanpa hardcoded logic di komponen UI. | **Active (Phase 1+)** |
| **Code Quality & Refactoring** | `code-review-excellence`<br>`codebase-cleanup-refactor-clean`<br>`legacy-modernizer`<br>`code-refactoring-tech-debt` | Review berkala, penjagaan modularitas komponen, low cognitive complexity, dan pembersihan technical debt. | **Active** |
| **Testing & Quality Assurance** | `unit-testing-test-generate`<br>`javascript-testing-patterns`<br>`e2e-testing-patterns`<br>`test-automator` | Pengujian unit (kalkulator sewa, validasi Zod, form), component testing, dan E2E critical path (Customer sewa -> Driver dispatch -> POD). | **Scheduled (Phase 7)** |
| **Security & RBAC** | `auth-implementation-patterns`<br>`frontend-security-coder`<br>`security-auditor` | Simulasi Role-Based Access Control granular (Admin, Customer, Driver), middleware route guard, sanitasi input XSS, dan token handling. | **Active (Phase 2+)** |
| **Backend & Database** | `backend-architect`<br>`postgresql`<br>`sql-pro`<br>`database-migrations-sql-migrations` | Transisi ke backend relasional permanen (PostgreSQL/Prisma), indexing optimasi query, dan API gateway. | **Scheduled (Phase 8)** |
| **Billing & Payments** | `payment-integration`<br>`stripe-integration`<br>`pci-compliance` | Logika penagihan bulanan (subscription), perhitungan denda keterlambatan (*late penalty*), upload bukti transfer, dan gateway readiness. | **Scheduled (Phase 6)** |
| **Performance & DevOps** | `application-performance-performance-optimization`<br>`deployment-engineer`<br>`cicd-automation-workflow-automate` | Core Web Vitals optimization, bundle size analysis, CI/CD pipeline (GitHub Actions), dan containerized deployment. | **Scheduled (Phase 9)** |

---

## 2. Standar Prosedur Penggunaan Skill
1. **Context-Driven:** Setiap keputusan teknis dan fitur merujuk pada SRS dan ADR yang telah disetujui PM.
2. **Strict Typing:** Seluruh kode TypeScript wajib bebas dari `any` implisit maupun eksplisit tanpa justifikasi teknis kuat.
3. **Component Isolation:** Komponen UI murni (*dumb components*) terpisah dari hooks dan service fetching (*smart containers*).
