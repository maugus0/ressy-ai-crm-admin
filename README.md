# RessyAI CRM Admin Dashboard

Administration interface for managing restaurants, orders, reservations, menu items, FAQs, escalations, and users in the RessyAI CRM ecosystem.

## Features

- **Restaurant Management** - Create, edit, and manage restaurant profiles
- **Order Management** - View and manage customer orders with real-time updates
- **Reservation Management** - Handle restaurant reservations and bookings
- **Menu Management** - Manage menu items, categories, and bulk updates via CSV
- **FAQ Management** - Create and manage frequently asked questions per restaurant
- **Escalation Management** - Track and manage customer escalations and calls
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

- Node.js (v18 or newer)
- npm (v9 or newer)

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
├── components/          # React components
│   ├── ui/             # Shadcn UI components
│   ├── Header.tsx      # App header with notifications
│   └── Sidebar.tsx     # Navigation sidebar
├── contexts/           # React contexts
│   ├── AuthContext.tsx # Authentication state
│   └── SSEContext.tsx  # Real-time event handling
├── pages/              # Application pages
│   ├── Restaurants.tsx
│   ├── Orders.tsx
│   ├── Reservations.tsx
│   ├── Menu.tsx
│   ├── FAQ.tsx
│   ├── Escalations.tsx
│   └── Users.tsx
├── services/           # API service layer
├── lib/                # Utilities and API client
└── types/              # TypeScript type definitions
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
