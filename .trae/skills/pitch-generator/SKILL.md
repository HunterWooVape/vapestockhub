---
name: "pitch-generator"
description: "Generates professional B2B wholesale email/chat replies. Invoke when user needs to reply to a buyer's inquiry about price or availability."
---

# Pitch Generator Skill

## Purpose
To quickly generate high-converting, professional B2B wholesale replies for WhatsApp, Telegram, or Email based on buyer inquiries. It incorporates tiered pricing, FOMO, and clear next steps.

## Trigger Scenarios
- User says "A customer from Dubai asked for Vozol 9000 price, how should I reply?"
- User says "Draft a pitch for [Model Name]".
- User says "Reply to this Telegram message: [Pasted message]".

## Execution Steps

When invoked, the AI must execute the following:

1. **Context Gathering**:
   - If the user didn't specify the exact product, ask them.
   - Optional: Use `SearchCodebase` or query the database to get the real stock levels and pricing for the mentioned product (if requested by user).

2. **Drafting the Pitch (Core Logic)**:
   The pitch MUST follow this B2B structure:
   - **Greeting & Confirmation**: Acknowledge the inquiry and confirm the stock is real and available.
   - **Tiered Pricing**: Provide 2-3 price tiers to encourage larger orders (e.g., MOQ, 5k, 10k+).
   - **Logistics/Warehouse**: Mention where the stock is located (e.g., "Currently in our Dubai warehouse").
   - **FOMO (Urgency)**: Add a gentle push (e.g., "This batch is moving fast, currently only [X] pcs left").
   - **Call to Action (CTA)**: Ask a specific question to move the deal forward.

3. **Output Formats**:
   Provide two versions for the user:
   - **Version 1: Short & Punchy (For WhatsApp/Telegram)**
   - **Version 2: Detailed (For Email/Formal Inquiry)**

   **Template Example (Chat Version)**:
   ```text
   Hi [Name/There], thanks for reaching out from VapeStockHub! 
   
   Yes, we currently have the [Brand] [Model] in stock at our [Location] warehouse. 100% authentic, ready to ship.

   Here is the wholesale pricing:
   - MOQ (500 pcs): $[Price 1]
   - 5,000+ pcs: $[Price 2]
   - Take All ([Total Qty]): $[Best Price]

   We have popular flavors like [Flavor 1, Flavor 2]. This clearance batch is moving very fast today. 
   
   What quantity are you looking for, and do you need help with shipping to [Target Market]? Let me know and I can lock in your allocation.
   ```

## Tone & Vibe
- **Professional, Direct, Confident**. No fluff. 
- You are a high-level wholesale distributor, not a B2C retail clerk.
- Never use words like "cheap" or "discount" excessively; use "wholesale margin", "clearance allocation", or "tier pricing".