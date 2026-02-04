# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User (Mobile/Desktop)                    │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Static Web App (GitHub Pages)                   │
│  ┌────────────┐  ┌─────────────┐  ┌───────────────────┐   │
│  │ Auth View  │  │ History View│  │  Editor View      │   │
│  └────────────┘  └─────────────┘  └───────────────────┘   │
│         │                │                   │              │
│         └────────────────┴───────────────────┘              │
│                          │                                  │
│  ┌───────────────────────▼──────────────────────────────┐  │
│  │          State Management (state.js)                  │  │
│  └───────────────────────┬──────────────────────────────┘  │
│                          │                                  │
│         ┌────────────────┼────────────────┐                │
│         ▼                ▼                ▼                │
│  ┌───────────┐   ┌──────────┐   ┌──────────────┐         │
│  │  Parser   │   │ GitHub   │   │   Storage    │         │
│  │  (txt↔JSON)│   │   API    │   │ (localStorage)│         │
│  └───────────┘   └─────┬────┘   └──────────────┘         │
└──────────────────────────┼───────────────────────────────────┘
                          │ REST API
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    GitHub API (REST)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ OAuth Device │  │ Get Content  │  │ Update Content  │  │
│  │     Flow     │  │  (Read File) │  │  (Commit File)  │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               GitHub Repository (Private/Public)             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ records_2026.txt                                      │  │
│  │ records_2025.txt                                      │  │
│  │ ...                                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Viewing Workouts
```
User → History View → GitHub API → Get File → Parser → State → Render
```

### Adding Workout
```
User → Editor View → Fill Form → Save → Serialize → GitHub API → Commit
                                    ↓
                              Update State → Refresh View
```

### Copy Workout
```
User → Click Copy → Clone Data → Update Date → Editor View → Edit → Save
```

## Component Hierarchy

```
App (main.js)
├── AuthView (auth-view.js)
│   ├── Login Button
│   ├── Device Code Display
│   └── Polling Status
│
├── HistoryView (history-view.js)
│   ├── Header
│   │   ├── Refresh Button
│   │   └── Settings Button
│   ├── Quick Actions
│   │   ├── Copy Latest Button
│   │   └── New Workout Button
│   └── Workout List
│       └── Month Groups
│           └── Workout Cards
│               ├── Date & Exercises
│               └── Copy Button
│
└── EditorView (editor-view.js)
    ├── Header
    │   ├── Back Button
    │   └── Save Button
    ├── Date Picker
    ├── Exercise Cards
    │   └── For each exercise:
    │       ├── Exercise Name
    │       ├── +/- Controls (Weight/Reps/Sets)
    │       └── Remove Button
    ├── Add Exercise Button
    └── Exercise Picker (Modal)
        ├── Search Box
        ├── Common Exercises Grid
        └── Cardio Quick Buttons
```

## State Management

```javascript
State = {
    user: Object,           // GitHub user info
    workouts: Array,        // All workouts (parsed)
    exercises: Array,       // Exercise database with frequency
    currentView: String,    // 'auth' | 'history' | 'editor'
    editingWorkout: Object, // Workout being edited (null = new)
    isLoading: Boolean,     // Loading state
    error: String          // Error message
}
```

## Data Models

### Workout Object
```javascript
{
    date: "2026-02-03",        // ISO format
    displayDate: "2월 3일",     // Korean display
    exercises: [Exercise]      // Array of exercises
}
```

### Exercise Object (Weighted)
```javascript
{
    type: "weighted",
    name: "레그프레스",
    weight: 120,              // kg
    reps: 12,                 // repetitions
    sets: 4                   // sets (optional)
}
```

### Exercise Object (Cardio)
```javascript
{
    type: "stepmill",
    name: "스탭밀",
    floors: 75
}

{
    type: "walking",
    name: "걷기",
    minutes: 10
}
```

### Exercise Database Entry
```javascript
{
    name: "레그프레스",
    type: "weighted",
    count: 124,              // Usage frequency
    lastUsed: "2026-02-03",  // Last workout date
    lastWeight: 120,         // Last used values
    lastReps: 12,
    lastSets: 4
}
```

## File Format

