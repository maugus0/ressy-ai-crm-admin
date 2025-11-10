# RessyAI CRM Admin Portal

This project is the administration interface for RessyAI's CRM portals. It provides tools and panels for managing clients, billing rules, onboarding, settings, and tiers within the CRM ecosystem.

## Features
- Client management and overview
- Billing rules configuration
- Onboarding workflow
- Settings management
- Tiered access and badges
- Modern UI components (React + Tailwind CSS)
- Authentication system with protected routes

## Tech Stack
- React
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

### Running the Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:8080` (configured port).

### Building for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

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
   - The base path is automatically configured based on your repository name

### Manual Deployment

You can deploy manually using the `deploy` script:

```bash
npm run deploy
```

This will:
1. Build the project with the correct base path for GitHub Pages
2. Deploy the `dist` folder to the `gh-pages` branch

**Note:** Make sure your repository name matches the base path in `build:gh-pages` script. If your repository has a different name, either:
- Update the base path in the `build:gh-pages` script in `package.json`, or
- Use the custom deploy script: `REPO_NAME=your-repo-name npm run deploy:custom`

**First-time setup:** You may need to configure git remote if not already set:
```bash
git remote add origin https://github.com/<username>/<repo-name>.git
```

### Authentication

The application uses mocked authentication. Default credentials:
- **Email**: `ressy@admin.com`
- **Password**: `Ressy123`

## Project Structure
- `src/` — Main source code
  - `components/` — UI components
  - `contexts/` — React contexts (Auth)
  - `hooks/` — Custom React hooks
  - `lib/` — Utility functions
  - `pages/` — Application pages
  - `services/` — Service modules (Auth)
- `public/` — Static assets
- `.github/workflows/` — GitHub Actions workflows
- `index.html` — Main HTML file

## License
This project is proprietary to RessyAI.
