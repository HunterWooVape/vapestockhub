INSERT INTO inventory (
    slug,
    title,
    brand,
    product_type,
    puff,
    e_liquid,
    nicotine,
    flavor,
    price,
    quantity,
    moq,
    market,
    warehouse_location,
    description,
    images,
    status,
    contact_visibility,
    is_featured,
    is_urgent_clearance
)
SELECT
    'mock-vape-stock-' || LPAD(series.id::text, 3, '0'),
    brand_name || ' ' || model_name || ' ' || puff_value || ' Disposable Vape',
    brand_name,
    'Disposable',
    puff_value,
    ((10 + (series.id % 8))::text || 'ml'),
    CASE WHEN series.id % 3 = 0 THEN '2%' ELSE '5%' END,
    flavor_name || ', ' || flavor_name2 || ', ' || flavor_name3 || ', ' || flavor_name4 || ', ' || flavor_name5,
    ROUND((1.90 + ((series.id % 14) * 0.35))::numeric, 2),
    1500 + (series.id * 230),
    CASE WHEN series.id % 4 = 0 THEN 1000 ELSE 500 END,
    market_name,
    warehouse_name,
    'Mock inventory manifest:
' || flavor_name || ': ' || (500 + (series.id * 10)) || ' pcs
' || flavor_name2 || ': ' || (400 + (series.id * 15)) || ' pcs
' || flavor_name3 || ': ' || (300 + (series.id * 20)) || ' pcs
' || flavor_name4 || ': ' || (200 + (series.id * 25)) || ' pcs
' || flavor_name5 || ': ' || (100 + (series.id * 30)) || ' pcs

Total units available in ' || warehouse_name || '. Ready for immediate dispatch. Contact us to lock this allocation.',
    ARRAY['/images/inventory-placeholder.svg'],
    'active',
    CASE WHEN series.id % 2 = 0 THEN 'contact_required' ELSE 'public' END::contact_visibility,
    (series.id % 7 = 0),
    (series.id % 5 = 0)
FROM (
    SELECT generate_series(1, 60) AS id
) AS series
CROSS JOIN LATERAL (
    SELECT
        (ARRAY['Vozol', 'Elf Bar', 'Geek Bar', 'Lost Mary', 'Maskking', 'Oxbar'])[((series.id - 1) % 6) + 1] AS brand_name,
        (ARRAY['Star', 'Pulse', 'Ultra', 'Pro', 'Max', 'Go'])[((series.id - 1) % 6) + 1] AS model_name,
        (ARRAY[5000, 7000, 9000, 12000, 15000, 18000])[((series.id - 1) % 6) + 1] AS puff_value,
        (ARRAY['Blue Razz Ice', 'Watermelon Ice', 'Mint Blast', 'Grape Berry', 'Peach Mango', 'Lemon Lime'])[((series.id - 1) % 6) + 1] AS flavor_name,
        (ARRAY['Strawberry Kiwi', 'Mango Ice', 'Cherry Lemon', 'Pineapple Coconut', 'Lush Ice', 'Kiwi Passion Fruit'])[((series.id - 1) % 6) + 1] AS flavor_name2,
        (ARRAY['Double Apple', 'Mixed Berries', 'Cool Mint', 'Banana Ice', 'Blueberry Raspberry', 'Cotton Candy'])[((series.id - 1) % 6) + 1] AS flavor_name3,
        (ARRAY['Gummy Bear', 'Skittles', 'Rainbow Drop', 'Energy Drink', 'Cola Ice', 'Vanilla Ice Cream'])[((series.id - 1) % 6) + 1] AS flavor_name4,
        (ARRAY['Watermelon Bubblegum', 'Strawberry Banana', 'Peach Ice', 'Melon Ice', 'Grape Ice', 'Blackberry Ice'])[((series.id - 1) % 6) + 1] AS flavor_name5,
        (ARRAY['Middle East', 'Latin America', 'Eastern Europe', 'North America', 'Middle East', 'Latin America'])[((series.id - 1) % 6) + 1] AS market_name,
        (ARRAY['Dubai, UAE', 'Panama City, Panama', 'Belgrade, Serbia', 'Los Angeles, USA', 'Jeddah, Saudi Arabia', 'Bogotá, Colombia'])[((series.id - 1) % 6) + 1] AS warehouse_name
) AS attributes
ON CONFLICT (slug) DO NOTHING;
