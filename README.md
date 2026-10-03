# shorty-edit-free

A lightweight, easy-to-use AI video editor prototype for creators, agencies, and small businesses. This project gives you a simple 3-step workflow: upload clips, describe the edit, and export a styled short-form reel.

## Features

- Drag-and-drop upload flow
- Fast auto-edit prompt workflow
- Realistic short-form reel UX for TikTok / Reels / Shorts
- AI-inspired editing job tracking
- Mock production-ready status flow for local development

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Video processing: Python + FFmpeg + MoviePy ready

## Local development

### 1. Frontend

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

Frontend runs on: http://localhost:3000

### 2. Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on: http://localhost:5000

### 3. Optional Python prototype

```bash
cd video-processor
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python ai_video_editor.py
```

## Example prompt

```text
Create a 30-second fashion reel using my 10 t-shirt mockups.
Use realistic product-style motion, high-end lighting, clean transitions, and captions.
Make it fit for Instagram Reels and TikTok.
Music: Caught In Your Rhythm by GotSome and Clementine Douglas.
```

## Notes

This is a functional MVP foundation for the full app. It is intentionally simple and friendly for beginners, while still structured to scale into a more advanced AI editing system.
