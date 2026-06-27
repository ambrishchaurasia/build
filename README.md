# BUILD - The Gamified Developer Tracker

BUILD is a gamified **Habit Tracker & Productivity App for Developers**. It integrates automated metrics from LeetCode (solved counters, ranking) and GitHub (commits calendar, repo statistics) alongside subjective, user-defined discipline and fitness goals (Daily Tasks, Projects, Fitness, and Habits).

The app features a beautiful, dynamic mobile UI that turns your daily developer life into a quest-based RPG, allowing you to track your momentum, maintain streaks, and level up your developer persona.

---

## Technical Architecture

* **Mobile App (Frontend)**: React Native, Expo (Expo Router), TypeScript, NativeWind (Tailwind CSS for React Native), and Axios.
* **Backend API**: Node.js, Express.js, TypeScript, and Prisma ORM.
* **Database**: PostgreSQL (Hosted on Render) or local SQLite for development.

---

## Directory Structure

```
build-tracker/
├── backend/
│   ├── prisma/             # Schema definitions
│   ├── src/
│   │   ├── controllers/    # Express REST API controllers
│   │   ├── routes/         # Router definitions
│   │   └── services/       # GitHub, LeetCode, and Scoring services
│   └── .env                # Backend environment variables
│
├── mobile/
│   ├── src/
│   │   ├── app/            # Expo Router screens & layouts (tabs, login)
│   │   ├── components/     # UI Components (DailyTasks, OnboardingTour, AccountArena)
│   │   └── services/       # Axios API integration clients
│   ├── app.json            # Expo configuration
│   └── .env                # Mobile environment variables
│
└── README.md               # This instructions file
```

---

## How to Run Locally

### 1. Launch Backend API Server
Navigate to the `backend/` directory, set up your `.env`, and start the server:

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```
The backend server runs on `http://localhost:5000`.

### 2. Launch Mobile App (Expo)
Open a new terminal window, navigate to the `mobile/` directory, install packages, and boot Expo:

```bash
cd mobile
npm install
npx expo start
```
Scan the QR code shown in your terminal using the **Expo Go** app on your iOS or Android device to instantly run the app on your phone.

---

## Building the APK (Android)

To generate a standalone APK that you can install directly on an Android device:
```bash
cd mobile
eas build --platform android --profile preview
```
*(Note: Requires an Expo account and EAS CLI installed globally)*

---

*crafted_by_ambrish*
