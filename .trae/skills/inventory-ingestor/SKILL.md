---
name: "inventory-ingestor"
description: "Formats messy supplier text/Excel data into structured Admin panel fields. Invoke when user pastes raw supplier inventory data or asks to process new stock."
---

# Inventory Ingestor Skill

## Purpose
To transform raw, unstructured supplier inventory data (often copied from WhatsApp, Telegram, or Excel) into clean, structured data perfectly formatted for the VapeStockHub Admin Panel.

## Trigger Scenarios
- User pastes a block of raw text and says "process this" or "add this to inventory".
- User provides an Excel screenshot or CSV data and needs it formatted for the Admin Panel.
- User says "I have new stock from a supplier".

## Execution Steps

When invoked, execute the following steps strictly:

1. **Analyze the Raw Data**:
   - Extract the `Brand` (e.g., Vozol, Elf Bar).
   - Extract the `Product Type` / Model (e.g., Star 9000, BC5000).
   - Calculate or extract the `Total Quantity`.
   - Identify the `Puff count`, `Nicotine strength` (e.g., 5%, 2%), and `E-liquid capacity` if available.
   - Identify the `Warehouse Location` and target `Market` if mentioned.

2. **Process Flavors (Crucial Step)**:
   - Extract all flavor names.
   - Combine them into a **single comma-separated string** (e.g., `Blue Razz Ice, Watermelon Ice, Mint`).
   - *Rule*: Do NOT include the quantities in this comma-separated string.

3. **Construct the Inventory Manifest (Description)**:
   - Create a clean, multiline text block detailing the exact breakdown of flavors and their respective quantities.
   - Add a professional closing sentence (e.g., "Ready for immediate dispatch.").
   - *Format Example*:
     ```text
     Blue Razz Ice: 3000 pcs
     Watermelon Ice: 2000 pcs
     ...
     Total: 5000 pcs available in [Location].
     ```

4. **Suggest Pricing (If missing)**:
   - If the supplier provided a cost price, suggest a Wholesale Price by adding a standard 15-20% margin (or ask the user for their preferred margin).

5. **Output the Result**:
   Present the final result clearly mapped to the Admin Panel fields, so the user can easily copy-paste:

   **Output Format Template**:
   ```markdown
   ✅ **Data Processed for Admin Panel**

   - **Title**: [Brand] [Model] [Puffs]
   - **Brand**: [Brand]
   - **Product Type**: Disposable (or Pod System, etc.)
   - **Price USD**: [Suggested Price]
   - **Quantity**: [Total Quantity]
   - **MOQ**: [Suggested MOQ, e.g., 500]
   - **Puff**: [Puff Count]
   - **Nicotine**: [Nicotine %]
   - **Flavor (Copy exactly)**: `[Comma-separated flavors]`
   - **Market**: [Target Market]
   - **Warehouse**: [Location]
   
   - **Description / Manifest (Copy exactly)**:
   ```text
   [The formatted multiline manifest]
   ```
   ```

## User Interaction
If any critical fields (like Brand, Total Quantity, or Location) are missing from the raw data, politely ask the user to provide them before generating the final output.