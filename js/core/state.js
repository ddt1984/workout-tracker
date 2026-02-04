// Global app state management
export const State = {
    // Current state
    user: null,
    workouts: [], // All workouts (flattened from all years)
    workoutsByYear: {}, // Year -> workouts map for caching
    exercises: [], // Exercise database with frequency
    currentView: 'auth',
    isLoading: false,
    error: null,

    // Listeners
    listeners: [],

    // Subscribe to state changes
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    },

    // Update state and notify listeners
    update(updates) {
        Object.assign(this, updates);
        this.listeners.forEach(listener => listener(this));
    },

    // Set loading state
    setLoading(isLoading) {
        this.update({ isLoading });
    },

    // Set error
    setError(error) {
        this.update({ error: error ? error.message || String(error) : null });
    },

    // Clear error
    clearError() {
        this.update({ error: null });
    },

    // Set user
    setUser(user) {
        this.update({ user });
    },

    // Set workouts for a specific year
    setWorkoutsForYear(year, workouts) {
        this.workoutsByYear[year] = workouts;

        // Flatten all workouts from all years
        const allWorkouts = Object.values(this.workoutsByYear)
            .flat()
            .sort((a, b) => b.date.localeCompare(a.date)); // Sort by date desc

        this.update({
            workouts: allWorkouts,
            workoutsByYear: this.workoutsByYear
        });
        this.buildExerciseDatabase();
    },

    // Set workouts (legacy method, sets current year)
    setWorkouts(workouts) {
        const year = new Date().getFullYear();
        this.setWorkoutsForYear(year, workouts);
    },

    // Get workouts for a specific year
    getWorkoutsForYear(year) {
        return this.workoutsByYear[year] || [];
    },

    // Check if year data is loaded
    hasYearData(year) {
        return year in this.workoutsByYear;
    },

    // Build exercise database from workouts
    buildExerciseDatabase() {
        const exerciseMap = new Map();

        this.workouts.forEach(workout => {
            workout.exercises.forEach(exercise => {
                const name = exercise.name;
                const existing = exerciseMap.get(name);

                if (existing) {
                    existing.count++;
                    existing.lastUsed = workout.date > existing.lastUsed ? workout.date : existing.lastUsed;
                    // Track last values
                    if (exercise.weight) existing.lastWeight = exercise.weight;
                    if (exercise.reps) existing.lastReps = exercise.reps;
                    if (exercise.sets) existing.lastSets = exercise.sets;
                    if (exercise.floors) existing.lastFloors = exercise.floors;
                    if (exercise.minutes) existing.lastMinutes = exercise.minutes;
                } else {
                    exerciseMap.set(name, {
                        name,
                        type: exercise.type,
                        count: 1,
                        lastUsed: workout.date,
                        lastWeight: exercise.weight || null,
                        lastReps: exercise.reps || null,
                        lastSets: exercise.sets || null,
                        lastFloors: exercise.floors || null,
                        lastMinutes: exercise.minutes || null
                    });
                }
            });
        });

        // Sort by frequency (most used first)
        this.exercises = Array.from(exerciseMap.values())
            .sort((a, b) => b.count - a.count);

        this.update({ exercises: this.exercises });
    },

    // Change view
    setView(view) {
        this.update({ currentView: view });
    },

    // Get exercise by name
    getExercise(name) {
        return this.exercises.find(ex => ex.name === name);
    },

    // Get latest workout
    getLatestWorkout() {
        return this.workouts.length > 0 ? this.workouts[0] : null;
    }
};