### Text Format (GitHub Storage)
```
2월 3일
스탭밀 75층
걷기 10분

2월 1일
레그프레스 120kg 12 x 4
랫플다운 35kg 12 x
로우로우 45kg 12 x 4
스탭밀 70층

---
1월 31일
체스트 플라이 45kg 12 x 4
```

### Parsing Rules
- **Date line**: `M월 D일` (e.g., "2월 3일")
- **Weighted exercise**: `Name Wkg R x S` (e.g., "레그프레스 120kg 12 x 4")
- **Step mill**: `Name F층` (e.g., "스탭밀 75층")
- **Walking**: `Name M분` (e.g., "걷기 10분")
- **Separator**: `---` between months
- **Blank lines**: Separate workouts

## API Endpoints Used

### GitHub OAuth
- `POST /login/device/code` - Start device flow
- `POST /login/oauth/access_token` - Poll for token

### GitHub REST API
- `GET /user` - Get authenticated user
- `GET /repos/{owner}/{repo}/contents/{path}` - Read file
- `PUT /repos/{owner}/{repo}/contents/{path}` - Update file

## Security Model

### Authentication
1. User authorizes via OAuth device flow
2. Token stored in localStorage (browser-only)
3. Token sent in Authorization header for all API calls
4. Scope: `repo` (read/write repository access)

### Data Privacy
- All workout data stays in user's GitHub repository
- No server-side storage or processing
- App runs entirely client-side (static HTML/JS)
- User controls access via GitHub permissions

### Token Security
- Token never leaves browser
- Can be revoked at: https://github.com/settings/applications
- Expires automatically (GitHub handles)
- No refresh token needed

## Performance Considerations

### Optimization Strategies
1. **Local caching**: Workouts cached in localStorage
2. **Lazy loading**: Only load current year file
3. **No external dependencies**: Minimal JS bundle size
4. **Static hosting**: Fast CDN delivery via GitHub Pages
5. **Incremental rendering**: Render workouts as they're parsed

### Bottlenecks
- GitHub API rate limits (5000/hour authenticated)
- Network latency for file operations
- Large workout files (years of data)

### Mitigations
- Cache aggressively in localStorage
- Debounce save operations
- Show loading states during network operations
- Optimize parser for large files

## Browser Compatibility

### Required Features
- ES6+ (modules, arrow functions, async/await)
- Fetch API
- LocalStorage
- Flexbox/Grid CSS
- CSS Variables

### Supported Browsers
- Chrome/Edge 80+
- Safari 14+
- Firefox 75+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 80+)

### Progressive Enhancement
- Works without service worker
- Graceful degradation for localStorage failures
- Fallback error messages for API failures

## Deployment Options

### Option 1: GitHub Pages (Recommended)
- **Pros**: Free, fast, automatic HTTPS, easy deployment
- **Cons**: Public repository (but data repo can be private)
- **Setup**: Enable Pages in repository settings

### Option 2: Local File Server
- **Pros**: Complete privacy, offline development
- **Cons**: Manual setup, not accessible remotely
- **Setup**: `python -m http.server 8000`

### Option 3: Static Host (Netlify, Vercel, etc.)
- **Pros**: Custom domains, preview deployments
- **Cons**: Extra setup steps
- **Setup**: Connect GitHub repo to hosting service

## Monitoring & Debugging

### Browser Console
- All errors logged to console
- State changes logged (development)
- API requests logged

### GitHub Commits
- Each save creates a commit
- Commit message includes date
- Can review history in GitHub

### Testing
- `test-parser.html` for parser verification
- Manual testing checklist in `CHECKLIST.md`
- Browser DevTools for debugging

## Future Architecture Improvements

### Service Worker
- Offline support
- Background sync
- Cache management

### IndexedDB
- Store larger datasets
- Better performance than localStorage
- Structured queries

### Web Workers
- Parse large files in background
- Don't block UI thread

### Progressive Web App
- App shell caching
- Push notifications (for reminders)
- Native app feel

---

This architecture prioritizes:
- ✅ Simplicity (no build step, no backend)
- ✅ Privacy (data in user's repo)
- ✅ Performance (static hosting, local cache)
- ✅ Mobile UX (tap-first interface)
- ✅ Maintainability (clear separation of concerns)
