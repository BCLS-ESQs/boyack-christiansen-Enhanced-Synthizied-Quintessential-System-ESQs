/**
 * ESQs Automatic Billing Timer System
 * Tracks time, estimates reasonable billing hours, and provides ethical safeguards
 */

class ESQsBillingTimer {
    constructor() {
        this.activeTimers = new Map(); // sessionId -> timer data
        this.dailyTimeEntries = new Map(); // date -> array of entries
        this.billingRates = new Map(); // attorney -> hourly rate
        this.activityTemplates = new Map(); // activity type -> time multipliers
        
        this.settings = {
            autoStartEnabled: true,
            inactivityTimeoutMinutes: 15, // Stop timer after 15 min inactivity
            dailyStartTime: '12:01', // Start billing at 12:01 PM
            ethicalMultiplierMax: 1.5, // Maximum 1.5x actual time for ethics
            roundingIncrement: 0.1, // Round to 6-minute increments (0.1 hours)
            minimumBillableTime: 0.1 // Minimum 6 minutes (0.1 hours)
        };

        // Activity templates with reasonable time multipliers
        this.initializeActivityTemplates();
        this.initializeBillingRates();
        this.setupInactivityDetection();
        
        console.log('⏱️ ESQs Billing Timer initialized');
    }

    /**
     * Initialize activity templates with reasonable time estimates
     */
    initializeActivityTemplates() {
        this.activityTemplates.set('document_drafting', {
            name: 'Document Drafting',
            baseMultiplier: 2.5, // ESQs 45min = 1.875 hours reasonable
            complexity: {
                simple: 2.0,    // Simple docs (letters, basic motions)
                moderate: 2.5,  // Standard motions, contracts
                complex: 3.0,   // Complex pleadings, appeals
                litigation: 3.5 // Trial prep, discovery responses
            },
            description: 'Legal document creation and drafting'
        });

        this.activityTemplates.set('legal_research', {
            name: 'Legal Research',
            baseMultiplier: 2.0,
            complexity: {
                simple: 1.5,    // Basic statute lookup
                moderate: 2.0,  // Case law research
                complex: 2.5,   // Multi-jurisdictional research
                novel: 3.0      // Novel legal issues
            },
            description: 'Legal research and analysis'
        });

        this.activityTemplates.set('client_communication', {
            name: 'Client Communication',
            baseMultiplier: 1.2,
            complexity: {
                simple: 1.0,    // Brief updates
                moderate: 1.2,  // Detailed explanations
                complex: 1.5,   // Crisis management
                sensitive: 1.8  // Difficult conversations
            },
            description: 'Client calls, emails, and meetings'
        });

        this.activityTemplates.set('document_review', {
            name: 'Document Review',
            baseMultiplier: 1.8,
            complexity: {
                simple: 1.3,    // Basic contract review
                moderate: 1.8,  // Standard legal documents
                complex: 2.2,   // Complex agreements
                discovery: 1.0  // Discovery document review
            },
            description: 'Review and analysis of legal documents'
        });

        this.activityTemplates.set('court_preparation', {
            name: 'Court Preparation',
            baseMultiplier: 2.8,
            complexity: {
                simple: 2.0,    // Status conferences
                moderate: 2.8,  // Motion hearings
                complex: 3.5,   // Trial preparation
                trial: 4.0      // Trial attendance
            },
            description: 'Court appearance preparation and attendance'
        });

        this.activityTemplates.set('case_analysis', {
            name: 'Case Analysis',
            baseMultiplier: 2.2,
            complexity: {
                simple: 1.8,    // Straightforward analysis
                moderate: 2.2,  // Standard case evaluation
                complex: 2.8,   // Multi-faceted analysis
                strategic: 3.2  // Strategic planning
            },
            description: 'Case strategy and legal analysis'
        });
    }

