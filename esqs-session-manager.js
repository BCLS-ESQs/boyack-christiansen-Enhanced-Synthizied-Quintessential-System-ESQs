/**
     * Start billing timer for client session
     */
    async startBillingForClient(sessionId, clientName, attorney = 'John W Adams III', caseNumber = null) {
        try {
            const billingResult = await esqsBillingTimer.startBillingTimer(clientName, sessionId, attorney, caseNumber);
            
            if (billingResult.success) {
                const session = this.activeClientSessions.get(sessionId);
                if (session) {
                    session.billingActive = true;
                    session.billingStartTime = billingResult.startTime;
                    session.attorney = attorney;
                    session.billingRate = billingResult.billingRate;
                    session.caseNumber = caseNumber;
                }
                
                console.log(`💰 Billing started for ${clientName} - ${attorney} @ ${billingResult.billingRate}/hr`);
            }
            
            return billingResult;
            
        } catch (error) {
            console.error('Error starting billing:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Log billable activity automatically
     */
    async logBillableActivity(sessionId, activityType, description, complexity = 'moderate', esqsAssisted = false) {
        try {
            const session = this.activeClientSessions.get(sessionId);
            if (!session || !session.billingActive) return;

            // Log to billing timer
            await esqsBillingTimer.logBillableActivity(sessionId, {
                type: activityType,
                description: description,
                complexity: complexity,
                esqsAssisted: esqsAssisted,
                details: { sessionId, client: session.clientName }
            });

            // Also log to session
            await this.logActivity(sessionId, {
                type: activityType,
                description: description,
                context: { billable: true, complexity, esqsAssisted }
            });

            return true;

        } catch (error) {
            console.error('Error logging billable activity:', error);
            return false;
        }
    }/**
 * ESQs Session Manager - Automatic Client Session Tracking & Archiving
 * Handles automatic session logging, client folder management, and scheduled archiving
 */

class ESQsSessionManager {
    constructor() {
        this.activeClientSessions = new Map();
        this.globalSessionLog = [];
        this.autoSaveInterval = null;
        this.scheduledArchives = new Map();
        
        this.settings = {
            autoSaveEnabled: true,
            autoSaveIntervalMinutes: 30,
            sessionTimeoutMinutes: 120,
            maxSessionActivities: 100,
            archiveSchedule: {
                daily: '18:00',      // 6 PM daily archive
                weekly: 'Friday',    // Friday weekly archive
                monthly: 1           // 1st of month archive
            }
        };

        this.activityTypes = {
            CLIENT_ACCESS: 'client_access',
            DOCUMENT_VIEW: 'document_view',
            DOCUMENT_EDIT: 'document_edit',
            ESQS_QUERY: 'esqs_query',
            SEARCH: 'search',
            FILE_UPLOAD: 'file_upload',
            FOLDER_CREATE: 'folder_create',
            LEGAL_RESEARCH: 'legal_research',
            CASE_ANALYSIS: 'case_analysis'
        };

        this.initialize();
    }

    /**
     * Initialize session manager
     */
    initialize() {
        this.setupAutoSave();
        this.setupScheduledArchiving();
        this.setupSessionCleanup();
        this.loadPersistentSessions();
        
        console.log('✅ ESQs Session Manager initialized');
    }

    /**
     * Automatically start session when client is accessed
     */
    async accessClient(clientName, context = {}) {
        try {
            // Check if session already exists
            let sessionId = this.findActiveClientSession(clientName);
            
            if (!sessionId) {
                // Create new session
                sessionId = await this.startClientSession(clientName, context);
                
                // Start billing timer
                await this.startBillingForClient(sessionId, clientName, context.attorney, context.caseNumber);
            }

            // Ensure client folder exists in Dropbox
            await this.ensureClientFolderExists(clientName, context.caseNumber);

            // Log client access
            await this.logActivity(sessionId, {
                type: this.activityTypes.CLIENT_ACCESS,
                description: `Accessed client: ${clientName}`,
                context: context
            });

            // Load client intelligence from previous sessions
            const clientIntelligence = await this.loadClientIntelligence(clientName);

            return {
                success: true,
                sessionId: sessionId,
                clientName: clientName,
                clientIntelligence: clientIntelligence,
                billingActive: true,
                message: 'Client session active with auto-archiving and billing'
            };

        } catch (error) {
            console.error('Error accessing client:', error);
            throw new Error(`Failed to access client: ${error.message}`);
        }
    }

    /**
     * Start new client session
     */
    async startClientSession(clientName, context = {}) {
        const sessionId = this.generateSessionId();
        const startTime = new Date().toISOString();

        const session = {
            sessionId: sessionId,
            clientName: clientName,
            startTime: startTime,
            lastActivity: startTime,
            activities: [],
            documentsAccessed: [],
            searchQueries: [],
            esqsQueries: [],
            context: context,
            autoSaveCount: 0,
            status: 'active'
        };

        this.activeClientSessions.set(sessionId, session);

        // Schedule auto-archiving for this session
        this.scheduleSessionArchiving(sessionId);

        console.log(`📝 Started session for ${clientName}: ${sessionId}`);
        
        return sessionId;
    }

    /**
     * Log activity automatically
     */
    async logActivity(sessionId, activity) {
        try {
            const session = this.activeClientSessions.get(sessionId);
            if (!session) {
                console.warn(`Session not found: ${sessionId}`);
                return false;
            }

            const timestamp = new Date().toISOString();
            const logEntry = {
                timestamp: timestamp,
                type: activity.type,
                description: activity.description,
                data: activity.data || {},
                context: activity.context || {},
                esqsAnalysis: activity.esqsAnalysis || null,
                id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
            };

            // Add to session activities
            session.activities.push(logEntry);
            session.lastActivity = timestamp;

            // Track specific activity types
            this.trackSpecificActivity(session, logEntry);

            // Auto-save if threshold reached
            if (session.activities.length % 10 === 0) {
                await this.autoSaveSession(sessionId);
            }

            // Add to global log
            this.globalSessionLog.push({
                sessionId: sessionId,
                clientName: session.clientName,
                ...logEntry
            });

            return true;

        } catch (error) {
            console.error('Error logging activity:', error);
            return false;
        }
    }

    /**
     * Track specific activity types for intelligence
     */
    trackSpecificActivity(session, activity) {
        switch (activity.type) {
            case this.activityTypes.DOCUMENT_VIEW:
            case this.activityTypes.DOCUMENT_EDIT:
                session.documentsAccessed.push({
                    ...activity,
                    fileName: activity.data.fileName,
                    fileType: activity.data.fileType
                });
                break;

            case this.activityTypes.SEARCH:
                session.searchQueries.push({
                    ...activity,
                    query: activity.data.query,
                    results: activity.data.results
                });
                break;

            case this.activityTypes.ESQS_QUERY:
                session.esqsQueries.push({
                    ...activity,
                    query: activity.data.query,
                    processingMode: activity.data.processingMode,
                    tokensUsed: activity.data.tokensUsed
                });
                break;
        }
    }

    /**
     * Auto-save session to client folder
     */
    async autoSaveSession(sessionId) {
        try {
            const session = this.activeClientSessions.get(sessionId);
            if (!session) return;

            const clientName = session.clientName;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            
            // Generate session summary
            const sessionData = this.generateDetailedSessionSummary(session);
            
            // Save to client's auto-archive folder
            const archivePath = await this.saveToClientArchive(
                clientName, 
                `autosave_${timestamp}.md`, 
                sessionData
            );

            // Update session
            session.autoSaveCount++;
            session.lastAutoSave = new Date().toISOString();

            console.log(`💾 Auto-saved session for ${clientName} (#${session.autoSaveCount})`);

            return {
                success: true,
                archivePath: archivePath,
                saveCount: session.autoSaveCount
            };

        } catch (error) {
            console.error('Auto-save error:', error);
        }
    }

    /**
     * Generate detailed session summary for archive
     */
    generateDetailedSessionSummary(session) {
        const duration = this.calculateDuration(session.startTime, session.lastActivity);
        const now = new Date().toISOString();

        return `# ESQs Session Archive: ${session.clientName}

## Session Overview
- **Session ID:** ${session.sessionId}
- **Client:** ${session.clientName}
- **Start Time:** ${new Date(session.startTime).toLocaleString()}
- **Last Activity:** ${new Date(session.lastActivity).toLocaleString()}
- **Duration:** ${duration}
- **Auto-Save #:** ${session.autoSaveCount + 1}
- **Total Activities:** ${session.activities.length}

## Session Context
${session.context.caseNumber ? `- **Case Number:** ${session.context.caseNumber}` : ''}
${session.context.practiceArea ? `- **Practice Area:** ${session.context.practiceArea}` : ''}
${session.context.attorney ? `- **Attorney:** ${session.context.attorney}` : ''}

## Activity Timeline
${session.activities.map((activity, index) => `
### [${new Date(activity.timestamp).toLocaleTimeString()}] ${activity.type.replace(/_/g, ' ').toUpperCase()}
**Description:** ${activity.description}
${activity.esqsAnalysis ? `**ESQs Analysis:** ${activity.esqsAnalysis}` : ''}
${Object.keys(activity.data).length > 0 ? `**Details:** ${JSON.stringify(activity.data, null, 2)}` : ''}
`).join('\n')}

## Documents Activity Summary
${session.documentsAccessed.length > 0 ? 
session.documentsAccessed.map(doc => `- **${doc.fileName}** (${doc.type}) - ${new Date(doc.timestamp).toLocaleTimeString()}`).join('\n') :
'No documents accessed in this session'}

## Search Activity
${session.searchQueries.length > 0 ?
session.searchQueries.map(search => `- **"${search.query}"** - ${search.results || 0} results - ${new Date(search.timestamp).toLocaleTimeString()}`).join('\n') :
'No searches performed in this session'}

## ESQs Interactions
${session.esqsQueries.length > 0 ?
session.esqsQueries.map(query => `
### ${new Date(query.timestamp).toLocaleTimeString()} - ${query.processingMode || 'Normal'} Mode
**Query:** ${query.query}
**Tokens:** ${query.tokensUsed || 'N/A'}
`).join('\n') :
'No ESQs queries in this session'}

## Session Intelligence
- **Activity Level:** ${this.assessActivityLevel(session.activities.length)}
- **Primary Focus:** ${this.identifyPrimaryFocus(session.activities)}
- **Document Types:** ${this.getUniqueDocumentTypes(session.documentsAccessed).join(', ') || 'None'}
- **Search Complexity:** ${this.assessSearchComplexity(session.searchQueries)}

---
**Auto-generated by ESQs Session Manager**  
**Archive Created:** ${new Date(now).toLocaleString()}  
**ESQs Version:** Enhanced Synthesized Quintessential System v4.0  

*This session will continue to be auto-archived every ${this.settings.autoSaveIntervalMinutes} minutes*
`;
    }

    /**
     * Load client intelligence from previous sessions
     */
    async loadClientIntelligence(clientName) {
        try {
            // Get session history from Dropbox
            const clientIntelligence = await dropboxArchive.getClientSessionHistory(clientName);
            
            if (clientIntelligence.success) {
                // Process intelligence for ESQs
                const processedIntelligence = {
                    recentActivity: clientIntelligence.lastActivity,
                    totalSessions: clientIntelligence.totalSessions,
                    commonPatterns: clientIntelligence.clientIntelligence.commonTopics,
                    documentPreferences: clientIntelligence.clientIntelligence.documentTypes,
                    recommendations: clientIntelligence.clientIntelligence.recommendations,
                    attentionAreas: this.identifyAttentionAreas(clientIntelligence.sessionHistory)
                };

                console.log(`🧠 Loaded intelligence for ${clientName}: ${processedIntelligence.totalSessions} sessions`);
                
                return processedIntelligence;
            }

            return null;

        } catch (error) {
            console.error('Error loading client intelligence:', error);
            return null;
        }
    }

    /**
     * Setup automatic scheduled archiving
     */
    setupScheduledArchiving() {
        // Daily archive at 6 PM
        this.scheduleDailyArchive();
        
        // Weekly archive on Friday
        this.scheduleWeeklyArchive();
        
        // Monthly archive on 1st
        this.scheduleMonthlyArchive();
    }

    scheduleDailyArchive() {
        const now = new Date();
        const scheduleTime = new Date();
        scheduleTime.setHours(18, 0, 0, 0); // 6 PM

        if (scheduleTime <= now) {
            scheduleTime.setDate(scheduleTime.getDate() + 1);
        }

        const msUntilArchive = scheduleTime.getTime() - now.getTime();

        setTimeout(() => {
            this.performDailyArchive();
            
            // Schedule next daily archive
            setInterval(() => {
                this.performDailyArchive();
            }, 24 * 60 * 60 * 1000); // Every 24 hours
            
        }, msUntilArchive);

        console.log(`📅 Daily archive scheduled for ${scheduleTime.toLocaleString()}`);
    }

    async performDailyArchive() {
        try {
            console.log('🗄️ Performing daily archive...');
            
            // Archive all active sessions
            for (const [sessionId, session] of this.activeClientSessions) {
                await this.createDailyArchive(session);
            }

            // Clean up old sessions
            await this.cleanupOldSessions();

            console.log('✅ Daily archive completed');

        } catch (error) {
            console.error('Daily archive error:', error);
        }
    }

    async createDailyArchive(session) {
        const date = new Date().toISOString().split('T')[0];
        const archiveContent = this.generateDailyArchiveSummary(session, date);
        
        await this.saveToClientArchive(
            session.clientName,
            `daily_archive_${date}.md`,
            archiveContent
        );
    }

    /**
     * Utility methods
     */
    findActiveClientSession(clientName) {
        for (const [sessionId, session] of this.activeClientSessions) {
            if (session.clientName === clientName && session.status === 'active') {
                return sessionId;
            }
        }
        return null;
    }

    generateSessionId() {
        return `esqs_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    }

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

    assessActivityLevel(activityCount) {
        if (activityCount > 50) return 'High';
        if (activityCount > 20) return 'Medium';
        if (activityCount > 5) return 'Low';
        return 'Minimal';
    }

    identifyPrimaryFocus(activities) {
        const typeCounts = {};
        activities.forEach(activity => {
            typeCounts[activity.type] = (typeCounts[activity.type] || 0) + 1;
        });

        const primaryType = Object.keys(typeCounts).reduce((a, b) => 
            typeCounts[a] > typeCounts[b] ? a : b, Object.keys(typeCounts)[0]);

        return primaryType ? primaryType.replace(/_/g, ' ').toUpperCase() : 'General Activity';
    }

    getUniqueDocumentTypes(documentsAccessed) {
        const types = new Set();
        documentsAccessed.forEach(doc => {
            if (doc.fileType) types.add(doc.fileType);
        });
        return Array.from(types);
    }

    assessSearchComplexity(searchQueries) {
        if (searchQueries.length === 0) return 'None';
        
        const avgQueryLength = searchQueries.reduce((sum, query) => 
            sum + (query.query?.length || 0), 0) / searchQueries.length;
        
        if (avgQueryLength > 50) return 'Complex';
        if (avgQueryLength > 20) return 'Moderate';
        return 'Simple';
    }

    async saveToClientArchive(clientName, filename, content) {
        const clientPath = dropboxArchive.getClientPath(clientName);
        const archivePath = `${clientPath}/Auto_Archives/${filename}`;
        
        await dropboxArchive.createFile(archivePath, content, { overwrite: true });
        return archivePath;
    }

    async ensureClientFolderExists(clientName, caseNumber) {
        if (dropboxArchive.isConnected) {
            await dropboxArchive.accessClientFolder(clientName, caseNumber);
        }
    }

    setupAutoSave() {
        if (this.settings.autoSaveEnabled) {
            this.autoSaveInterval = setInterval(() => {
                this.autoSaveAllActiveSessions();
            }, this.settings.autoSaveIntervalMinutes * 60 * 1000);
        }
    }

    async autoSaveAllActiveSessions() {
        for (const sessionId of this.activeClientSessions.keys()) {
            await this.autoSaveSession(sessionId);
        }
    }

    /**
     * Public API for integration with ESQs
     */
    
    // Call this when user queries ESQs
    async logESQsQuery(clientName, query, processingMode, response, tokensUsed) {
        const sessionId = this.findActiveClientSession(clientName);
        if (sessionId) {
            await this.logActivity(sessionId, {
                type: this.activityTypes.ESQS_QUERY,
                description: `ESQs query: ${query.substring(0, 50)}...`,
                data: { query, processingMode, response: response.substring(0, 100), tokensUsed },
                esqsAnalysis: `Processed in ${processingMode} mode, ${tokensUsed} tokens used`
            });

            // Determine billable activity type based on query content
            const activityType = this.categorizeQueryForBilling(query);
            const complexity = processingMode === 'deep' ? 'complex' : 'moderate';
            
            await this.logBillableActivity(
                sessionId,
                activityType,
                `Legal analysis: ${query.substring(0, 100)}...`,
                complexity,
                true // ESQs assisted
            );
        }
    }

    // Call this when user accesses documents
    async logDocumentAccess(clientName, fileName, fileType, action = 'view') {
        const sessionId = this.findActiveClientSession(clientName);
        if (sessionId) {
            await this.logActivity(sessionId, {
                type: action === 'edit' ? this.activityTypes.DOCUMENT_EDIT : this.activityTypes.DOCUMENT_VIEW,
                description: `${action === 'edit' ? 'Edited' : 'Viewed'} document: ${fileName}`,
                data: { fileName, fileType, action }
            });

            // Log billable activity
            const activityType = action === 'edit' ? 'document_drafting' : 'document_review';
            const complexity = this.assessDocumentComplexity(fileName, fileType);
            
            await this.logBillableActivity(
                sessionId,
                activityType,
                `${action === 'edit' ? 'Document editing' : 'Document review'}: ${fileName}`,
                complexity,
                false // Not ESQs assisted for direct document work
            );
        }
    }

    // Call this when user searches
    async logSearch(clientName, query, resultsCount) {
        const sessionId = this.findActiveClientSession(clientName);
        if (sessionId) {
            await this.logActivity(sessionId, {
                type: this.activityTypes.SEARCH,
                description: `Searched for: ${query}`,
                data: { query, results: resultsCount }
            });

            // Log as legal research if it's a legal search
            if (this.isLegalResearch(query)) {
                await this.logBillableActivity(
                    sessionId,
                    'legal_research',
                    `Legal research: ${query}`,
                    'moderate',
                    true // ESQs assisted search
                );
            }
        }
    }

    // Get session status
    /**
     * Utility methods for billing categorization
     */
    categorizeQueryForBilling(query) {
        const lowerQuery = query.toLowerCase();
        
        if (lowerQuery.includes('draft') || lowerQuery.includes('write') || lowerQuery.includes('compose')) {
            return 'document_drafting';
        }
        
        if (lowerQuery.includes('research') || lowerQuery.includes('case law') || lowerQuery.includes('statute')) {
            return 'legal_research';
        }
        
        if (lowerQuery.includes('analyze') || lowerQuery.includes('review') || lowerQuery.includes('evaluate')) {
            return 'case_analysis';
        }
        
        if (lowerQuery.includes('court') || lowerQuery.includes('hearing') || lowerQuery.includes('trial')) {
            return 'court_preparation';
        }
        
        if (lowerQuery.includes('client') || lowerQuery.includes('communication') || lowerQuery.includes('email')) {
            return 'client_communication';
        }
        
        return 'case_analysis'; // Default
    }

    assessDocumentComplexity(fileName, fileType) {
        const name = fileName.toLowerCase();
        
        if (name.includes('motion') || name.includes('pleading') || name.includes('brief')) {
            return 'complex';
        }
        
        if (name.includes('contract') || name.includes('agreement')) {
            return 'moderate';
        }
        
        if (name.includes('letter') || name.includes('email')) {
            return 'simple';
        }
        
        if (name.includes('discovery') || name.includes('interrogator')) {
            return 'litigation';
        }
        
        return 'moderate'; // Default
    }

    isLegalResearch(query) {
        const legalTerms = [
            'case law', 'statute', 'regulation', 'precedent', 'court', 'judge',
            'legal', 'law', 'rule', 'motion', 'pleading', 'brief', 'contract'
        ];
        
        const lowerQuery = query.toLowerCase();
        return legalTerms.some(term => lowerQuery.includes(term));
    }

    /**
     * End client session and generate billing summary
     */
    async endClientSession(sessionId) {
        try {
            const session = this.activeClientSessions.get(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }

            // Stop billing timer and get summary
            let billingSummary = null;
            if (session.billingActive) {
                const billingResult = await esqsBillingTimer.stopTimer(sessionId);
                if (billingResult.success) {
                    billingSummary = billingResult.summary;
                }
            }

            // Final session archive
            await this.createFinalSessionArchive(session, billingSummary);

            // Clean up
            this.activeClientSessions.delete(sessionId);

            return {
                success: true,
                sessionId: sessionId,
                clientName: session.clientName,
                billingSummary: billingSummary,
                message: 'Session ended with billing summary generated'
            };

        } catch (error) {
            console.error('Error ending client session:', error);
            throw new Error(`Failed to end session: ${error.message}`);
        }
    }

    async createFinalSessionArchive(session, billingSummary) {
        const finalArchive = this.generateFinalSessionSummary(session, billingSummary);
        
        await this.saveToClientArchive(
            session.clientName,
            `final_session_${session.sessionId}.md`,
            finalArchive
        );
    }

    generateFinalSessionSummary(session, billingSummary) {
        const sessionSummary = this.generateDetailedSessionSummary(session);
        
        if (!billingSummary) {
            return sessionSummary;
        }

        return `${sessionSummary}

---

## 💰 BILLING SUMMARY

### Time Analysis
- **Actual Time:** ${billingSummary.timeAnalysis.actualTime.toFixed(2)} hours
- **Reasonable Time:** ${billingSummary.timeAnalysis.reasonableTime.toFixed(2)} hours  
- **Recommended Billing:** ${billingSummary.timeAnalysis.recommendedTime.toFixed(2)} hours
- **Rounded Billing:** ${billingSummary.timeAnalysis.roundedTime.toFixed(2)} hours

### Financial Summary
- **Hourly Rate:** ${billingSummary.financialAnalysis.hourlyRate}
- **Recommended Amount:** ${billingSummary.financialAnalysis.recommendedAmount.toFixed(2)}
- **Ethical Compliance:** ${billingSummary.financialAnalysis.ethicalCompliance ? '✅ Compliant' : '⚠️ Review Required'}

### Activity Breakdown
${billingSummary.activityBreakdown.map(activity => `
**${activity.description}**
- Actual: ${activity.actualTime.toFixed(2)}h | Reasonable: ${activity.reasonableTime.toFixed(2)}h
- Complexity: ${activity.complexity} | ESQs Assisted: ${activity.esqsAssisted ? 'Yes' : 'No'}
- Reasoning: ${activity.reasoning}
`).join('\n')}

### Billing Recommendations
${billingSummary.recommendations.map(rec => `- **${rec.type}:** ${rec.message}`).join('\n')}

### Ethical Notes
${billingSummary.ethicalNotes.map(note => `- ${note}`).join('\n')}

---
**Ready for attorney review and time entry creation**
`;
    }
}

// Global session manager instance
const esqsSessionManager = new ESQsSessionManager();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ESQsSessionManager;
}
