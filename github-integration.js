/**
 * GitHub Integration for ESQs
 * Auto-saves legal work, session logs, and case files to GitHub
 */

class GitHubIntegration {
    constructor() {
        this.token = null;
        this.username = 'JdubIV';
        this.repo = 'boyack-christiansen-Enhanced-Synthizied-Quintessential-System-ESQs';
        this.baseURL = 'https://api.github.com';
        this.isConnected = false;
        this.autoSaveEnabled = true;
        
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
     * Make GitHub API request
     */
    async makeRequest(endpoint, method = 'GET', data = null) {
        const headers = {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
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
                throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
            
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
     * Get connection status
     */
    getStatus() {
        return {
            connected: this.isConnected,
            username: this.username,
            repository: `${this.username}/${this.repo}`,
            autoSave: this.autoSaveEnabled,
            lastSync: new Date().toISOString()
        };
    }
}

// Global GitHub integration instance
const githubIntegration = new GitHubIntegration();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GitHubIntegration;
}
