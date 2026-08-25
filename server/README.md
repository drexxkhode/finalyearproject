# TurfArena Server

This directory contains the TurfArena backend API. It provides authentication, turf management, bookings, payments, slot availability, reviews, enquiries, image uploads, search, scheduled jobs, and real-time Socket.IO services for the public client and administration frontend.

## Technology Stack

- Node.js with Express 5
- MySQL through `mysql2`
- JWT authentication
- bcryptjs password hashing
- Socket.IO real-time communication
- Redis caching and coordination, with graceful fallback when unavailable
- Cloudinary image storage
- Meilisearch turf search
- Paystack payment webhooks and verification
- Nodemailer/Brevo email delivery
- Multer file uploads
- Node Cron scheduled tasks

## Project Structure

```text
server/
├── config/                    # Database, JWT, Cloudinary, Redis, and search setup
├── controllers/               # HTTP request handlers and business logic
├── middleware/                # Authentication, uploads, rate limits, and sockets
├── routes/
│   ├── admin/                 # Manager and Staff administration endpoints
│   ├── client/                # Public-user authentication, booking, reviews, enquiries
│   ├── super/                 # Super Admin endpoints
│   └── turf/                  # Turf, map, image, and search endpoints
├── sockets/                   # Analytics, slot locks, and notifications
├── service/                   # Mail and scheduled services
├── utils/                     # Email, search sync, review prompts, and helpers
├── models/                    # Search configuration
├── images/                    # Local image assets
├── server.js                  # Express and Socket.IO entry point
├── package.json
└── README.md
```

## Requirements

- Node.js
- npm
- MySQL database
- Redis is recommended but optional
- Cloudinary account for profile and turf images
- Meilisearch instance for turf search
- Paystack account for payments
- Email provider credentials for notifications and password recovery

## Installation

From this directory:

```bash
npm install
```

## Environment Variables

Create a `server/.env` file. Never commit it to source control.

```env
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=turfarena

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES=7d

REDIS_URL=redis://localhost:6379

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

PAYSTACK_SECRET_KEY=your_paystack_secret

BREVO_API_KEY=your_brevo_key
SENDER_EMAIL=you@example.com
SENDER_NAME=TurfArena

REACT_APP_URL=http://localhost:5000
```

The checked-in environment file may contain additional deployment or test variables. Keep those values private and use the variable names expected by the configuration and controllers.

## Running the Server

Start the development server with Nodemon:

```bash
npm run dev
```

The default port is `5000`. The server binds to `0.0.0.0` so it can be reached by other devices on the configured network.

The root endpoint returns a basic status message:

```text
GET http://localhost:5000/
```

The health endpoint is:

```text
GET http://localhost:5000/api/health
```

## API Route Groups

| Prefix | Responsibility |
|---|---|
| `/api/auth` | Turf Manager and Staff authentication, profiles, administrators, and passwords |
| `/api/users` | Public client authentication, profiles, user administration, and photos |
| `/api/turf` | Turf details, dashboards, turf listings, updates, images, and search |
| `/api/map` | Map and turf direction data |
| `/api/bookings` | Booking creation, history, cancellation, deletion, and Paystack webhook handling |
| `/api/slots` | Public slot reads and protected slot administration |
| `/api/admin` | Manager booking reports, dashboard totals, and payment history |
| `/api/enquiries` | Client enquiries and administrator replies |
| `/api/reviews` | Turf reviews, system reviews, and pending review prompts |
| `/api/payments` | Administrative payment history and reporting |
| `/api/super` | Super Admins, turf managers, turf registration, system reviews, and analytics |
| `/api/health` | Database and service health checks |

Protected endpoints generally require:

```http
Authorization: Bearer <jwt_token>
```

## Real-Time Services

The Socket.IO server supports:

- Turf room joining and leaving
- Temporary slot locks and lock expiry
- Booking confirmation broadcasts
- Administrative notification rooms
- Monthly booking analytics

Socket authentication uses the JWT supplied in the Socket.IO handshake. The client should connect to the same host and port as the API unless deployment configuration separates them.

## Database and Caching

The server uses a MySQL connection pool configured through `server/config/db.js`. Redis is optional: when `REDIS_URL` is missing or unavailable, cache operations safely degrade to no-ops and the application continues using MySQL.

Important data areas include users, admins, Super Admins, turfs, turf images, time slots, bookings, payments, enquiries, reviews, and slot locks.

## File Uploads

Multer handles incoming image uploads. Profile and turf images are uploaded to Cloudinary, while the server also exposes local `/uploads` and `/images` static paths for local assets.

## Security Notes

- Keep JWT, database, Cloudinary, Paystack, Redis, and email credentials out of source control.
- Configure CORS for only the deployed client origins in production.
- Keep backend authorization middleware enabled on all administrative routes.
- Use HTTPS in production so JWTs and payment-related requests are protected in transit.
- Validate webhook signatures and keep Paystack secrets server-side.
- Avoid logging secrets, authorization headers, or complete tokens.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start `server.js` with Nodemon |
| `npm start` | Start `server.js` with Nodemon |

## Related Applications

- `client/` — public turf browsing and booking application
- `frontend/` — Turf Manager, Staff, and Super Admin dashboard
