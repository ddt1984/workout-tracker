// Main application entry point
import { State } from './core/state.js';
import { Storage } from './core/storage.js';
import { AuthView } from './components/auth-view.js';
import { HistoryView } from './components/history-view.js';
import { EditorView } from './components/editor-view.js';

class App {
    constructor() {
        this.container = document.getElementById('view-container');
        this.currentView = null;

        // Subscribe to state changes
        State.subscribe(state => {
            this.handleStateChange(state);
        });

        // Check authentication and set initial view
        const token = Storage.getToken();
        if (token) {
            State.setView('auth'); // Will auto-login
        } else {
            State.setView('auth');
        }
    }

    handleStateChange(state) {
        // Route to appropriate view
        if (state.currentView !== this.currentViewName) {
            this.navigateTo(state.currentView);
        }
    }

    navigateTo(viewName) {
        this.currentViewName = viewName;

        // Clear container
        this.container.innerHTML = '';

        // Create and render view
        switch (viewName) {
            case 'auth':
                this.currentView = new AuthView(this.container);
                break;

            case 'history':
                this.currentView = new HistoryView(this.container);
                break;

            case 'editor':
                this.currentView = new EditorView(this.container);
                break;

            default:
                this.container.innerHTML = '<div class="error">Unknown view</div>';
                return;
        }

        this.currentView.render();
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new App();
    });
} else {
    new App();
}
