/**
 * PracticePanther Integration Module for ESQs
 * Connects ESQs system to PracticePanther case management
 */

class PracticePantherIntegration {
    constructor() {
        this.baseURL = 'https://app.practicepanther.com/api/v1';
        this.apiKey = null;
        this.firmId = null;
        this.isConnected = false;
        
        this.endpoints = {
            contacts: '/contacts',
            matters: '/matters',
            time: '/time_entries',
            expenses: '/expenses',
            events: '/events',
            tasks: '/tasks',
            documents: '/documents',
            users: '/users'
        };
    }

    /**
     * Initialize connection to PracticePanther
     */
    async connect(apiKey, firmId) {
        try {
            this.apiKey = apiKey;
            this.firmId = firmId;
            
            // Test connection
            const response = await this.makeRequest('/users/me');
            
            if (response.success) {
                this.isConnected = true;
                console.log('✅ Connected to PracticePanther');
                return {
                    success: true,
                    user: response.data,
                    message: 'Successfully connected to PracticePanther'
                };
            } else {
                throw new Error('Authentication failed');
            }
            
        } catch (error) {
            console.error('❌ PracticePanther connection failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get all matters for case analysis
     */
    async getMatters(filters = {}) {
        if (!this.isConnected) {
            throw new Error('Not connected to PracticePanther');
        }

        try {
            const queryParams = new URLSearchParams({
                limit: filters.limit || 100,
                offset: filters.offset || 0,
                status: filters.status || 'active',
                ...filters
            });

            const response = await this.makeRequest(
                `${this.endpoints.matters}?${queryParams}`
            );

            return {
                success: true,
                matters: response.data.results,
                total: response.data.count,
                message: `Retrieved ${response.data.results.length} matters`
            };

        } catch (error) {
            console.error('Error fetching matters:', error);
            throw new Error(`Failed to fetch matters: ${error.message}`);
        }
    }

    /**
     * Get specific matter details
     */
    async getMatter(matterId) {
        try {
            const response = await this.makeRequest(
                `${this.endpoints.matters}/${matterId}`
            );

            // Get related data
            const [contacts, timeEntries, tasks, documents] = await Promise.all([
                this.getMatterContacts(matterId),
                this.getMatterTimeEntries(matterId),
                this.getMatterTasks(matterId),
                this.getMatterDocuments(matterId)
            ]);

            return {
                success: true,
                matter: response.data,
                contacts: contacts.data || [],
                timeEntries: timeEntries.data || [],
                tasks: tasks.data || [],
                documents: documents.data || [],
                analysis: await this.analyzeMatter(response.data)
            };

        } catch (error) {
            console.error('Error fetching matter details:', error);
            throw new Error(`Failed to fetch matter: ${error.message}`);
        }
    }

    /**
     * Get contacts for ESQs analysis
     */
    async getContacts(filters = {}) {
        try {
            const queryParams = new URLSearchParams({
                limit: filters.limit || 100,
                type: filters.type || 'all',
                ...filters
            });

            const response = await this.makeRequest(
                `${this.endpoints.contacts}?${queryParams}`
            );

            return {
                success: true,
                contacts: response.data.results,
                total: response.data.count
            };

        } catch (error) {
            throw new Error(`Failed to fetch contacts: ${error.message}`);
        }
    }

    /**
     * Get time entries for billing analysis
     */
    async getTimeEntries(matterId, dateRange = {}) {
        try {
            const queryParams = new URLSearchParams({
                matter: matterId,
                date_from: dateRange.from || '',
                date_to: dateRange.to || '',
                limit: 1000
            });

            const response = await this.makeRequest(
                `${this.endpoints.time}?${queryParams}`
            );

            return {
                success: true,
                timeEntries: response.data.results,
                totalHours: this.calculateTotalHours(response.data.results),
                totalAmount: this.calculateTotalAmount(response.data.results)
            };

        } catch (error) {
            throw new Error(`Failed to fetch time entries: ${error.message}`);
        }
    }

    /**
     * Get tasks for deadline management
     */
    async getTasks(filters = {}) {
        try {
            const queryParams = new URLSearchParams({
                status: filters.status || 'pending',
                assigned_to: filters.assignedTo || '',
                matter: filters.matterId || '',
                due_date_from: filters.dueDateFrom || '',
                due_date_to: filters.dueDateTo || '',
                limit: 200
            });

            const response = await this.makeRequest(
                `${this.endpoints.tasks}?${queryParams}`
            );

            return {
                success: true,
                tasks: response.data.results,
                upcomingDeadlines: this.analyzeDeadlines(response.data.results)
            };

        } catch (error) {
            throw new Error(`Failed to fetch tasks: ${error.message}`);
        }
    }

    /**
     * Create new matter
     */
    async createMatter(matterData) {
        try {
            const response = await this.makeRequest(
                this.endpoints.matters,
                'POST',
                matterData
            );

            return {
                success: true,
                matter: response.data,
                matterId: response.data.id,
                message: 'Matter created successfully'
            };

        } catch (error) {
            throw new Error(`Failed to create matter: ${error.message}`);
        }
    }

    /**
     * Create time entry
     */
    async createTimeEntry(timeData) {
        try {
            const response = await this.makeRequest(
                this.endpoints.time,
                'POST',
                timeData
            );

            return {
                success: true,
                timeEntry: response.data,
                message: 'Time entry created successfully'
            };

        } catch (error) {
            throw new Error(`Failed to create time entry: ${error.message}`);
        }
    }

    /**
     * Analyze matter for ESQs insights
     */
    async analyzeMatter(matter) {
        const analysis = {
            caseType: matter.practice_area || 'General',
            status: matter.status,
            openDate: matter.open_date,
            lastActivity: matter.last_activity_date,
            responsibleAttorney: matter.responsible_attorney,
            billingStatus: matter.billing_status,
            totalBilled: matter.total_billed || 0,
            daysOpen: this.calculateDaysOpen(matter.open_date),
            priority: this.assessPriority(matter),
            riskFactors: this.identifyRiskFactors(matter),
            recommendations: this.generateRecommendations(matter)
        };

        return analysis;
    }

    /**
     * ESQs case intelligence analysis
     */
    generateCaseIntelligence(matter, relatedData) {
        const intelligence = {
            caseOverview: {
                name: matter.name,
                client: matter.client_name,
                practiceArea: matter.practice_area,
                status: matter.status,
                daysActive: this.calculateDaysOpen(matter.open_date)
            },
            
            financialAnalysis: {
                totalBilled: matter.total_billed || 0,
                totalHours: relatedData.timeEntries?.totalHours || 0,
                averageHourlyRate: this.calculateAverageRate(relatedData.timeEntries),
                billingTrend: this.analyzeBillingTrend(relatedData.timeEntries)
            },
            
            activityAnalysis: {
                recentActivity: this.analyzeRecentActivity(relatedData),
                taskCompletion: this.analyzeTaskCompletion(relatedData.tasks),
                communicationFrequency: this.analyzeCommunication(relatedData)
            },
            
            riskAssessment: {
                deadlineRisks: this.assessDeadlineRisks(relatedData.tasks),
                billingRisks: this.assessBillingRisks(relatedData.timeEntries),
                clientRisks: this.assessClientRisks(matter, relatedData)
            },
            
            strategicRecommendations: this.generateStrategicRecommendations(matter, relatedData)
        };

        return intelligence;
    }

    /**
     * Helper methods for analysis
     */
    calculateTotalHours(timeEntries) {
        return timeEntries.reduce((total, entry) => total + (entry.hours || 0), 0);
    }

    calculateTotalAmount(timeEntries) {
        return timeEntries.reduce((total, entry) => total + (entry.amount || 0), 0);
    }

    calculateDaysOpen(openDate) {
        if (!openDate) return 0;
        const open = new Date(openDate);
        const now = new Date();
        const diffTime = Math.abs(now - open);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    assessPriority(matter) {
        // Simple priority assessment logic
        const factors = {
            high: ['litigation', 'criminal', 'urgent'],
            medium: ['family', 'business', 'contract'],
            low: ['estate', 'general']
        };

        const practiceArea = (matter.practice_area || '').toLowerCase();
        
        for (const [priority, areas] of Object.entries(factors)) {
            if (areas.some(area => practiceArea.includes(area))) {
                return priority;
            }
        }
        
        return 'medium';
    }

    identifyRiskFactors(matter) {
        const risks = [];
        
        if (this.calculateDaysOpen(matter.open_date) > 365) {
            risks.push('Long-running case (>1 year)');
        }
        
        if (!matter.last_activity_date || this.calculateDaysOpen(matter.last_activity_date) > 30) {
            risks.push('No recent activity (>30 days)');
        }
        
        if (matter.status === 'pending') {
            risks.push('Case status pending');
        }
        
        return risks;
    }

    generateRecommendations(matter) {
        const recommendations = [];
        
        if (this.calculateDaysOpen(matter.last_activity_date) > 30) {
            recommendations.push('Schedule client check-in');
        }
        
        if (!matter.next_court_date) {
            recommendations.push('Set important dates and deadlines');
        }
        
        recommendations.push('Review case progress and billing status');
        
        return recommendations;
    }

    /**
     * Make API request to PracticePanther
     */
    async makeRequest(endpoint, method = 'GET', data = null) {
        const headers = {
            'Authorization': `Token ${this.apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'ESQs-Legal-Intelligence/1.0'
        };

        const config = {
            method: method,
            headers: headers
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, config);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            return {
                success: true,
                data: result
            };
            
        } catch (error) {
            console.error('PracticePanther API Error:', error);
            throw error;
        }
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            connected: this.isConnected,
            firmId: this.firmId,
            lastConnection: new Date().toISOString()
        };
    }
}

// Global instance
const practicePanther = new PracticePantherIntegration();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PracticePantherIntegration;
}
