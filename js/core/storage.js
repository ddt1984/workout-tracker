// LocalStorage wrapper for app data
export const Storage = {
    // Keys
    KEYS: {
        TOKEN: 'github_token',
        REPO: 'github_repo',
        OWNER: 'github_owner',
        CACHED_WORKOUTS: 'cached_workouts',
        LAST_SYNC: 'last_sync'
    },

    // Get item from localStorage
    get(key) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        } catch (e) {
            console.error('Storage.get error:', e);
            return null;
        }
    },

    // Set item in localStorage
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage.set error:', e);
            return false;
        }
    },

    // Remove item from localStorage
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Storage.remove error:', e);
            return false;
        }
    },

    // Clear all app data
    clear() {
        Object.values(this.KEYS).forEach(key => this.remove(key));
    },

    // Auth helpers
    getToken() {
        return this.get(this.KEYS.TOKEN);
    },

    setToken(token) {
        return this.set(this.KEYS.TOKEN, token);
    },

    getRepo() {
        return {
            owner: this.get(this.KEYS.OWNER),
            repo: this.get(this.KEYS.REPO)
        };
    },

    setRepo(owner, repo) {
        this.set(this.KEYS.OWNER, owner);
        this.set(this.KEYS.REPO, repo);
    },

    // Workout cache helpers
    getCachedWorkouts() {
        return this.get(this.KEYS.CACHED_WORKOUTS) || [];
    },

    setCachedWorkouts(workouts) {
        this.set(this.KEYS.CACHED_WORKOUTS, workouts);
        this.set(this.KEYS.LAST_SYNC, new Date().toISOString());
    },

    getLastSync() {
        return this.get(this.KEYS.LAST_SYNC);
    }
};
