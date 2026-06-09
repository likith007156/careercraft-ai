# CareerCraft AI - Personal Career Preparation Platform

CareerCraft AI is a premium, AI-powered preparation platform designed to help students transition from foundational knowledge to advanced readiness for top IT company selection processes. The platform is optimized for companies like **Cognizant, TCS, Infosys, Wipro, Accenture, Amazon, and Google**.

Built with a modern, editorial Steep light theme design system (and a toggleable classic dark theme fallback), CareerCraft AI guides users through automated diagnostic assessments, daily schedules, flashcards, quizzes, coding laboratories, communication coaching, simulated group discussions, and mock interviews.

---

## 🛠️ Tech Stack

* **Frontend**: React (Vite) + Tailwind CSS v3
* **Backend**: Python Flask API
* **AI Engine**: Claude API (`claude-sonnet-4-20250514` model with offline mock fallbacks)
* **Database**: SQLite (SQL query compatibility across Python models)
* **Charts**: Chart.js (via `react-chartjs-2`)
* **Code Editor**: Monaco Editor (`@monaco-editor/react`)
* **Speech Processing**: Web Speech API (Text-to-Speech & Speech-to-Text)

---

## 📋 Prerequisites

To run CareerCraft AI locally, ensure you have the following installed:
* **Node.js**: version 18.0.0 or higher
* **Python**: version 3.9.0 or higher
* **npm**: package manager (usually bundled with Node.js)

---

## ⚙️ Step-by-Step Setup Instructions

### 1. Clone the repository and navigate to the project directory:
```bash
cd "My Assistant"
```

### 2. Configure the Backend:
```bash
# Navigate to backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate virtual environment
# On Windows (Command Prompt):
venv\Scripts\activate.bat
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On macOS/Linux:
source venv/bin/activate

# Install required packages
pip install -r requirements.txt

# Create a .env file in the backend/ folder and add your Anthropic API Key:
# ANTHROPIC_API_KEY=your_actual_claude_api_key
# FLASK_ENV=development
```

### 3. Run the Backend Server:
```bash
python -m backend.app
# Server will start on http://127.0.0.1:5000
```

### 4. Configure and Run the Frontend:
Open a new terminal session, then run:
```bash
# Navigate to frontend directory
cd frontend

# Install packages
npm install

# Start development server
npm run dev
# App will open on http://localhost:5173/
```

---

## 📁 Project Folder Structure

```
/
├── backend/
│   ├── database/          # SQLite database storage (careercraft.db)
│   ├── models/            # Database schemas & SQL queries (database.py)
│   ├── routes/            # Flask Blueprints (dashboard, quiz, progress, etc.)
│   ├── services/          # Claude API helper client (claude_service.py)
│   ├── app.py             # Flask application entry point
│   ├── requirements.txt   # Python dependencies listing
│   └── .env               # Environment secrets (ignored by Git)
├── frontend/
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable widgets and layouts
│   │   ├── pages/         # Page components (Dashboard, Quiz, Learn, etc.)
│   │   ├── utils/         # API connection utilities (api.js)
│   │   ├── context/       # React Context (AppContext.jsx)
│   │   ├── index.css      # Core theme stylings & Steep tokens
│   │   └── main.jsx       # Client entry point
│   ├── tailwind.config.js # Tailwind CSS configuration mappings
│   ├── package.json       # Node dependency listing
│   └── vite.config.js     # Vite configuration
├── README.md              # Project documentation
└── .gitignore             # Untracked git files listing
```

---

## 🚀 Deployment Instructions

### Backend (Render Deployment)
1. **Prepare Repo**: Ensure code is committed to a GitHub repository.
2. **Setup on Render**:
   - Go to [render.com](https://render.com) and create an account.
   - Click **New +** and select **Web Service**.
   - Connect your GitHub repository.
   - Set **Root Directory** to `backend`.
   - Set **Runtime** to `Python`.
   - Set **Build Command** to `pip install -r requirements.txt`.
   - Set **Start Command** to `gunicorn app:app --bind 0.0.0.0:$PORT`.
3. **Environment Variables**:
   - In the service's Environment tab, add:
     - `ANTHROPIC_API_KEY`: Your Anthropic API credentials.
     - `FLASK_ENV`: `production`.
     - `DATABASE_URL`: `database/careercraft.db`.
4. **Deploy**: Trigger manual deploy and wait for a green status. Note down the Render service URL (e.g., `https://your-backend.onrender.com`).

### Frontend (Vercel Deployment)
1. **Configure API URL**: Update `frontend/src/utils/api.js` to point to the live Render backend URL.
2. **Setup on Vercel**:
   - Sign up or log into [vercel.com](https://vercel.com).
   - Click **Add New** and select **Project**.
   - Import your GitHub repository.
   - Under **Framework Preset**, select **Vite**.
   - Change **Root Directory** to `frontend`.
   - Click **Deploy**. Vercel will build the React app and host the static files.

---

## 💡 Common Issues and Fixes

### 1. "Speech Recognition is not supported or allowed"
- **Fix**: The Speech-to-Text and Text-to-Speech features utilize the browser's built-in Web Speech API. Ensure you are using a modern browser like Google Chrome or Microsoft Edge and have granted microphone permissions to the website. A fallback text-input field is provided if speech is disabled.

### 2. "Site Cannot Be Reached" during local testing
- **Fix**: Ensure that the Flask backend is actively running on `http://127.0.0.1:5000` before starting the Vite frontend. Make sure your local ports `5000` and `5173` are not blocked by firewall rules.

### 3. Claude API fails to respond
- **Fix**: If you do not have an active API Key, CareerCraft AI automatically shifts to a mock response generator so the app remains fully functional. Check that the `.env` file exists inside the `backend` folder and contains the line `ANTHROPIC_API_KEY=your_key`.

---

## 🔒 Security Notes

* **API Keys Security**: The Anthropic API key is a confidential secret and **must never** be hardcoded anywhere in the frontend files, JS bundles, or repository source code.
* **Backend Isolation**: All Claude API requests are encapsulated in the Flask backend (`claude_service.py`). The frontend communicates exclusively with local Flask endpoints, keeping credentials secure.
* **Git Exclusions**: Ensure that `.env` files and SQLite `.db` databases are listed in your `.gitignore` to prevent leaking keys or preparedness history to public source repositories.

---

## 📖 How to Use the App Guide

1. **Onboarding Diagnostic**: When logging in for the first time, you will be prompted to take a 20-question placement mock assessment to establish your technical and communication baselines.
2. **Dashboard Overview**: Check your personalized readiness score, current preparation level, and check off daily study, practice, and review milestones.
3. **Curated Learning**: Review structured lessons for Java, Python, SQL, Aptitude, and Web Development. Click the mastery states to test yourself.
4. **Interactive Quiz**: Challenge yourself with MCQs, Leitner-spaced repetitions, or Monaco Editor code problems.
5. **Interview Simulation**: Practice spoken or typed interviews with the virtual HR/Tech chatbot, generating custom speech pace metrics and filler word analysis.
6. **GD Arena**: Conduct simulated round-table discussion sessions against virtual peers, gaining collaboration scores and coaching critiques.
7. **Progress & Flaws**: Monitor your readiness trends with radar maps and check the personal **Flaw Detector** page to review automatic corrections compiled from your study history.
