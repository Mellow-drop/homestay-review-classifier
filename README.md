# SentiNest - Review Sentiment Center

**Live Demo:** [https://homestay-review-classifier-683ia448y.vercel.app/](https://homestay-review-classifier-683ia448y.vercel.app/)

A premium review auditing application that analyzes guest feedback (sentiment & operational themes), generates suggested management replies, and runs local model accuracy evaluations.

---

## 🚀 Quick Start

### 1. Configure Environment
Create a `.env` file at the root of the project:
```env
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=your_postgresql_database_url
```

### 2. Run Backend (FastAPI)
```bash
pip install -r requirements.txt
uvicorn api.index:app --reload
```

### 3. Run Frontend (React/Vite)
```bash
pnpm install && pnpm dev
# or: npm install && npm run dev
```

---

## 🛠️ Tech Stack
* **Frontend**: React 19, Vite, Tailwind CSS 4, React Query, Wouter, Shadcn UI
* **Backend**: FastAPI, Python 3.9+, SQLAlchemy
* **Database**: PostgreSQL (Supabase compatible)
* **AI Model**: Google Gemini (with offline fallback heuristics)

---

## ☁️ Deployment
This project is configured for **Vercel** serverless hosting. Link your repository on Vercel, set your environment variables (`GEMINI_API_KEY` and `DATABASE_URL`), and deploy.
