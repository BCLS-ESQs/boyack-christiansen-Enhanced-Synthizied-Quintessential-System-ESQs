/**
     * Start client session tracking
     */
    async startClientSession(clientName, sessionType = 'general') {
        try {
            const sessionId = this.generateSessionId();
            const timestamp = new Date().toISOString();
            
            const session = {
                sessionId: sessionId,
                clientName: clientName,
                sessionType: sessionType,
                startTime: timestamp,
                activities: [],
                documentsAccessed: [],
                searchQueries: [],
                esqsInteractions: []
            };

            this.activeSessions.set(sessionId, session);
            
            // Auto-archiving setup for this session
            this.scheduleAutoArchive(sessionId);
            
            return {
                success: true,
                sessionId: sessionId,
                clientName: clientName,
                message: 'Client session started with auto-archiving'
            };

        } catch (error) {
            console.error('Error starting client session:', error);
            throw new Error(`Failed to start session: ${error.message}`);
        }
    }

    /**
     * Log activity during client session
     */
    async logSessionActivity(sessionId, activity) {
        try {
            const session = this.activeSessions.get(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }

            const logEntry = {
                timestamp: new Date().toISOString(),
                type: activity.type,
                description: activity.description,
                data: activity.data || {},
                esqsAnalysis: activity.esqsAnalysis || null
            };

            session.activities.push(logEntry);
            
            // Auto-save session log every few activities
            if (session.activities.length % 5 === 0) {
                await this.saveSessionLog(sessionId);
            }

            return {
                success: true,
                logEntry: logEntry,
                totalActivities: session.activities.length
            };

        } catch (error) {
            console.error('Error logging activity:', error);
            throw new Error(`Failed to log activity: ${error.message}`);
        }
    }

    /**
     * Schedule automatic archiving
     */
    scheduleAutoArchive(sessionId) {
        if (!this.autoArchive.enabled) return;

        // Set interval for periodic auto-save
        const intervalId = setInterval(async () => {
            const session = this.activeSessions.get(sessionId);
            if (session) {
                await this.autoSaveSession(sessionId);
            } else {
                clearInterval(intervalId);
            }
        }, this.autoArchive.intervalMinutes * 60 * 1000);

        // Store interval ID for cleanup
        if (this.activeSessions.has(sessionId)) {
            this.activeSessions.get(sessionId).intervalId = intervalId;
        }
    }

    /**
     * Auto-save session data
     */
    async autoSaveSession(sessionId) {
        try {
            const session = this.activeSessions.get(sessionId);
            if (!session) return;

            const clientPath = this.getClientPath(session.clientName);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const autoArchivePath = `${clientPath}/Auto_Archives/session_${timestamp}.md`;

            // Generate comprehensive session summary
            const sessionSummary = this.generateSessionSummary(session);
            
            await this.createFile(autoArchivePath, sessionSummary);

            // Update session with auto-save info
            session.lastAutoSave = new Date().toISOString();
            session.autoSaveCount = (session.autoSaveCount || 0) + 1;

            console.log(`✅ Auto-saved session for ${session.clientName}`);

            return {
                success: true,
                autoSavePath: autoArchivePath,
                saveCount: session.autoSaveCount
            };

        } catch (error) {
            console.error('Auto-save error:', error);
        }
    }

    /**
     * Generate comprehensive session summary
     */
    generateSessionSummary(session) {
        const duration = this.calculateSessionDuration(session.startTime);
        
        return `# ESQs Session Log: ${session.clientName}

## Session Information
- **Session ID:** ${session.sessionId}
- **Client:** ${session.clientName}
- **Session Type:** ${session.sessionType}
- **Start Time:** ${new Date(session.startTime).toLocaleString()}
- **Duration:** ${duration}
- **Auto-Save Count:** ${session.autoSaveCount || 1}

## Activities Summary
${session.activities.map((activity, index) => `
### ${index + 1}. ${activity.type} - ${new Date(activity.timestamp).toLocaleTimeString()}
**Description:** ${activity.description}
${activity.esqsAnalysis ? `**ESQs Analysis:** ${activity.esqsAnalysis}` : ''}
${activity.data && Object.keys(activity.data).length > 0 ? `**Data:** ${JSON.stringify(activity.data, null, 2)}` : ''}
`).join('\n')}

## Documents Accessed
${session.documentsAccessed.map(doc => `- ${doc.name} (${doc.timestamp})`).join('\n')}

## Search Queries
${session.searchQueries.map(query => `- "${query.query}" (${query.timestamp})`).join('\n')}

## ESQs Interactions
${session.esqsInteractions.map(interaction => `
### ${interaction.type} - ${new Date(interaction.timestamp).toLocaleTimeString()}
**Query:** ${interaction.query}
**Response:** ${interaction.response.substring(0, 200)}...
**Processing Mode:** ${interaction.processingMode}
**Tokens Used:** ${interaction.tokensUsed}
`).join('\n')}

---
*Auto-generated by ESQs Enhanced Synthesized Quintessential System*
*Timestamp: ${new Date().toISOString()}*
`;
    }

    /**
     * Automatically load client session logs when accessing client
     */
    async getClientSessionHistory(clientName) {
        try {
            const clientPath = this.getClientPath(clientName);
            const sessionLogsPath = `${clientPath}/ESQs_Session_Logs`;
            const autoArchivesPath = `${clientPath}/Auto_Archives`;

            // Get all session logs
            const [sessionLogs, autoArchives] = await Promise.all([
                this.listFolder(sessionLogsPath).catch(() => ({ entries: [] })),
                this.listFolder(autoArchivesPath).catch(() => ({ entries: [] }))
            ]);

            // Read recent session files
            const recentSessions = await this.loadRecentSessionFiles(
                [...sessionLogs.entries, ...autoArchives.entries]
            );

            // Generate client intelligence summary
            const clientIntelligence = this.generateClientIntelligence(recentSessions);

            return {
                success: true,
                clientName: clientName,
                totalSessions: recentSessions.length,
                sessionHistory: recentSessions,
                clientIntelligence: clientIntelligence,
                lastActivity: this.getLastActivityDate(recentSessions)
            };

        } catch (error) {
            console.error('Error loading client session history:', error);
            return {
                success: false,
                error: error.message,
                clientIntelligence: null
            };
        }
    }

    /**
     * Generate client intelligence from session history
     */
    generateClientIntelligence(sessions) {
        const intelligence = {
            totalInteractions: 0,
            commonTopics: [],
            preferredESQsFeatures: [],
            documentTypes: [],
            communicationPatterns: [],
            caseComplexity: 'medium',
            attentionAreas: [],
            recommendations: []
        };

        // Analyze all sessions
        sessions.forEach(session => {
            intelligence.totalInteractions += session.activities ? session.activities.length : 0;
            
            // Extract topics and patterns
            if (session.activities) {
                session.activities.forEach(activity => {
                    if (activity.type === 'document_access') {
                        intelligence.documentTypes.push(activity.data.fileType);
                    }
                    if (activity.type === 'esqs_query') {
                        intelligence.commonTopics.push(activity.data.topic);
                    }
                });
            }
        });

        // Process patterns
        intelligence.commonTopics = this.findMostCommon(intelligence.commonTopics);
        intelligence.documentTypes = this.findMostCommon(intelligence.documentTypes);
        
        // Generate recommendations
        intelligence.recommendations = this.generateClientRecommendations(intelligence);

        return intelligence;
    }

    /**
     * Initialize client folder when first accessed
     */
    async accessClientFolder(clientName, caseNumber = null) {
        try {
            const clientPath = this.getClientPath(clientName);
            
            // Check if client folder exists
            const folderExists = await this.checkFolderExists(clientPath);
            
            if (!folderExists) {
                // Create client folder structure
                await this.createClientFolder(clientName, caseNumber);
            }

            // Load session history
            const sessionHistory = await this.getClientSessionHistory(clientName);
            
            // Start new session
            const newSession = await this.startClientSession(clientName, 'folder_access');

            // Log folder access
            await this.logSessionActivity(newSession.sessionId, {
                type: 'folder_access',
                description: `Accessed client folder for ${clientName}`,
                data: { clientName, caseNumber }
            });

            return {
                success: true,
                clientName: clientName,
                clientPath: clientPath,
                sessionId: newSession.sessionId,
                sessionHistory: sessionHistory,
                folderCreated: !folderExists,
                message: `Client folder accessed with session tracking`
            };

        } catch (error) {
            console.error('Error accessing client folder:', error);
            throw new Error(`Failed to access client folder: ${error.message}`);
        }
    }/**
 * Dropbox Archive Integration for ESQs
 * Complete file management system for legal document archives
 */

