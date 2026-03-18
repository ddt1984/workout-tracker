// History view component
import { GitHubAPI } from '../core/github-api.js';
import { Parser } from '../core/parser.js';
import { Storage } from '../core/storage.js';
import { State } from '../core/state.js';
import { DateUtils } from '../utils/date-utils.js';

export class HistoryView {
    constructor(container) {
        this.container = container;
        this.fileSha = null;
        this.eventListeners = [];
    }

    cleanup() {
        // Remove all event listeners
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners = [];
    }

    addEventListener(element, event, handler) {
        element.addEventListener(event, handler);
        this.eventListeners.push({ element, event, handler });
    }

    async render() {
        this.currentIndex = 0;
        this.workouts = [];

        this.container.innerHTML = `
            <div class="history-view">
                <div class="header">
                    <h1>🏋️ Workout Tracker</h1>
                    <div class="header-actions">
                        <button id="refresh-btn" class="btn-icon" title="새로고침">
                            🔄
                        </button>
                        <button id="settings-btn" class="btn-icon" title="설정">
                            ⚙️
                        </button>
                    </div>
                </div>

                <div class="tab-nav">
                    <button id="history-tab" class="tab-btn active">
                        📋 History
                    </button>
                    <button id="calendar-tab" class="tab-btn">
                        📊 Analytics
                    </button>
                </div>

                <div class="workout-slider-container">
                    <button id="new-workout-btn" class="btn btn-large btn-primary">
                        ➕ New Workout
                    </button>
                    <div class="loading">
                        <div class="spinner"></div>
                        <p>Loading workouts...</p>
                    </div>
                </div>
            </div>
        `;

        // Load workouts
        await this.loadWorkouts();

        // Setup event listeners
        this.setupEventListeners();
    }

    async loadWorkouts() {
        try {
            State.setLoading(true);

            const currentYear = new Date().getFullYear();
            const previousYear = currentYear - 1;

            // Load current year
            const { content, sha } = await GitHubAPI.getYearFile(currentYear);
            this.fileSha = sha;
            const currentYearWorkouts = Parser.parseFile(content, currentYear);
            State.setWorkoutsForYear(currentYear, currentYearWorkouts);

            // Load previous year for exercise database
            try {
                const prevData = await GitHubAPI.getYearFile(previousYear);
                if (prevData.content) {
                    const previousYearWorkouts = Parser.parseFile(prevData.content, previousYear);
                    State.setWorkoutsForYear(previousYear, previousYearWorkouts);
                }
            } catch (prevError) {
                console.log('Previous year data not available:', prevError);
            }

            // Cache current year workouts
            Storage.setCachedWorkouts(currentYearWorkouts);

            // Render current year workout list
            this.renderWorkoutList(currentYearWorkouts);

            State.setLoading(false);
        } catch (error) {
            console.error('Load workouts error:', error);
            State.setError(error);

            // Try to load from cache
            const cached = Storage.getCachedWorkouts();
            if (cached && cached.length > 0) {
                const year = new Date().getFullYear();
                State.setWorkoutsForYear(year, cached);
                this.renderWorkoutList(cached);
                this.showMessage('Showing cached data', 'warning');
            } else {
                this.showMessage('Failed to load workouts: ' + error.message, 'error');
            }

            State.setLoading(false);
        }
    }

    renderWorkoutList(workouts) {
        this.workouts = workouts;
        this.currentIndex = 0;

        if (workouts.length === 0) {
            this.container.querySelector('.workout-slider-container').innerHTML = `
                <button id="new-workout-btn" class="btn btn-large btn-primary">
                    ➕ New Workout
                </button>
                <div class="empty-state">
                    <div class="empty-icon">🏋️</div>
                    <p>No workouts yet</p>
                    <p class="empty-subtitle">Start tracking your fitness journey!</p>
                </div>
            `;
            // Re-setup new workout button
            this.addEventListener(document.getElementById('new-workout-btn'), 'click', () => {
                State.update({ editingWorkout: null });
                State.setView('editor');
            });
            return;
        }

        // Render slider
        this.renderSlider();
    }

    renderSlider() {
        const workout = this.workouts[this.currentIndex];
        const relativeTime = DateUtils.getRelativeTime(workout.date);
        const exerciseSummary = this.getExerciseSummary(workout.exercises);

        const html = `
            <button id="new-workout-btn" class="btn btn-large btn-primary">
                ➕ New Workout
            </button>

            <div class="workout-slider">
                <button class="slider-nav prev" id="prev-workout" ${this.currentIndex === this.workouts.length - 1 ? 'disabled' : ''}>
                    ‹
                </button>

                <div class="slider-card">
                    <div class="workout-card-single">
                        <div class="workout-date">
                            ${workout.displayDate}
                            <span class="workout-time">${relativeTime}</span>
                        </div>
                        <div class="exercise-list">
                            ${exerciseSummary}
                        </div>
                        <div class="workout-actions">
                            <button class="btn btn-secondary" id="copy-workout">
                                📋 Copy
                            </button>
                            <button class="btn btn-secondary" id="edit-workout">
                                ✏️ Edit
                            </button>
                        </div>
                    </div>
                </div>

                <button class="slider-nav next" id="next-workout" ${this.currentIndex === 0 ? 'disabled' : ''}>
                    ›
                </button>
            </div>

            <div class="slider-indicator">
                ${this.currentIndex + 1} / ${this.workouts.length}
            </div>
        `;

        this.container.querySelector('.workout-slider-container').innerHTML = html;

        // Setup slider event listeners
        this.setupSliderListeners();
    }

