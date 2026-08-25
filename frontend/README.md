# TurfArena Frontend

This directory contains the TurfArena administration dashboard for Turf Managers, Staff users, and Super Admins. It is a React single-page application that communicates with the TurfArena server over REST APIs and Socket.IO.

## Features

- Role-based authentication for Managers, Staff, and Super Admins
- Protected dashboard and profile routes
- Turf manager administration, bookings, enquiries, slots, reports, payments, settings, and gallery management
- Super Admin management of turfs, turf managers, system users, reviews, and Super Admin accounts
- Turf profile and administrator profile viewing/editing
- Turf location selection with Leaflet maps and draggable markers
- Charts, analytics, tables, notifications, loading states, and toast messages
- Password reset, password changes, profile updates, and profile photo management
- Live Socket.IO analytics and administrative notifications

## Technology Stack

- React 19
- Create React App / `react-scripts`
- React Router DOM 7
- Axios
- Socket.IO Client
- Leaflet and React Leaflet
- Bootstrap 5 and Bootstrap Icons
- ApexCharts and React ApexCharts
- React Data Table Component
- React Big Calendar
- React Toastify and React Spinners

## Project Structure

```text
frontend/
├── public/
│   ├── assets/                 # Bootstrap, CSS, fonts, icons, flags, and images
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/             # Analytics, maps, charts, and shared widgets
│   ├── pages/
│   │   ├── Layout/
│   │   │   ├── TurfManager/    # Manager and Staff screens
│   │   │   └── SuperAdmin/     # Super Admin screens
│   │   ├── Dashboard.js
│   │   ├── Login.js
│   │   └── Profile.js          # Role-based profile router
│   ├── partials/               # Navbar, Sidebar, Hero, and Footer
│   ├── services/               # Protected routes and search service
│   ├── App.js                  # Application routes and layout
│   ├── index.css               # Global styles
│   └── index.js                # React entry point
├── .env.development
├── .env.production
├── package.json
└── README.md
```

## Requirements

- Node.js and npm
- A running TurfArena server
- The server API URL configured in the environment files

## Installation

From this directory:

```bash
npm install
```

## Environment Variables

The application reads the API URL through Create React App environment variables:

```env
REACT_APP_URL=http://localhost:5000
```

`REACT_APP_URL` is used as the base URL for REST requests. Most files fall back to `http://localhost:5000` when the variable is unavailable.

Do not place private secrets in frontend environment files. Values beginning with `REACT_APP_` are included in the browser bundle.

## Development

Start the development server:

```bash
npm start
```

The app normally runs at `http://localhost:3000`.

## Production Build

Create an optimized build:

```bash
npm run build
```

The output is generated in `build/` and can be served by a static web server. Because the app uses client-side routing, the host must redirect unknown routes to `index.html`.

## Available Scripts

| Command | Description |
|---|---|
| `npm start` | Start the development server |
| `npm run dev` | Alias for the development server |
| `npm run build` | Create a production build |
| `npm test` | Run the test watcher |
| `npm run eject` | Eject Create React App configuration |

## Authentication and Roles

After login, the frontend stores the JWT and user information in `localStorage` under `token` and `user`. `ProtectedRoute` checks authentication and role access before rendering protected pages.

The main role groups are:

- `Manager` and `Staff`: turf operations and administration
- `Super_admin`: system-wide turf and user administration

The backend remains responsible for enforcing authorization. Frontend route guards are for user experience and must not be treated as the security boundary.

## API Integration

The frontend expects the server to provide endpoints for authentication, turf details, bookings, slots, payments, enquiries, reviews, images, reports, analytics, and user management. Requests generally send the JWT using:

```http
Authorization: Bearer <token>
```

Socket.IO is used for live administrative notifications, analytics, and slot updates.

## Troubleshooting

- If requests fail, confirm that the server is running and `REACT_APP_URL` is correct.
- If authentication appears stale, clear the browser `token` and `user` entries from local storage and sign in again.
- If a role cannot open a page, verify the stored user role and the server authorization middleware.
- If map functionality fails, confirm that Leaflet dependencies are installed and that the browser can reach OpenStreetMap tiles.
- Restart the Create React App development server after changing environment variables.

## Related Applications

- `client/` — public turf discovery and booking application
- `server/` — REST API, authentication, database integration, and Socket.IO services