    /**
     * Initialize billing rates from PracticePanther
     */
    async initializeBillingRatesFromPP() {
        try {
            if (practicePanther.isConnected) {
                // Get all users/attorneys from PracticePanther
                const users = await practicePanther.getUsers();
                
                if (users.success) {
                    users.data.forEach(user => {
                        this.billingRates.set(user.display_name, user.default_rate || 350);
                    });
                    
                    console.log('✅ Billing rates loaded from PracticePanther');
                }
            } else {
                // Use default rates if PracticePanther not connected
                this.billingRates.set('Travis Christiansen', 450);
                this.billingRates.set('John W Adams III', 350);
                this.billingRates.set('Default', 350);
            }
        } catch (error) {
            console.error('Error loading billing rates:', error);
            // Fall back to defaults
            this.billingRates.set('Default', 350);
        }
    }

    /**
     * Get billing rate for specific attorney and matter
     */
    async getBillingRateForMatter(attorney, clientName, caseNumber = null) {
        try {
            if (!practicePanther.isConnected) {
                return this.billingRates.get(attorney) || this.billingRates.get('Default') || 350;
            }

            // Find the matter in PracticePanther
            let matter = null;
            if (caseNumber) {
                // Search by case number first
                const matters = await practicePanther.getMatters({ 
                    search: caseNumber,
                    limit: 10 
                });
                
                if (matters.success && matters.matters.length > 0) {
                    matter = matters.matters.find(m => 
                        m.number === caseNumber || m.name.includes(clientName)
                    );
                }
            }
            
            // If no matter found by case number, search by client name
            if (!matter) {
                const matters = await practicePanther.getMatters({ 
                    search: clientName,
                    limit: 10 
                });
                
                if (matters.success && matters.matters.length > 0) {
                    matter = matters.matters.find(m => 
                        m.client_name === clientName || m.name.includes(clientName)
                    );
                }
            }

            // Get rate from matter or attorney default
            if (matter) {
                // Check if matter has specific rate for this attorney
                const matterRate = matter.billing_rates?.[attorney] || 
                                 matter.default_rate ||
                                 this.billingRates.get(attorney) ||
                                 350;
                
                console.log(`💰 Rate for ${attorney} on ${clientName}: ${matterRate}/hr`);
                return matterRate;
            }

            // Fall back to attorney's default rate
            return this.billingRates.get(attorney) || this.billingRates.get('Default') || 350;

        } catch (error) {
            console.error('Error getting billing rate:', error);
            return this.billingRates.get(attorney) || 350;
        }
    }

    /**
     * Start billing timer when client file is accessed
     */
    async startBillingTimer(clientName, sessionId, attorney = 'John W Adams III', caseNumber = null) {
        try {
            const currentTime = new Date();
            const billingStartTime = this.getBillingStartTime(currentTime);
            
            // Initialize billing rates from PracticePanther if not done yet
            await this.initializeBillingRatesFromPP();
            
            // Check if it's past billing start time (12:01 PM)
            if (currentTime < billingStartTime) {
                console.log(`⏰ Billing will start at ${billingStartTime.toLocaleTimeString()}`);
                
                // Schedule timer to start at 12:01 PM
                const delay = billingStartTime.getTime() - currentTime.getTime();
                setTimeout(() => {
                    this.actuallyStartTimer(clientName, sessionId, attorney, caseNumber);
                }, delay);
                
                return {
                    success: true,
                    scheduled: true,
                    startTime: billingStartTime,
                    message: `Billing timer scheduled for ${billingStartTime.toLocaleTimeString()}`
                };
            } else {
                // Start immediately if past 12:01 PM
                return await this.actuallyStartTimer(clientName, sessionId, attorney, caseNumber);
            }

        } catch (error) {
            console.error('Error starting billing timer:', error);
            throw new Error(`Failed to start billing timer: ${error.message}`);
        }
    }

