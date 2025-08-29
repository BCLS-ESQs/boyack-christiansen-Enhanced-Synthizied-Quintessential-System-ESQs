/**
 * GitHub Integration for ESQs
 * Auto-saves legal work, session logs, and case files to GitHub
 * Supports both Personal Access Token and GitHub App authentication
 */

class GitHubIntegration {
    constructor() {
        this.token = null;
        this.username = 'JdubIV';
        this.repo = 'boyack-christiansen-Enhanced-Synthizied-Quintessential-System-ESQs';
        this.baseURL = 'https://api.github.com';
        this.isConnected = false;
        this.autoSaveEnabled = true;
        
        // GitHub App configuration
        this.githubApp = {
            appId: 1861159,
            clientId: 'Iv23liU4B03GqrvEok8b',
            privateKey: null,
            installationId: null,
            installationToken: null
        };
        
        // Organization configuration
        this.organization = 'BCLS-ESQs';
        
        console.log('📁 ESQs GitHub Integration ready');
    }

    /**
     * Connect to GitHub with personal access token
     */
    async connect(personalAccessToken) {
        try {
            this.token = personalAccessToken;
            
            // Test connection
            const response = await this.makeRequest('/user');
            
            if (response.login) {
                this.isConnected = true;
                this.username = response.login;
                
                console.log(`✅ Connected to GitHub as ${this.username}`);
                
                return {
                    success: true,
                    username: this.username,
                    message: 'ESQs connected to GitHub successfully'
                };
            }
            
        } catch (error) {
            console.error('❌ GitHub connection failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Connect to GitHub using GitHub App authentication
     */
    async connectWithGitHubApp(privateKey, installationId) {
        try {
            this.githubApp.privateKey = privateKey;
            this.githubApp.installationId = installationId;
            
            // Generate installation token
            const installationToken = await this.generateInstallationToken();
            
            if (installationToken) {
                this.githubApp.installationToken = installationToken;
                this.token = installationToken; // Use installation token as main token
                this.isConnected = true;
                
                console.log('✅ Connected to GitHub via GitHub App');
                
                return {
                    success: true,
                    authenticationType: 'github-app',
                    organization: this.organization,
                    message: 'ESQs connected to GitHub via App successfully'
                };
            }
            
        } catch (error) {
            console.error('❌ GitHub App connection failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate JWT token for GitHub App authentication
     */
    async generateJWTToken() {
        try {
            if (!this.githubApp.privateKey) {
                throw new Error('GitHub App private key not configured');
            }

            // Create JWT payload
            const now = Math.floor(Date.now() / 1000);
            const payload = {
                iat: now - 60, // Issued 60 seconds ago
                exp: now + (10 * 60), // Expires in 10 minutes
                iss: this.githubApp.appId // GitHub App ID
            };

            // For browser environment, we'll need to use a JWT library or implement basic JWT
            // This is a simplified version - in production, use a proper JWT library
            const header = {
                alg: 'RS256',
                typ: 'JWT'
            };

            // Note: This is a simplified implementation
            // In a real application, you'd use a proper JWT library with RSA signing
            const encodedHeader = btoa(JSON.stringify(header));
            const encodedPayload = btoa(JSON.stringify(payload));
            
            // For now, return a placeholder - this would need proper RSA signing
            console.warn('⚠️ JWT generation requires proper RSA signing implementation');
            return `${encodedHeader}.${encodedPayload}.signature-placeholder`;
            
        } catch (error) {
            console.error('JWT generation failed:', error);
            throw error;
        }
    }

    /**
     * Generate installation token from GitHub App
     */
    async generateInstallationToken() {
        try {
            const jwtToken = await this.generateJWTToken();
            
            const response = await fetch(`${this.baseURL}/app/installations/${this.githubApp.installationId}/access_tokens`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${jwtToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to generate installation token: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.token;
            
        } catch (error) {
            console.error('Installation token generation failed:', error);
            throw error;
        }
    }

    /**
     * Auto-save ESQs session to GitHub
     */
    async saveSession(sessionData) {
        if (!this.isConnected || !this.autoSaveEnabled) return;
        
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `sessions/${sessionData.clientName}_${timestamp}.md`;
            
            const content = this.formatSessionForGitHub(sessionData);
            
            await this.createOrUpdateFile(filename, content, 
                `ESQs auto-save: ${sessionData.clientName} session`);
                
            console.log(`💾 Session auto-saved to GitHub: ${filename}`);
            
            return { success: true, filename: filename };
            
        } catch (error) {
            console.error('GitHub save error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Save billing summary to GitHub
     */
    async saveBillingSummary(billingSummary) {
        if (!this.isConnected) return;
        
        try {
            const date = new Date().toISOString().split('T')[0];
            const filename = `billing/${billingSummary.clientName}_${date}_billing.md`;
            
            const content = this.formatBillingForGitHub(billingSummary);
            
            await this.createOrUpdateFile(filename, content,
                `ESQs billing: ${billingSummary.clientName} - ${billingSummary.timeAnalysis.roundedTime}h`);
                
            return { success: true, filename: filename };
            
        } catch (error) {
            console.error('GitHub billing save error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * GitHub repository search tool (similar to google_drive_search)
     */
    async githubRepoSearch(owner = null, repo = null, path = '', query = '') {
        try {
            const searchOwner = owner || this.organization;
            const searchRepo = repo || this.repo;
            
            if (!this.isConnected) {
                throw new Error('GitHub not connected');
            }

            // Search repository contents
            const searchEndpoint = `/search/code?q=${encodeURIComponent(query)}+repo:${searchOwner}/${searchRepo}`;
            
            const response = await this.makeRequest(searchEndpoint);
            
            return {
                success: true,
                owner: searchOwner,
                repo: searchRepo,
                query: query,
                totalCount: response.total_count,
                results: response.items.map(item => ({
                    name: item.name,
                    path: item.path,
                    sha: item.sha,
                    url: item.html_url,
                    downloadUrl: item.download_url,
                    type: 'file',
                    score: item.score
                }))
            };
            
        } catch (error) {
            console.error('GitHub repository search failed:', error);
            throw new Error(`Repository search failed: ${error.message}`);
        }
    }

    /**
     * GitHub file fetch tool (similar to google_drive file fetch)
     */
    async githubFileFetch(owner = null, repo = null, filePath) {
        try {
            const fetchOwner = owner || this.organization;
            const fetchRepo = repo || this.repo;
            
            if (!this.isConnected) {
                throw new Error('GitHub not connected');
            }

            const response = await this.makeRequest(`/repos/${fetchOwner}/${fetchRepo}/contents/${filePath}`);
            
            let content = '';
            if (response.content) {
                // Decode base64 content
                content = atob(response.content);
            }
            
            return {
                success: true,
                owner: fetchOwner,
                repo: fetchRepo,
                path: filePath,
                name: response.name,
                size: response.size,
                sha: response.sha,
                type: response.type,
                content: content,
                downloadUrl: response.download_url,
                htmlUrl: response.html_url
            };
            
        } catch (error) {
            console.error('GitHub file fetch failed:', error);
            throw new Error(`File fetch failed: ${error.message}`);
        }
    }

    /**
     * Browse repository contents (directory listing)
     */
    async browseRepository(owner = null, repo = null, path = '') {
        try {
            const browseOwner = owner || this.organization;
            const browseRepo = repo || this.repo;
            
            if (!this.isConnected) {
                throw new Error('GitHub not connected');
            }

            const response = await this.makeRequest(`/repos/${browseOwner}/${browseRepo}/contents/${path}`);
            
            // Handle both single file and directory responses
            const items = Array.isArray(response) ? response : [response];
            
            return {
                success: true,
                owner: browseOwner,
                repo: browseRepo,
                path: path,
                items: items.map(item => ({
                    name: item.name,
                    path: item.path,
                    sha: item.sha,
                    size: item.size,
                    type: item.type, // 'file' or 'dir'
                    downloadUrl: item.download_url,
                    htmlUrl: item.html_url
                }))
            };
            
        } catch (error) {
            console.error('Repository browse failed:', error);
            throw new Error(`Repository browse failed: ${error.message}`);
        }
    }

    /**
     * Get organization repositories
     */
    async getOrganizationRepos(org = null) {
        try {
            const organization = org || this.organization;
            
            if (!this.isConnected) {
                throw new Error('GitHub not connected');
            }

            const response = await this.makeRequest(`/orgs/${organization}/repos`);
            
            return {
                success: true,
                organization: organization,
                repositories: response.map(repo => ({
                    name: repo.name,
                    fullName: repo.full_name,
                    description: repo.description,
                    private: repo.private,
                    htmlUrl: repo.html_url,
                    cloneUrl: repo.clone_url,
                    defaultBranch: repo.default_branch,
                    language: repo.language,
                    updatedAt: repo.updated_at
                }))
            };
            
        } catch (error) {
            console.error('Organization repos fetch failed:', error);
            throw new Error(`Organization repos fetch failed: ${error.message}`);
        }
    }

    /**
     * Create or update file in GitHub repo
     */
    async createOrUpdateFile(path, content, commitMessage) {
        try {
            // Check if file exists
            let sha = null;
            try {
                const existing = await this.makeRequest(`/repos/${this.username}/${this.repo}/contents/${path}`);
                sha = existing.sha;
            } catch (error) {
                // File doesn't exist, that's fine
            }
            
            // Create/update file
            const requestBody = {
                message: commitMessage,
                content: btoa(unescape(encodeURIComponent(content))), // Base64 encode
                sha: sha // Include sha if updating existing file
            };
            
            const response = await this.makeRequest(
                `/repos/${this.username}/${this.repo}/contents/${path}`,
                'PUT',
                requestBody
            );
            
            return response;
            
        } catch (error) {
            throw new Error(`Failed to save to GitHub: ${error.message}`);
        }
    }

    /**
     * Format session data for GitHub
     */
    formatSessionForGitHub(sessionData) {
        return `# ESQs Session Log: ${sessionData.clientName}

## Session Overview
- **Client:** ${sessionData.clientName}
- **Session ID:** ${sessionData.sessionId}
- **Date:** ${new Date(sessionData.startTime).toLocaleString()}
- **Duration:** ${this.calculateDuration(sessionData.startTime, sessionData.lastActivity)}
- **Total Activities:** ${sessionData.activities.length}

## Session Activities
${sessionData.activities ? sessionData.activities.map((activity, index) => `
### ${index + 1}. ${activity.type.replace(/_/g, ' ').toUpperCase()}
- **Time:** ${new Date(activity.timestamp).toLocaleTimeString()}
- **Description:** ${activity.description}
${activity.esqsAnalysis ? `- **ESQs Analysis:** ${activity.esqsAnalysis}` : ''}
`).join('\n') : 'No activities logged'}

## ESQs Synthesis Queries
${sessionData.esqsQueries ? sessionData.esqsQueries.map(query => `
### ${new Date(query.timestamp).toLocaleTimeString()}
**Query:** ${query.query}
**Processing Mode:** ${query.processingMode}
**Response:** ${query.response.substring(0, 200)}...
`).join('\n') : 'No ESQs queries in this session'}

---
*Auto-generated by ESQs Enhanced Synthesized Quintessential System*  
*Saved to GitHub: ${new Date().toISOString()}*
`;
    }

    /**
     * Format billing summary for GitHub
     */
    formatBillingForGitHub(billingSummary) {
        return `# ESQs Billing Summary: ${billingSummary.clientName}

## Billing Overview
- **Client:** ${billingSummary.clientName}
- **Attorney:** ${billingSummary.attorney}
- **Date:** ${new Date(billingSummary.startTime).toLocaleDateString()}
- **Session Duration:** ${this.calculateDuration(billingSummary.startTime, billingSummary.endTime)}

## Time Analysis
- **Actual Time:** ${billingSummary.timeAnalysis.actualTime.toFixed(2)} hours
- **ESQs Recommended:** ${billingSummary.timeAnalysis.reasonableTime.toFixed(2)} hours
- **Final Billing:** ${billingSummary.timeAnalysis.roundedTime.toFixed(2)} hours
- **Hourly Rate:** $${billingSummary.financialAnalysis.hourlyRate}
- **Total Amount:** $${billingSummary.financialAnalysis.recommendedAmount.toFixed(2)}

## Activity Breakdown
${billingSummary.activityBreakdown.map(activity => `
### ${activity.description}
- **Actual Time:** ${activity.actualTime.toFixed(2)} hours
- **Reasonable Time:** ${activity.reasonableTime.toFixed(2)} hours
- **Complexity:** ${activity.complexity}
- **ESQs Assisted:** ${activity.esqsAssisted ? 'Yes' : 'No'}
- **Reasoning:** ${activity.reasoning}
`).join('\n')}

## Ethical Compliance
${billingSummary.ethicalNotes.map(note => `- ${note}`).join('\n')}

## Billing Recommendations
${billingSummary.recommendations.map(rec => `- **${rec.type}:** ${rec.message}`).join('\n')}

---
*ESQs Automatic Billing System*  
*Ethical Maximum: ${billingSummary.timeAnalysis.ethicalMaxTime.toFixed(2)} hours*  
*Compliance Status: ${billingSummary.financialAnalysis.ethicalCompliance ? '✅ Compliant' : '⚠️ Review Required'}*
`;
    }

    /**
     * Make GitHub API request with proper authentication
     */
    async makeRequest(endpoint, method = 'GET', data = null) {
        if (!this.token) {
            throw new Error('No authentication token available');
        }

        const headers = {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'ESQs-GitHub-Integration'
        };
        
        const config = {
            method: method,
            headers: headers
        };
        
        if (data) {
            config.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, config);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${errorText}`);
            }
            
            // Handle empty responses
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return { success: true };
            }
            
        } catch (error) {
            console.error('GitHub API request failed:', error);
            throw error;
        }
    }

    /**
     * Utility methods
     */
    calculateDuration(startTime, endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const diffMs = end - start;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        
        if (diffHours > 0) {
            return `${diffHours}h ${diffMins % 60}m`;
        } else {
            return `${diffMins}m`;
        }
    }

    /**
     * Get connection status with enhanced information
     */
    getStatus() {
        return {
            connected: this.isConnected,
            username: this.username,
            repository: `${this.username}/${this.repo}`,
            organization: this.organization,
            autoSave: this.autoSaveEnabled,
            authenticationType: this.githubApp.installationToken ? 'github-app' : 'personal-token',
            lastSync: new Date().toISOString(),
            apiEndpoint: this.baseURL,
            availableTools: [
                'githubRepoSearch',
                'githubFileFetch', 
                'browseRepository',
                'getOrganizationRepos',
                'createOrUpdateFile'
            ]
        };
    }

    /**
     * Test repository access
     */
    async testRepositoryAccess(owner = null, repo = null) {
        try {
            const testOwner = owner || this.organization;
            const testRepo = repo || this.repo;
            
            const response = await this.makeRequest(`/repos/${testOwner}/${testRepo}`);
            
            return {
                success: true,
                repository: response.full_name,
                permissions: {
                    admin: response.permissions?.admin || false,
                    push: response.permissions?.push || false,
                    pull: response.permissions?.pull || false
                },
                private: response.private,
                defaultBranch: response.default_branch
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Global GitHub integration instance
const githubIntegration = new GitHubIntegration();

// Global functions for GitHub repository tools (similar to Google Drive tools)
window.githubRepoSearch = async (query, options = {}) => {
    const { owner, repo, path } = options;
    return await githubIntegration.githubRepoSearch(owner, repo, path, query);
};

window.githubFileFetch = async (filePath, options = {}) => {
    const { owner, repo } = options;
    return await githubIntegration.githubFileFetch(owner, repo, filePath);
};

window.browseGitHubRepository = async (options = {}) => {
    const { owner, repo, path = '' } = options;
    return await githubIntegration.browseRepository(owner, repo, path);
};

window.getGitHubOrgRepos = async (org) => {
    return await githubIntegration.getOrganizationRepos(org);
};

window.testGitHubAccess = async (options = {}) => {
    const { owner, repo } = options;
    return await githubIntegration.testRepositoryAccess(owner, repo);
};

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GitHubIntegration;
}
