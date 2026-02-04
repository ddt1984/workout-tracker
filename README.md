# 🏋️ Workout Tracker

A mobile-first web app for tracking workouts with GitHub sync.

## Features

- **GitHub Sync**: Store workout data in your GitHub repository as plain text files
- **Tap-Based UI**: No typing needed - adjust weights, reps, and sets with +/- buttons
- **Copy from Previous**: Quickly duplicate past workouts and modify them
- **Exercise Picker**: Smart suggestions based on your workout history
- **Mobile-First**: Optimized for gym use on your phone
- **Dark Mode**: Easy on the eyes in gym lighting

## Setup

### 1. Create GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - Application name: `Workout Tracker`
   - Homepage URL: `https://yourusername.github.io/workout-tracker`
   - Authorization callback URL: `https://yourusername.github.io/workout-tracker`
4. Click "Register application"
5. Copy the Client ID and update it in `js/core/github-api.js` (line 10)

### 2. Create Repository

1. Create a new repository called `workout` (or your preferred name)
2. Add your existing workout files (e.g., `records_2026.txt`)
3. Make sure the repository is private if you want to keep workouts private

### 3. Deploy to GitHub Pages

1. Push this `workout-tracker` folder to a new repository
2. Go to repository Settings → Pages
3. Set Source to "main" branch, root folder
4. Save and wait for deployment
5. Visit the provided URL (e.g., `https://yourusername.github.io/workout-tracker`)

### 4. Configure Repository

When you first log in, the app will look for a repository named `workout` in your account.
To change this, update the repository name in `js/components/auth-view.js` (line 41).

## Data Format

The app uses Korean date format and preserves your existing text format:

```
2월 3일
스탭밀 75층
걷기 10분

2월 1일
레그프레스 120kg 12 x 4
랫플다운 35kg 12 x
```

## Development

To test locally:

1. Open `index.html` in a browser
2. You'll need to run a local server for modules to work:
   ```bash
   python -m http.server 8000
   ```
3. Visit `http://localhost:8000`

## File Structure

```
workout-tracker/
├── index.html              # Main app
├── manifest.json           # PWA manifest
├── css/                    # Styles
├── js/
│   ├── main.js            # App entry point
│   ├── core/              # Core functionality
│   │   ├── github-api.js  # GitHub API wrapper
│   │   ├── parser.js      # Text parser
│   │   ├── storage.js     # LocalStorage
│   │   └── state.js       # State management
│   ├── components/        # UI components
│   │   ├── auth-view.js   # Login
│   │   ├── history-view.js # Workout list
│   │   └── editor-view.js  # Workout editor
│   └── utils/
│       └── date-utils.js   # Date utilities
└── lib/
    └── octokit.min.js     # GitHub API client
```

## Usage

### Adding a Workout

1. Tap "📋 최근 복사" to copy your last workout
2. Use +/- buttons to adjust weights, reps, sets
3. Tap "저장 ✓" to save

### Adding New Exercise

1. Tap "➕ 운동 추가"
2. Select from common exercises or search
3. Adjust values and save

### Viewing History

- Scroll to see all workouts
- Tap "📋 복사" to copy any workout

## Security

- OAuth tokens are stored in localStorage (client-side only)
- You control who has access by authorizing the GitHub App
- All data stays in your GitHub repository
- The app only requests `repo` scope (read/write repository files)

## Browser Support

- Modern browsers with ES6+ support
- Works best on mobile Safari and Chrome
- Requires JavaScript enabled

## License

MIT License - feel free to modify and use for your own workouts!