    /**
     * Actually start the billing timer
     */
    async actuallyStartTimer(clientName, sessionId, attorney, caseNumber = null) {
        const startTime = new Date();
        
        // Get the actual billing rate from PracticePanther
        const billingRate = await this.getBillingRateForMatter(attorney, clientName, caseNumber);
        
        const timerData = {
            sessionId: sessionId,
            clientName: clientName,
            attorney: attorney,
            caseNumber: caseNumber,
            billingRate: billingRate,
            startTime: startTime,
            lastActivity: startTime,
            activities: [],
            isPaused: false,
            totalActiveTime: 0, // in milliseconds
            currentActivity: null,
            pausedDuration: 0,
            narratives: [] // Store narrative options for time entry
        };

        this.activeTimers.set(sessionId, timerData);
        
        // Setup inactivity monitoring
        this.setupInactivityMonitoring(sessionId);
        
        console.log(`⏱️ Billing timer started for ${clientName} (${attorney} @ ${billingRate}/hr)`);
        
        return {
            success: true,
            sessionId: sessionId,
            startTime: startTime,
            attorney: attorney,
            billingRate: billingRate,
            message: `Billing timer active for ${clientName} @ ${billingRate}/hr`
        };
    }

    /**
     * Log billable activity
     */
    async logBillableActivity(sessionId, activityData) {
        try {
            const timer = this.activeTimers.get(sessionId);
            if (!timer) {
                throw new Error('No active timer found');
            }

            const now = new Date();
            const activityEntry = {
                id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                type: activityData.type,
                description: activityData.description,
                startTime: activityData.startTime || timer.lastActivity,
                endTime: now,
                duration: now - (activityData.startTime || timer.lastActivity),
                complexity: activityData.complexity || 'moderate',
                esqsAssisted: activityData.esqsAssisted || false,
                details: activityData.details || {}
            };

            timer.activities.push(activityEntry);
            timer.lastActivity = now;
            timer.currentActivity = activityEntry;

            // Calculate reasonable billing time for this activity
            const reasonableBilling = this.calculateReasonableBillingTime(activityEntry);
            activityEntry.reasonableBilling = reasonableBilling;

            return {
                success: true,
                activity: activityEntry,
                reasonableBilling: reasonableBilling
            };

        } catch (error) {
            console.error('Error logging billable activity:', error);
            throw new Error(`Failed to log activity: ${error.message}`);
        }
    }

    /**
     * Calculate reasonable billing time based on activity
     */
    calculateReasonableBillingTime(activity) {
        const actualHours = activity.duration / (1000 * 60 * 60); // Convert ms to hours
        const template = this.activityTemplates.get(activity.type);
        
        if (!template) {
            // Default multiplier if no template exists
            return {
                actualTime: actualHours,
                reasonableTime: actualHours * 1.5,
                multiplier: 1.5,
                reasoning: 'Default estimation (no template available)'
            };
        }

        const complexityMultiplier = template.complexity[activity.complexity] || template.baseMultiplier;
        const reasonableTime = actualHours * complexityMultiplier;
        
        // Apply ESQs assistance discount if applicable
        const finalTime = activity.esqsAssisted ? reasonableTime * 0.9 : reasonableTime;

        return {
            actualTime: actualHours,
            reasonableTime: finalTime,
            multiplier: complexityMultiplier,
            template: template.name,
            complexity: activity.complexity,
            esqsDiscount: activity.esqsAssisted ? 10 : 0,
            reasoning: `${template.name} (${activity.complexity}) - ${activity.esqsAssisted ? 'ESQs assisted' : 'Manual work'}`
        };
    }

    /**
     * Setup inactivity monitoring
     */
    setupInactivityMonitoring(sessionId) {
        const checkInterval = setInterval(() => {
            const timer = this.activeTimers.get(sessionId);
            if (!timer) {
                clearInterval(checkInterval);
                return;
            }

            const now = new Date();
            const inactiveTime = now - timer.lastActivity;
            const inactiveMinutes = inactiveTime / (1000 * 60);

            if (inactiveMinutes >= this.settings.inactivityTimeoutMinutes && !timer.isPaused) {
                this.pauseTimer(sessionId, 'inactivity');
                console.log(`⏸️ Timer paused for ${timer.clientName} due to inactivity`);
            }
        }, 60000); // Check every minute

        // Store interval ID for cleanup
        const timer = this.activeTimers.get(sessionId);
        if (timer) {
            timer.inactivityInterval = checkInterval;
        }
    }

