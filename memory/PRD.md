# EduTrack Parent — PRD

## Overview
A React Native (Expo) parent-facing mobile app for K-12 schools. Parents log in with school + student name + password to track their child's school activities in one place.

## Stack
- **Frontend**: Expo SDK 54, expo-router, TypeScript, react-native-safe-area-context, expo-blur, expo-image, expo-haptics, expo-linear-gradient, expo-notifications.
- **Backend**: FastAPI (Python), Motor (MongoDB async), httpx.
- **AI**: Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`) via `emergentintegrations` + Emergent LLM key.
- **Push**: Emergent-managed push notifications (works only on dev/standalone builds, not Expo Go).
- **Auth**: Simple school-name + student-name + password (auto-generated) login. Sessions persisted via SecureStore (mobile) / AsyncStorage (web).

## Features
1. **Login** — School + Student Name + Password (`POST /api/auth/login`). Demo accounts toggle visible from login screen.
2. **Home Dashboard** — Today's attendance %, next class, quick-actions row (homework, fees, attendance, leave, AI, updates), pending homework, latest announcement, reminders.
3. **Schedule** — Weekly timetable per day (Mon–Fri) + segmented exam timetable view.
4. **Homework** — Subject-iconed cards with due dates and "open AI helper" sticky CTA.
5. **Announcements** — School-wide updates (holidays, events, activities, notices).
6. **Attendance Tracker** — 30-day daily log + overall % + present/absent/leave stats.
7. **Fees** — Invoices by quarter, paid/due/upcoming pills, sticky "Pay due now" CTA (`POST /api/fees/pay`).
8. **Bus Tracker** — Simulated live map with animated bus marker, ETA, pickup/drop times, route stops, driver card with tap-to-call.
9. **Leave Request** — Apply for leave + view past requests with status.
10. **AI Homework Helper** — Multi-turn chat with Claude Sonnet 4.5 (`POST /api/ai/chat-sync`), context-aware for student's class.
11. **Push Notifications** — Device registers via `POST /api/register-push`; backend triggers via `send_push()` on fee payment and leave submission.

## Backend Endpoints
- `POST /api/auth/login`
- `GET /api/student/{id}`, `GET /api/students`
- `GET /api/homework/{student_id}`
- `GET /api/timetable/{student_id}`
- `GET /api/exams/{student_id}`
- `GET /api/announcements/{school_id}`
- `GET /api/fees/{student_id}`, `POST /api/fees/pay`
- `GET /api/bus/{student_id}`
- `GET /api/attendance/{student_id}`
- `GET /api/leaves/{student_id}`, `POST /api/leaves`
- `GET /api/reminders/{student_id}`
- `POST /api/ai/chat-sync` (non-streaming, simpler for mobile)
- `GET /api/ai/messages/{student_id}`
- `POST /api/register-push`

## MongoDB Collections
schools, students, homework, timetable, exams, announcements, fees, bus_info, attendance, leaves, chat_messages.

## Seed Data
On first startup (empty DB), seeds 1 school + 3 students with full data:
homework, timetable (Mon–Fri), 5 mid-term exams, 4 announcements, 4 quarterly fees, bus info with route stops, 30 days of attendance, 1 past leave.

## Design
Sage Green palette (#5C785A brand), iOS-Native Clean personality. No emojis. No blue/purple. Phosphor-style icons via `@expo/vector-icons` (Ionicons). Hero image only on login.
