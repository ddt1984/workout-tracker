// Authentication view component
import { GitHubAPI } from '../core/github-api.js';
import { Storage } from '../core/storage.js';
import { State } from '../core/state.js';

export class AuthView {
    constructor(container) {
        this.container = container;
        this.deviceFlowData = null;
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
                        <p>인증 중...</p>
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

        // Show login button
        this.container.innerHTML = `
            <div class="auth-view">
                <h1>🏋️</h1>
                <h2>Workout Tracker</h2>
                <p>GitHub에 로그인하여 운동 기록을 동기화하세요</p>
                <button id="login-btn" class="btn btn-primary btn-large">
                    GitHub로 로그인
                </button>
            </div>
        `;

        document.getElementById('login-btn').addEventListener('click', () => {
            this.startLogin();
        });
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
                        환영합니다, ${user.login}님!
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
                        로그인 실패: ${error.message}
                    </div>
                    <button id="retry-btn" class="btn btn-primary btn-large">
                        다시 시도
                    </button>
                </div>
            `;

            document.getElementById('retry-btn').addEventListener('click', () => {
                this.render();
            });
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
