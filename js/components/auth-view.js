// Authentication view component
import { GitHubAPI } from '../core/github-api.js';
import { Storage } from '../core/storage.js';
import { State } from '../core/state.js';

export class AuthView {
    constructor(container) {
        this.container = container;
        this.deviceFlowData = null;
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
        const token = Storage.getToken();

        // If already have token, try to authenticate
        if (token) {
            this.container.innerHTML = `
                <div class="auth-view">
                    <h1>🏋️</h1>
                    <p>Workout Tracker</p>
                    <div class="loading">
                        <div class="spinner"></div>
                        <p>Authenticating...</p>
                    </div>
                </div>
            `;

            try {
                GitHubAPI.init(token);
                const user = await GitHubAPI.getUser();
                State.setUser(user);

                // Set default repo (assume same name as this app)
                Storage.setRepo(user.login, 'workout');

                // Navigate to history view
                State.setView('history');
            } catch (error) {
                console.error('Auth error:', error);
                Storage.clear();
                this.render();
            }
            return;
        }

        // Show login button and token input
        this.container.innerHTML = `
            <div class="auth-view">
                <h1>🏋️</h1>
                <h2>Workout Tracker</h2>
                <p>Login with GitHub Personal Access Token</p>

                <div style="width: 100%; max-width: 400px; margin: 2rem 0;">
                    <label style="display: block; color: var(--text-secondary); margin-bottom: 0.5rem; font-size: 0.9rem;">
                        Personal Access Token:
                    </label>
                    <input
                        type="password"
                        id="token-input"
                        placeholder="ghp_..."
                        style="width: 100%; padding: 0.75rem; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border); border-radius: var(--radius-sm); font-family: monospace; font-size: 0.9rem;"
                    >
                    <button id="token-login-btn" class="btn btn-primary btn-large" style="margin-top: 1rem;">
                        Login
                    </button>
                </div>

                <details style="margin-top: 2rem; max-width: 400px; color: var(--text-secondary); font-size: 0.85rem;">
                    <summary style="cursor: pointer; margin-bottom: 0.5rem;">How to create a token</summary>
                    <ol style="margin-left: 1.5rem; line-height: 1.8;">
                        <li><a href="https://github.com/settings/tokens" target="_blank" style="color: var(--accent);">GitHub Settings → Tokens</a></li>
                        <li>Click "Generate new token (classic)"</li>
                        <li>Check "repo" scope</li>
                        <li>Generate and copy the token, then paste above</li>
                    </ol>
                </details>
            </div>
        `;

        const loginHandler = () => this.loginWithToken();
        this.addEventListener(document.getElementById('token-login-btn'), 'click', loginHandler);

        const keypressHandler = (e) => {
            if (e.key === 'Enter') {
                this.loginWithToken();
            }
        };
        this.addEventListener(document.getElementById('token-input'), 'keypress', keypressHandler);
    }

    async loginWithToken() {
        const tokenInput = document.getElementById('token-input');
        const token = tokenInput.value.trim();

        if (!token) {
            alert('Please enter a token');
            return;
        }

        if (!token.startsWith('ghp_')) {
            alert('Please enter a valid GitHub Personal Access Token (starts with ghp_)');
            return;
        }

        try {
            // Show loading
            this.container.innerHTML = `
                <div class="auth-view">
                    <h1>🏋️</h1>
                    <div class="loading">
                        <div class="spinner"></div>
                        <p>Authenticating...</p>
                    </div>
                </div>
            `;

            // Initialize with token
            GitHubAPI.init(token);

            // Get user info
            const user = await GitHubAPI.getUser();

            // Save token and user info
            Storage.setToken(token);
            Storage.setRepo(user.login, 'workout');
            State.setUser(user);

            // Show success
            this.container.innerHTML = `
                <div class="auth-view">
                    <h1>🏋️</h1>
                    <div class="message message-success">
                        Welcome, ${user.login}!
                    </div>
                </div>
            `;

            // Navigate to history
            setTimeout(() => {
                State.setView('history');
            }, 1000);

        } catch (error) {
            console.error('Token login error:', error);
            this.container.innerHTML = `
                <div class="auth-view">
                    <h1>🏋️</h1>
                    <div class="message message-error">
                        Login failed: ${error.message}
                    </div>
                    <button id="retry-btn" class="btn btn-primary btn-large">
                        Retry
                    </button>
                </div>
            `;

            const retryHandler = () => this.render();
            this.addEventListener(document.getElementById('retry-btn'), 'click', retryHandler);
        }
    }

    async startLogin() {
        try {
            // Start device flow
            this.container.innerHTML = `
                <div class="auth-view">
                    <h1>🏋️</h1>
                    <div class="loading">
                        <div class="spinner"></div>
                        <p>인증 준비 중...</p>
                    </div>
                </div>
            `;

            this.deviceFlowData = await GitHubAPI.startDeviceFlow();

            // Show device code
            this.container.innerHTML = `
                <div class="auth-view">
                    <h1>🏋️</h1>
                    <h2>GitHub 인증</h2>
                    <p>다음 코드를 입력하여 인증하세요:</p>
                    <div class="device-code">
                        <code>${this.deviceFlowData.userCode}</code>
                    </div>
                    <a href="${this.deviceFlowData.verificationUri}" target="_blank" class="btn btn-primary btn-large">
                        GitHub에서 인증하기
                    </a>
                    <p style="margin-top: 1rem; color: var(--text-secondary); font-size: 0.9rem;">
                        인증 후 자동으로 로그인됩니다
                    </p>
                    <div class="loading" style="margin-top: 2rem;">
                        <div class="spinner"></div>
                        <p>인증 대기 중...</p>
                    </div>
                </div>
            `;

            // Start polling
            const token = await GitHubAPI.pollDeviceFlow(
                this.deviceFlowData.deviceCode,
                this.deviceFlowData.interval
            );

            // Save token and initialize
            Storage.setToken(token);
            GitHubAPI.init(token);

            // Get user info
            const user = await GitHubAPI.getUser();
            State.setUser(user);

            // Show success
            this.container.innerHTML = `
                <div class="auth-view">
                    <h1>🏋️</h1>
                    <div class="message message-success">
                        Welcome, ${user.login}!
                    </div>
                    <div class="loading">
                        <div class="spinner"></div>
                        <p>설정 중...</p>
                    </div>
                </div>
            `;

            // Setup repository
            await this.setupRepository(user);

        } catch (error) {
            console.error('Login error:', error);
            this.container.innerHTML = `
                <div class="auth-view">
                    <h1>🏋️</h1>
                    <div class="message message-error">
                        Login failed: ${error.message}
                    </div>
                    <button id="retry-btn" class="btn btn-primary btn-large">
                        Retry
                    </button>
                </div>
            `;

            const retryHandler = () => this.render();
            this.addEventListener(document.getElementById('retry-btn'), 'click', retryHandler);
        }
    }

    async setupRepository(user) {
        // For now, use default repository name
        // In future, could let user select from their repos
        Storage.setRepo(user.login, 'workout');
        GitHubAPI.owner = user.login;
        GitHubAPI.repo = 'workout';

        // Navigate to history
        State.setView('history');
    }
}
