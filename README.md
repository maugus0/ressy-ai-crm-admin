# RessyAI CRM Admin Dashboard

Administration interface for managing restaurants, orders, reservations, menu items, FAQs, escalations, callers, and users in the RessyAI CRM ecosystem.

## Features

- **Restaurant Management** - Create, edit, and manage restaurant profiles with per-day operating hours, timezone (searchable dropdown), agent capabilities (orders, reservations, FAQs), and integrations (Twilio, Deepgram, OpenTable)
- **Order Management** - View and manage customer orders with real-time updates
- **Reservation Management** - Handle restaurant reservations and bookings; day-aware validation against operating hours
- **Menu Management** - Manage menu items, categories, and bulk updates via CSV
- **FAQ Management** - Create and manage frequently asked questions per restaurant
- **Escalation Management** - Track and manage customer escalations and calls
- **Calls & Callers** - View call history and caller (customer) data
- **User Management** - Admin and user account management
- **Real-time Notifications** - Server-Sent Events (SSE) for live updates with sound alerts
- **Mobile Responsive** - Fully responsive design for all screen sizes
- **JWT Authentication** - Secure authentication with automatic token refresh

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Shadcn UI** components
- **Server-Sent Events (SSE)** for real-time updates
- **Web Audio API** for notification sounds

## Getting Started

### Prerequisites

- Node.js (v20.19 or newer; see `.nvmrc`)
- npm (v10 or newer)

### Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd ressy-ai-crm-admin
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env.local
   ```

4. Update `.env.local` with your API settings:
   ```env
   VITE_API_BASE_URL=http://localhost:5001
   VITE_API_VERSION=v1
   ```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:8080`.

### Build

```bash
npm run build
```

### Other Scripts

| Command | Description |
|---------|-------------|
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check formatting without writing |
| `npm run test` | Run Vitest tests |
| `npm run preview` | Preview production build locally |

## Environment Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:5001` (fallback) |
| `VITE_API_VERSION` | API version prefix | `v1` |

### Production Deployment

For GitHub Pages deployment, set environment variables in GitHub Actions:
- Go to Repository → Settings → Secrets and variables → Actions
- Add `VITE_API_BASE_URL` and `VITE_API_VERSION` as repository variables

The CI/CD workflow will automatically build and deploy to GitHub Pages.

## Project Structure

```
src/
├── components/              # React components
│   ├── ui/                 # Shadcn UI components (command, popover, timezone-combobox, etc.)
│   ├── Header.tsx          # App header with notifications
│   ├── ProtectedRoute.tsx  # Auth guard for routes
│   └── Sidebar.tsx         # Navigation sidebar
├── config/                 # App configuration (env)
├── contexts/
│   ├── AuthContext.tsx     # Authentication state
│   └── SSEContext.tsx      # Real-time event handling
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities and API client
│   ├── api/                # API client and endpoints
│   └── utils/              # timezone, time, json, tokenRefresh, etc.
├── pages/
│   ├── Login.tsx
│   ├── Restaurants.tsx     # Per-day hours, agent capabilities, timezone combobox
│   ├── Orders.tsx
│   ├── Reservations.tsx    # Day-aware operating hours validation
│   ├── Menu.tsx
│   ├── FAQ.tsx
│   ├── Escalations.tsx
│   ├── Callers.tsx
│   ├── Calls.tsx
│   ├── Users.tsx
│   └── NotFound.tsx
├── services/               # API service layer
└── types/                  # TypeScript type definitions (api.types, auth.types)
```

## Authentication

- Admin login via `/api/v1/auth/admin/login`
- Automatic token refresh every 10 minutes
- Tokens stored in localStorage
- Auto-logout on token expiration

## Real-time Features

- **SSE Connection** - Live updates for orders, reservations, and escalations
- **Notification Sounds** - Custom audio alerts for different event types
- **Connection Status** - Monitor active SSE connections (admin only)

## License

Proprietary - RessyAI
