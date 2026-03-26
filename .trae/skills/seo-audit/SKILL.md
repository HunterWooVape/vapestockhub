---
name: "seo-audit"
description: "Audits the current inventory database and Next.js routes for SEO compliance. Invoke when user wants to check SEO health before launching or adding traffic."
---

# SEO Audit Skill

## Purpose
To automatically scan the current state of the VapeStockHub project (both the codebase routing and the Supabase inventory data) to ensure all SEO best practices and anti-pollution rules are functioning correctly before driving traffic.

## Trigger Scenarios
- User says "run seo audit" or "check seo".
- User says "I'm ready to launch, check if everything is ok for Google".
- User wants to verify if the "noindex" threshold rules are working.

## Execution Steps

When invoked, the AI must perform the following checks using available tools (Read, SearchCodebase, or writing a temporary Node.js script to query the database if necessary):

1. **Check Sitemap & Robots.txt**:
   - Verify `src/app/sitemap.ts` and `src/app/robots.ts` exist.
   - Ensure `robots.txt` is blocking `/admin/` and `/go/` (tracking links).

2. **Verify Anti-Pollution Thresholds (Code Check)**:
   - Check `src/app/brand/[slug]/page.tsx`, `src/app/market/[slug]/page.tsx`, and `src/app/price/[slug]/page.tsx`.
   - Ensure the `generateMetadata` function contains the logic to apply `<meta name="robots" content="noindex, follow" />` if the active item count is `< 2`.

3. **Data Quality Check (Database Check)**:
   - *Requires querying the Supabase `inventory` table.*
   - **Missing Images**: Count how many `active` items are using the default placeholder image instead of real images.
   - **Empty Descriptions**: Count how many `active` items have an empty or extremely short description.
   - **Slug Format**: Check for any malformed slugs (e.g., containing spaces `%20` or uppercase letters).

4. **Output the Audit Report**:
   Present a clear, actionable report using the format below.

   **Output Format Template**:
   ```markdown
   # 📈 VapeStockHub SEO & Data Audit Report

   ## 1. Infrastructure (Code)
   - [x/ ] `robots.txt` configured correctly (Blocking /admin, /go).
   - [x/ ] `sitemap.xml` dynamic generation active.
   - [x/ ] Anti-pollution thresholds (noindex for <2 items) active on Brand/Market pages.

   ## 2. Data Quality (Database)
   - **Active Items**: [Total Active Count]
   - ⚠️ **Missing Images**: [Count] items are using placeholders. (Impacts Google Images)
   - ⚠️ **Thin Content**: [Count] items have no detailed manifest/description.
   
   ## 3. Action Items
   1. [List any immediate fixes needed, e.g., "Upload real images for ID 12, 15"]
   2. [List any code adjustments needed]
   ```
