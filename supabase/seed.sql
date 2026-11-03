-- ============================================================================
-- KISAN SAHAYAK — STAGE 2 AGRICULTURAL REFERENCE SEED DATA
-- Target Database: Supabase PostgreSQL 15+
-- File: supabase/seed.sql
-- Contains: 12 Categories and 39 Resources (ICAR, Schemes, Implements, Mandi)
-- Strict Boundary: NO demo users, NO passwords, NO mock profiles, NO mock user activity.
-- Idempotency: All records insert with ON CONFLICT (id) DO NOTHING.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. SEED CATEGORIES (12 Agricultural Knowledge Domains)
-- ----------------------------------------------------------------------------
INSERT INTO public.categories (id, name, slug, description, icon)
VALUES
  (1, 'Cereals & Grains', 'cereals', 'Staple crops including rice, wheat, and millets.', 'fa-wheat-awn'),
  (2, 'Pulses & Legumes', 'pulses', 'High-protein crops such as gram, lentils, and soybean.', 'fa-seedling'),
  (3, 'Vegetables & Spices', 'vegetables', 'Short-duration horticultural cash crops.', 'fa-carrot'),
  (4, 'Commercial & Cash Crops', 'cash-crops', 'High-value crops like cotton, sugarcane, and mustard.', 'fa-sack-dollar'),
  (5, 'Hand & Power Tools', 'hand-tools', 'Essential handheld equipment and power implements.', 'fa-screwdriver-wrench'),
  (6, 'Irrigation Equipment', 'irrigation-tools', 'Modern micro-irrigation, drip kits, and solar pumps.', 'fa-droplet'),
  (7, 'Tractors & Machinery', 'machinery', 'Heavy agricultural mechanization and harvesters.', 'fa-tractor'),
  (8, 'Income Support Schemes', 'income-support', 'Direct benefit transfer and income assistance programs.', 'fa-hand-holding-dollar'),
  (9, 'Crop Insurance', 'crop-insurance', 'Risk mitigation against climate and weather hazards.', 'fa-shield-halved'),
  (10, 'Credit & Loans', 'credit-loans', 'Institutional finance, KCC cards, and interest subvention.', 'fa-landmark'),
  (11, 'Organic & Soil Management', 'organic-farming', 'Natural farming, bio-fertilizers, and soil rejuvenation.', 'fa-leaf'),
  (12, 'Mandi & Marketplace', 'marketplace', 'e-NAM portals, market yard pricing, and seed/fertilizer outlets.', 'fa-store')
ON CONFLICT (id) DO NOTHING;


-- Synchronize categories identity sequence to highest ID safely
DO $$
DECLARE
  v_seq text;
