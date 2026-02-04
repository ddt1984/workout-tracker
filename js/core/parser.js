// Parser for workout txt files
// Handles Korean date format: "M월 D일"
// Exercise formats:
// - Weighted: "레그프레스 120kg 12 x 4"
// - Step mill: "스탭밀 75층"
// - Walking: "걷기 10분"

export const Parser = {
    // Parse entire file into workout array
    parseFile(fileContent, year = new Date().getFullYear()) {
        const workouts = [];
        const lines = fileContent.split('\n');
        let currentWorkout = null;
        let currentDate = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Skip empty lines and separators
            if (!line || line === '---') {
                continue;
            }

            // Check if line is a date
            const dateMatch = line.match(/^(\d{1,2})월\s*(\d{1,2})일$/);
            if (dateMatch) {
                // Save previous workout if exists
                if (currentWorkout && currentWorkout.exercises.length > 0) {
                    workouts.push(currentWorkout);
                }

                // Start new workout
                const month = parseInt(dateMatch[1]);
                const day = parseInt(dateMatch[2]);
                const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                currentWorkout = {
                    date: isoDate,
                    displayDate: line,
                    exercises: []
                };
                currentDate = line;
            } else if (currentWorkout) {
                // Parse exercise line
                const exercise = this.parseExerciseLine(line);
                if (exercise) {
                    currentWorkout.exercises.push(exercise);
                }
            }
        }

        // Add last workout
        if (currentWorkout && currentWorkout.exercises.length > 0) {
            workouts.push(currentWorkout);
        }

        return workouts;
    },

    // Parse single exercise line
    parseExerciseLine(line) {
        line = line.trim();
        if (!line) return null;

        // Pattern 1: Step mill - "스탭밀 75층"
        const stepmillMatch = line.match(/^(.+?)\s+(\d+)층$/);
        if (stepmillMatch) {
            return {
                type: 'stepmill',
                name: stepmillMatch[1].trim(),
                floors: parseInt(stepmillMatch[2])
            };
        }

        // Pattern 2: Walking - "걷기 10분"
        const walkingMatch = line.match(/^(.+?)\s+(\d+)분$/);
        if (walkingMatch) {
            return {
                type: 'walking',
                name: walkingMatch[1].trim(),
                minutes: parseInt(walkingMatch[2])
            };
        }

        // Pattern 3: Weighted exercise - "레그프레스 120kg 12 x 4"
        // Format: name weight reps x sets (sets is optional)
        const weightedMatch = line.match(/^(.+?)\s+(\d+(?:\.\d+)?)kg\s+(\d+)\s*x?\s*(\d*)$/);
        if (weightedMatch) {
            const sets = weightedMatch[4] ? parseInt(weightedMatch[4]) : null;
            return {
                type: 'weighted',
                name: weightedMatch[1].trim(),
                weight: parseFloat(weightedMatch[2]),
                reps: parseInt(weightedMatch[3]),
                sets: sets
            };
        }

        // If no pattern matches, return null (skip line)
        return null;
    },

    // Serialize single workout to text format
    serializeWorkout(workout) {
        const lines = [workout.displayDate];

        workout.exercises.forEach(exercise => {
            lines.push(this.serializeExercise(exercise));
        });

        return lines.join('\n');
    },

    // Serialize single exercise
    serializeExercise(exercise) {
        switch (exercise.type) {
            case 'stepmill':
                return `${exercise.name} ${exercise.floors}층`;

            case 'walking':
                return `${exercise.name} ${exercise.minutes}분`;

            case 'weighted':
                if (exercise.sets) {
                    return `${exercise.name} ${exercise.weight}kg ${exercise.reps} x ${exercise.sets}`;
                } else {
                    return `${exercise.name} ${exercise.weight}kg ${exercise.reps} x`;
                }

            default:
                return '';
        }
    },

    // Serialize entire workout array to file content
    serializeFile(workouts) {
        const sections = [];

        workouts.forEach((workout, index) => {
            sections.push(this.serializeWorkout(workout));

            // Add separator between months (when month changes)
            if (index < workouts.length - 1) {
                const currentMonth = workout.displayDate.match(/^(\d{1,2})월/)[1];
                const nextMonth = workouts[index + 1].displayDate.match(/^(\d{1,2})월/)[1];

                if (currentMonth !== nextMonth) {
                    sections.push('\n---');
                }
            }
        });

        return sections.join('\n\n');
    },

    // Create new workout from form data
    createWorkout(date, exercises) {
        // Convert ISO date to Korean format
        const d = new Date(date);
        const month = d.getMonth() + 1;
        const day = d.getDate();
        const displayDate = `${month}월 ${day}일`;

        return {
            date,
            displayDate,
            exercises
        };
    },

    // Extract month from display date for grouping
    getMonth(displayDate) {
        const match = displayDate.match(/^(\d{1,2})월/);
        return match ? parseInt(match[1]) : 0;
    },

    // Group workouts by month
    groupByMonth(workouts) {
        const groups = {};

        workouts.forEach(workout => {
            const month = this.getMonth(workout.displayDate);
            const key = `${month}월`;

            if (!groups[key]) {
                groups[key] = [];
            }

            groups[key].push(workout);
        });

        return groups;
    }
};
