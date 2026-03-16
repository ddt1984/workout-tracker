// Calendar view component - shows workout calendar
import { GitHubAPI } from '../core/github-api.js';
import { Parser } from '../core/parser.js';
import { State } from '../core/state.js';
import { DateUtils } from '../utils/date-utils.js';

export class CalendarView {
    constructor(container) {
        this.container = container;
        this.currentYear = new Date().getFullYear();
        this.currentMonth = new Date().getMonth(); // 0-11
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
        this.container.innerHTML = `
            <div class="calendar-view">
                <div class="header">
                    <h1>🏋️ Workout Tracker</h1>
                    <div class="header-actions">
                        <button id="refresh-btn" class="btn-icon" title="Refresh">
                            🔄
                        </button>
                        <button id="settings-btn" class="btn-icon" title="Settings">
                            ⚙️
                        </button>
                    </div>
                </div>

                <div class="tab-nav">
                    <button id="history-tab" class="tab-btn">
                        📋 History
                    </button>
                    <button id="calendar-tab" class="tab-btn active">
                        📊 Analytics
                    </button>
                </div>

                <div class="calendar-container">
                    <!-- Monthly Workout Days Chart -->
                    <div class="analytics-section">
                        <h2 class="analytics-title">Monthly Workout Days</h2>
                        <div id="monthly-chart" class="monthly-chart">
                            <!-- Chart will be rendered here -->
                        </div>
                    </div>

                    <!-- Calendar -->
                    <div class="calendar-header">
                        <button id="prev-month" class="btn-icon">←</button>
                        <h2 id="current-month"></h2>
                        <button id="next-month" class="btn-icon">→</button>
                    </div>
                    <div class="calendar-grid" id="calendar-grid">
                        <!-- Calendar will be rendered here -->
                    </div>
                    <div class="calendar-legend">
                        <div class="legend-item">
                            <div class="legend-dot workout-day"></div>
                            <span>Workout day</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-dot today"></div>
                            <span>Today</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.renderMonthlyChart();
        this.renderCalendar();
        this.setupEventListeners();
    }

    async renderMonthlyChart() {
        // Get last 13 months of data
        const today = new Date();
        const monthsData = [];

        // Collect unique years needed
        const yearsNeeded = new Set();
        for (let i = 12; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            yearsNeeded.add(date.getFullYear());
        }

        // Load data for years we don't have yet
        for (const year of yearsNeeded) {
            if (!State.hasYearData(year)) {
                await this.loadYearData(year);
            }
        }

        let prevYear = null;
        for (let i = 12; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const year = date.getFullYear();
            const month = date.getMonth();

            // Count unique workout days for this month
            const workoutDays = new Set();

            // Get workouts for this year
            const yearWorkouts = State.getWorkoutsForYear(year);

            yearWorkouts.forEach(workout => {
                const workoutDate = new Date(workout.date);
                if (workoutDate.getFullYear() === year && workoutDate.getMonth() === month) {
                    workoutDays.add(workoutDate.getDate());
                }
            });

            // Show year only when it changes
            const showYear = prevYear !== year;
            const yearShort = String(year).slice(-2);
            const monthNum = month + 1;
            const label = showYear ? `${monthNum}\n'${yearShort}` : String(monthNum);
            prevYear = year;

            monthsData.push({
                year: year,
                month: month,
                count: workoutDays.size,
                label: label
            });
        }

        // Find max count for scaling
        const maxCount = Math.max(...monthsData.map(m => m.count), 1);

        // Generate chart HTML
        let chartHTML = '<div class="chart-bars">';

        monthsData.forEach(data => {
            const percentage = (data.count / maxCount) * 100;
            const isCurrentMonth = data.year === today.getFullYear() && data.month === today.getMonth();

            chartHTML += `
                <div class="chart-bar-container ${isCurrentMonth ? 'current' : ''}">
                    <div class="chart-bar" style="height: ${percentage}%">
                        <span class="bar-value">${data.count}</span>
                    </div>
                    <div class="bar-label">${data.label}</div>
                </div>
            `;
        });

        chartHTML += '</div>';

