# Blog Workflow Hub

## Purpose
- This folder stores the reusable workflow for blog planning, especially `alternative`-style articles built from real inventory already published on VapeStockHub.
- The goal is to keep a stable process:
  - user provides article angle + inventory URLs or slugs
  - inventory data is fetched directly from the site database
  - features are extracted from real records
  - recommendation slots are generated dynamically
  - article drafting starts only after the slot structure is confirmed

## Core Principle
- The article frame can stay semi-stable.
- The recommendation slots must stay dynamic.
- Slots are derived from current inventory features, not fixed in advance.

## Standard Workflow
1. Define the article angle and target keyword.
2. Provide inventory URLs, slugs, or a text file containing them.
3. Run the planning script.
4. Review the generated slot structure and feature extraction output.
5. Confirm or adjust slot labels.
6. Draft the article only after the structure is approved.

## Recommended Command
```bash
npm run plan-alternative-blog -- \
  --keyword "geek bar alternative" \
  --title "Best Geek Bar Alternatives for Wholesale Buyers in 2026" \
  --urls "https://vapestockhub.com/inventory/slug-a,https://vapestockhub.com/inventory/slug-b"
```

## Output
- The script writes both `.json` and `.md` planning files into `docs/blog/generated/`.
- Use the markdown file for quick human review.
- Use the JSON file if later automation or a skill needs structured input.

## Files in This Folder
- `README.md`: workflow overview
- `ALTERNATIVE_ARTICLE_PROMPT_TEMPLATE.md`: prompt template to send in chat
- `ALTERNATIVE_ARTICLE_IO_TEMPLATE.md`: standard input/output contract
- `generated/`: generated planning outputs from the script

## Important Boundaries
- Do not assume the recommendation slots are fixed.
- Do not rely on manual freeform product descriptions if the inventory record already exists on the site.
- Do not write official-brand claims when the inventory is only an alternative or similar-format option.
