# Setup Guide for Workout Tracker

## Step-by-Step Setup

### Step 1: Register GitHub OAuth App

This is required for the app to access your GitHub repository.

1. Go to https://github.com/settings/developers
2. Click "OAuth Apps" tab
3. Click "New OAuth App"
4. Fill in the form:
   - **Application name**: `Workout Tracker`
   - **Homepage URL**: `http://localhost:8000` (for testing) or your GitHub Pages URL
   - **Application description**: `Personal workout tracking app`
   - **Authorization callback URL**: `http://localhost:8000` (same as homepage)
5. Click "Register application"
6. You'll see your **Client ID** - copy it
7. Open `js/core/github-api.js` in this project
8. Replace the CLIENT_ID on line 10 with your Client ID:
   ```javascript
   CLIENT_ID: 'YOUR_CLIENT_ID_HERE',
   ```

**Note**: For GitHub Pages deployment, you'll need to update the callback URL later.

### Step 2: Create GitHub Repository for Data

1. Go to https://github.com/new
2. Create a new repository:
   - Name: `workout` (or any name you prefer)
   - Visibility: **Private** (recommended) or Public
   - Don't initialize with README
3. Click "Create repository"
4. Upload your existing workout files:
   - Go to "Add file" → "Upload files"
   - Upload `records_2026.txt` and any other year files
   - Commit the files

If you named your repository something other than `workout`, you'll need to update:
- Open `js/components/auth-view.js`
- Line 41, change `'workout'` to your repository name:
  ```javascript
  Storage.setRepo(user.login, 'your-repo-name');
  ```

### Step 3: Test Locally

1. Open a terminal in the `workout-tracker` folder
2. Start a local web server:
   ```bash
   python -m http.server 8000
   ```
   Or if you have Node.js:
   ```bash
   npx serve .
   ```
3. Open your browser to http://localhost:8000
4. You should see the login screen
5. Click "GitHub로 로그인"
6. Follow the device flow instructions:
   - Copy the code shown
   - Click the link to GitHub
   - Paste the code and authorize
   - Return to the app - it should auto-login

### Step 4: Deploy to GitHub Pages (Optional)

For mobile access, deploy to GitHub Pages:

1. Create a new repository for the app (e.g., `workout-tracker`)
2. Push this folder to the repository:
   ```bash
   cd workout-tracker
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/workout-tracker.git
   git push -u origin main
   ```
3. Go to repository Settings → Pages
4. Set Source to "main" branch
5. Save and wait for deployment (~1 minute)
6. Copy the GitHub Pages URL (e.g., `https://yourusername.github.io/workout-tracker`)
7. Update your OAuth App:
   - Go back to https://github.com/settings/developers
   - Click on your Workout Tracker app
   - Update Homepage URL and Callback URL to your GitHub Pages URL
   - Save changes

### Step 5: Use on Mobile

1. Open the GitHub Pages URL on your phone
2. Log in with GitHub
3. Add to Home Screen:
   - **iOS Safari**: Tap Share → Add to Home Screen
   - **Android Chrome**: Tap Menu → Add to Home Screen
4. Open from home screen for full-screen app experience

## Troubleshooting

### "Not initialized" error
- Make sure you've updated the CLIENT_ID in `js/core/github-api.js`
- Check that your OAuth app is registered correctly

### "404" when loading workouts
- Verify your repository name matches what's in `auth-view.js`
- Check that your workout files are named `records_YYYY.txt`
- Make sure you've authorized the app to access your repository

### Modules not loading
- Make sure you're running a local server, not just opening `index.html`
- Browser security blocks ES6 modules when opened as `file://`

### Can't save workouts
- Check that you authorized the app with `repo` scope
- Verify the repository exists and you have write access
- Check browser console for error messages

## Data Migration

Your existing workout files will work as-is. The app reads and writes the same format:

```
M월 D일
운동이름 무게kg 횟수 x 세트
스탭밀 층수층
걷기 분분
```

No migration needed!

## Security Notes

- Your OAuth token is stored in browser localStorage
- The token only has access to repositories you authorize
- All data stays in your GitHub repository
- You can revoke access anytime at https://github.com/settings/applications
- Use a private repository to keep workouts private

## Next Steps

After setup is complete:

1. Test copying your latest workout
2. Try adding a new exercise
3. Verify the commit appears in your GitHub repository
4. Check that the text file format is preserved correctly

Enjoy your new workout tracker! 🏋️
