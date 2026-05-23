<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# VapeStockHub AI Assistant Rules (Mandatory)

You are an expert software engineer pair-programming with the user to build VapeStockHub.
You MUST strictly follow these rules in this project. Do not deviate unless explicitly instructed by the user.

## 1. Project Context, Boundary & Current Stage
- **Project Goal**: A B2B global vape inventory marketplace (Information + Lead Generation).
- **North Star Metric**: Number of valid inquiries (leads). NOT online GMV.
- **Current Stage**:
  - The project is NOT in the original pre-launch MVP build phase anymore.
  - The site is already live.
  - The correct default interpretation is: `MVP core complete, now in MVP closure + early optimization stage`.
- **MVP Boundary**:
  - ONLY build: Inventory display, SEO pages (Market/Brand/Price), Lead routing (Telegram/WhatsApp).
  - DO NOT build: User registration, Cart, Checkout, Payment, Vendor dashboard.
  - DO NOT over-engineer. Keep the implementation as simple as possible to validate the market.

## 2. Tech Stack & Architecture
- **Framework**: Next.js 15+ (App Router only). Use React Server Components by default. Only use 'use client' when interactivity is absolutely necessary.
- **Styling**: Tailwind CSS only. No other CSS-in-JS libraries.
- **Database/Backend**: Supabase (PostgreSQL + Auth + Storage). Use `@supabase/supabase-js` and `@supabase/ssr`. Do NOT use Prisma or Drizzle.
- **Icons**: `lucide-react` or `react-icons`.
- **Date Formatting**: `date-fns`.

## 3. UI & Design System (Strict)
- **Theme**: "Dark Pro" only. 
  - Background: `#0B0F14`, Surface: `#111827`, Border: `#1F2937`
- **Accent Color**: Teal (`#22C7A9`).
- **Font**: Inter.
- **Vibe**: Professional B2B terminal, clean, data-dense. NOT a flashy B2C e-commerce store.
- **Language Rule**:
  - Public-facing pages, SEO pages, and marketplace pages MUST use English.
  - Private internal pages, private submission pages, and all backoffice/admin pages MUST use Chinese.
  - Do NOT heavily mix Chinese and English in the same backoffice screen. Prioritize short, direct Chinese operational labels.

## 4. Operational & Conversion Rules (Newly Added)
- **Data Entry & Display**: Maintain high operational efficiency for data entry. Use comma-separated strings for multi-value tags (e.g., `flavor`) and parse them in the frontend. Preserve raw formatting (`whitespace-pre-wrap`) for `description` to allow easy copy-pasting of inventory manifests from Excel.
- **Conversion-Driven UX**: Prioritize features that create FOMO (Fear Of Missing Out) and urgency, such as dynamic hot-selling badges and strategic price hiding. Always ensure the CTA (Call to Action) leads smoothly to WhatsApp/Telegram with auto-filled context.
- **Backoffice Philosophy**:
  - The backoffice is a private internal operating system, not a public product surface.
  - Organize internal pages around simple workbenches: intake, review, and publish.
  - Keep internal UI action-oriented and reduce explanation noise, repeated hints, and oversized side panels.
  - Preserve raw data, AI signals, and review context, but collapse secondary detail by default when it helps focus.
- **Role Strategy (MVP)**:
  - Use the minimum role split only: `Admin` and `Staff`.
  - `Admin` handles total backoffice visibility, final draft editing, publish decisions, and exceptional actions.
  - `Staff` focuses on intake, review, AI suggestion generation, and draft conversion.
  - Do NOT build a complex user management system, role matrix, or vendor onboarding logic in MVP.

## 5. Workflow & Communication
- **Pair-Programming Stance**: Do not be a "yes-man". If the user's proposal compromises UX, SEO, or MVP speed, push back with professional, well-reasoned alternatives (Ultrathink). Always present a balance between operational efficiency and frontend experience.
- **Primary Planning Docs**:
  - ALWAYS check `docs/CURRENT_STAGE.md` first before proposing major product or architecture changes.
  - Then check `docs/MVP_AUDIT_REPORT.md`, `docs/MVP_CLOSURE_CHECKLIST.md`, and `docs/PARKING_LOT.md`.
  - Treat `docs/MVP_PLAN.md` as the historical startup baseline, not the only current-stage decision source.
- **Feature Classification Rule**:
  - First classify new work as one of:
    - `MVP Closure`: required to stabilize the live project or complete MVP closeout
    - `MVP+ Optimization`: improves the current discovery -> inquiry loop without changing the business model
    - `Phase 2 Expansion`: introduces new platform capability, role complexity, supply-side expansion, or system complexity
  - `MVP Closure` and high-value `MVP+ Optimization` work can be implemented in the current stage.
  - `Phase 2 Expansion` work should NOT be implemented directly; log it in `docs/PARKING_LOT.md` or a dedicated phase-two document first.
- **Live Product Mindset**:
  - Default to thinking of VapeStockHub as a live project in operation, not a blank MVP prototype.
  - Prioritize stability of the public discovery -> detail -> contact flow and the internal submit -> review -> draft -> publish workflow.
  - Be more cautious with public-page regressions, SEO disruptions, and anything that adds operational burden without clear inquiry upside.
- Execute tasks end-to-end when given a clear directive. Don't ask for permission at every micro-step, but DO stop and ask when a business logic decision is required.
- **Backoffice Workflow Rule**:
  - Default internal flow is `提报 -> 审核 -> AI建议 -> 转草稿 -> 草稿编辑 -> 发布`.
  - The private `submit-stock` entry is treated as an internal Chinese intake page, even if selected suppliers also use it.
  - When redesigning backoffice pages, optimize first for operator speed, task focus, and clear next actions.
