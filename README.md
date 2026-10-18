# Kisan Sahayak (किसान सहायक)
> **“Smart Resources. Better Farming. Stronger Farmers.”**

A modern, responsive React web application and agriculture resource platform designed specifically for Indian farmers. Kisan Sahayak acts as a centralized digital portal connecting cultivators with verified government schemes, high-yield crop guides, modern farming machinery, regional weather advisories, trusted agricultural marketplaces, and an active farmer community forum.

---

## 🌟 Key Features

### 1. 🌾 Seeds & Crops Directory
* Comprehensive cultivation guides for staple cereals, pulses, vegetables, oilseeds, and cash crops (Rice, Wheat, Maize, Cotton, Sugarcane, Tomato, Potato, Mustard, Soybean, Chickpea, etc.).
* Agro-climatic data: temperature range, rainfall requirement, soil suitability, and season markers (Kharif / Rabi / Zaid).
* Direct links to ICAR (Indian Council of Agricultural Research) apex institutes.

### 2. 🚜 Modern Farming Tools & Equipment
* Implements directory covering Tractor Rotavators, Solar Drip Irrigation Units, Precision Agricultural Drone Sprayers, Power Tillers, Laser Land Levelers, and Super Seeders.
* Specifications, horsepower requirements, and Sub-Mission on Agricultural Mechanization (SMAM) subsidy details.

### 3. 🏛️ Government Schemes & Welfare Portal
* Verified information on flagship programs: **PM-KISAN**, **PMFBY** (Crop Insurance), **PMKSY** (Per Drop More Crop), **Paramparagat Krishi Vikas Yojana (PKVY)**, and **Soil Health Card Scheme**.
* Clear eligibility criteria, financial benefits breakdown, and direct buttons to official central/state portals (`.gov.in` / `.nic.in`).

### 4. 💳 Loans & Financial Subsidies
* Concessional **Kisan Credit Card (KCC)** interest subvention rules (4% effective interest).
* **Agriculture Infrastructure Fund (AIF)**, NABARD long-term credit facilities, and **PM-KUSUM** solar pump support information.

### 5. 📖 Farming Knowledge Hub
* Step-by-step agronomic manuals on Zero Budget Natural Farming (ZBNF), Integrated Pest Management (IPM), Vermicomposting, Drip Fertigation, and Scientific Crop Rotation.

### 6. 🌦️ Interactive Weather & Agro-Advisories
* Regional weather forecast covering 12 major Indian agricultural belts.
* Live weather integration via Open-Meteo API + calibrated seasonal fallback.
* **Automated Agricultural Advisories**: Actionable alerts on pesticide wash-off risks, irrigation scheduling, and high wind crop protection.

### 7. 🏪 Marketplace & Mandi Price Tracker
* Directory of verified agricultural buying and selling platforms: **e-NAM**, **Agmarknet**, **IFFCO Kisan E-Bazar**, **AgroStar**, **BigHaat**.
* **Daily APMC Mandi Spot Rate Indicator** showing current modal market rates for key commodities across Indian states with real-time filters.

### 8. 👥 Farmer Community & Helplines
* 24x7 National Kisan Call Center Toll-Free Helpline: `1800-180-1551`.
* Network of Krishi Vigyan Kendras (KVKs).
* **Interactive Discussion Forum**: Farmers can post agricultural doubts, reply in comment threads, and like posts in real time.

### 9. 📊 Farmer Dashboard & Personal Bookmarks
* Personalized welcome banner with state & farming preference indicator.
* Saved Resources page isolating bookmarks per user.
* Quick access tiles to all major features.

### 10. 🛡️ Administrator Control Center
* Full CRUD management of agricultural resources, government schemes, tools, and crop guides.
* User management and role switching (`user` / `admin`).
* Community post moderation and user feedback review.
* Real-time platform KPI metrics.

---

## 🛠️ Technology Stack

* **Framework**: React 18, Vite, TypeScript
* **State Management**: Reactive React Context with localStorage data persistence
* **Styling**: Authentic AgriTech CSS design system, Responsive Grid & Flexbox, Plus Jakarta Sans typography, Font Awesome 6
* **APIs**: Open-Meteo Agro-Meteorology API

---

## 🚀 Getting Started & Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```

The app will be running at `http://0.0.0.0:3000`.

### 3. Build for Production
```bash
npm run build
```
