# ⚽ TURFFIELD
### Geo-Based Astro Turf Booking & Management System
**A Case Study of the Accra Metropolitan Assembly (AMA)**

---

## 🗂️ Project Structure

```
turffield/
├── index.html                  # Vite HTML entry point
├── vite.config.js              # Vite configuration
├── package.json                # Dependencies & scripts
├── README.md
│
└── src/
    ├── main.jsx                # React DOM entry point
    ├── App.jsx                 # Root component + layout (web & mobile)
    ├── index.css               # Global CSS reset & design tokens
    │
    ├── context/
    │   └── AuthContext.jsx     # Global auth state (login, register, logout)
    │
    ├── hooks/
    │   ├── useSlots.js         # Live slot management + countdown lock
    │   └── useNotification.js  # Toast notification helper
    │
    ├── data/
    │   └── turfs.js            # Turf records, photos, seed enquiries, slot generator
    │
    ├── components/
    │   ├── AuthScreen.jsx      # Login / Register screen
    │   ├── TurfCard.jsx        # Turf listing card (used in grid)
    │   ├── Gallery.jsx         # Photo gallery with thumbnails + arrows
    │   ├── EnquiriesSection.jsx# Per-turf Q&A section
    │   └── Notification.jsx    # Toast notification component
    │
    └── pages/
        ├── Home.jsx            # Browse turfs / Map / Recommendations
        ├── TurfDetail.jsx      # Single turf view with slots + enquiries
        ├── Booking.jsx         # 3-step booking flow + Paystack UI
        ├── Directions.jsx      # GPS directions (Google Maps / Waze)
        └── MyBookings.jsx      # User's booking history
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ (download from https://nodejs.org)
- npm v9+

### Installation

```bash
# 1. Clone or download the project
cd turffield

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
# Opens at http://localhost:3000
```

### Build for Production

```bash
npm run build
# Output goes to /dist folder — deploy to Vercel, Netlify, or any static host
```

### Preview Production Build

```bash
npm run preview
```

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 Auth | Register & login with localStorage persistence |
| 🏟️ Browse Turfs | Search, filter by size, sort by distance / rating / price |
| 📸 Photo Gallery | 4 photos per turf with thumbnails and arrow navigation |
| 🔒 Live Slot Locking | 5-minute countdown lock prevents double-bookings |
| 💬 Enquiries | Per-turf Q&A section with simulated staff replies |
| 💳 Paystack | Full 3-step booking flow with Paystack payment UI |
| 🧭 GPS Directions | Deep-links to Google Maps & Waze with turf coordinates |
| 🎯 Recommendations | Ranked turf suggestions with availability heatmap |
| 📱 Responsive | Mobile app UI (< 900px) + full web layout (≥ 900px) |

---

## 🔧 Tech Stack

- **React 18** — functional components, hooks
- **Vite 5** — fast dev server & build tool
- **React Router DOM 6** — client-side routing (ready to use)
- **CSS Variables** — design token system
- **localStorage** — auth persistence (replace with real API in production)

---

## 🗺️ Future Enhancements (for real deployment)

- Replace localStorage auth with **JWT + backend API** (Node.js / Django)
- Use **Firebase Realtime Database** or **Supabase** for live slot sync
- Integrate real **Paystack Checkout.js SDK**
- Replace mock map with **Google Maps JavaScript API** or **Mapbox**
- Add **admin dashboard** for AMA turf managers
- Push notifications for booking reminders

---

## 👨‍🎓 Final Year Project Info

- **Institution:** [Your University]
- **Student:** [Your Name]
- **Supervisor:** [Supervisor Name]
- **Year:** 2024/2025
