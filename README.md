# SentiNest - Review Sentiment Center

**Live Demo:** [https://homestay-review-classifier-683ia448y.vercel.app/](https://homestay-review-classifier-683ia448y.vercel.app/)

A premium review auditing application that analyzes guest feedback (sentiment & operational themes), generates suggested management replies, and runs local model accuracy evaluations.

---

## 🚀 Quick Start

### 1. Configure Environment
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your keys:
   - `GEMINI_API_KEY`: Obtain from Google AI Studio.
   - `DATABASE_URL`: PostgreSQL connection string (compatible with Supabase, neon, etc.).

### 2. Run Backend (FastAPI)
1. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the FastAPI development server:
   ```bash
   python -m uvicorn api.index:app --port 8000 --reload
   ```

### 3. Run Frontend (React/Vite)
1. Navigate to the client directory (or use the root commands if monorepo configuration allows):
   ```bash
   pnpm install
   pnpm dev
   ```
   *Note: If you do not have `pnpm` installed, you can use `npm install` and `npm run dev`.*
   The frontend dev server proxies API calls automatically to `http://127.0.0.1:8000`.

---

## 🛠️ Tech Stack
* **Frontend**: React 19, Vite, Tailwind CSS 4, React Query, Wouter, Shadcn UI
* **Backend**: FastAPI, Python 3.9+, SQLAlchemy
* **Database**: PostgreSQL (Supabase compatible)
* **AI Model**: Google Gemini (with offline fallback heuristics)

---

## ☁️ Deployment
This project is configured for **Vercel** serverless hosting. Link your repository on Vercel, set your environment variables (`GEMINI_API_KEY` and `DATABASE_URL`), and deploy.
