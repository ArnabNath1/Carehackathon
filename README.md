# CareOps - Unified Operations Platform 🚀

> **One Platform. All Your Operations.**

Replace the chaos of disconnected tools with a unified operations platform for service-based businesses.

---

## ✨ What We Built

A **complete unified operations platform** with:

### Backend (FastAPI) ✅
- Authentication & Authorization (JWT, role-based)
- 8-Step Onboarding Flow
- Voice Onboarding (Groq AI)
- Real-Time Dashboard API
- Booking System (public + staff)
- Unified Inbox
- Complete Database Schema

### Frontend (Next.js) ✅
- Landing Page
- Login & Registration
- Dashboard with Real-Time Metrics
- Responsive Design (Tailwind CSS)
- State Management (Zustand)
- Complete API Integration

---

## 🚀 Quick Start

### 1. Database Setup
1. Create [Supabase](https://supabase.com) project
2. Run `database/schema.sql` in SQL Editor

### 2. Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
→ http://localhost:8000

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
→ http://localhost:3000

---

## 📁 Project Structure

```
CareOps/
├── backend/              # FastAPI
│   ├── main.py          # Main app
│   ├── auth.py          # Auth system
│   ├── routers/         # API endpoints
│   └── services/        # Voice AI
├── frontend/            # Next.js
│   ├── src/app/        # Pages
│   ├── src/lib/        # API client
│   └── src/components/ # UI components
├── database/           # PostgreSQL schema
└── docs/              # Documentation
```

---

## 🎯 Key Features

- 🎙️ Voice Onboarding
- 📊 Real-Time Dashboard
- 📅 Smart Booking System
- 💬 Unified Inbox
- 📝 Form Management
- 📦 Inventory Tracking
- 🔔 Smart Alerts

---

## 🔧 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python 3.11+
- **Database**: Supabase (PostgreSQL)
- **AI**: Groq (Whisper + Llama)
- **Auth**: JWT, bcrypt

---

## 📚 Documentation

- `docs/QUICK_START.md` - Setup guide
- `docs/DEPLOYMENT.md` - Production deployment
- `docs/IMPLEMENTATION_STATUS.md` - Feature tracking
- `PROJECT_SUMMARY.md` - Detailed overview

---

## 🏆 Hackathon Submission

Built for the **CareOps Hackathon** - A complete unified operations platform that replaces multiple disconnected tools with one clear system.

---

Made with ❤️ for CareOps Hackathon
