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

            // Check if line is a date (allow optional time)
            const dateMatch = line.match(/^(\d{1,2})월\s*(\d{1,2})일/);
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

        // Remove trailing punctuation and whitespace (comma, semicolon, period, etc.)
        line = line.replace(/[\s,;.]+$/, '').trim();

        // Skip lines with commas (complex multi-set format)
        if (line.includes(',')) {
            return null;
        }

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

        // Pattern 3: Plank with seconds - "플랭크 60초 x 4"
        const plankMatch = line.match(/^(.+?)\s+(\d+)초\s*x\s*(\d+)$/);
        if (plankMatch) {
            return {
                type: 'walking', // Treat as time-based exercise
                name: plankMatch[1].trim(),
                minutes: Math.ceil(parseInt(plankMatch[2]) / 60) // Convert to minutes
            };
        }

        // Pattern 4: Complex format "덤벨 숄더 프레스 10kg x 2 12 x 4"
        // Format: name Xkg x Y reps x sets (where Y is multiplier)
        let complexMatch = line.match(/^(.+?)\s+(\d+(?:\.\d+)?)kg\s*x\s*(\d+)\s+(\d+)\s*x\s*(\d+(?:\.\d+)?)$/);
        if (complexMatch) {
            const weight = parseFloat(complexMatch[2]) * parseInt(complexMatch[3]); // Multiply
            return {
                type: 'weighted',
                name: complexMatch[1].trim(),
                weight: weight,
                reps: parseInt(complexMatch[4]),
                sets: parseFloat(complexMatch[5])
            };
        }

        // Pattern 5: Simple weighted - "레그프레스 120kg 12 x 4"
        let weightedMatch = line.match(/^(.+?)\s+(\d+(?:\.\d+)?)kg\s+(\d+)\s*x\s+(\d+(?:\.\d+)?)$/);
        if (weightedMatch) {
            return {
                type: 'weighted',
                name: weightedMatch[1].trim(),
                weight: parseFloat(weightedMatch[2]),
                reps: parseInt(weightedMatch[3]),
                sets: parseFloat(weightedMatch[4])
            };
        }

        // Pattern 6: With 'x' but no sets number: "12 x"
        weightedMatch = line.match(/^(.+?)\s+(\d+(?:\.\d+)?)kg\s+(\d+)\s*x$/);
        if (weightedMatch) {
            return {
                type: 'weighted',
                name: weightedMatch[1].trim(),
                weight: parseFloat(weightedMatch[2]),
                reps: parseInt(weightedMatch[3]),
                sets: null
            };
        }

        // Pattern 7: Just reps: "레그프레스 120kg 12"
        weightedMatch = line.match(/^(.+?)\s+(\d+(?:\.\d+)?)kg\s+(\d+)$/);
        if (weightedMatch) {
            return {
                type: 'weighted',
                name: weightedMatch[1].trim(),
                weight: parseFloat(weightedMatch[2]),
                reps: parseInt(weightedMatch[3]),
                sets: null
            };
        }

        // Pattern 8: No weight (bodyweight exercises like "카프 레이즈 10 x 4")
        const bodyweightMatch = line.match(/^(.+?)\s+(\d+)\s*x\s*(\d+)$/);
        if (bodyweightMatch) {
            return {
                type: 'weighted',
                name: bodyweightMatch[1].trim(),
                weight: 0, // Bodyweight
                reps: parseInt(bodyweightMatch[2]),
                sets: parseInt(bodyweightMatch[3])
            };
        }

        // If no pattern matches, return null (skip line)
        console.warn('Failed to parse exercise line:', line);
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