    /**
     * Pause timer
     */
    pauseTimer(sessionId, reason = 'manual') {
        const timer = this.activeTimers.get(sessionId);
        if (!timer || timer.isPaused) return false;

        timer.isPaused = true;
        timer.pauseStartTime = new Date();
        timer.pauseReason = reason;

        console.log(`⏸️ Timer paused for ${timer.clientName}: ${reason}`);
        return true;
    }

    /**
     * Resume timer
     */
    resumeTimer(sessionId) {
        const timer = this.activeTimers.get(sessionId);
        if (!timer || !timer.isPaused) return false;

        const now = new Date();
        const pauseDuration = now - timer.pauseStartTime;
        
        timer.pausedDuration += pauseDuration;
        timer.isPaused = false;
        timer.lastActivity = now;
        
        delete timer.pauseStartTime;
        delete timer.pauseReason;

        console.log(`▶️ Timer resumed for ${timer.clientName}`);
        return true;
    }

    /**
     * Stop timer and generate billing summary
     */
    async stopTimer(sessionId) {
        try {
            const timer = this.activeTimers.get(sessionId);
            if (!timer) {
                throw new Error('No active timer found');
            }

            const endTime = new Date();
            timer.endTime = endTime;
            
            // Calculate total time
            const totalTime = endTime - timer.startTime - timer.pausedDuration;
            timer.totalActiveTime = totalTime;

            // Generate billing summary
            const billingSummary = await this.generateBillingSummary(timer);

            // Remove from active timers
            this.activeTimers.delete(sessionId);

            // Clear inactivity interval
            if (timer.inactivityInterval) {
                clearInterval(timer.inactivityInterval);
            }

            console.log(`⏹️ Timer stopped for ${timer.clientName}`);

            return {
                success: true,
                summary: billingSummary,
                message: `Billing session completed for ${timer.clientName}`
            };

        } catch (error) {
            console.error('Error stopping timer:', error);
            throw new Error(`Failed to stop timer: ${error.message}`);
        }
    }

    /**
     * Generate comprehensive billing summary
     */
    async generateBillingSummary(timer) {
        const totalHours = timer.totalActiveTime / (1000 * 60 * 60);
        const attorneyRate = this.billingRates.get(timer.attorney) || this.billingRates.get('Default');

        // Calculate activity-based billing
        let totalReasonableTime = 0;
        const activityBreakdown = timer.activities.map(activity => {
            const billing = activity.reasonableBilling || this.calculateReasonableBillingTime(activity);
            totalReasonableTime += billing.reasonableTime;
            
            return {
                description: activity.description,
                actualTime: billing.actualTime,
                reasonableTime: billing.reasonableTime,
                reasoning: billing.reasoning,
                complexity: activity.complexity,
                esqsAssisted: activity.esqsAssisted
            };
        });

        // Ethical check - ensure not more than 1.5x actual time
        const ethicalMaxTime = totalHours * this.settings.ethicalMultiplierMax;
        const recommendedTime = Math.min(totalReasonableTime, ethicalMaxTime);
        
        // Round to billing increment
        const roundedTime = this.roundToBillingIncrement(recommendedTime);

        const summary = {
            sessionId: timer.sessionId,
            clientName: timer.clientName,
            attorney: timer.attorney,
            startTime: timer.startTime,
            endTime: timer.endTime,
            
            timeAnalysis: {
                actualTime: totalHours,
                reasonableTime: totalReasonableTime,
                ethicalMaxTime: ethicalMaxTime,
                recommendedTime: recommendedTime,
                roundedTime: roundedTime,
                pausedTime: timer.pausedDuration / (1000 * 60 * 60)
            },
            
            financialAnalysis: {
                hourlyRate: attorneyRate,
                actualAmount: totalHours * attorneyRate,
                reasonableAmount: totalReasonableTime * attorneyRate,
                recommendedAmount: roundedTime * attorneyRate,
                ethicalCompliance: recommendedTime <= ethicalMaxTime
            },
            
            activityBreakdown: activityBreakdown,
            
            recommendations: this.generateBillingRecommendations(timer, totalHours, recommendedTime),
            
            ethicalNotes: this.generateEthicalNotes(totalHours, totalReasonableTime, ethicalMaxTime)
        };

        return summary;
    }

