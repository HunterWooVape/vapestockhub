# Alternative Article Input / Output Template

## Input Contract

### Required Inputs
- `primary_keyword`
  - Example: `geek bar alternative`
- `article_title`
  - Example: `Best Geek Bar Alternatives for Wholesale Buyers in 2026`
- `inventory_sources`
  - Accepts one or more of:
    - inventory URLs
    - inventory slugs
    - text file containing URLs/slugs

### Optional Inputs
- `article_type`
  - Example: `brand-level alternative`
- `target_market`
  - Example: `US`
- `priority_angle`
  - Example: `budget buyer`, `pulse-style alternative`, `Middle East buyer fit`
- `notes`
  - Any editorial instruction the user wants to add

## Minimum Processing Rules
- Fetch inventory data directly from site-backed records whenever possible.
- Do not depend on manual descriptive text if URLs or slugs are available.
- Extract features first.
- Recommend slots second.
- Wait for confirmation before drafting the article.

## Expected Output Structure

### 1. Inventory Feature Extraction
- Inventory title
- Slug
- Brand
- Product type
- Puff band
- Price band
- MOQ
- Stock depth
- Featured markets
- Detectable text signals
- Data gaps

### 2. Dynamic Slot Recommendations
- Slot label
- Assigned inventory item
- Why it fits
- Supporting evidence
- Risk note if wording needs to stay soft

### 3. Structural Review
- Which parts of the article are strongly supported by data
- Which parts need softer wording
- Which parts should be skipped because the inventory evidence is too weak

### 4. Confirmation Questions
- Are the slot labels accepted?
- Should any slot be merged or renamed?
- Is more inventory needed?
- Can drafting start?

## Data Gap Handling Rules
- If a field is missing, mark it explicitly instead of inventing content.
- If the article angle depends on a missing field, downgrade the recommendation confidence.
- If multiple items are too similar to justify multiple slots, reduce the slot count.
- If only one or two convincing angles exist, keep the structure narrow instead of padding it.
