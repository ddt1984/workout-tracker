// Editor view component - tap-based workout editor
import { GitHubAPI } from '../core/github-api.js';
import { Parser } from '../core/parser.js';
import { Storage } from '../core/storage.js';
import { State } from '../core/state.js';
import { DateUtils } from '../utils/date-utils.js';

export class EditorView {
    constructor(container) {
        this.container = container;
        this.workout = null;
        this.exercises = [];
        this.showingPicker = false;
    }

    async render() {
        // Get workout to edit (or create new)
        this.workout = State.editingWorkout || {
            date: DateUtils.getTodayISO(),
            displayDate: DateUtils.getTodayKorean(),
            exercises: []
        };

        this.exercises = [...this.workout.exercises];

        this.container.innerHTML = `
            <div class="editor-view">
                <div class="header">
                    <button id="back-btn" class="btn-secondary">← Back</button>
                    <h1>Workout</h1>
                    <button id="save-btn" class="btn btn-success">Save ✓</button>
                </div>
                <div class="editor-content">
                    <div class="date-picker">
                        <label style="color: var(--text-secondary); font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">
                            Date
                        </label>
                        <input type="date" id="workout-date" value="${this.workout.date}">
                    </div>
                    <div id="exercise-cards" class="exercise-cards">
                        ${this.renderExerciseCards()}
                    </div>
                    <button id="add-exercise-btn" class="btn btn-primary btn-large">
                        ➕ Add Exercise
                    </button>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    renderExerciseCards() {
        if (this.exercises.length === 0) {
            return '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Add exercises</p>';
        }

        return this.exercises.map((exercise, index) => {
            return this.renderExerciseCard(exercise, index);
        }).join('');
    }

    renderExerciseCard(exercise, index) {
        if (exercise.type === 'weighted') {
            return `
                <div class="exercise-card" data-index="${index}">
                    <div class="exercise-card-header">
                        <div class="exercise-name">${exercise.name}</div>
                        <button class="btn-icon btn-remove" data-action="remove" data-index="${index}">
                            🗑️
                        </button>
                    </div>
                    <div class="exercise-controls">
                        <div class="control-row">
                            <div class="control-label">Weight</div>
                            <button class="control-btn" data-action="dec-weight" data-index="${index}">−</button>
                            <div class="control-value">${exercise.weight}kg</div>
                            <button class="control-btn" data-action="inc-weight" data-index="${index}">+</button>
                        </div>
                        <div class="control-row">
                            <div class="control-label">Reps</div>
                            <button class="control-btn" data-action="dec-reps" data-index="${index}">−</button>
                            <div class="control-value">${exercise.reps} reps</div>
                            <button class="control-btn" data-action="inc-reps" data-index="${index}">+</button>
                        </div>
                        <div class="control-row">
                            <div class="control-label">Sets</div>
                            <button class="control-btn" data-action="dec-sets" data-index="${index}">−</button>
                            <div class="control-value">${exercise.sets || 0} sets</div>
                            <button class="control-btn" data-action="inc-sets" data-index="${index}">+</button>
                        </div>
                    </div>
                </div>
            `;
        } else if (exercise.type === 'stepmill') {
            return `
                <div class="exercise-card" data-index="${index}">
                    <div class="exercise-card-header">
                        <div class="exercise-name">${exercise.name}</div>
                        <button class="btn-icon btn-remove" data-action="remove" data-index="${index}">
                            🗑️
                        </button>
                    </div>
                    <div class="exercise-controls">
                        <div class="control-row">
                            <div class="control-label">Floors</div>
                            <button class="control-btn" data-action="dec-floors" data-index="${index}">−</button>
                            <div class="control-value">${exercise.floors} floors</div>
                            <button class="control-btn" data-action="inc-floors" data-index="${index}">+</button>
                        </div>
                    </div>
                </div>
            `;
        } else if (exercise.type === 'walking') {
            return `
                <div class="exercise-card" data-index="${index}">
                    <div class="exercise-card-header">
                        <div class="exercise-name">${exercise.name}</div>
                        <button class="btn-icon btn-remove" data-action="remove" data-index="${index}">
                            🗑️
                        </button>
                    </div>
                    <div class="exercise-controls">
                        <div class="control-row">
                            <div class="control-label">Time</div>
                            <button class="control-btn" data-action="dec-minutes" data-index="${index}">−</button>
                            <div class="control-value">${exercise.minutes} min</div>
                            <button class="control-btn" data-action="inc-minutes" data-index="${index}">+</button>
                        </div>
                    </div>
                </div>
            `;
        }

        return '';
    }

    setupEventListeners() {
        // Back button
        document.getElementById('back-btn').addEventListener('click', () => {
            State.setView('history');
        });

        // Save button
        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveWorkout();
        });

        // Add exercise button
        document.getElementById('add-exercise-btn').addEventListener('click', () => {
            this.showExercisePicker();
        });

        // Exercise control buttons (event delegation)
        document.getElementById('exercise-cards').addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const index = parseInt(e.target.dataset.index);

            if (action && index >= 0) {
                this.handleExerciseAction(action, index);
            }
        });

        // Date change
        document.getElementById('workout-date').addEventListener('change', (e) => {
            this.workout.date = e.target.value;
            this.workout.displayDate = DateUtils.toKoreanDate(e.target.value);
        });
    }

    handleExerciseAction(action, index) {
        const exercise = this.exercises[index];

        switch (action) {
            case 'remove':
                this.exercises.splice(index, 1);
                break;

            case 'inc-weight':
                exercise.weight += 5;
                break;
            case 'dec-weight':
                exercise.weight = Math.max(0, exercise.weight - 5);
                break;

            case 'inc-reps':
                exercise.reps += 1;
                break;
            case 'dec-reps':
                exercise.reps = Math.max(1, exercise.reps - 1);
                break;

            case 'inc-sets':
                exercise.sets = (exercise.sets || 0) + 1;
                break;
            case 'dec-sets':
                exercise.sets = Math.max(0, (exercise.sets || 0) - 1);
                break;

            case 'inc-floors':
                exercise.floors += 10;
                break;
            case 'dec-floors':
                exercise.floors = Math.max(0, exercise.floors - 10);
                break;

            case 'inc-minutes':
                exercise.minutes += 5;
                break;
            case 'dec-minutes':
                exercise.minutes = Math.max(0, exercise.minutes - 5);
                break;
        }

        // Re-render exercise cards
        document.getElementById('exercise-cards').innerHTML = this.renderExerciseCards();
    }

    showExercisePicker() {
        const exercises = State.exercises;

        // Split exercises by type
        const weighted = exercises.filter(ex => ex.type === 'weighted');
        const cardio = exercises.filter(ex => ex.type === 'stepmill' || ex.type === 'walking');

        // Show top 20 weighted exercises
        const commonExercises = weighted.slice(0, 20);

        const pickerHTML = `
            <div class="exercise-picker">
                <div class="picker-header">
                    <button id="picker-back-btn" class="btn-secondary">← Back</button>
                    <h2>Select Exercise</h2>
                    <div style="width: 44px;"></div>
                </div>
                <div class="picker-content">
                    <div class="search-box">
                        <input type="text" id="exercise-search" placeholder="🔍 Search exercises...">
                    </div>

                    ${commonExercises.length > 0 ? `
                        <div class="picker-section">
                            <div class="section-title">Common Exercises</div>
                            <div class="exercise-grid">
                                ${commonExercises.map(ex => `
                                    <button class="exercise-option" data-exercise='${JSON.stringify(ex)}'>
                                        <div class="exercise-option-name">${ex.name}</div>
                                        <div class="exercise-option-count">${ex.count} times</div>
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <div class="picker-section">
                        <div class="section-title">Cardio</div>
                        <div class="cardio-buttons">
                            <button class="btn btn-secondary cardio-btn" data-cardio="stepmill">
                                스탭밀 75층
                            </button>
                            <button class="btn btn-secondary cardio-btn" data-cardio="walking">
                                걷기 10분
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.container.insertAdjacentHTML('beforeend', pickerHTML);
        this.showingPicker = true;

        // Setup picker event listeners
        document.getElementById('picker-back-btn').addEventListener('click', () => {
            this.hideExercisePicker();
        });

        // Exercise selection
        document.querySelectorAll('.exercise-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const exerciseData = JSON.parse(e.currentTarget.dataset.exercise);
                this.addExercise(exerciseData);
            });
        });

        // Cardio buttons
        document.querySelectorAll('.cardio-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.cardio;
                if (type === 'stepmill') {
                    this.addExercise({
                        name: '스탭밀',
                        type: 'stepmill',
                        lastFloors: 75
                    });
                } else if (type === 'walking') {
                    this.addExercise({
                        name: '걷기',
                        type: 'walking',
                        lastMinutes: 10
                    });
                }
            });
        });

        // Search functionality
        const searchInput = document.getElementById('exercise-search');
        searchInput.addEventListener('input', (e) => {
            this.filterExercises(e.target.value);
        });
    }

    filterExercises(query) {
        if (!query) {
            document.querySelectorAll('.exercise-option').forEach(btn => {
                btn.style.display = 'flex';
            });
            return;
        }

        const lowerQuery = query.toLowerCase();
        document.querySelectorAll('.exercise-option').forEach(btn => {
            const data = JSON.parse(btn.dataset.exercise);
            const matches = data.name.toLowerCase().includes(lowerQuery);
            btn.style.display = matches ? 'flex' : 'none';
        });
    }

    hideExercisePicker() {
        document.querySelector('.exercise-picker').remove();
        this.showingPicker = false;
    }

    addExercise(exerciseData) {
        // Create new exercise with last used values
        let newExercise;

        if (exerciseData.type === 'weighted') {
            newExercise = {
                type: 'weighted',
                name: exerciseData.name,
                weight: exerciseData.lastWeight || 20,
                reps: exerciseData.lastReps || 12,
                sets: exerciseData.lastSets || 4
            };
        } else if (exerciseData.type === 'stepmill') {
            newExercise = {
                type: 'stepmill',
                name: exerciseData.name,
                floors: exerciseData.lastFloors || 75
            };
        } else if (exerciseData.type === 'walking') {
            newExercise = {
                type: 'walking',
                name: exerciseData.name,
                minutes: exerciseData.lastMinutes || 10
            };
        }

        this.exercises.push(newExercise);
        this.hideExercisePicker();

        // Re-render exercise cards
        document.getElementById('exercise-cards').innerHTML = this.renderExerciseCards();
    }

    async saveWorkout() {
        if (this.exercises.length === 0) {
            alert('Please add exercises');
            return;
        }

        try {
            // Show saving state
            document.getElementById('save-btn').textContent = 'Saving...';
            document.getElementById('save-btn').disabled = true;

            // Create workout object
            const workout = {
                date: this.workout.date,
                displayDate: this.workout.displayDate,
                exercises: this.exercises
            };

            // Get current file content
            const { content: currentContent, sha } = await GitHubAPI.getCurrentYearFile();

            // Parse existing workouts
            const existingWorkouts = Parser.parseFile(currentContent);

            // Prepend new workout
            const updatedWorkouts = [workout, ...existingWorkouts];

            // Serialize back to text
            const newContent = Parser.serializeFile(updatedWorkouts);

            // Save to GitHub
            await GitHubAPI.updateCurrentYearFile(newContent, sha);

            // Update local state
            State.setWorkouts(updatedWorkouts);

            // Show success and go back
            alert('Workout saved! ✓');
            State.setView('history');

        } catch (error) {
            console.error('Save error:', error);
            alert('Save failed: ' + error.message);

            // Re-enable save button
            document.getElementById('save-btn').textContent = 'Save ✓';
            document.getElementById('save-btn').disabled = false;
        }
    }
}