    /**
     * Generate billing recommendations
     */
    generateBillingRecommendations(timer, actualTime, recommendedTime) {
        const recommendations = [];

        if (recommendedTime > actualTime * 1.2) {
            recommendations.push({
                type: 'efficiency',
                message: 'ESQs assistance significantly reduced time - consider highlighting efficiency in billing narrative'
            });
        }

        if (timer.activities.length > 5) {
            recommendations.push({
                type: 'detail',
                message: 'Multiple activities performed - consider detailed time entry breakdown'
            });
        }

        if (actualTime < 0.5) {
            recommendations.push({
                type: 'minimum',
                message: 'Short session - consider combining with related work for billing efficiency'
            });
        }

        const complexActivities = timer.activities.filter(a => a.complexity === 'complex' || a.complexity === 'litigation');
        if (complexActivities.length > 0) {
            recommendations.push({
                type: 'complexity',
                message: 'Complex work performed - ensure billing reflects appropriate expertise level'
            });
        }

        return recommendations;
    }

    /**
     * Generate ethical compliance notes
     */
    generateEthicalNotes(actualTime, reasonableTime, ethicalMaxTime) {
        const notes = [];

        if (reasonableTime <= ethicalMaxTime) {
            notes.push('✅ Billing complies with 1.5x ethical guideline');
        } else {
            notes.push('⚠️ Recommended time exceeds 1.5x actual time - capped for ethical compliance');
        }

        const efficiency = actualTime / reasonableTime;
        if (efficiency > 0.8) {
            notes.push('ℹ️ High efficiency ratio - consider documenting time-saving methods');
        } else if (efficiency < 0.4) {
            notes.push('ℹ️ Significant time savings achieved - highlight value-added efficiency');
        }

        return notes;
    }

    /**
     * Create time entry for Practice Panther with narrative options
     */
    async createTimeEntry(billingSummary, options = {}) {
        try {
            const {
                customHours = null,
                narrativeType = 'summary',
                customNarrative = null,
                matterId = null
            } = options;
            
            const hours = customHours || billingSummary.timeAnalysis.roundedTime;
            const rate = billingSummary.financialAnalysis.hourlyRate;
            
            // Validate custom hours against ethical limits
            if (customHours && customHours > billingSummary.timeAnalysis.ethicalMaxTime) {
                throw new Error(`Custom hours (${customHours}) exceed ethical maximum (${billingSummary.timeAnalysis.ethicalMaxTime.toFixed(2)})`);
            }

            // Generate narrative options
            const narrativeOptions = this.generateNarrativeOptions(billingSummary);
            
            // Select narrative based on type
            let description = customNarrative;
            if (!description) {
                switch (narrativeType) {
                    case 'detailed':
                        description = narrativeOptions.detailed.narrative;
                        break;
                    case 'brief':
                        description = narrativeOptions.brief.narrative;
                        break;
                    case 'custom':
                        description = narrativeOptions.custom.narrative;
                        break;
                    default:
                        description = narrativeOptions.summary.narrative;
                }
            }

            // Find or create matter in PracticePanther
            let finalMatterId = matterId;
            if (!finalMatterId && practicePanther.isConnected) {
                const matter = await this.findOrCreateMatter(
                    billingSummary.clientName, 
                    billingSummary.sessionId
                );
                finalMatterId = matter?.id;
            }

            const timeEntryData = {
                matter_ref: { id: finalMatterId || billingSummary.clientName },
                date: billingSummary.startTime.toISOString().split('T')[0],
                hours: hours.toFixed(2),
                rate: rate,
                description: description,
                is_billable: true,
                billed_by_user_ref: { id: billingSummary.attorney },
                tags: this.generateTimeEntryTags(billingSummary)
            };

            // Create time entry in PracticePanther if connected
            let practicePantherResult = null;
            if (practicePanther.isConnected) {
                try {
                    practicePantherResult = await practicePanther.createTimeEntry(timeEntryData);
                } catch (error) {
                    console.warn('PracticePanther time entry failed:', error);
                }
            }

            console.log('📝 Time entry prepared:', timeEntryData);

            return {
                success: true,
                timeEntry: timeEntryData,
                amount: hours * rate,
                ethicallyCompliant: hours <= billingSummary.timeAnalysis.ethicalMaxTime,
                narrativeOptions: narrativeOptions,
                selectedNarrative: description,
                practicePantherCreated: !!practicePantherResult?.success,
                practicePantherEntry: practicePantherResult
            };

        } catch (error) {
            console.error('Error creating time entry:', error);
            throw new Error(`Failed to create time entry: ${error.message}`);
        }
    }

