# Solo Leveling System

![Solo Leveling System](https://raw.githubusercontent.com/rriyansh/SoloLevelingSystem/main/public/favicon.png)

Solo Leveling System is a gamified productivity app that turns personal goals into quests. Create projects, complete daily tasks, earn XP, build streaks, and track your progress through a hunter-style ranking system.

## What it includes

- Quest and project tracking with progress, XP, levels, and completion states
- Daily tasks, check-ins, reminders, streaks, and bonus XP
- AI assistant for guidance and quest breakdowns
- Google, GitHub, Apple, and email authentication
- Authenticator-app MFA, email verification, idle logout, and session revocation
- Firebase-backed user data with owner-based Firestore security rules
- Server-side Gemini requests with request validation and rate limiting
- Responsive dark and light themes with animated progress interactions
- PWA support with shortcuts for New Quest and Today's Tasks

## Tech stack

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase&logoColor=black)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI-4285F4?logo=google&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-validation-3E67B1?logo=zod&logoColor=white)

## Run locally

### 1. Clone and install

```bash
git clone https://github.com/rriyansh/SoloLevelingSystem.git
cd SoloLevelingSystem
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and set the Firebase values for your project. Keep `GEMINI_API_KEY` server-side. Do not add a `VITE_GEMINI_API_KEY` value.

```env
GEMINI_API_KEY=your_gemini_api_key
APP_URL=http://localhost:3000

VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

### 3. Start the development server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Available scripts

```bash
npm run dev       # Start the Express and Vite development server
npm run build     # Create a production build
npm run start     # Start the production server
npm run lint      # Run TypeScript checks
npm run analyze   # Build with bundle analysis enabled
```

## Security notes

Firestore rules restrict documents to their owning user. API routes require a verified Firebase ID token, validate request bodies with Zod, apply rate limits, and use security headers. Configure Firebase Admin credentials on the server before deploying the protected API routes.

## Project structure

```text
api/           Vercel API handlers
backend/       Server security and Firebase Admin helpers
public/        PWA assets and manifest
src/components Reusable interface components
src/contexts   Authentication and application state
src/lib        Validation and shared utilities
src/pages      Application screens
src/services   Client API services
```

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
