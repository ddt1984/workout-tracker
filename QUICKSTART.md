# Quick Start Guide

Get your workout tracker running in 5 minutes!

## Prerequisites

- GitHub account
- Your existing workout files (`records_2026.txt`, etc.)
- Python installed (for local testing)

## 5-Minute Setup

### 1. Register OAuth App (2 minutes)

1. Visit: https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - Name: `Workout Tracker`
   - Homepage: `http://localhost:8000`
   - Callback: `http://localhost:8000`
4. Click "Register application"
5. **Copy the Client ID** (you'll need this!)

### 2. Update Client ID (30 seconds)

1. Open `js/core/github-api.js`
2. Line 10: Replace the CLIENT_ID:
   ```javascript
   CLIENT_ID: 'YOUR_CLIENT_ID_HERE',  // ← Paste your Client ID
   ```
3. Save the file

### 3. Create Data Repository (1 minute)

1. Go to: https://github.com/new
2. Repository name: `workout`
3. Visibility: **Private** (recommended)
4. Click "Create repository"
5. Upload your `records_2026.txt` file:
   - Click "uploading an existing file"
   - Drag and drop your txt file
   - Commit

### 4. Start Local Server (30 seconds)

Open terminal in the `workout-tracker` folder:

```bash
cd workout-tracker
python -m http.server 8000
```

### 5. Test the App (1 minute)

1. Open browser: http://localhost:8000
2. Click "GitHub로 로그인"
3. Copy the 8-character code
4. Click the link and paste code
5. Authorize the app
6. Return to the app - you're in! 🎉

## First Workout

1. Click "📋 최근 복사" to copy your last workout
2. Use +/- buttons to adjust weights
3. Click "저장 ✓" to save
4. Check your GitHub repo - you'll see a new commit!

## Mobile Access (Optional)

Want to use it at the gym? Deploy to GitHub Pages:

1. Create new repo: `workout-tracker`
2. Push this code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/USERNAME/workout-tracker.git
   git push -u origin main
   ```
3. Enable Pages: Settings → Pages → Source: main
4. Update OAuth app callback to your GitHub Pages URL
5. Visit on mobile and "Add to Home Screen"

Done! 🏋️

## Troubleshooting

**"Not initialized" error?**
→ Check that you updated CLIENT_ID in `github-api.js`

**Can't find workouts?**
→ Verify repo is named `workout` and file is `records_2026.txt`

**Modules not loading?**
→ Use a local server, don't open `index.html` directly

**Need help?**
→ Check `SETUP.md` for detailed instructions

## Test Before You Start

Verify the parser works:
1. Open http://localhost:8000/test-parser.html
2. Check that all tests pass ✓
3. Review parsed data structure

If tests pass, you're ready to go!

## What You Can Do

- ✅ View all workout history
- ✅ Copy any previous workout
- ✅ Edit with tap-only interface (no typing!)
- ✅ Add new exercises from smart suggestions
- ✅ Auto-sync to GitHub
- ✅ Access from any device

## Tips for Best Experience

1. **Copy workflow is fastest**: Always start by copying your last workout
2. **Pre-filled values**: Exercise picker remembers your last weight/reps
3. **Quick adjustments**: +/- buttons are optimized for common increments
4. **Mobile-first**: Works best on phone in portrait mode
5. **Dark mode**: Easy on eyes in gym lighting

Start tracking! 💪
