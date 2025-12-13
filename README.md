# RessyAI CRM Admin Dashboard

This project is the administration interface for RessyAI's CRM portals. It provides tools and panels for managing clients, billing rules, onboarding, settings, and tiers within the CRM ecosystem.

## Features

- Client management and overview
- Billing rules configuration
- Onboarding workflow
- Settings management
- Tiered access and badges
- Modern UI components (React + Tailwind CSS)
- JWT authentication with automatic token refresh

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Query

## Getting Started

### Prerequisites

- Node.js (v18 or newer recommended)
- npm (v9 or newer recommended)

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

### Running the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:8080`.

### Building for Production

```bash
npm run build
```

## Environment Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:5001` |
| `VITE_API_VERSION` | API version prefix | `v1` |

For production, update `.env.local`:
```env
VITE_API_BASE_URL=https://api.ressy.ai
```

## Project Structure

```
src/
├── config/
│   └── env.ts                # Environment configuration
├── lib/
│   ├── api/
│   │   ├── client.ts         # API client with auth handling
│   │   └── endpoints.ts      # Centralized endpoint definitions
│   └── utils.ts              # Utility functions
├── types/
│   └── auth.types.ts         # API type definitions
├── services/
│   └── auth.ts               # Authentication service
├── contexts/
│   └── AuthContext.tsx       # Auth context with token refresh
├── components/
│   ├── ui/                   # Base UI components (shadcn/ui)
│   └── ...                   # Feature components
├── pages/                    # Application pages
└── hooks/                    # Custom React hooks
```

## Authentication

The application integrates with the backend authentication API:

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/auth/admin/login` | Admin login |
| `POST /api/v1/auth/refresh` | Refresh access token |
| `POST /api/v1/auth/logout` | Logout |

### Token Management

- Access tokens are stored in localStorage
- Tokens are automatically refreshed every 10 minutes
- If a token expires or refresh fails, the user is logged out

## Deployment to GitHub Pages

This project is configured for automatic deployment to GitHub Pages using GitHub Actions.

### Setup Instructions

1. **Enable GitHub Pages in your repository:**
   - Go to your repository settings
   - Navigate to "Pages" in the left sidebar
   - Under "Source", select "GitHub Actions"

2. **Push to main/master branch:**
   - The GitHub Actions workflow will automatically build and deploy your site
   - The workflow runs on push to `main` or `master` branches

3. **Access your deployed site:**
   - Your site will be available at: `https://<username>.github.io/<repository-name>/`

### Manual Deployment

```bash
npm run deploy
```

## License

This project is proprietary to RessyAI.