        document.getElementById('monthly-chart').innerHTML = chartHTML;
    }

    async loadYearData(year) {
        try {
            // Show loading indicator
            const calendarGrid = document.getElementById('calendar-grid');
            calendarGrid.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading...</p></div>';

            // Load from GitHub
            const { content } = await GitHubAPI.getYearFile(year);

            if (content) {
                // Parse workouts for this year
                const workouts = Parser.parseFile(content, year);
                State.setWorkoutsForYear(year, workouts);

                // Update chart after loading new year data
                this.renderMonthlyChart();
            } else {
                // No data for this year
                State.setWorkoutsForYear(year, []);
            }
        } catch (error) {
            console.error('Failed to load year data:', error);
            // Set empty array so we don't keep trying
            State.setWorkoutsForYear(year, []);
        }
    }

    async renderCalendar() {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];

        // Update month display
        document.getElementById('current-month').textContent =
            `${monthNames[this.currentMonth]} ${this.currentYear}`;

        // Check if we need to load data for this year
        if (!State.hasYearData(this.currentYear)) {
            await this.loadYearData(this.currentYear);
        }

        // Get workout days for this month
        const workoutDays = this.getWorkoutDaysForMonth(this.currentYear, this.currentMonth);

        // Calculate calendar grid
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

        // Generate calendar HTML
        let calendarHTML = `
            <div class="calendar-weekdays">
                <div class="weekday">Sun</div>
                <div class="weekday">Mon</div>
                <div class="weekday">Tue</div>
                <div class="weekday">Wed</div>
                <div class="weekday">Thu</div>
                <div class="weekday">Fri</div>
                <div class="weekday">Sat</div>
            </div>
            <div class="calendar-days">
        `;

        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }

        // Add days of the month
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === this.currentYear &&
                               today.getMonth() === this.currentMonth;

        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = isCurrentMonth && today.getDate() === day;
            const hasWorkout = workoutDays.has(day);

            let dayClass = 'calendar-day';
            if (isToday) dayClass += ' today';
            if (hasWorkout) dayClass += ' workout-day';

            const workoutCount = workoutDays.get(day) || 0;

            calendarHTML += `
                <div class="${dayClass}" data-day="${day}">
                    <span class="day-number">${day}</span>
                    ${hasWorkout ? `<span class="workout-indicator">${workoutCount}</span>` : ''}
                </div>
            `;
        }

        calendarHTML += '</div>';

        document.getElementById('calendar-grid').innerHTML = calendarHTML;

        // Add click handlers for days with workouts
        document.querySelectorAll('.calendar-day.workout-day').forEach(dayEl => {
            const dayClickHandler = () => {
                const day = parseInt(dayEl.dataset.day);
                this.showWorkoutDetails(day);
            };
            this.addEventListener(dayEl, 'click', dayClickHandler);
        });
    }

    getWorkoutDaysForMonth(year, month) {
        const workoutDays = new Map(); // day -> count

        // Get workouts for this specific year
        const yearWorkouts = State.getWorkoutsForYear(year);

        yearWorkouts.forEach(workout => {
            const date = new Date(workout.date);
            if (date.getFullYear() === year && date.getMonth() === month) {
                const day = date.getDate();
                workoutDays.set(day, (workoutDays.get(day) || 0) + 1);
            }
        });

        return workoutDays;
    }

    showWorkoutDetails(day) {
        // Get workouts for this specific year
        const yearWorkouts = State.getWorkoutsForYear(this.currentYear);

        const workouts = yearWorkouts.filter(workout => {
            const date = new Date(workout.date);
            return date.getFullYear() === this.currentYear &&
                   date.getMonth() === this.currentMonth &&
                   date.getDate() === day;
        });

        if (workouts.length === 0) return;

        const workout = workouts[0];
        const exerciseSummary = workout.exercises.map(ex => {
            let text = ex.name;
            if (ex.type === 'weighted') {
                text += ` ${ex.weight}kg`;
            } else if (ex.type === 'stepmill') {
                text += ` ${ex.floors} floors`;
            } else if (ex.type === 'walking') {
                text += ` ${ex.minutes}min`;
            }
            return text;
        }).join('\n');

        alert(`${workout.displayDate}\n\n${exerciseSummary}`);
    }

    setupEventListeners() {
        // Tab navigation
        const historyTabHandler = () => State.setView('history');
        this.addEventListener(document.getElementById('history-tab'), 'click', historyTabHandler);

        // Month navigation
        const prevMonthHandler = () => {
            this.currentMonth--;
            if (this.currentMonth < 0) {
                this.currentMonth = 11;
                this.currentYear--;
            }
            this.renderCalendar();
        };
        this.addEventListener(document.getElementById('prev-month'), 'click', prevMonthHandler);

        const nextMonthHandler = () => {
            this.currentMonth++;
            if (this.currentMonth > 11) {
                this.currentMonth = 0;
                this.currentYear++;
            }
            this.renderCalendar();
        };
        this.addEventListener(document.getElementById('next-month'), 'click', nextMonthHandler);

        // Refresh
        const refreshHandler = () => {
            // Reload chart and calendar
            this.renderMonthlyChart();
            this.renderCalendar();
        };
        this.addEventListener(document.getElementById('refresh-btn'), 'click', refreshHandler);

        // Settings
        const settingsHandler = () => {
            if (confirm('Logout?')) {
                localStorage.clear();
                State.update({
                    user: null,
                    workouts: [],
                    exercises: []
                });
                State.setView('auth');
            }
        };
        this.addEventListener(document.getElementById('settings-btn'), 'click', settingsHandler);
    }
}
