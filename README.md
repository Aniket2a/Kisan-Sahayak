# Kisan Sahayak (किसान सहायक)
> **“Smart Resources. Better Farming. Stronger Farmers.”**

A modern, responsive web application and agriculture resource platform designed specifically for Indian farmers. Kisan Sahayak acts as a centralized digital portal connecting cultivators with verified government schemes, high-yield crop guides, modern farming machinery, regional weather advisories, trusted agricultural marketplaces, and an active farmer community forum.

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
* Concessional **Kisan Credit Card (KCC)** interest subvention rules (effective 4% p.a.).
* **Agriculture Infrastructure Fund (AIF)**, NABARD long-term credit facilities, and **PM-KUSUM** 60% solar pump subsidies.

### 5. 📖 Farming Knowledge Hub
* Step-by-step agronomic manuals on Zero Budget Natural Farming (ZBNF), Integrated Pest Management (IPM), Vermicomposting, Drip Fertigation, and Scientific Crop Rotation.

### 6. 🌦️ Interactive Weather & Agro-Advisories
* Regional weather forecast covering major Indian agricultural belts (Ludhiana, Karnal, Nashik, Varanasi, Indore, Guntur, Surat, Coimbatore, Patna, Bardhaman, Kota, Shimla).
* Live weather integration via Open-Meteo API + calibrated seasonal fallback.
* **Automated Agricultural Advisories**: Actionable alerts on pesticide wash-off risks, morning/evening irrigation scheduling, and high wind crop protection.

### 7. 🏪 Marketplace & Mandi Price Tracker
* Directory of verified agricultural buying and selling platforms: **e-NAM**, **Agmarknet**, **IFFCO Kisan E-Bazar**, **AgroStar**, **BigHaat**.
* **Daily APMC Mandi Spot Rate Indicator** showing current modal market rates for key commodities across Indian states.

### 8. 👥 Farmer Community & Helplines
* 24x7 National Kisan Call Center Toll-Free Helpline: `1800-180-1551`.
* Network of 730+ Krishi Vigyan Kendras (KVKs).
* **Interactive Discussion Forum**: Logged-in farmers can post agricultural doubts, reply in comment threads, and like posts in real time.

### 9. 📊 Farmer Dashboard & Personal Bookmarks
* Personalized welcome banner with state & farming preference indicator.
* Saved Resources page isolating bookmarks per user.
* Quick access tiles to all major features.

### 10. 🛡️ Administrator Control Center
* Full CRUD management of agricultural resources, government schemes, tools, and crop guides.
* User management and role switching (`user` / `admin`).
* Community post moderation and user feedback review.
* Real-time platform KPI metrics (Total Users, Resources, Categories, Bookmarks, and Star Ratings).

---

## 🛠️ Technology Stack

* **Backend**: Python 3, Flask, Werkzeug (PBKDF2 SHA-256 secure password hashing)
* **Database**: SQLite3 with normalized tables and foreign key constraints
* **Frontend**: Responsive HTML5, Custom Agri-Themed CSS Grid & Flexbox, Vanilla JS
* **Typography & Icons**: Google Fonts (Plus Jakarta Sans), Font Awesome 6
* **APIs**: Open-Meteo Agro-Meteorology API

---

## 🚀 Getting Started & Installation

### 1. Prerequisites
* Python 3.8+ installed on your system.

### 2. Install Dependencies
```bash
cd kisan_sahayak
pip install -r requirements.txt
```

### 3. Initialize the SQLite Database
```bash
python init_db.py
```

### 4. Run the Flask Web Application
```bash
python app.py
```

Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## 🔒 Administrator & Environment Configuration

Admin access is controlled securely via environment variables rather than hardcoded credentials:

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `ADMIN_USERNAME` | Yes (for admin access) | Username for administrator account | `admin` or `lead_admin` |
| `ADMIN_PASSWORD` | Yes (for admin access) | Strong password for administrator account | `YourSecurePassword2026!` |
| `SECRET_KEY` | Recommended in production | Secret key for session security & CSRF | `32-byte-hex-string` |
| `FLASK_DEBUG` | Optional | Set to `True` for local debugging only | `False` |

### 🌾 Pre-Seeded Demo Farmer Account
* **Username / Email**: `ramesh_kumar` *(ramesh.farmer@gmail.com)*
* **Password**: `farmer123`
* *You can also register a new farmer account anytime with your preferred Indian state and farming interest.*

---

## 🧪 Running Automated Tests
```bash
python test_app.py
```
*All 11 isolated test suites verify database integrity, environment-based admin authentication, CSRF defense, open redirect protection, farmer authentication, bookmarks, likes, weather advisories, error handling, and admin controls.*

---

## ⚖️ Disclaimer
Information displayed on Kisan Sahayak is compiled for educational and informational purposes. Kisan Sahayak redirects farmers toward authorized official government websites and services. Users should verify official scheme guidelines, eligibility rules, and documentation requirements from the respective official department portals.
