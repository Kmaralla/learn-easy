# Learn-AI - Adaptive AI Learning Platform

## Overview
Learn-AI is an innovative learning platform that teaches AI concepts through an adaptive, quiz-style experience. Instead of traditional module-based courses, it presents one learning card at a time, adapting difficulty based on user performance.

## Current State
Redesigned MVP with:
- Single-card learning experience (no module navigation)
- AI Agents content from Amazon Science (ReAct pattern, Memory, Tools, Multi-agent systems)
- Adaptive difficulty: content adjusts based on user accuracy
- Gamification: credits, streaks, accuracy tracking
- Clean, focused UI with minimal distractions

## Tech Stack
- **Frontend**: React + TypeScript, Vite, TailwindCSS, Shadcn/ui, Framer Motion
- **Backend**: Express.js + TypeScript
- **State**: In-memory storage (MemStorage)
- **Styling**: Custom design system with Inter font

## Learning Flow
1. User sees a **concept card** with theory and key takeaway
2. User clicks "Test Your Knowledge"
3. User answers a **scenario-based question**
4. Immediate feedback with explanation
5. System advances to next card
6. Difficulty adapts based on performance

## Adaptive System
- Beginners see only beginner content initially
- After 80%+ accuracy (3+ questions): unlock intermediate content
- After 90%+ accuracy (6+ questions): unlock advanced content
- System automatically selects appropriate difficulty level

## Content Topics (from Amazon Science AI Agents blog)
1. What is an AI Agent
2. ReAct Pattern (Think, Act, Observe)
3. Agent Memory Systems
4. Tools & APIs
5. Multi-Agent Architecture
6. Agent Safety & Guardrails
7. Code Interpreters

## Project Structure
```
client/
├── src/
│   ├── components/     # UI components
│   ├── pages/
│   │   ├── dashboard.tsx   # Main learning experience
│   │   ├── progress.tsx    # Progress tracking
│   │   └── profile.tsx     # User profile
│   └── App.tsx
server/
├── routes.ts           # API endpoints
├── storage.ts          # Learning cards & adaptive logic
shared/
└── schema.ts           # TypeScript types
```

## API Endpoints
- `GET /api/learn` - Current learning card + user stats
- `POST /api/next-card` - Advance to next card
- `POST /api/answer` - Submit answer and update stats
- `GET /api/user/credits` - Current user credits
- `GET /api/progress` - User progress data
- `GET /api/profile` - User profile with achievements

## Running the App
The app runs on port 5000 with `npm run dev`

## Design System
- Font: Inter (body)
- Theme: Light/dark mode support
- Colors: Blue primary, semantic success/warning colors
- See design_guidelines.md for full specifications