    /**
     * Find or create matter in PracticePanther
     */
    async findOrCreateMatter(clientName, caseNumber) {
        try {
            if (!practicePanther.isConnected) return null;

            // First try to find existing matter
            const searchResult = await practicePanther.getMatters({
                search: caseNumber || clientName,
                limit: 10
            });

            if (searchResult.success && searchResult.matters.length > 0) {
                // Look for exact match
                const exactMatch = searchResult.matters.find(m => 
                    m.number === caseNumber || 
                    m.client_name === clientName ||
                    m.name.includes(clientName)
                );
                
                if (exactMatch) {
                    return exactMatch;
                }
            }

            // If no exact match, return the best match or null
            return searchResult.success && searchResult.matters.length > 0 ? 
                   searchResult.matters[0] : null;

        } catch (error) {
            console.error('Error finding matter:', error);
            return null;
        }
    }

    /**
     * Generate tags for time entry
     */
    generateTimeEntryTags(billingSummary) {
        const tags = [];
        
        // Add activity-based tags
        const activities = billingSummary.activityBreakdown;
        activities.forEach(activity => {
            if (activity.esqsAssisted) tags.push('ESQs-Assisted');
            if (activity.complexity === 'complex') tags.push('Complex');
            if (activity.complexity === 'litigation') tags.push('Litigation');
        });

        // Add efficiency tags
        const efficiency = billingSummary.timeAnalysis.actualTime / billingSummary.timeAnalysis.reasonableTime;
        if (efficiency < 0.6) tags.push('High-Efficiency');
        
        return tags.join(', ');
    }

    /**
     * Generate narrative options for time entry
     */
    generateNarrativeOptions(billingSummary) {
        const activities = billingSummary.activityBreakdown;
        const clientName = billingSummary.clientName;
        
        // Option 1: Detailed breakdown
        const detailedNarrative = this.createDetailedNarrative(activities, clientName);
        
        // Option 2: Summary narrative  
        const summaryNarrative = this.createSummaryNarrative(activities, clientName);
        
        // Option 3: Brief narrative
        const briefNarrative = this.createBriefNarrative(activities, clientName);
        
        // Option 4: Custom template
        const customTemplate = this.createCustomTemplate(activities, clientName);

        return {
            detailed: {
                title: 'Detailed Breakdown',
                narrative: detailedNarrative,
                recommended: activities.length > 3
            },
            summary: {
                title: 'Summary Description', 
                narrative: summaryNarrative,
                recommended: activities.length <= 3
            },
            brief: {
                title: 'Brief Entry',
                narrative: briefNarrative,
                recommended: activities.length === 1
            },
            custom: {
                title: 'Custom Template',
                narrative: customTemplate,
                recommended: false
            }
        };
    }