    setupSliderListeners() {
        // Navigation buttons
        const prevBtn = document.getElementById('prev-workout');
        const nextBtn = document.getElementById('next-workout');

        if (prevBtn && !prevBtn.disabled) {
            this.addEventListener(prevBtn, 'click', () => {
                if (this.currentIndex < this.workouts.length - 1) {
                    this.currentIndex++;
                    this.renderSlider();
                }
            });
        }

        if (nextBtn && !nextBtn.disabled) {
            this.addEventListener(nextBtn, 'click', () => {
                if (this.currentIndex > 0) {
                    this.currentIndex--;
                    this.renderSlider();
                }
            });
        }

        // Copy and Edit buttons
        const copyBtn = document.getElementById('copy-workout');
        const editBtn = document.getElementById('edit-workout');

        if (copyBtn) {
            this.addEventListener(copyBtn, 'click', () => {
                this.copyWorkout(this.workouts[this.currentIndex]);
            });
        }

        if (editBtn) {
            this.addEventListener(editBtn, 'click', () => {
                this.editWorkout(this.workouts[this.currentIndex]);
            });
        }

        // New workout button
        const newBtn = document.getElementById('new-workout-btn');
        if (newBtn) {
            this.addEventListener(newBtn, 'click', () => {
                State.update({ editingWorkout: null });
                State.setView('editor');
            });
        }

        // Touch swipe support
        this.setupTouchSwipe();
    }

    setupTouchSwipe() {
        const slider = this.container.querySelector('.slider-card');
        if (!slider) return;

        let touchStartX = 0;
        let touchEndX = 0;

        const handleSwipe = () => {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;

            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0 && this.currentIndex < this.workouts.length - 1) {
                    // Swipe left - show older
                    this.currentIndex++;
                    this.renderSlider();
                } else if (diff < 0 && this.currentIndex > 0) {
                    // Swipe right - show newer
                    this.currentIndex--;
                    this.renderSlider();
                }
            }
        };

        this.addEventListener(slider, 'touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        this.addEventListener(slider, 'touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });
    }

    getExerciseSummary(exercises) {
        return exercises.map(ex => {
            let text = ex.name;
            if (ex.type === 'weighted') {
                text += ` ${ex.weight}kg ${ex.reps}${ex.sets ? ' x ' + ex.sets : ''}`;
            } else if (ex.type === 'stepmill') {
                text += ` ${ex.floors}층`;
            } else if (ex.type === 'walking') {
                text += ` ${ex.minutes}분`;
            }
            return `<div class="exercise-item">${text}</div>`;
        }).join('');
    }

    setupEventListeners() {
        // Tab navigation
        const calendarTabHandler = () => State.setView('calendar');
        this.addEventListener(document.getElementById('calendar-tab'), 'click', calendarTabHandler);

        // Refresh
        const refreshHandler = () => this.loadWorkouts();
        this.addEventListener(document.getElementById('refresh-btn'), 'click', refreshHandler);

        // Settings
        const settingsHandler = () => this.showSettings();
        this.addEventListener(document.getElementById('settings-btn'), 'click', settingsHandler);
    }

    copyWorkout(workout) {
        // Clone workout and update date to today
        const copy = {
            ...workout,
            date: DateUtils.getTodayISO(),
            displayDate: DateUtils.getTodayKorean(),
            exercises: workout.exercises.map(ex => {
                // Reset sets to 0 for new workout session
                const exerciseCopy = { ...ex };
                if (exerciseCopy.type === 'weighted') {
                    exerciseCopy.sets = 0;
                }
                return exerciseCopy;
            })
        };

        State.update({ editingWorkout: copy, isEditing: false });
        State.setView('editor');
    }

    editWorkout(workout) {
        // Edit existing workout (keep original date)
        const workoutToEdit = {
            ...workout,
            exercises: workout.exercises.map(ex => ({ ...ex }))
        };

        State.update({ editingWorkout: workoutToEdit, isEditing: true });
        State.setView('editor');
    }

    showSettings() {
        const user = State.user;
        const repo = Storage.getRepo();

        if (confirm('Logout?')) {
            Storage.clear();
            State.update({
                user: null,
                workouts: [],
                exercises: []
            });
            State.setView('auth');
        }
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        messageDiv.style.margin = '1rem';

        const quickActions = this.container.querySelector('.quick-actions');
        quickActions.insertAdjacentElement('afterend', messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}