class DropboxArchiveIntegration {
    constructor() {
        this.accessToken = null;
        this.isConnected = false;
        this.archivePath = '/ESQs_Legal_Archives';
        
        // Client-based folder structure
        this.folderStructure = {
            clients: '/ESQs_Legal_Archives/Clients',
            templates: '/ESQs_Legal_Archives/Templates',
            firmResources: '/ESQs_Legal_Archives/Firm_Resources'
        };

        // Auto-archiving settings
        this.autoArchive = {
            enabled: true,
            intervalMinutes: 30, // Auto-save every 30 minutes
            scheduleDaily: '18:00', // Daily archive at 6 PM
            scheduleWeekly: 'Friday', // Weekly archive on Friday
            retentionDays: 365 // Keep archives for 1 year
        };

        // Client session tracking
        this.activeSessions = new Map();
        this.sessionLogs = new Map();

        this.supportedFormats = {
            documents: ['.pdf', '.docx', '.doc', '.txt', '.rtf'],
            spreadsheets: ['.xlsx', '.xls', '.csv'],
            presentations: ['.pptx', '.ppt'],
            images: ['.jpg', '.jpeg', '.png', '.gif', '.tiff'],
            audio: ['.mp3', '.wav', '.m4a'],
            video: ['.mp4', '.mov', '.avi']
        };
    }