BEGIN
  v_seq := pg_get_serial_sequence('public.categories', 'id');
  IF v_seq IS NOT NULL THEN
    PERFORM setval(v_seq, COALESCE((SELECT max(id) FROM public.categories), 1));
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- 2. SEED RESOURCES (39 Agricultural Resources Across 6 Core Types)
-- ----------------------------------------------------------------------------
INSERT INTO public.resources (
  id, category_id, title, description, resource_type,
  external_url, image_url, season_climate, eligibility, benefits, provider, views_count
) VALUES
  -- 1-10: Crops
  (
    1, 1, 'Rice (Paddy / धान)',
    'Staple food grain cultivated widely across Kharif season. High water-retentive clayey loam soil preferred. Requires hot and humid climate with abundant irrigation.',
    'crop',
    'https://icar.org.in/',
    'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=600&q=80',
    'Season: Kharif (June–Nov) | Temp: 20°C–35°C | Rainfall: 100–150 cm | Soil: Clayey / Loam',
    'Suitable for all states with assured irrigation or high monsoon rainfall.',
    'High domestic and export demand. Minimum Support Price (MSP) guaranteed procurement.',
    'ICAR - Indian Institute of Rice Research (IIRR)',
    142
  ),
  (
    2, 1, 'Wheat (गेहूं)',
    'Major Rabi cereal crop requiring cool growing period and bright sunny harvest weather. Prefers well-drained loamy and clayey loam soils.',
    'crop',
    'https://icar.org.in/',
    'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
    'Season: Rabi (Oct–April) | Temp: 10°C–25°C | Rainfall: 50–75 cm | Soil: Well-drained Loam',
    'North, Central & Western India (Punjab, Haryana, UP, MP, Rajasthan).',
    'Assured government procurement at MSP, high market liquidity and stable yield.',
    'ICAR - Indian Institute of Wheat and Barley Research (IIWBR)',
    198
  ),
  (
    3, 1, 'Maize (मक्का / Corn)',
    'Versatile cereal grown for food, fodder, and industrial starch. Grows best under semi-arid conditions in well-drained red or black soils.',
    'crop',
    'https://icar.org.in/',
    'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80',
    'Season: Kharif & Spring | Temp: 21°C–27°C | Rainfall: 50–100 cm | Soil: Deep Loam',
    'Widely adaptable in Karnataka, MP, Bihar, Maharashtra, and Rajasthan.',
    'High industrial demand for poultry feed, ethanol production, and corn flour.',
    'ICAR - Indian Institute of Maize Research (IIMR)',
    88
  ),
  (
    4, 4, 'Cotton (कपास / White Gold)',
    'Premier commercial fiber crop of India. Requires a warm climate, frost-free days, plenty of sunshine, and fertile black cotton (regur) soil.',
    'crop',
    'https://cotcorp.org.in/',
    'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=600&q=80',
    'Season: Kharif (May–Nov) | Temp: 21°C–30°C | Rainfall: 50–100 cm | Soil: Deep Black Soil',
    'Majorly grown in Gujarat, Maharashtra, Telangana, and Andhra Pradesh.',
    'High remunerative cash returns and direct procurement by Cotton Corporation of India (CCI).',
    'ICAR - Central Institute for Cotton Research (CICR)',
    115
  ),
  (
    5, 4, 'Sugarcane (गन्ना)',
    'Long-duration commercial cash crop. Needs tropical/subtropical climate with high humidity and well-drained fertile alluvial soil.',
    'crop',
    'https://iisr.icar.gov.in/',
    'https://images.unsplash.com/photo-1589135233689-d56121405e32?auto=format&fit=crop&w=600&q=80',
    'Season: Annual (10–14 months) | Temp: 20°C–35°C | Rainfall: 75–120 cm | Soil: Rich Alluvial',
    'Cultivated in Uttar Pradesh, Maharashtra, Karnataka, and Tamil Nadu.',
    'Assured mill gate procurement with Statutory Fair and Remunerative Price (FRP).',
    'ICAR - Indian Institute of Sugarcane Research',
    94
  ),
  (
    6, 3, 'Tomato (टमाटर)',
    'High-yielding vegetable crop suitable for round-the-year cultivation under open-field and protected polyhouse conditions.',
    'crop',
    'https://iihr.res.in/',
    'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
    'Season: Year-round (Kharif/Rabi/Zaid) | Temp: 18°C–27°C | Soil: Well-drained Sandy Loam',
    'Suitable for all agro-climatic zones with drip irrigation.',
    'Quick turnaround (60–90 days), high daily market turnover in wholesale mandis.',
    'ICAR - Indian Institute of Horticultural Research (IIHR)',
    132
  ),
  (
    7, 3, 'Potato (आलू)',
    'Most important tuber crop of India. Requires cool night temperatures during tuberization and light sandy loam rich in organic matter.',
    'crop',
    'https://cpri.icar.gov.in/',
    'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80',
    'Season: Rabi (Oct–Feb) | Temp: 15°C–20°C | Soil: Loose Friable Loam (pH 5.2–6.4)',
    'Dominant in UP, West Bengal, Bihar, Gujarat, and Punjab.',
    'High yield per acre, excellent cold-storage marketability and processing demand.',
    'ICAR - Central Potato Research Institute (CPRI)',
    110
  ),
  (
    8, 4, 'Mustard & Rapeseed (सरसों)',
    'Key oilseed crop of Rabi season. Tolerant to dry conditions and frost, grows well in light to heavy loam soils.',
    'crop',
    'https://drmr.icar.gov.in/',
    'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?auto=format&fit=crop&w=600&q=80',
    'Season: Rabi (Oct–March) | Temp: 15°C–25°C | Rainfall: 25–40 cm | Soil: Light to Heavy Loam',
    'Rajasthan, Haryana, Madhya Pradesh, UP, and West Bengal.',
    'High oil recovery percentage (38-42%), strong market prices and low water requirement.',
    'ICAR - Directorate of Rapeseed-Mustard Research (DRMR)',
    102
  ),
  (
    9, 2, 'Soybean (सोयाबीन)',
    'Wonder legume crop rich in protein and edible oil. Fixes atmospheric nitrogen to enrich soil fertility for succeeding crops.',
    'crop',
    'https://iisrindore.icar.gov.in/',
    'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80',
    'Season: Kharif (June–Oct) | Temp: 20°C–32°C | Rainfall: 60–80 cm | Soil: Well-drained Black/Loam',
    'Central and Western India (Madhya Pradesh, Maharashtra, Rajasthan).',
    'Dual revenue from oil and protein meal (DOC) exports; excellent soil fertility enhancer.',
    'ICAR - Indian Institute of Soybean Research',
    76
  ),
  (
    10, 2, 'Chickpea / Gram (चना)',
    'Major pulse crop in India representing over 40% of total pulse production. Highly resilient in drought-prone rainfed areas.',
    'crop',
    'https://iipr.icar.gov.in/',
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
    'Season: Rabi (Oct–March) | Temp: 15°C–25°C | Rainfall: 30–50 cm | Soil: Deep Silt Loam',
    'Madhya Pradesh, Maharashtra, Rajasthan, Karnataka, and UP.',
    'High domestic pulse demand, stable MSP, and minimal chemical fertilizer needs.',
    'ICAR - Indian Institute of Pulses Research (IIPR)',
    84
  ),

  -- 11-17: Farming Tools & Machinery
  (
    11, 7, 'Tractor Mounted Rotavator (रोटावेटर)',
    'Rotary tiller implement driven by tractor PTO. Crushes clods, cuts crop residues, and produces fine seedbed in a single pass.',
    'tool',
    'https://agrimachinery.nic.in/',
    'https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?auto=format&fit=crop&w=600&q=80',
    'Category: Tractor Implement | Power: 35–60 HP | Operation: PTO Driven 540 RPM',
    'Available for all farmers owning or hiring a 35+ HP tractor.',
    'Saves up to 40% fuel and preparation time compared to conventional multi-disc ploughing.',
    'Department of Agriculture & Farmers Welfare (SMAM)',
    140
  ),
  (
    12, 6, 'Solar Powered Drip Irrigation Kit',
    'Complete micro-irrigation unit integrated with a DC solar submersible/surface pump and automatic filtration system.',
    'tool',
    'https://pmkusum.mnre.gov.in/',
    'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&w=600&q=80',
    'Category: Smart Micro-Irrigation | Solar Capacity: 3–7.5 HP | Discharge: Uniform Drip',
    'Small, marginal and commercial farmers with available borewell or pond source.',
    'Up to 90% water saving, zero electricity bills, and eligible for 60% PM-KUSUM subsidy.',
    'Ministry of New & Renewable Energy (MNRE)',
    210
  ),
  (
    13, 5, 'Agricultural Drone Sprayer (कृषि ड्रोन)',
    '10L to 16L precision drone system equipped with centrifugal nozzles for ultra-low volume foliar spraying and crop health mapping.',
    'tool',
    'https://agrimachinery.nic.in/',
    'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=600&q=80',
    'Category: Smart Agri-Tech | Payload: 10–16 Litres | Coverage: 1 Acre in 7 minutes',
    'Progressive farmers, FPOs, Custom Hiring Centres, and Agriculture Graduates.',
    'Eliminates chemical exposure for laborers, reduces pesticide consumption by up to 30%.',
    'Sub-Mission on Agricultural Mechanization (SMAM)',
    320
  ),
  (
    14, 7, 'Power Tiller / Mini Cultivator (पावर टिलर)',
    'Compact, two-wheeled walk-behind tractor ideal for inter-cultivation, weeding in orchards, and puddling in small paddy fields.',
    'tool',
    'https://farmech.dac.gov.in/',
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80',
    'Category: Compact Machinery | Power: 8–15 HP Diesel | Weight: 120–250 kg',
    'Highly suited for smallholders, hilly terrains, vegetable growers, and orchard owners.',
    'Low purchase cost, highly maneuverable in tight rows where full tractors cannot enter.',
    'Ministry of Agriculture & Farmers Welfare',
    165
  ),
  (
    15, 7, 'Laser Land Leveler (लेजर लैंड लेवलर)',
    'Precision laser-guided bucket scraper ensuring accurate topographic leveling across the entire cultivation field.',
    'tool',
    'https://agrimachinery.nic.in/',
    'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=80',
    'Category: Precision Grading | Laser Range: 300–400m | Power Requirement: 50+ HP Tractor',
    'Custom Hiring Centers (CHCs), farmer groups, and large-scale cultivators.',
    'Reduces irrigation water usage by 25-30%, enhances fertilizer efficiency and uniformity.',
    'ICAR / SMAM Custom Hiring Center Portal',
    95
  ),
  (
    16, 7, 'Multi-Crop Happy Seeder / Super Seeder',
    'Tractor implement designed to sow wheat and seeds directly into standing paddy stubble without burning crop residue.',
    'tool',
    'https://agrimachinery.nic.in/',
    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=600&q=80',
    'Category: Zero-Till Seeding | Tractor: 50–65 HP | Action: Stubble Shredding + Seed Drilling',
    'Farmers in paddy-wheat cropping zones (Punjab, Haryana, UP, MP).',
    'Zero stubble burning, preserves soil moisture, adds organic mulch, earns carbon credits.',
    'Central Crop Residue Management Scheme (CRM)',
    180
  ),
  (
    17, 5, 'Battery Powered Knapsack Sprayer',
    '16-liter ergonomic backpack sprayer with 12V lithium-ion battery and dual pressure regulators for uniform field application.',
    'tool',
    'https://agricoop.nic.in/',
    'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=600&q=80',
    'Category: Hand & Power Sprayers | Tank: 16–20 Litres | Battery: 12V 8Ah / 12Ah',
    'All small and marginal farmers.',
    'Zero manual pumping fatigue, 5 hours continuous spray per charge, adjustable brass nozzles.',
    'National Food Security Mission (NFSM)',
    240
  ),

  -- 18-23: Government Schemes
  (
    18, 8, 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
    'Central sector scheme providing income support to all landholding farmer families across India to supplement their agricultural financial needs.',
    'scheme',
    'https://pmkisan.gov.in/',
    'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=600&q=80',
    'Sector: Central Government | Mode: Direct Benefit Transfer (DBT) via Aadhaar',
    'All landholding farmer families with cultivable land in their names (subject to official exclusion criteria).',
    '₹6,000 per year paid in three equal 4-monthly installments of ₹2,000 directly into verified bank accounts.',
    'Ministry of Agriculture & Farmers Welfare',
    510
  ),
  (
    19, 9, 'PMFBY (Pradhan Mantri Fasal Bima Yojana)',
    'Comprehensive crop insurance scheme protecting farmers against non-preventable natural risks from pre-sowing to post-harvest stages.',
    'scheme',
    'https://pmfby.gov.in/',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
    'Sector: National Crop Insurance | Premium: 2% Kharif, 1.5% Rabi, 5% Commercial',
    'All farmers growing notified crops in notified areas (both loanee and non-loanee farmers).',
    'Comprehensive financial compensation for yield loss, localized calamities, post-harvest losses, and unseasonal rains.',
    'Department of Agriculture & Farmers Welfare',
    430
  ),
  (
    20, 6, 'PMKSY (Pradhan Mantri Krishi Sinchayee Yojana)',
    'Flagship irrigation initiative with the motto "Har Khet Ko Pani" and "Per Drop More Crop" promoting precision micro-irrigation systems.',
    'scheme',
    'https://pmksy.gov.in/',
    'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&w=600&q=80',
    'Sector: Water Infrastructure & Efficiency | Coverage: Pan-India',
    'Individual farmers, self-help groups, cooperative societies, and water user associations.',
    'Up to 45% to 55% capital subsidy on installation of Drip & Sprinkler irrigation systems as per state guidelines.',
    'Ministry of Jal Shakti & Ministry of Agriculture',
    315
  ),
  (
    21, 11, 'Paramparagat Krishi Vikas Yojana (PKVY)',
    'Dedicated sub-component of National Mission on Sustainable Agriculture promoting certified organic farming through cluster approach.',
    'scheme',
    'https://pgsindia-ncof.gov.in/',
    'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=80',
    'Sector: Sustainable Agriculture | Certification: PGS-India Certified Organic',
    'Farmer clusters forming groups of 20 or more farmers holding contiguous land.',
    'Financial assistance of ₹50,000 per hectare over 3 years for inputs, bio-fertilizers, and organic certification.',
    'National Centre of Organic and Natural Farming (NCONF)',
    270
  ),
  (
    22, 11, 'Soil Health Card Scheme (मृदा स्वास्थ्य कार्ड)',
    'Government program issuing comprehensive soil test reports detailing 12 critical macro and micro nutrient parameters with crop-specific fertilizer recommendations.',
    'scheme',
    'https://soilhealth.dac.gov.in/',
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=600&q=80',
    'Sector: Soil Nutrient Governance | Cycle: Every 2 Years Soil Testing',
    'All farmers across all agricultural blocks in India.',
    'Free soil nutrient testing, reduction in excessive chemical fertilizer costs, and optimized crop productivity.',
    'Department of Agriculture & Farmers Welfare',
    290
  ),
  (
    23, 7, 'Sub-Mission on Agricultural Mechanization (SMAM)',
    'Scheme aimed at increasing farm power availability and establishing Custom Hiring Centres (CHCs) for modern farm machinery.',
    'scheme',
    'https://agrimachinery.nic.in/',
    'https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?auto=format&fit=crop&w=600&q=80',
    'Sector: Mechanization & Technology | Subsidy: 40% to 50% on Implements',
    'Individual farmers, SC/ST, women farmers, cooperative societies, and rural entrepreneurs.',
    'Substantial subsidy on tractors, rotavators, power weeders, harvesters, and up to 80% for custom hiring hubs.',
    'Ministry of Agriculture & Farmers Welfare',
    345
  ),

  -- 24-27: Credit, Loans & Subsidies
  (
    24, 10, 'Kisan Credit Card (KCC / किसान क्रेडिट कार्ड)',
    'Provides adequate and timely institutional credit to farmers under single window for cultivation expenses, post-harvest needs, and working capital.',
    'loan',
    'https://www.myscheme.gov.in/schemes/kcc',
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80',
    'Type: Concessional Working Capital Credit | Limit: Based on Cropping Pattern',
    'All individual/joint cultivators, tenant farmers, oral lessees, sharecroppers, and SHGs.',
    'Short-term credit up to ₹3 Lakh at effective interest rate of 4% per annum (with prompt repayment subvention as per RBI norms).',
    'Reserve Bank of India (RBI) & NABARD',
    620
  ),
  (
    25, 10, 'Agriculture Infrastructure Fund (AIF)',
    'Medium to long term debt financing facility for investment in viable post-harvest management infrastructure and community farming assets.',
    'loan',
    'https://agriinfra.dac.gov.in/',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
    'Type: Long Term Debt Facility | Fund Size: ₹1 Lakh Crore',
    'Primary Agricultural Credit Societies (PACS), FPOs, Agri-entrepreneurs, and Startups.',
    '3% interest subvention per annum for loans up to ₹2 Crore for a maximum period of 7 years, plus CGTMSE credit guarantee.',
    'Ministry of Agriculture & NABARD',
    185
  ),
  (
    26, 6, 'Micro Irrigation Capital Subsidy',
    'State & Central combined subsidy scheme providing upfront assistance for installing drip, micro-sprinklers, and portable sprinkler sets.',
    'loan',
    'https://pmksy.gov.in/',
    'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&w=600&q=80',
    'Type: Capital Subsidy | Share: 55% for Small/Marginal, 45% for Other Farmers',
    'Cultivators having verified land ownership with available irrigation water source.',
    'Direct release of subsidy to certified manufacturer vendors; drastic reduction in farmer out-of-pocket setup cost.',
    'State Horticulture & Agriculture Departments',
    230
  ),
  (
    27, 6, 'PM-KUSUM Solar Pump Subsidy Scheme',
    'Solarization scheme enabling farmers to replace diesel irrigation pumps with standalone off-grid solar pumps and grid-connected solar power systems.',
    'loan',
    'https://pmkusum.mnre.gov.in/',
    'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=600&q=80',
    'Type: 60% Total Government Subsidy (30% Central + 30% State)',
    'Individual farmers, groups, cooperatives, and water user associations with water source.',
    'Get 3 HP to 10 HP solar pumps with only 10% farmer contribution (up to 30% available via bank loan).',
    'Ministry of New & Renewable Energy (MNRE)',
    410
  ),

  -- 28-32: Farming Guides
  (
    28, 11, 'Complete Guide to Zero Budget Natural Farming (ZBNF)',
    'Comprehensive manual on chemical-free agriculture utilizing indigenous cow dung-urine formulations like Jeevamrit, Beejamrit, Mulching, and Waaphasa.',
    'guide',
    'https://icar.org.in/',
    'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=80',
    'Category: Natural & Organic Farming | Topic: Microbial Bio-Formulations',
    'Applicable to all agro-ecological zones and cropping systems.',
    'Cuts cultivation costs, improves soil biology, and produces residue-free organic crops.',
    'National Centre of Organic and Natural Farming',
    380
  ),
  (
    29, 11, 'Soil Health Management & Organic Vermicomposting',
    'Practical step-by-step techniques to test soil texture, balance pH, and build on-farm vermicompost units using Eisenia fetida earthworms.',
    'guide',
    'https://soilhealth.dac.gov.in/',
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=600&q=80',
    'Category: Soil Science | Topic: Organic Humus & Earthworm Composting',
    'Useful for all farmers wanting to convert agricultural waste into organic manure.',
    'Increases water holding capacity, replenishes organic carbon, and reduces chemical fertilizer requirement.',
    'ICAR - Indian Institute of Soil Science (IISS)',
    295
  ),
  (
    30, 11, 'Integrated Pest Management (IPM) in Vegetable Crops',
    'Modern holistic pest control combining yellow sticky traps, pheromone lures, trichoderma bio-agents, and neem-based botanical sprays.',
    'guide',
    'https://ncipm.icar.gov.in/',
    'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
    'Category: Crop Protection | Topic: Biological & Cultural Pest Control',
    'Targeted for tomato, brinjal, chilli, okra, and cucurbit vegetable growers.',
    'Prevents pest resistance, keeps harvest safe from excessive pesticide residues, and safeguards beneficial pollinators.',
    'ICAR - National Research Centre for Integrated Pest Management (NCIPM)',
    210
  ),
  (
    31, 6, 'Drip Fertigation & Precision Water Scheduling',
    'Scientific guidelines on calculating crop water requirements (Etc), injecting water-soluble fertilizers directly through drip lines, and venturi operation.',
    'guide',
    'https://iihr.res.in/',
    'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&w=600&q=80',
    'Category: Precision Irrigation | Topic: Water-Soluble Fertigation',
    'Orchards, sugarcane, cotton, and high-value horticultural crops.',
    'Significantly reduces fertilizer wastage, prevents nutrient leaching, and increases crop yields by 25-35%.',
    'Precision Farming Development Centres (PFDC)',
    175
  ),
  (
    32, 11, 'Scientific Crop Rotation & Green Manuring Strategies',
    'Methods for alternating deep-rooted tap crops with fibrous cereals and cultivating Dhaincha / Sunnhemp as green manure to fix nitrogen.',
    'guide',
    'https://icar.org.in/',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
    'Category: Agronomy | Topic: Legume Incorporation & Soil Rejuvenation',
    'Farmers practicing monoculture or intensive cereal rotations.',
    'Breaks pest-weed cycles, enhances soil organic nitrogen naturally.',
    'ICAR - Indian Agricultural Research Institute (IARI Pusa)',
    160
  ),

  -- 33-36: Marketplaces & Price Discovery
  (
    33, 12, 'e-NAM (National Agriculture Market)',
    'Pan-India electronic trading portal networking the existing APMC mandis to create a unified national market for agricultural commodities.',
    'marketplace',
    'https://www.enam.gov.in/',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    'Platform Type: National Electronic Mandi Auction | Commodities: 200+ Agri Goods',
    'All registered farmers, traders, FPOs, and commission agents.',
    'Transparent online bidding, real-time price discovery, assaying quality reports, and direct bank settlement.',
    'Small Farmers Agribusiness Consortium (SFAC)',
    580
  ),
  (
    34, 12, 'Agmarknet Portal (Mandi Price Tracker)',
    'Official agricultural marketing information network providing daily arrival volumes and wholesale commodity prices across 3,000+ Indian mandis.',
    'marketplace',
    'https://agmarknet.gov.in/',
    'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=600&q=80',
    'Platform Type: Daily Wholesale Market Rates Information System',
    'All farmers tracking mandi price trends before selling produce.',
    'Accurate daily spot prices for cereals, pulses, fruits, and vegetables by district and market yard.',
    'Directorate of Marketing & Inspection (DMI)',
    470
  ),
  (
    35, 12, 'IFFCO Kisan E-Bazar (IFFCO E-Bazar)',
    'Direct online delivery platform by India’s premier cooperative for certified bio-fertilizers, nano urea, seeds, cattle feed, and farm implements.',
    'marketplace',
    'https://www.iffcobazar.in/',
    'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&q=80',
    'Platform Type: Official Cooperative Agri-Input E-Store',
    'Farmers across all postal pin codes in India.',
    'Guaranteed genuine certified inputs, free home delivery, and subsidized cooperative pricing.',
    'Indian Farmers Fertiliser Cooperative Limited (IFFCO)',
    390
  ),
  (
    36, 12, 'AgroStar / BigHaat Agri Retail Store',
    'Leading digital agtech platforms providing door-step delivery of branded hybrid seeds, agrochemicals, knapsack sprayers, and tarpaulins.',
    'marketplace',
    'https://www.bighaat.com/',
    'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=600&q=80',
    'Platform Type: Agri-Tech Direct-to-Farmer Commerce',
    'Farmers seeking door delivery of agricultural inputs with cash-on-delivery options.',
    'Large catalog of reputable seed companies, crop advisory support, and equipment accessories.',
    'Agro-Retail Tech Network',
    290
  ),

  -- 37-39: Community, Science & Helplines
  (
    37, 8, 'Kisan Call Centre (Toll-Free Helpline: 1800-180-1551)',
    'Round-the-clock telephone advisory service answering farmer queries in 22 local Indian languages by agricultural subject matter specialists.',
    'community',
    'https://dackkms.gov.in/',
    'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=600&q=80',
    'Service Type: 24x7 Toll-Free Voice Advisory | Languages: 22 Regional Languages',
    'Any farmer across India calling from mobile or landline.',
    'Instant expert advice on disease outbreaks, pest alerts, weather contingencies, and scheme documentation.',
    'Ministry of Agriculture & Farmers Welfare',
    650
  ),
  (
    38, 11, 'Krishi Vigyan Kendra (KVK) National Network',
    '730+ district-level agricultural science centers conducting on-farm trials, frontline demonstrations, and skill training for local farmers.',
    'community',
    'https://kvk.icar.gov.in/',
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80',
    'Institution: ICAR District Agricultural Extension Centres',
    'Local rural youth, farm women, progressive growers, and SHGs.',
    'Free training workshops, supply of quality breeder seeds/saplings, and diagnostic farm visits.',
    'Indian Council of Agricultural Research (ICAR)',
    420
  ),
  (
    39, 1, 'ICAR Central Agricultural Research Institutes',
    'Network of premier apex agricultural research institutes developing high-yielding climate-resilient crop varieties and technology packages.',
    'community',
    'https://icar.org.in/',
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80',
    'Apex Body: Indian Council of Agricultural Research (ICAR)',
    'Researchers, farmers, students, and agricultural policy makers.',
    'Access to published research bulletins, variety release notifications, and national seed portals.',
    'ICAR Headquarters, Krishi Bhawan, New Delhi',
    310
  )
ON CONFLICT (id) DO NOTHING;


-- Synchronize resources identity sequence to highest ID safely
DO $$
DECLARE
  v_seq text;
BEGIN
  v_seq := pg_get_serial_sequence('public.resources', 'id');
  IF v_seq IS NOT NULL THEN
    PERFORM setval(v_seq, COALESCE((SELECT max(id) FROM public.resources), 1));
  END IF;
END $$;


COMMIT;