    createDetailedNarrative(activities, clientName) {
        const narratives = activities.map((activity, index) => {
            const time = activity.reasonableTime;
            const hours = Math.floor(time);
            const minutes = Math.round((time % 1) * 60);
            const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
            
            let description = '';
            
            switch (activity.description.toLowerCase()) {
                case 'document drafting':
                case 'draft':
                    description = `Draft ${this.inferDocumentType(activity)} (${timeStr})`;
                    break;
                case 'legal research':
                case 'research':
                    description = `Legal research re: ${this.inferResearchTopic(activity)} (${timeStr})`;
                    break;
                case 'document review':
                case 'review':
                    description = `Review and analyze ${this.inferDocumentType(activity)} (${timeStr})`;
                    break;
                case 'client communication':
                case 'communication':
                    description = `Client communication regarding case status and strategy (${timeStr})`;
                    break;
                case 'case analysis':
                case 'analysis':
                    description = `Case analysis and strategic planning (${timeStr})`;
                    break;
                default:
                    description = `${activity.description} (${timeStr})`;
            }
            
            return description;
        });

        return `${narratives.join('; ')}. ${this.addEfficiencyNote(activities)}`;
    }

    createSummaryNarrative(activities, clientName) {
        const primaryActivity = this.identifyPrimaryActivity(activities);
        const totalTime = activities.reduce((sum, a) => sum + a.reasonableTime, 0);
        const hours = Math.floor(totalTime);
        const minutes = Math.round((totalTime % 1) * 60);
        const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        
        let mainDescription = '';
        
        switch (primaryActivity.type) {
            case 'document_drafting':
                mainDescription = `Legal document preparation and drafting`;
                break;
            case 'legal_research':
                mainDescription = `Legal research and case law analysis`;
                break;
            case 'client_communication':
                mainDescription = `Client consultation and case discussion`;
                break;
            case 'case_analysis':
                mainDescription = `Case review and strategic analysis`;
                break;
            case 'document_review':
                mainDescription = `Document review and legal analysis`;
                break;
            default:
                mainDescription = `Legal services and case work`;
        }
        
        const additionalActivities = activities.length > 1 ? 
            `; additional case-related activities` : '';
        
        return `${mainDescription}${additionalActivities} (${timeStr}). ${this.addEfficiencyNote(activities)}`;
    }

    createBriefNarrative(activities, clientName) {
        const primaryActivity = activities[0];
        const time = activities.reduce((sum, a) => sum + a.reasonableTime, 0);
        const hours = Math.floor(time);
        const minutes = Math.round((time % 1) * 60);
        const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        
        let briefDesc = '';
        
        switch (primaryActivity.description.toLowerCase()) {
            case 'document drafting':
                briefDesc = 'Legal drafting';
                break;
            case 'legal research':
                briefDesc = 'Legal research';
                break;
            case 'client communication':
                briefDesc = 'Client consultation';
                break;
            case 'case analysis':
                briefDesc = 'Case analysis';
                break;
            case 'document review':
                briefDesc = 'Document review';
                break;
            default:
                briefDesc = 'Legal services';
        }
        
        return `${briefDesc} (${timeStr})${this.hasESQsAssistance(activities) ? '. Enhanced efficiency with legal AI.' : '.'}`;
    }

    createCustomTemplate(activities, clientName) {
        return `[ACTIVITY TYPE] regarding [SUBJECT MATTER] for ${clientName}. [DESCRIPTION OF WORK PERFORMED]. [TIME BREAKDOWN IF NEEDED]. [EFFICIENCY NOTES].

Template variables:
- [ACTIVITY TYPE]: ${this.identifyPrimaryActivity(activities).description}
- [SUBJECT MATTER]: [To be filled]
- [TIME BREAKDOWN]: ${activities.map(a => `${a.description}: ${a.reasonableTime.toFixed(1)}h`).join(', ')}
- [EFFICIENCY NOTES]: ${this.addEfficiencyNote(activities)}`;
    }

    /**
     * Helper methods for narrative generation
     */
    identifyPrimaryActivity(activities) {
        // Find the activity with the most time
        return activities.reduce((primary, current) => 
            current.reasonableTime > primary.reasonableTime ? current : primary
        );
    }

