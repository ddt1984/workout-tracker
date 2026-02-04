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
    }

    async render() {
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
                <div class="quick-actions">
                    <button id="copy-latest-btn" class="btn btn-primary">
                        📋 최근 복사
                    </button>
                    <button id="new-workout-btn" class="btn btn-secondary">
                        ➕ 새 운동
                    </button>
                </div>
                <div class="loading">
                    <div class="spinner"></div>
                    <p>운동 기록 불러오는 중...</p>
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

            // Load from GitHub
            const { content, sha } = await GitHubAPI.getCurrentYearFile();
            this.fileSha = sha;

            // Parse workouts
            const workouts = Parser.parseFile(content);
            State.setWorkouts(workouts);

            // Cache workouts
            Storage.setCachedWorkouts(workouts);

            // Render workout list
            this.renderWorkoutList(workouts);

            State.setLoading(false);
        } catch (error) {
            console.error('Load workouts error:', error);
            State.setError(error);

            // Try to load from cache
            const cached = Storage.getCachedWorkouts();
            if (cached && cached.length > 0) {
                State.setWorkouts(cached);
                this.renderWorkoutList(cached);
                this.showMessage('캐시된 데이터를 표시합니다', 'warning');
            } else {
                this.showMessage('운동 기록을 불러올 수 없습니다: ' + error.message, 'error');
            }

            State.setLoading(false);
        }
    }

    renderWorkoutList(workouts) {
        if (workouts.length === 0) {
            this.container.querySelector('.loading').innerHTML = `
                <p style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                    아직 운동 기록이 없습니다<br>
                    첫 운동을 추가해보세요!
                </p>
            `;
            return;
        }

        // Group by month
        const grouped = Parser.groupByMonth(workouts);

        // Generate HTML
        let html = '<div class="workout-list">';

        Object.entries(grouped).forEach(([month, monthWorkouts]) => {
            html += `
                <div class="month-group">
                    <div class="month-header">${month} ${new Date().getFullYear()}</div>
            `;

            monthWorkouts.forEach((workout, index) => {
                const relativeTime = DateUtils.getRelativeTime(workout.date);
                const exerciseSummary = this.getExerciseSummary(workout.exercises);

                html += `
                    <div class="workout-card" data-workout-index="${workouts.indexOf(workout)}">
                        <div class="workout-header">
                            <div class="workout-date">
                                ${workout.displayDate}
                                <span style="color: var(--text-tertiary); font-size: 0.85rem; margin-left: 0.5rem;">
                                    ${relativeTime}
                                </span>
                            </div>
                        </div>
                        <div class="exercise-list">
                            ${exerciseSummary}
                        </div>
                        <div class="workout-actions">
                            <button class="btn btn-secondary btn-copy" data-workout-index="${workouts.indexOf(workout)}">
                                📋 복사
                            </button>
                        </div>
                    </div>
                `;
            });

            html += '</div>';
        });

        html += '</div>';

        this.container.querySelector('.loading').outerHTML = html;

        // Add event listeners for copy buttons
        this.container.querySelectorAll('.btn-copy').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.workoutIndex);
                this.copyWorkout(workouts[index]);
            });
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
        // Copy latest workout
        document.getElementById('copy-latest-btn').addEventListener('click', () => {
            const latest = State.getLatestWorkout();
            if (latest) {
                this.copyWorkout(latest);
            } else {
                this.showMessage('복사할 운동이 없습니다', 'error');
            }
        });

        // New workout
        document.getElementById('new-workout-btn').addEventListener('click', () => {
            State.update({ editingWorkout: null });
            State.setView('editor');
        });

        // Refresh
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.loadWorkouts();
        });

        // Settings
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettings();
        });
    }

    copyWorkout(workout) {
        // Clone workout and update date to today
        const copy = {
            ...workout,
            date: DateUtils.getTodayISO(),
            displayDate: DateUtils.getTodayKorean(),
            exercises: workout.exercises.map(ex => ({ ...ex }))
        };

        State.update({ editingWorkout: copy });
        State.setView('editor');
    }

    showSettings() {
        const user = State.user;
        const repo = Storage.getRepo();

        if (confirm('로그아웃 하시겠습니까?')) {
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