    /**
     * Initialize connection to Dropbox
     */
    async connect(accessToken) {
        try {
            this.accessToken = accessToken;
            
            // Test connection and create archive structure
            const userInfo = await this.getCurrentUser();
            await this.createArchiveStructure();
            
            this.isConnected = true;
            console.log('✅ Connected to Dropbox Archives');
            
            return {
                success: true,
                user: userInfo,
                archivePath: this.archivePath,
                message: 'ESQs Archive system ready'
            };
            
        } catch (error) {
            console.error('❌ Dropbox connection failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create client-specific folder structure
     */
    async createClientFolder(clientName, caseNumber = null) {
        try {
            const clientFolderName = this.sanitizeClientName(clientName);
            const clientPath = `${this.folderStructure.clients}/${clientFolderName}`;
            
            // Create main client folder
            await this.createFolder(clientPath);
            
            // Create subfolders within client folder
            const subfolders = [
                'Documents',
                'Correspondence', 
                'Pleadings',
                'Discovery',
                'Research',
                'Contracts',
                'Court_Orders',
                'Evidence',
                'ESQs_Session_Logs',
                'Auto_Archives'
            ];

            for (const subfolder of subfolders) {
                await this.createFolder(`${clientPath}/${subfolder}`);
            }

            // Create client information file
            const clientInfo = this.generateClientInfoTemplate(clientName, caseNumber);
            await this.createFile(
                `${clientPath}/CLIENT_INFO.md`,
                clientInfo,
                { overwrite: false }
            );

            // Initialize session log
            await this.initializeSessionLog(clientName);

            return {
                success: true,
                clientPath: clientPath,
                structure: subfolders,
                message: `Client folder created for ${clientName}`
            };

        } catch (error) {
            console.error('Error creating client folder:', error);
            throw new Error(`Failed to create client folder: ${error.message}`);
        }
    }

    /**
     * ESQs intelligent file search
     */
    async searchFiles(query, options = {}) {
        try {
            const {
                category = 'all',
                fileType = 'all',
                dateRange = {},
                clientFilter = null,
                caseFilter = null,
                limit = 100
            } = options;

            // Determine search path
            let searchPath = this.archivePath;
            if (category !== 'all' && this.folderStructure[category]) {
                searchPath = this.folderStructure[category];
            }

            // Execute search
            const searchResults = await this.makeDropboxRequest(
                'https://api.dropboxapi.com/2/files/search_v2',
                'POST',
                {
                    query: query,
                    options: {
                        path: searchPath,
                        max_results: limit,
                        file_status: 'active',
                        filename_only: false
                    }
                }
            );

            // Process and analyze results
            const processedResults = await this.processSearchResults(
                searchResults.matches,
                { clientFilter, caseFilter, fileType, dateRange }
            );

            // ESQs intelligence analysis
            const analysis = await this.analyzeSearchResults(processedResults, query);

            return {
                success: true,
                query: query,
                totalResults: processedResults.length,
                results: processedResults,
                analysis: analysis,
                searchOptions: options
            };

        } catch (error) {
            console.error('File search error:', error);
            throw new Error(`Search failed: ${error.message}`);
        }
    }

    /**
     * Read file content for ESQs analysis
     */
    async readFile(filePath, options = {}) {
        try {
            const {
                includeMetadata = true,
                extractText = true,
                analyzeContent = true
            } = options;

            // Get file metadata
            const metadata = includeMetadata ? await this.getFileMetadata(filePath) : null;
            
            // Download file content
            const fileContent = await this.downloadFile(filePath);
            
            // Extract text if requested
            let textContent = null;
            if (extractText) {
                textContent = await this.extractTextFromFile(fileContent, metadata?.name);
            }

            // ESQs content analysis
            let contentAnalysis = null;
            if (analyzeContent && textContent) {
                contentAnalysis = await this.analyzeFileContent(textContent, metadata);
            }

            return {
                success: true,
                filePath: filePath,
                metadata: metadata,
                content: fileContent,
                textContent: textContent,
                analysis: contentAnalysis,
                readTime: new Date().toISOString()
            };

        } catch (error) {
            console.error('File read error:', error);
            throw new Error(`Failed to read file: ${error.message}`);
        }
    }

    /**
     * Edit/update file through ESQs
     */
    async editFile(filePath, content, options = {}) {
        try {
            const {
                fileType = 'text',
                createBackup = true,
                notifyChanges = true,
                authorInfo = null
            } = options;

            // Create backup if requested
            if (createBackup) {
                const backupPath = this.generateBackupPath(filePath);
                await this.copyFile(filePath, backupPath);
            }

            // Prepare content based on file type
            let processedContent;
            if (fileType === 'text' || filePath.endsWith('.txt') || filePath.endsWith('.md')) {
                processedContent = content;
            } else if (filePath.endsWith('.docx')) {
                processedContent = await this.convertToDocx(content);
            } else if (filePath.endsWith('.pdf')) {
                processedContent = await this.convertToPdf(content);
            } else {
                processedContent = content; // Raw content
            }

            // Upload updated file
            const result = await this.uploadFile(filePath, processedContent, { 
                mode: 'overwrite',
                autorename: false 
            });

            // Log change for ESQs tracking
            await this.logFileChange(filePath, 'edit', authorInfo);

            return {
                success: true,
                filePath: filePath,
                backupCreated: createBackup,
                fileSize: result.size,
                lastModified: result.client_modified,
                message: 'File updated successfully'
            };

        } catch (error) {
            console.error('File edit error:', error);
            throw new Error(`Failed to edit file: ${error.message}`);
        }
    }

    /**
     * Organize files by case/client automatically
     */
    async organizeFiles(sourceFolder, organizationRules = {}) {
        try {
            const {
                autoDetectClients = true,
                autoDetectCases = true,
                createSubfolders = true,
                dryRun = false
            } = organizationRules;

            // Get all files in source folder
            const files = await this.listFolder(sourceFolder, { recursive: true });
            
            // Analyze files for organization
            const organizationPlan = await this.createOrganizationPlan(
                files, 
                { autoDetectClients, autoDetectCases }
            );

            if (dryRun) {
                return {
                    success: true,
                    dryRun: true,
                    plan: organizationPlan,
                    message: 'Organization plan created (dry run)'
                };
            }

            // Execute organization
            const results = await this.executeOrganizationPlan(organizationPlan, createSubfolders);

            return {
                success: true,
                filesProcessed: results.processed,
                filesSkipped: results.skipped,
                foldersCreated: results.foldersCreated,
                organizationPlan: organizationPlan
            };

        } catch (error) {
            console.error('File organization error:', error);
            throw new Error(`Organization failed: ${error.message}`);
        }
    }

    /**
     * ESQs document intelligence analysis
     */
    async analyzeDocument(filePath) {
        try {
            // Read file content
            const fileData = await this.readFile(filePath, {
                includeMetadata: true,
                extractText: true,
                analyzeContent: true
            });

            // Deep document analysis
            const analysis = {
                documentType: this.identifyDocumentType(fileData.textContent, fileData.metadata),
                legalCategories: this.categorizeLegalDocument(fileData.textContent),
                keyEntities: this.extractLegalEntities(fileData.textContent),
                importantDates: this.extractDates(fileData.textContent),
                clientReferences: this.extractClientReferences(fileData.textContent),
                caseReferences: this.extractCaseReferences(fileData.textContent),
                actionItems: this.identifyActionItems(fileData.textContent),
                complianceCheck: this.checkCompliance(fileData.textContent),
                relatedDocuments: await this.findRelatedDocuments(fileData.textContent),
                esqsRecommendations: this.generateDocumentRecommendations(fileData)
            };

            return {
                success: true,
                filePath: filePath,
                analysis: analysis,
                confidence: this.calculateAnalysisConfidence(analysis),
                analysisDate: new Date().toISOString()
            };

        } catch (error) {
            console.error('Document analysis error:', error);
            throw new Error(`Analysis failed: ${error.message}`);
        }
    }

    /**
     * Create new document from ESQs template
     */
    async createDocumentFromTemplate(templateName, variables = {}, options = {}) {
        try {
            const {
                outputPath = null,
                clientName = null,
                caseName = null,
                autoSave = true
            } = options;

            // Load template
            const templatePath = `${this.folderStructure.templates}/${templateName}`;
            const template = await this.readFile(templatePath);

            // Process template with variables
            const processedContent = this.processTemplate(template.textContent, variables);

            // Generate output path if not provided
            let finalPath = outputPath;
            if (!finalPath) {
                finalPath = this.generateDocumentPath(templateName, clientName, caseName);
            }

            // Create document
            const result = await this.createFile(finalPath, processedContent);

            // Log creation
            await this.logFileChange(finalPath, 'create', {
                template: templateName,
                variables: Object.keys(variables)
            });

            return {
                success: true,
                documentPath: finalPath,
                templateUsed: templateName,
                variablesApplied: Object.keys(variables).length,
                fileSize: result.size,
                message: 'Document created from template'
            };

        } catch (error) {
            console.error('Template creation error:', error);
            throw new Error(`Failed to create document: ${error.message}`);
        }
    }

    /**
     * ESQs collaborative editing
     */
    async enableCollaboration(filePath, collaborators = [], permissions = {}) {
        try {
            const {
                allowEdit = true,
                allowComment = true,
                expirationDays = 30
            } = permissions;

            // Create shared link with permissions
            const sharedLink = await this.createSharedLink(filePath, {
                requested_visibility: 'password',
                link_password: this.generateSecurePassword(),
                expires: this.calculateExpirationDate(expirationDays)
            });

            // Set up collaboration tracking
            const collaborationSession = {
                filePath: filePath,
                collaborators: collaborators,
                permissions: permissions,
                sharedLink: sharedLink,
                sessionId: this.generateSessionId(),
                createdAt: new Date().toISOString()
            };

            // Store collaboration info
            await this.storeCollaborationSession(collaborationSession);

            return {
                success: true,
                sessionId: collaborationSession.sessionId,
                sharedLink: sharedLink.url,
                password: sharedLink.link_password,
                expiresAt: sharedLink.expires,
                collaborators: collaborators.length
            };

        } catch (error) {
            console.error('Collaboration setup error:', error);
            throw new Error(`Failed to setup collaboration: ${error.message}`);
        }
    }

    /**
     * Archive management for completed cases
     */
    async archiveCase(caseId, archiveOptions = {}) {
        try {
            const {
                includeDocuments = true,
                includeCorrespondence = true,
                createSummary = true,
                compressionLevel = 'standard'
            } = archiveOptions;

            // Find all case-related files
            const caseFiles = await this.searchFiles(caseId, {
                category: 'all',
                limit: 1000
            });

            // Create archive folder
            const archiveFolder = `${this.folderStructure.archived}/${caseId}_${Date.now()}`;
            await this.createFolder(archiveFolder);

            // Copy files to archive
            const archivedFiles = [];
            for (const file of caseFiles.results) {
                if (this.shouldArchiveFile(file, archiveOptions)) {
                    const archivePath = `${archiveFolder}/${file.name}`;
                    await this.copyFile(file.path_lower, archivePath);
                    archivedFiles.push(archivePath);
                }
            }

            // Create case summary if requested
            if (createSummary) {
                const summary = await this.generateCaseSummary(caseFiles.results, caseId);
                await this.createFile(
                    `${archiveFolder}/CASE_SUMMARY.md`,
                    summary
                );
            }

            // Create archive manifest
            const manifest = this.createArchiveManifest(archivedFiles, caseId, archiveOptions);
            await this.createFile(
                `${archiveFolder}/ARCHIVE_MANIFEST.json`,
                JSON.stringify(manifest, null, 2)
            );

            return {
                success: true,
                caseId: caseId,
                archiveFolder: archiveFolder,
                filesArchived: archivedFiles.length,
                archiveSize: await this.calculateFolderSize(archiveFolder),
                manifest: manifest
            };

        } catch (error) {
            console.error('Case archive error:', error);
            throw new Error(`Failed to archive case: ${error.message}`);
        }
    }

    /**
     * ESQs file analysis methods
     */
    async analyzeFileContent(textContent, metadata) {
        const analysis = {
            wordCount: this.countWords(textContent),
            pageEstimate: Math.ceil(this.countWords(textContent) / 250),
            readingTime: Math.ceil(this.countWords(textContent) / 200),
            
            documentStructure: this.analyzeDocumentStructure(textContent),
            legalLanguageComplexity: this.assessLegalComplexity(textContent),
            
            keyTerms: this.extractKeyTerms(textContent),
            legalCitations: this.extractLegalCitations(textContent),
            contractClauses: this.identifyContractClauses(textContent),
            
            complianceIssues: this.identifyComplianceIssues(textContent),
            riskFactors: this.identifyRiskFactors(textContent),
            
            confidentialityLevel: this.assessConfidentiality(textContent),
            privilegeStatus: this.assessPrivilegeStatus(textContent, metadata)
        };

        return analysis;
    }

    identifyDocumentType(textContent, metadata) {
        const types = {
            contract: ['agreement', 'contract', 'terms', 'whereas', 'party'],
            pleading: ['plaintiff', 'defendant', 'hereby', 'court', 'motion'],
            correspondence: ['dear', 'sincerely', 'regards', 'letter', 'email'],
            research: ['cited', 'authority', 'precedent', 'holding', 'opinion'],
            template: ['[CLIENT]', '{{', 'TEMPLATE', '[DATE]', 'PLACEHOLDER']
        };

        const content = textContent.toLowerCase();
        const scores = {};

        for (const [type, keywords] of Object.entries(types)) {
            scores[type] = keywords.reduce((score, keyword) => {
                return score + (content.includes(keyword) ? 1 : 0);
            }, 0);
        }

        const bestMatch = Object.keys(scores).reduce((a, b) => 
            scores[a] > scores[b] ? a : b
        );

        return {
            type: bestMatch,
            confidence: Math.min(scores[bestMatch] * 20, 100),
            allScores: scores
        };
    }

    generateDocumentRecommendations(fileData) {
        const recommendations = [];
        
        const analysis = fileData.analysis;
        const content = fileData.textContent || '';

        // Confidentiality recommendations
        if (analysis.confidentialityLevel === 'high') {
            recommendations.push({
                type: 'security',
                priority: 'high',
                message: 'Document contains confidential information - ensure secure handling'
            });
        }

        // Compliance recommendations
        if (analysis.complianceIssues && analysis.complianceIssues.length > 0) {
            recommendations.push({
                type: 'compliance',
                priority: 'high',
                message: `${analysis.complianceIssues.length} potential compliance issues identified`
            });
        }

        // Organization recommendations
        if (!content.includes('client:') && !content.includes('matter:')) {
            recommendations.push({
                type: 'organization',
                priority: 'medium',
                message: 'Consider adding client/matter identifiers for better organization'
            });
        }

        return recommendations;
    }

    /**
     * Utility methods
     */
    async makeDropboxRequest(url, method = 'GET', data = null, isUpload = false) {
        const headers = {
            'Authorization': `Bearer ${this.accessToken}`
        };

        if (!isUpload) {
            headers['Content-Type'] = 'application/json';
        }

        const config = {
            method: method,
            headers: headers
        };

        if (data) {
            if (isUpload) {
                config.body = data;
            } else {
                config.body = JSON.stringify(data);
            }
        }

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('Dropbox API Error:', error);
            throw error;
        }
    }

    /**
     * Utility methods for client management
     */
    sanitizeClientName(clientName) {
        return clientName.replace(/[^a-zA-Z0-9\s-_]/g, '').trim();
    }

    getClientPath(clientName) {
        const sanitizedName = this.sanitizeClientName(clientName);
        return `${this.folderStructure.clients}/${sanitizedName}`;
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    calculateSessionDuration(startTime) {
        const start = new Date(startTime);
        const now = new Date();
        const diffMs = now - start;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        
        if (diffHours > 0) {
            return `${diffHours}h ${diffMins % 60}m`;
        } else {
            return `${diffMins}m`;
        }
    }

    findMostCommon(array) {
        const frequency = {};
        array.forEach(item => {
            frequency[item] = (frequency[item] || 0) + 1;
        });
        
        return Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([item, count]) => ({ item, count }));
    }

    generateClientRecommendations(intelligence) {
        const recommendations = [];
        
        if (intelligence.totalInteractions > 20) {
            recommendations.push({
                type: 'efficiency',
                message: 'Consider creating custom templates for this frequent client'
            });
        }
        
        if (intelligence.documentTypes.length > 3) {
            recommendations.push({
                type: 'organization', 
                message: 'Multiple document types - consider folder reorganization'
            });
        }
        
        if (intelligence.commonTopics.length > 0) {
            recommendations.push({
                type: 'automation',
                message: `Frequent topics: ${intelligence.commonTopics[0].item} - consider automated workflows`
            });
        }
        
        return recommendations;
    }

    generateClientInfoTemplate(clientName, caseNumber) {
        return `# Client Information: ${clientName}

## Basic Information
- **Client Name:** ${clientName}
- **Case Number:** ${caseNumber || 'Not assigned'}
- **Date Created:** ${new Date().toISOString()}
- **ESQs Folder Path:** ${this.getClientPath(clientName)}

## Case Details
- **Practice Area:** [To be filled]
- **Responsible Attorney:** [To be filled]
- **Case Status:** [To be filled]
- **Important Dates:** [To be filled]

## Client Preferences
- **Communication Method:** [To be filled]
- **Billing Preferences:** [To be filled]
- **Special Instructions:** [To be filled]

## ESQs Session Tracking
- **Auto-Archive Enabled:** ${this.autoArchive.enabled}
- **Archive Interval:** ${this.autoArchive.intervalMinutes} minutes
- **Retention Period:** ${this.autoArchive.retentionDays} days

## Document Organization
This folder is automatically organized by ESQs with the following structure:
- **Documents/** - General client documents
- **Correspondence/** - Email and letters
- **Pleadings/** - Court filings
- **Discovery/** - Discovery documents and evidence
- **Research/** - Legal research and memos
- **Contracts/** - Agreements and contracts
- **Court_Orders/** - Court orders and judgments
- **Evidence/** - Case evidence and exhibits
- **ESQs_Session_Logs/** - Manual session logs
- **Auto_Archives/** - Automatic session archives

---
*Created by ESQs Enhanced Synthesized Quintessential System*
*Last Updated: ${new Date().toISOString()}*
`;
    }

    async initializeSessionLog(clientName) {
        const clientPath = this.getClientPath(clientName);
        const logPath = `${clientPath}/ESQs_Session_Logs/session_history.md`;
        
        const initialLog = `# ESQs Session History: ${clientName}

This file tracks all ESQs interactions and activities for ${clientName}.

## Session Log
Sessions will be automatically logged here...

---
*Initialized: ${new Date().toISOString()}*
`;
        
        await this.createFile(logPath, initialLog, { overwrite: false });
    }

    /**
     * Connection status
     */
    getStatus() {
        return {
            connected: this.isConnected,
            archivePath: this.archivePath,
            folderStructure: this.folderStructure,
            supportedFormats: this.supportedFormats,
            lastSync: new Date().toISOString()
        };
    }
}

// Global instance
const dropboxArchive = new DropboxArchiveIntegration();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DropboxArchiveIntegration;
}
