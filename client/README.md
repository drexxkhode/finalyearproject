# TurfArena Client

TurfArena is a geo-based astro-turf booking and management system for facilities in the Dome-Kwabenya and Ayawaso West constituencies.

This directory contains the React client application. Users can browse available turfs, view locations and directions, reserve time slots, make payments, manage bookings, and submit reviews or enquiries.

## Features

- User registration, login, OTP verification, logout, and password reset
- Turf browsing with search, filtering, sorting, recommendations, and availability information
- Turf detail pages with image galleries, ratings, reviews, enquiries, and available time slots
- Live slot locking with five-minute countdowns through Socket.IO
- Multi-step booking flow with Paystack payment integration
- Booking history and booking cancellation
- User profile management and email-verification support
- Interactive Leaflet maps and GPS-based turf directions
- Google Maps, Waze, and GraphHopper direction support
- Responsive desktop and mobile layouts
- Toast notifications and mobile bottom navigation

## Technology Stack

- React 18.3
- Vite 7.3
- React Router DOM 7
- Axios
- Socket.IO Client
- React Leaflet and Leaflet Routing Machine
- Bootstrap 5 and Bootstrap Icons
- React Icons
- Paystack Checkout

## Project Structure

```text
client/
├── public/
│   ├── assets/                 # Turf and application images
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── api/
│   │   └── authApi.jsx         # Authentication API requests
│   ├── components/             # Reusable UI components
│   ├── context/
│   │   ├── AuthContext.jsx     # Authentication state
│   │   └── SocketContext.jsx   # Socket.IO connection state
│   ├── data/
│   │   └── turfs.js            # Turf data and local supporting data
│   ├── hooks/
│   │   ├── useNotification.js  # Toast notification helper
│   │   ├── useSlots.js          # Slot loading, locking, and countdown logic
│   │   └── useUserLocation.js   # Browser location helper
│   ├── pages/
│   │   ├── Booking.jsx
│   │   ├── Directions.jsx
│   │   ├── Home.jsx
│   │   ├── Mapview.jsx
│   │   ├── MyBookings.jsx
│   │   ├── Profile.jsx
│   │   └── TurfDetail.jsx
│   ├── partials/               # Shared navigation components
│   ├── routes/
│   │   └── Inner.jsx            # Application routes and protected routes
│   ├── utils/
│   │   └── haversine.js         # Distance calculations
│   ├── App.jsx                  # Application providers and root layout
│   ├── index.css                # Global styles and design tokens
│   └── main.jsx                 # React entry point
├── .env.development             # Development environment configuration
├── .env.production              # Production environment configuration
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Requirements

- Node.js 22 or later
- npm
- A running TurfArena backend API
- Valid third-party service credentials where required

The required Node.js version is specified in `package.json` (`>=22`).

## Installation

From this directory, install the dependencies:

```bash
npm install
```

## Environment Variables

Create or update the appropriate environment file before starting the client.

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_API_URL=http://localhost:5000
VITE_IMAGE_API_URL=
VITE_PAYSTACK_PUBLIC_KEY=
VITE_ORS_API_KEY=
VITE_GRAPHHOPPER_API_KEY=
```

Variable purposes:

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL for REST API requests |
| `VITE_SOCKET_API_URL` | Socket.IO server URL for live slot updates |
| `VITE_IMAGE_API_URL` | Image service or image API URL |
| `VITE_PAYSTACK_PUBLIC_KEY` | Public Paystack checkout key |
| `VITE_ORS_API_KEY` | Optional OpenRouteService directions key |
| `VITE_GRAPHHOPPER_API_KEY` | GraphHopper routing API key |

Do not commit private credentials or secret backend keys. Vite exposes variables prefixed with `VITE_` to the browser, so only public client-side values should be placed there.

## Development

Start the Vite development server:

```bash
npm run dev
```

Vite will display the local development URL in the terminal, normally:

```text
http://localhost:5173
```

## Production Build

Create an optimized production build:

```bash
npm run build
```

The generated files are placed in `dist/` and can be deployed to a static hosting provider such as Vercel, Netlify, or an equivalent service.

Preview the production build locally:

```bash
npm run preview
```

## Application Flow

1. Visitors browse turf listings and view turf details without signing in.
2. A user selects a date and available time slot.
3. The selected slot is temporarily locked through Socket.IO.
4. Authenticated users continue through the booking details and payment steps.
5. Paystack processes the payment using the configured public key.
6. The backend confirms the booking and the booking appears in the user's booking history.

The client stores temporary navigation and booking state in browser storage where necessary, while authentication, booking, payment, reviews, and live availability are handled through the backend services.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build the client for production |
| `npm run preview` | Preview the production build |

## Backend Integration

The client expects the backend to provide authentication, turf, booking, review, enquiry, payment, and Socket.IO endpoints. Ensure that:

- The API URL is reachable from the browser.
- CORS allows the client origin.
- The Socket.IO server allows the client origin and supports the slot events used by `useSlots.js`.
- Paystack callbacks and payment verification are configured on the backend.
- Map and routing API keys are valid for the deployed domain.

## Configuration Notes

- Map tiles and routing services require browser access to their external providers.
- The application uses client-side routing, so the production host must serve `index.html` for unknown application routes.
- The production bundle may be large because the application includes mapping, routing, payment, and UI libraries. Code splitting can be introduced later if initial load performance becomes a concern.

## Troubleshooting

- If API requests fail, verify `VITE_API_URL` and that the server is running.
- If live slot updates do not work, verify `VITE_SOCKET_API_URL`, CORS, and the Socket.IO server.
- If payments or directions fail, check the corresponding public API key and browser-console errors.
- After changing environment variables, restart the Vite development server.

## Project Information

- Project: TurfArena Geo-Based Astro Turf Booking and Management System
- Case study: Dome-Kwabenya and Ayawaso West constituencies
- Project type: Final-year project