    inferDocumentType(activity) {
        const desc = activity.description.toLowerCase();
        if (desc.includes('motion')) return 'motion';
        if (desc.includes('brief')) return 'legal brief';
        if (desc.includes('contract')) return 'contract';
        if (desc.includes('letter')) return 'correspondence';
        if (desc.includes('pleading')) return 'pleading';
        return 'legal document';
    }

    inferResearchTopic(activity) {
        const desc = activity.description.toLowerCase();
        if (desc.includes('statute')) return 'statutory analysis';
        if (desc.includes('case law')) return 'case law precedent';
        if (desc.includes('motion')) return 'motion practice';
        if (desc.includes('contract')) return 'contract law';
        return 'applicable law';
    }

    hasESQsAssistance(activities) {
        return activities.some(a => a.esqsAssisted);
    }

    addEfficiencyNote(activities) {
        const esqsAssisted = this.hasESQsAssistance(activities);
        const complexWork = activities.some(a => a.complexity === 'complex' || a.complexity === 'litigation');
        
        if (esqsAssisted && complexWork) {
            return 'Advanced legal AI assistance utilized for enhanced accuracy and efficiency.';
        } else if (esqsAssisted) {
            return 'Legal AI assistance utilized for improved efficiency.';
        } else if (complexWork) {
            return 'Complex legal analysis requiring specialized expertise.';
        }
        
        return 'Standard legal services performed with attention to detail.';
    }

    /**
     * Utility methods
     */
    getBillingStartTime(date) {
        const billingStart = new Date(date);
        const [hours, minutes] = this.settings.dailyStartTime.split(':');
        billingStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return billingStart;
    }

    roundToBillingIncrement(hours) {
        const increment = this.settings.roundingIncrement;
        return Math.ceil(hours / increment) * increment;
    }

    setupInactivityDetection() {
        // Global activity detection
        let lastGlobalActivity = Date.now();
        
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, () => {
                lastGlobalActivity = Date.now();
                this.updateAllTimerActivity();
            }, true);
        });
    }

    updateAllTimerActivity() {
        const now = new Date();
        for (const timer of this.activeTimers.values()) {
            if (!timer.isPaused) {
                timer.lastActivity = now;
            }
        }
    }

    /**
     * Daily billing summary for attorney review
     */
    async generateDailyBillingSummary(attorney, date = new Date()) {
        const dateStr = date.toISOString().split('T')[0];
        const dayEntries = this.dailyTimeEntries.get(dateStr) || [];
        
        const attorneyEntries = dayEntries.filter(entry => entry.attorney === attorney);
        
        const summary = {
            date: dateStr,
            attorney: attorney,
            totalSessions: attorneyEntries.length,
            totalActualTime: attorneyEntries.reduce((sum, entry) => sum + entry.timeAnalysis.actualTime, 0),
            totalRecommendedTime: attorneyEntries.reduce((sum, entry) => sum + entry.timeAnalysis.recommendedTime, 0),
            totalRecommendedAmount: attorneyEntries.reduce((sum, entry) => sum + entry.financialAnalysis.recommendedAmount, 0),
            entries: attorneyEntries,
            needsReview: attorneyEntries.filter(entry => !entry.reviewed)
        };

        return summary;
    }

    /**
     * Get timer status
     */
    getTimerStatus(sessionId) {
        const timer = this.activeTimers.get(sessionId);
        if (!timer) {
            return { active: false };
        }

        const now = new Date();
        const elapsedTime = now - timer.startTime - timer.pausedDuration;
        
        return {
            active: true,
            sessionId: sessionId,
            clientName: timer.clientName,
            attorney: timer.attorney,
            startTime: timer.startTime,
            elapsedTime: elapsedTime,
            isPaused: timer.isPaused,
            currentActivity: timer.currentActivity?.description,
            activitiesCount: timer.activities.length
        };
    }
}

// Global billing timer instance
const esqsBillingTimer = new ESQsBillingTimer();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ESQsBillingTimer;
}
