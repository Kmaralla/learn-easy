# Learn-AI - Interactive AI Learning Platform

## Overview
Learn-AI is an innovative learning platform that teaches AI concepts through interactive scenarios, real-world examples, and adaptive learning paths. Users earn credits while progressing through lessons and modules.

## Current State
MVP is complete with the following features:
- Dashboard with progress tracking, stats (credits, streak, accuracy)
- Interactive learning flow: Theory -> Scenario-based Questions -> Completion
- Gamification: Credits earned per correct answer, streak tracking
- 4 learning modules with 5 lessons covering AI fundamentals and Machine Learning
- Adaptive difficulty display (beginner/intermediate/advanced badges)
- Beautiful, responsive UI with dark/light theme support

## Tech Stack
- **Frontend**: React + TypeScript, Vite, TailwindCSS, Shadcn/ui components
- **Backend**: Express.js + TypeScript
- **State**: In-memory storage (MemStorage)
- **Styling**: Custom design system with Inter font

## Project Structure
```
client/
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── app-sidebar.tsx
│   │   ├── credit-reward.tsx
│   │   ├── difficulty-badge.tsx
│   │   ├── empty-state.tsx
│   │   ├── lesson-complete.tsx
│   │   ├── lesson-progress.tsx
│   │   ├── module-card.tsx
│   │   ├── progress-ring.tsx
│   │   ├── question-card.tsx
│   │   ├── stats-bar.tsx
│   │   ├── streak-calendar.tsx
│   │   ├── theory-section.tsx
│   │   ├── theme-provider.tsx
│   │   └── theme-toggle.tsx
│   ├── pages/          # Page components
│   │   ├── dashboard.tsx
│   │   ├── lesson.tsx
│   │   ├── module-detail.tsx
│   │   ├── modules.tsx
│   │   ├── profile.tsx
│   │   ├── progress.tsx
│   │   └── not-found.tsx
│   ├── App.tsx
│   └── index.css
server/
├── routes.ts           # API endpoints
├── storage.ts          # In-memory data storage with sample content
└── index.ts
shared/
└── schema.ts           # TypeScript types and Zod schemas
```

## API Endpoints
- `GET /api/dashboard` - Dashboard data with user stats and modules
- `GET /api/user/credits` - Current user credits
- `GET /api/modules` - All modules with progress
- `GET /api/modules/:id` - Module detail with lessons
- `GET /api/lessons/:id` - Lesson with questions
- `POST /api/answer` - Submit answer and update stats
- `POST /api/complete-lesson` - Mark lesson complete
- `GET /api/progress` - User progress page data
- `GET /api/profile` - User profile with achievements

## Sample Data
The app includes pre-loaded content:
- 4 Modules: Introduction to AI, ML Basics, AI Agents, Prompt Engineering
- 5 Lessons with comprehensive theory sections
- 10+ scenario-based questions with explanations
- Default user with some initial progress

## Running the App
The app runs on port 5000 with `npm run dev`

## Design System
- Font: Inter (body), JetBrains Mono (code)
- Theme: Supports light/dark mode
- Colors: Blue primary (#3B82F6), semantic success/warning colors
- See design_guidelines.md for full design specifications
