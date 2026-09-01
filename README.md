# TurfArena

TurfArena is a geo-based astro-turf booking and management system for turf facilities in the Dome-Kwabenya and Ayawaso West constituencies.

The application is organized into three cooperating applications:

- `client/` — public customer application for finding turfs, checking availability, booking slots, paying, and managing bookings.
- `frontend/` — administration dashboard for Turf Managers, Staff, and Super Admins.
- `server/` — Express API, authentication, database integration, payments, uploads, search, scheduled jobs, and Socket.IO services.

## Main Capabilities

### Public Client

- Browse and search turf facilities
- View turf locations, galleries, ratings, and enquiries
- Use maps and directions
- View real-time slot availability
- Temporarily lock slots during booking
- Pay through Paystack
- View, cancel, and manage bookings
- Submit turf and system reviews
- Manage profile details and verification

### Administration Dashboard

- Manager and Staff authentication
- Turf details, location, gallery, and settings management
- Administrator registration and management
- Booking, payment, and operational reports
- Enquiry replies and notifications
- Slot creation, editing, deletion, and bulk management
- Super Admin management of turfs, turf owners, managers, users, reviews, and system settings
- Analytics dashboards and live operational updates

## Architecture

```text
                         ┌─────────────────────┐
                         │   Public Client      │
                         │   React + Vite       │
                         └──────────┬──────────┘
                                    │ REST / Socket.IO
                         ┌──────────▼──────────┐
                         │       Server         │
                         │ Express + Socket.IO  │
                         └──────┬─────┬─────┬───┘
                                │     │     │
                         ┌──────▼┐ ┌──▼──┐ ┌▼────────┐
                         │ MySQL │ │Redis│ │External │
                         │       │ │     │ │Services │
                         └───────┘ └─────┘ │Paystack │
                                            │Cloudinary│
                                            │Meili/email│
                                            └─────────┘
                                    ▲
                         REST / Socket.IO
                                    │
                         ┌─────────┴─────────┐
                         │ Admin Frontend     │
                         │ React + CRA        │
                         └────────────────────┘
```

## Technology Overview

| Area | Technologies |
|---|---|
| Public application | React 18, Vite, React Router, Leaflet, Bootstrap |
| Admin application | React 19, Create React App, React Router, Leaflet, ApexCharts, Bootstrap |
| Backend | Node.js, Express, Socket.IO |
| Database | MySQL via `mysql2` |
| Cache/coordination | Redis |
| Authentication | JWT and bcryptjs |
| Payments | Paystack |
| Images | Cloudinary and Multer |
| Search | Meilisearch |
| Email | Nodemailer/Brevo integration |

## Repository Structure

```text
Final_Year_Project/
├── client/       # Public customer-facing application
├── frontend/     # Turf Manager, Staff, and Super Admin dashboard
├── server/       # API and real-time backend
├── backend/      # Additional backend/project resources, if used by deployment
├── tests/        # Test and integration resources
├── .gitignore
└── README.md
```

Each application contains its own README with more detailed setup and implementation information.

## Requirements

- Node.js and npm
- MySQL
- Redis recommended for caching and coordination
- Cloudinary account for image uploads
- Meilisearch instance for turf search
- Paystack account for payment processing
- Email provider credentials for verification and notifications

## Installation

Install dependencies in each application directory:

```bash
cd server
npm install

cd ../client
npm install

cd ../frontend
npm install
```

Configure the server environment before starting the applications. The server README contains the complete environment-variable reference. The browser applications use their respective `REACT_APP_*` or `VITE_*` variables for API and service URLs.

## Running Locally

Start the backend first:

```bash
cd server
npm run dev
```

Start the public client in a second terminal:

```bash
cd client
npm run dev
```

Start the administration frontend in a third terminal:

```bash
cd frontend
npm start
```

Typical local addresses:

| Application | Address |
|---|---|
| Server API | `http://localhost:5000` |
| Public client | `http://localhost:5173` |
| Admin frontend | `http://localhost:3000` |

The actual address may vary depending on occupied ports and environment configuration.

## Environment Configuration

Do not commit secrets to the repository.

The server requires configuration for:

- MySQL connection
- JWT signing and expiry
- Redis URL
- Cloudinary credentials
- Paystack test/live public and secret keys
- Email provider credentials
- Server port and allowed client origins

The public client commonly uses:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_API_URL=http://localhost:5000
```

The administration frontend commonly uses:

```env
REACT_APP_URL=http://localhost:5000
```

Only public browser-safe values should be exposed through client or frontend environment variables.

## Authentication and Data Flow

1. A user authenticates through the public client or administration frontend.
2. The server validates credentials and returns a JWT.
3. The browser stores the session token and user information locally.
4. Protected REST requests send the token as a Bearer authorization header.
5. Socket.IO connections authenticate with the same token.
6. MySQL stores users, turfs, bookings, slots, reviews, payments, and related records.
7. Redis supports caching and coordination where available.

The server is the security boundary. Client-side route guards improve navigation but do not replace backend authorization.

## Important Operational Notes

- Paystack webhooks must be publicly reachable in deployed environments and must use the configured secret.
- CORS must include the deployed public client and admin dashboard origins.
- Socket.IO must allow the origins used by both React applications.
- Client-side routing requires the deployment host to serve `index.html` for unknown frontend routes.
- Map tiles and routing services require network access from the browser.
- Redis is optional in the current server implementation, but it is recommended for production.
- Use HTTPS in production.

## Production Builds

Build the public client:

```bash
cd client
npm run build
```

Build the administration frontend:

```bash
cd frontend
npm run build
```

The server runs directly with Node/Nodemon using the scripts defined in `server/package.json`.

## Documentation

- [Public client README](client/README.md)
- [Admin frontend README](frontend/README.md)
- [Server README](server/README.md)

## Project Information

- Project: TurfArena Geo-Based Astro Turf Booking and Management System
- Case study: Dome-Kwabenya and Ayawaso West constituencies
- Project type: Final-year project
