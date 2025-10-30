# RessyAI CRM Admin Portal

This project is the administration interface for RessyAI's CRM portals. It provides tools and panels for managing clients, billing rules, onboarding, settings, and tiers within the CRM ecosystem.

## Features
- Client management and overview
- Billing rules configuration
- Onboarding workflow
- Settings management
- Tiered access and badges
- Modern UI components (React + Tailwind CSS)

## Tech Stack
- React
- TypeScript
- Vite
- Tailwind CSS
- Bun (lockfile)

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

### Running the Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:5173` (default Vite port).

### Building for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Project Structure
- `src/` — Main source code
  - `components/` — UI components
  - `hooks/` — Custom React hooks
  - `lib/` — Utility functions
  - `pages/` — Application pages
- `public/` — Static assets
- `index.html` — Main HTML file

## License
This project is proprietary to RessyAI.
