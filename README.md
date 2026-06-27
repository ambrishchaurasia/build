# StudentOS AI

StudentOS AI is a gamified **Habit Tracker & Board of Advisors for Engineering Students**. It integrates automated metrics from LeetCode (solved counters, ranking) and GitHub (commits calendar, repo statistics) alongside subjective, user-defined discipline and fitness goals (POTD, pulling streaks, meditation, No Fap).

AI specialist mentors (Coding Mentor, Project Advisor) and a Master Agent (Life Strategist) analyze this combined data weekly, dynamically generating focus priority weights, wins, neglect risks, and structured action plans to optimize placement readiness.

---

## Technical Architecture

* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4.0, React Router, Recharts, Axios, and TanStack React Query.
* **Backend**: Node.js, Express.js, TypeScript, Prisma ORM, and OpenAI API.
* **Database**: SQLite (configured for zero-setup local execution, easily swappable to PostgreSQL via `prisma/schema.prisma`).

---

## Directory Structure

```
studentos-ai/
├── backend/
│   ├── prisma/             # Schema definitions and SQLite db files
│   ├── src/
│   │   ├── agents/         # AI Advisors (Coding, Project, Life Strategist)
│   │   ├── controllers/    # Express REST API controllers
│   │   ├── middlewares/    # Authentication & Error middlewares
│   │   ├── routes/         # Router definitions
│   │   ├── services/       # GitHub, LeetCode, Scoring, and Report layers
│   │   └── seed.ts         # Seeding script for 10 simulated student profiles
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/          # Arenas (LeetCode, Projects, Fitness, Habits, Coach)
│   │   ├── services/       # Axios API integration clients
│   │   ├── App.tsx         # Layout controller
│   │   └── main.tsx        # Mount configuration
│   ├── vite.config.ts      # Vite proxy configurations
│   └── index.html          # Google Fonts & boilerplate
│
└── README.md               # This instructions file
```

---

## Step-by-Step Local Setup

Follow these commands to run StudentOS AI on your system.

### 1. Database Initialization (Backend)
Navigate to the `backend/` directory, configure your environment, create the database, and seed the profiles:

```bash
# Navigate to backend
cd backend

# Create .env configuration file (optional for OpenAI)
# If OPENAI_API_KEY is not defined, the app falls back to a high-fidelity local advisor engine!
echo JWT_SECRET=studentos-ai-super-secret-key > .env
echo PORT=5000 >> .env

# Generate Prisma Client & push local SQLite database
npx prisma generate
npx prisma db push

# Populate database with 10 mock students (includes 4 weeks of historical reports!)
npm run db:seed
```

### 2. Launch Backend API Server
Start the development server (runs nodemon with hot-reloads):

```bash
# In backend directory
npm run dev
```
The backend server runs on `http://localhost:5000`. You can access the Prisma database visual interface by running `npx prisma studio`.

### 3. Launch Frontend React Application
Open a new terminal window, navigate to the `frontend/` directory, install packages, and boot Vite:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Start Vite dev server
npm run dev
```
The React client runs on `http://localhost:5173`. Vite is pre-configured to proxy `/api` routes straight to the Express backend.

---

## Demo Profiles for Testing

The seeding script generates **10 student profiles** with historical completion charts. Use the following credentials on the login screen:

| Name | Email | Role | LeetCode Solved | Commit Count (30d) | Profile Type |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Aditya Sharma** | `aditya@studentos.ai` | Software Engineer | 340 | 55 | Balanced |
| **Karan Johar** | `karan@studentos.ai` | Software Engineer | 450 | 1 | **Imbalanced (DSA Heavy)** |
| **Sneha Patel** | `sneha@studentos.ai` | AI Engineer | 210 | 48 | AI/ML |
| **Kabir Singh** | `kabir@studentos.ai` | Software Engineer | 45 | 4 | **Slacker** |

* **Password for all accounts**: `password123`

### Key Scenarios to Test:
1. **The Placement Penalty**: Log in as **Karan Johar**. Notice that although his Coding Score is extremely high, his lack of GitHub commits drops his **Placement Readiness** and **Life Balance Score** significantly. Ask the AI Coach: *"Am I placement ready?"* or *"Why is my balance score low?"*
2. **Habit Checking**: Log in as **Aditya Sharma**. Navigate to the **Habits Board** or **LeetCode** tabs and click checkboxes to mark today's tasks as completed. Watch your Flame Streak, XP Coins, and level progress bar increment in real-time.
3. **AI Reports**: Go to the **AI Advisor** tab, click **Generate Report** to manually compile today's stats, and click on the generated report to inspect your Wins, Neglected Risks, and next week's focus allocation chart.
