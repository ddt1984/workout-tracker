// GitHub API wrapper using Octokit
import { Storage } from './storage.js';

export const GitHubAPI = {
    octokit: null,
    owner: null,
    repo: null,

    // OAuth App credentials (these will need to be set up)
    CLIENT_ID: 'Ov23liZCyxXjfrUMRvt1', // TODO: Replace with actual client ID

    // Initialize Octokit with token
    init(token) {
        if (typeof Octokit === 'undefined') {
            throw new Error('Octokit library not loaded');
        }

        this.octokit = new Octokit.Octokit({
            auth: token
        });

        const repoData = Storage.getRepo();
        this.owner = repoData.owner;
        this.repo = repoData.repo;
    },

    // Check if initialized
    isInitialized() {
        return this.octokit !== null && this.owner && this.repo;
    },

    // Start OAuth device flow
    async startDeviceFlow() {
        try {
            const response = await fetch('https://github.com/login/device/code', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    client_id: this.CLIENT_ID,
                    scope: 'repo'
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error_description || data.error);
            }

            return {
                deviceCode: data.device_code,
                userCode: data.user_code,
                verificationUri: data.verification_uri,
                expiresIn: data.expires_in,
                interval: data.interval
            };
        } catch (error) {
            console.error('Device flow error:', error);
            throw error;
        }
    },

    // Poll for device flow completion
    async pollDeviceFlow(deviceCode, interval = 5) {
        return new Promise((resolve, reject) => {
            const poll = setInterval(async () => {
                try {
                    const response = await fetch('https://github.com/login/oauth/access_token', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            client_id: this.CLIENT_ID,
                            device_code: deviceCode,
                            grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
                        })
                    });

                    const data = await response.json();

                    if (data.access_token) {
                        clearInterval(poll);
                        resolve(data.access_token);
                    } else if (data.error === 'authorization_pending') {
                        // Keep polling
                    } else if (data.error) {
                        clearInterval(poll);
                        reject(new Error(data.error_description || data.error));
                    }
                } catch (error) {
                    clearInterval(poll);
                    reject(error);
                }
            }, interval * 1000);

            // Timeout after 10 minutes
            setTimeout(() => {
                clearInterval(poll);
                reject(new Error('Authentication timeout'));
            }, 10 * 60 * 1000);
        });
    },

    // Get authenticated user info
    async getUser() {
        if (!this.octokit) {
            throw new Error('Not initialized');
        }

        const { data } = await this.octokit.rest.users.getAuthenticated();
        return data;
    },

    // Get file content from repository
    async getFileContent(path) {
        if (!this.isInitialized()) {
            throw new Error('Not initialized');
        }

        try {
            const { data } = await this.octokit.rest.repos.getContent({
                owner: this.owner,
                repo: this.repo,
                path: path
            });

            // Decode base64 content (remove newlines first)
            const base64Content = data.content.replace(/\n/g, '');
            const content = decodeURIComponent(escape(atob(base64Content)));
            return {
                content,
                sha: data.sha
            };
        } catch (error) {
            if (error.status === 404) {
                // File doesn't exist, return empty
                return {
                    content: '',
                    sha: null
                };
            }
            throw error;
        }
    },

    // Update file in repository
    async updateFile(path, content, message, sha = null) {
        if (!this.isInitialized()) {
            throw new Error('Not initialized');
        }

        try {
            // If no SHA provided, try to get current file
            if (!sha) {
                try {
                    const current = await this.getFileContent(path);
                    sha = current.sha;
                } catch (e) {
                    // File might not exist, that's ok for new files
                }
            }

            // Encode content to base64
            const encodedContent = btoa(unescape(encodeURIComponent(content)));

            const params = {
                owner: this.owner,
                repo: this.repo,
                path: path,
                message: message,
                content: encodedContent
            };

            // Include SHA if updating existing file
            if (sha) {
                params.sha = sha;
            }

            const { data } = await this.octokit.rest.repos.createOrUpdateFileContents(params);

            return {
                sha: data.content.sha,
                commit: data.commit
            };
        } catch (error) {
            console.error('Update file error:', error);
            throw error;
        }
    },

    // Get current year's workout file
    async getCurrentYearFile() {
        const year = new Date().getFullYear();
        const path = `records_${year}.txt`;
        return this.getFileContent(path);
    },

    // Update current year's workout file
    async updateCurrentYearFile(content, sha = null) {
        const year = new Date().getFullYear();
        const path = `records_${year}.txt`;
        const message = `Update workout - ${new Date().toISOString().split('T')[0]}`;
        return this.updateFile(path, content, message, sha);
    },

    // List repositories for user (for setup)
    async listRepos() {
        if (!this.octokit) {
            throw new Error('Not initialized');
        }

        const { data } = await this.octokit.rest.repos.listForAuthenticatedUser({
            sort: 'updated',
            per_page: 100
        });

        return data;
    }
};
