/**
 * Lexis Integration Module for ESQs
 * Connects ESQs system to Lexis legal research database
 * 
 * DECISIS API ACCESS INFORMATION:
 * ===============================
 * 
 * What is Decisis by Lexis?
 * -------------------------
 * Decisis is LexisNexis's legal analytics platform that provides:
 * - Judicial analytics and judge insights
 * - Case outcome predictions
 * - Court performance metrics
 * - Attorney tracking and performance data
 * - Motion success rates and timing analytics
 * - Settlement and verdict analysis
 * 
 * How to Get Access:
 * ------------------
 * 1. Contact LexisNexis Sales: https://www.lexisnexis.com/en-us/products/legal-analytics.page
 * 2. Request a Decisis Analytics subscription
 * 3. API access requires an Enterprise license with LexisNexis
 * 4. Pricing is typically based on firm size and usage volume
 * 
 * API Requirements:
 * -----------------
 * - Enterprise LexisNexis subscription
 * - API credentials (Client ID, Client Secret, API Key)
 * - IP whitelisting may be required
 * - OAuth 2.0 authentication flow
 * 
 * Base URL: https://api.lexisnexis.com/analytics/v1
 * Documentation: Available through LexisNexis Developer Portal (subscription required)
 * 
 * Available Endpoints (with proper subscription):
 * - /judges/{judgeId}/analytics
 * - /courts/{courtId}/performance
 * - /cases/{caseId}/prediction
 * - /attorneys/{attorneyId}/track-record
 * - /motions/success-rates
 */

class LexisIntegration {
    constructor() {
        this.baseURL = 'https://api.lexisnexis.com/v1';
        this.decisAPIBaseURL = 'https://api.lexisnexis.com/analytics/v1';
        this.apiKey = null;
        this.clientId = null;
        this.clientSecret = null;
        this.isConnected = false;
        this.hasDecisAccess = false;
        
        this.searchTypes = {
            caselaw: 'cases',
            statutes: 'statutes',
            regulations: 'regulations',
            secondary: 'secondary_sources',
            news: 'legal_news',
            forms: 'forms_precedents'
        };
        
        this.jurisdictions = {
            'UT': 'Utah',
            'US': 'Federal',
            '5TH_CIR': 'Fifth Judicial District'
        };

        // Decisis Analytics Features
        this.decisFeatures = {
            judgeAnalytics: 'judicial-insights',
            caseOutcomes: 'case-predictions',
            courtMetrics: 'court-performance',
            attorneyTracking: 'attorney-analytics',
            motionAnalytics: 'motion-success-rates',
            settlementData: 'settlement-analysis'
        };
    }

    /**
     * Get information about Decisis API access
     */
    getDecisInfo() {
        return {
            platform: 'Decisis by LexisNexis',
            description: 'Legal analytics platform providing judicial insights, case predictions, and court performance data',
            features: [
                'Judicial behavior analytics',
                'Case outcome predictions',
                'Motion success rate analysis',
                'Court performance metrics',
                'Attorney track record analysis',
                'Settlement and verdict data'
            ],
            accessRequirements: {
                subscription: 'Enterprise LexisNexis subscription required',
                apiAccess: 'Decisis Analytics API add-on needed',
                authentication: 'OAuth 2.0 with Client ID, Secret, and API Key',
                ipWhitelisting: 'May be required for security'
            },
            howToGetAccess: [
                '1. Contact LexisNexis Sales Team',
                '2. Request Decisis Analytics subscription quote',
                '3. Complete Enterprise subscription setup',
                '4. Request API credentials from LexisNexis Developer Portal',
                '5. Configure OAuth 2.0 authentication'
            ],
            contactInfo: {
                sales: 'https://www.lexisnexis.com/en-us/products/legal-analytics.page',
                support: 'LexisNexis Customer Support',
                developer: 'LexisNexis Developer Portal (subscription required)'
            },
            estimatedCost: 'Contact LexisNexis for pricing based on firm size and usage',
            baseURL: this.decisAPIBaseURL,
            hasAccess: this.hasDecisAccess
        };
    }

    /**
     * Check if Decisis API access is available
     */
    async checkDecisAccess() {
        if (!this.apiKey || !this.clientSecret) {
            return {
                hasAccess: false,
                message: 'Decisis API credentials not configured. Contact LexisNexis for Enterprise subscription.',
                nextSteps: this.getDecisInfo().howToGetAccess
            };
        }

        try {
            // Test Decisis API access (simulated for demo)
            const testResponse = await this.makeDecisRequest('/status', 'GET');
            
            if (testResponse.success) {
                this.hasDecisAccess = true;
                return {
                    hasAccess: true,
                    message: 'Decisis API access confirmed',
                    availableFeatures: Object.keys(this.decisFeatures)
                };
            }
        } catch (error) {
            return {
                hasAccess: false,
                message: 'Decisis API access not available or credentials invalid',
                error: error.message,
                nextSteps: this.getDecisInfo().howToGetAccess
            };
        }
    }

    /**
     * Initialize connection to Lexis (including Decisis if available)
     */
    async connect(apiKey, clientId, clientSecret = null) {
        try {
            this.apiKey = apiKey;
            this.clientId = clientId;
            this.clientSecret = clientSecret;
            
            // Set connected first to allow test search
            this.isConnected = true;
            
            // Test basic Lexis connection
            const testSearch = await this.search({
                query: 'contract law',
                sources: ['caselaw'],
                jurisdiction: 'UT',
                limit: 1
            });
            
            if (testSearch.success) {
                console.log('✅ Connected to Lexis');
                
                // Check Decisis access if client secret provided
                let decisStatus = null;
                if (clientSecret) {
                    decisStatus = await this.checkDecisAccess();
                    if (decisStatus.hasAccess) {
                        console.log('✅ Decisis API access confirmed');
                    } else {
                        console.log('ℹ️ Decisis API access not available');
                    }
                }
                
                return {
                    success: true,
                    message: 'Successfully connected to Lexis',
                    availableSources: Object.keys(this.searchTypes),
                    decisAccess: decisStatus
                };
            } else {
                this.isConnected = false;
                throw new Error('Authentication failed');
            }
            
        } catch (error) {
            this.isConnected = false;
            console.error('❌ Lexis connection failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Comprehensive legal search for ESQs analysis
     */
    async search(searchParams) {
        if (!this.isConnected) {
            throw new Error('Not connected to Lexis');
        }

        try {
            const {
                query,
                sources = ['caselaw', 'statutes'],
                jurisdiction = 'UT',
                dateRange = {},
                limit = 50,
                sortBy = 'relevance'
            } = searchParams;

            // Parallel searches across different source types
            const searchPromises = sources.map(source => 
                this.searchBySource(query, source, jurisdiction, dateRange, limit, sortBy)
            );

            const results = await Promise.all(searchPromises);
            
            // Combine and analyze results
            const combinedResults = this.combineSearchResults(results, sources);
            const analysis = await this.analyzeSearchResults(combinedResults, query);
            
            return {
                success: true,
                query: query,
                jurisdiction: jurisdiction,
                totalResults: combinedResults.totalCount,
                results: combinedResults.documents,
                analysis: analysis,
                searchTime: new Date().toISOString()
            };

        } catch (error) {
            console.error('Lexis search error:', error);
            throw new Error(`Search failed: ${error.message}`);
        }
    }

    /**
     * Search specific source type
     */
    async searchBySource(query, source, jurisdiction, dateRange, limit, sortBy) {
        const searchData = {
            q: query,
            source: this.searchTypes[source],
            jurisdiction: jurisdiction,
            sort: sortBy,
            limit: limit,
            ...dateRange
        };

        try {
            const response = await this.makeRequest('/search', 'POST', searchData);
            return {
                source: source,
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error(`Error searching ${source}:`, error);
            return {
                source: source,
                success: false,
                error: error.message,
                data: { documents: [], totalCount: 0 }
            };
        }
    }

    /**
     * Get full document content
     */
    async getDocument(documentId, source) {
        try {
            const response = await this.makeRequest(
                `/documents/${source}/${documentId}`
            );

            return {
                success: true,
                document: response.data,
                analysis: await this.analyzeDocument(response.data)
            };

        } catch (error) {
            throw new Error(`Failed to retrieve document: ${error.message}`);
        }
    }

    /**
     * Case law specific search with citation analysis
     */
    async searchCaselaw(query, jurisdiction = 'UT', options = {}) {
        const searchParams = {
            query: query,
            sources: ['caselaw'],
            jurisdiction: jurisdiction,
            limit: options.limit || 25,
            dateRange: options.dateRange || {},
            courtLevel: options.courtLevel || 'all'
        };

        try {
            const results = await this.search(searchParams);
            
            // Enhanced caselaw analysis
            const caseLawAnalysis = {
                precedentialValue: this.analyzePrecedentialValue(results.results),
                citationNetwork: this.buildCitationNetwork(results.results),
                jurisdictionalAnalysis: this.analyzeJurisdiction(results.results, jurisdiction),
                temporalTrends: this.analyzeTemporalTrends(results.results),
                keyHoldings: this.extractKeyHoldings(results.results)
            };

            return {
                ...results,
                caseLawAnalysis: caseLawAnalysis
            };

        } catch (error) {
            throw new Error(`Case law search failed: ${error.message}`);
        }
    }

    /**
     * Statute and regulation search
     */
    async searchStatutes(query, jurisdiction = 'UT', includeRegulations = true) {
        const sources = ['statutes'];
        if (includeRegulations) {
            sources.push('regulations');
        }

        const searchParams = {
            query: query,
            sources: sources,
            jurisdiction: jurisdiction,
            limit: 30
        };

        try {
            const results = await this.search(searchParams);
            
            // Enhanced statutory analysis
            const statutoryAnalysis = {
                applicableStatutes: this.categorizeStatutes(results.results),
                recentAmendments: this.findRecentAmendments(results.results),
                regulatoryGuidance: this.extractRegulatoryGuidance(results.results),
                complianceRequirements: this.identifyComplianceRequirements(results.results)
            };

            return {
                ...results,
                statutoryAnalysis: statutoryAnalysis
            };

        } catch (error) {
            throw new Error(`Statutory search failed: ${error.message}`);
        }
    }

    /**
     * Judge-specific research for ESQs judicial intelligence
     * Enhanced with Decisis Analytics when available
     */
    async searchJudicialProfile(judgeName, court, practiceArea = null) {
        const queries = [
            `judge "${judgeName}"`,
            `"${judgeName}" ${court}`,
            `"Judge ${judgeName}" decisions`
        ];

        if (practiceArea) {
            queries.push(`"${judgeName}" ${practiceArea}`);
        }

        try {
            const searchPromises = queries.map(query => 
                this.search({
                    query: query,
                    sources: ['caselaw', 'legal_news'],
                    jurisdiction: 'UT',
                    limit: 20
                })
            );

            const results = await Promise.all(searchPromises);
            const judicialProfile = this.buildJudicialProfile(results, judgeName, court);
            
            // Enhance with Decisis data if available
            let decisAnalytics = null;
            if (this.hasDecisAccess) {
                decisAnalytics = await this.getDecisJudicialAnalytics(judgeName, court);
            }
            
            return {
                success: true,
                judge: judgeName,
                court: court,
                profile: judicialProfile,
                decisAnalytics: decisAnalytics,
                recommendations: this.generateJudicialRecommendations(judicialProfile, decisAnalytics)
            };

        } catch (error) {
            throw new Error(`Judicial research failed: ${error.message}`);
        }
    }

    /**
     * Decisis Judicial Analytics (requires Decisis API access)
     */
    async getDecisJudicialAnalytics(judgeName, court) {
        if (!this.hasDecisAccess) {
            return {
                available: false,
                message: 'Decisis API access required for advanced judicial analytics',
                howToGetAccess: this.getDecisInfo().howToGetAccess
            };
        }

        try {
            // In a real implementation, this would make actual API calls to Decisis
            const analytics = await this.makeDecisRequest(
                `/judges/search?name=${encodeURIComponent(judgeName)}&court=${encodeURIComponent(court)}`,
                'GET'
            );

            return {
                available: true,
                judgeId: analytics.data.judgeId,
                analytics: {
                    caseVolume: analytics.data.caseVolume,
                    averageCaseLength: analytics.data.averageCaseLength,
                    reverralRate: analytics.data.reverralRate,
                    motionGrantRates: analytics.data.motionGrantRates,
                    settledCasePercentage: analytics.data.settledCasePercentage,
                    sentencingTrends: analytics.data.sentencingTrends,
                    proceduralPreferences: analytics.data.proceduralPreferences
                },
                lastUpdated: analytics.data.lastUpdated
            };

        } catch (error) {
            throw new Error(`Decisis judicial analytics failed: ${error.message}`);
        }
    }

    /**
     * Decisis Case Outcome Prediction (requires Decisis API access)
     */
    async predictCaseOutcome(caseDetails) {
        if (!this.hasDecisAccess) {
            return {
                available: false,
                message: 'Decisis API access required for case outcome predictions',
                howToGetAccess: this.getDecisInfo().howToGetAccess
            };
        }

        try {
            const prediction = await this.makeDecisRequest('/cases/predict', 'POST', {
                caseType: caseDetails.caseType,
                judge: caseDetails.judge,
                court: caseDetails.court,
                practiceArea: caseDetails.practiceArea,
                caseValue: caseDetails.caseValue,
                parties: caseDetails.parties
            });

            return {
                available: true,
                prediction: {
                    winProbability: prediction.data.winProbability,
                    expectedDuration: prediction.data.expectedDuration,
                    settlementLikelihood: prediction.data.settlementLikelihood,
                    averageSettlementAmount: prediction.data.averageSettlementAmount,
                    confidence: prediction.data.confidence
                },
                basedOn: prediction.data.similarCases,
                lastUpdated: prediction.data.lastUpdated
            };

        } catch (error) {
            throw new Error(`Case outcome prediction failed: ${error.message}`);
        }
    }

    /**
     * Decisis Motion Success Rate Analysis (requires Decisis API access)
     */
    async getMotionAnalytics(motionType, judge = null, court = null) {
        if (!this.hasDecisAccess) {
            return {
                available: false,
                message: 'Decisis API access required for motion analytics',
                howToGetAccess: this.getDecisInfo().howToGetAccess
            };
        }

        try {
            const queryParams = new URLSearchParams({
                motionType: motionType
            });
            
            if (judge) queryParams.append('judge', judge);
            if (court) queryParams.append('court', court);

            const analytics = await this.makeDecisRequest(
                `/motions/analytics?${queryParams}`,
                'GET'
            );

            return {
                available: true,
                motionType: motionType,
                analytics: {
                    overallSuccessRate: analytics.data.overallSuccessRate,
                    averageDecisionTime: analytics.data.averageDecisionTime,
                    seasonalTrends: analytics.data.seasonalTrends,
                    byJudge: analytics.data.byJudge,
                    byCourt: analytics.data.byCourt,
                    factorsInfluencingSuccess: analytics.data.successFactors
                },
                recommendations: analytics.data.recommendations,
                lastUpdated: analytics.data.lastUpdated
            };

        } catch (error) {
            throw new Error(`Motion analytics failed: ${error.message}`);
        }
    }

    /**
     * ESQs comprehensive research synthesis
     */
    async comprehensiveResearch(topic, caseContext = {}) {
        try {
            // Multi-faceted research approach
            const [
                caselaw,
                statutes,
                secondary,
                recentNews
            ] = await Promise.all([
                this.searchCaselaw(topic, caseContext.jurisdiction),
                this.searchStatutes(topic, caseContext.jurisdiction),
                this.search({
                    query: topic,
                    sources: ['secondary'],
                    jurisdiction: caseContext.jurisdiction || 'UT',
                    limit: 15
                }),
                this.search({
                    query: topic,
                    sources: ['news'],
                    dateRange: { from: this.getDateMonthsAgo(6) },
                    limit: 10
                })
            ]);

            // Synthesize all research
            const synthesis = {
                executiveSummary: this.generateExecutiveSummary(caselaw, statutes, secondary),
                legalFramework: this.buildLegalFramework(caselaw.results, statutes.results),
                precedentAnalysis: caselaw.caseLawAnalysis,
                statutoryAnalysis: statutes.statutoryAnalysis,
                practicalGuidance: this.extractPracticalGuidance(secondary.results),
                recentDevelopments: this.analyzeRecentDevelopments(recentNews.results),
                strategicRecommendations: this.generateResearchRecommendations(
                    topic, caselaw, statutes, caseContext
                )
            };

            return {
                success: true,
                topic: topic,
                researchDate: new Date().toISOString(),
                synthesis: synthesis,
                totalSources: caselaw.totalResults + statutes.totalResults + 
                             secondary.totalResults + recentNews.totalResults
            };

        } catch (error) {
            throw new Error(`Comprehensive research failed: ${error.message}`);
        }
    }

    /**
     * Analysis methods for ESQs intelligence
     */
    analyzeSearchResults(results, query) {
        return {
            relevanceScore: this.calculateRelevanceScore(results, query),
            authorityLevel: this.assessAuthorityLevel(results.documents),
            recency: this.analyzeRecency(results.documents),
            jurisdictionalRelevance: this.assessJurisdictionalRelevance(results.documents),
            keyThemes: this.extractKeyThemes(results.documents),
            citationStrength: this.analyzeCitationStrength(results.documents)
        };
    }

    assessAuthorityLevel(documents) {
        if (!documents || documents.length === 0) return 'low';
        
        const supremeCourtCases = documents.filter(doc => 
            doc.court && doc.court.toLowerCase().includes('supreme')
        ).length;
        
        if (supremeCourtCases > documents.length * 0.3) return 'high';
        if (supremeCourtCases > 0) return 'medium';
        return 'low';
    }

    analyzeRecency(documents) {
        if (!documents || documents.length === 0) return { average: 'unknown', recent: 0 };
        
        const currentYear = new Date().getFullYear();
        const recentDocs = documents.filter(doc => {
            if (!doc.date) return false;
            const docYear = new Date(doc.date).getFullYear();
            return (currentYear - docYear) <= 3;
        });

        return {
            average: recentDocs.length > 0 ? 'recent' : 'older',
            recent: recentDocs.length,
            percentage: Math.round((recentDocs.length / documents.length) * 100)
        };
    }

    assessJurisdictionalRelevance(documents) {
        if (!documents || documents.length === 0) return 'unknown';
        return 'relevant'; // Simplified for demo
    }

    extractKeyThemes(documents) {
        if (!documents || documents.length === 0) return [];
        
        // Simplified theme extraction
        const themes = new Set();
        documents.forEach(doc => {
            if (doc.title) {
                const words = doc.title.toLowerCase().split(' ');
                words.forEach(word => {
                    if (word.length > 4 && !['case', 'court', 'state'].includes(word)) {
                        themes.add(word);
                    }
                });
            }
        });
        
        return Array.from(themes).slice(0, 5);
    }

    analyzeCitationStrength(documents) {
        if (!documents || documents.length === 0) return 'weak';
        
        const withCitations = documents.filter(doc => 
            doc.citation && doc.citation.length > 0
        ).length;
        
        const percentage = (withCitations / documents.length) * 100;
        
        if (percentage >= 80) return 'strong';
        if (percentage >= 50) return 'moderate';
        return 'weak';
    }

    // Additional helper methods for completeness
    analyzePrecedentialValue(documents) {
        return 'moderate'; // Simplified for demo
    }

    buildCitationNetwork(documents) {
        return { totalCitations: documents.length }; // Simplified
    }

    analyzeJurisdiction(documents, jurisdiction) {
        return { relevantDocs: documents.length }; // Simplified
    }

    analyzeTemporalTrends(documents) {
        return { trend: 'stable' }; // Simplified
    }

    extractKeyHoldings(documents) {
        return documents.slice(0, 3).map(doc => doc.title || 'Key holding'); // Simplified
    }

    categorizeStatutes(documents) {
        return { applicable: documents.slice(0, 5) }; // Simplified
    }

    findRecentAmendments(documents) {
        return []; // Simplified
    }

    extractRegulatoryGuidance(documents) {
        return []; // Simplified
    }

    identifyComplianceRequirements(documents) {
        return []; // Simplified
    }

    generateExecutiveSummary(caselaw, statutes, secondary) {
        return 'Comprehensive legal analysis complete.'; // Simplified
    }

    buildLegalFramework(caseDocs, statuteDocs) {
        return { framework: 'established' }; // Simplified
    }

    extractPracticalGuidance(documents) {
        return []; // Simplified
    }

    analyzeRecentDevelopments(documents) {
        return { developments: documents.length }; // Simplified
    }

    // Judicial analysis helpers
    analyzeDecisionTrends(documents) {
        return { trend: 'consistent' }; // Simplified
    }

    analyzeSentencingPatterns(documents) {
        return { pattern: 'moderate' }; // Simplified
    }

    extractProceduralPreferences(documents) {
        return ['Timely filings', 'Proper formatting']; // Simplified
    }

    identifySpecializations(documents) {
        return ['Civil Law', 'Contract Disputes']; // Simplified
    }

    getRecentRulings(documents, months) {
        return documents.slice(0, 5); // Simplified
    }

    calculateAppealRate(documents) {
        return 15.2; // Simplified percentage
    }

    extractKeyQuotes(documents) {
        return ['Justice must be served with precision.']; // Simplified
    }

    generateJudicialRecommendations(profile, decisAnalytics = null) {
        const recommendations = [];
        
        if (decisAnalytics && decisAnalytics.available) {
            // Enhanced recommendations with Decisis data
            const analytics = decisAnalytics.analytics;
            
            if (analytics.motionGrantRates) {
                recommendations.push({
                    type: 'motion_strategy',
                    message: `Motion grant rate: ${analytics.motionGrantRates.overall}%. Plan accordingly.`,
                    confidence: 'high',
                    source: 'Decisis Analytics'
                });
            }
            
            if (analytics.averageCaseLength) {
                recommendations.push({
                    type: 'timeline_planning',
                    message: `Average case length: ${analytics.averageCaseLength} months. Set client expectations.`,
                    confidence: 'high',
                    source: 'Decisis Analytics'
                });
            }
            
            if (analytics.settledCasePercentage > 70) {
                recommendations.push({
                    type: 'settlement_strategy',
                    message: `${analytics.settledCasePercentage}% of cases settle. Strong settlement focus recommended.`,
                    confidence: 'high',
                    source: 'Decisis Analytics'
                });
            }
        } else {
            // Basic recommendations from profile
            if (profile.caseCount > 100) {
                recommendations.push({
                    type: 'experienced_judge',
                    message: 'Experienced judge with extensive case history',
                    confidence: 'medium'
                });
            }
            
            recommendations.push({
                type: 'decisis_upgrade',
                message: 'Upgrade to Decisis Analytics for precise judicial insights and success predictions',
                confidence: 'high',
                action: 'Contact LexisNexis Sales'
            });
        }
        
        return recommendations;
    }

    buildJudicialProfile(searchResults, judgeName, court) {
        const allDocuments = searchResults.flatMap(result => result.results || []);
        
        return {
            caseCount: allDocuments.length,
            decisionTrends: this.analyzeDecisionTrends(allDocuments),
            sentencingPatterns: this.analyzeSentencingPatterns(allDocuments),
            proceduralPreferences: this.extractProceduralPreferences(allDocuments),
            specializations: this.identifySpecializations(allDocuments),
            recentRulings: this.getRecentRulings(allDocuments, 12),
            appealRate: this.calculateAppealRate(allDocuments),
            keyQuotes: this.extractKeyQuotes(allDocuments)
        };
    }

    generateResearchRecommendations(topic, caselaw, statutes, caseContext) {
        const recommendations = [];
        
        // Analyze strength of legal position
        if (caselaw.results.length > 10) {
            recommendations.push({
                type: 'strong_precedent',
                message: 'Strong precedential support available',
                confidence: 'high'
            });
        }
        
        // Check for recent developments
        const recentCases = caselaw.results.filter(doc => 
            new Date(doc.date) > this.getDateMonthsAgo(12)
        );
        
        if (recentCases.length > 0) {
            recommendations.push({
                type: 'recent_development',
                message: 'Recent case law developments found',
                confidence: 'medium'
            });
        }
        
        // Statutory analysis
        if (statutes.results.length > 0) {
            recommendations.push({
                type: 'statutory_support',
                message: 'Relevant statutory framework identified',
                confidence: 'high'
            });
        }
        
        // Decisis enhancement suggestion
        if (!this.hasDecisAccess) {
            recommendations.push({
                type: 'decisis_enhancement',
                message: 'Consider Decisis Analytics for enhanced judicial insights and case predictions',
                confidence: 'medium',
                action: 'Contact LexisNexis for Decisis subscription'
            });
        }
        
        return recommendations;
    }

    /**
     * Enhanced judicial recommendations with Decisis data
     */

    /**
     * Utility methods
     */
    combineSearchResults(results, sources) {
        const allDocuments = [];
        let totalCount = 0;
        
        results.forEach((result, index) => {
            if (result.success && result.data) {
                const docs = result.data.documents || [];
                docs.forEach(doc => {
                    doc.sourceType = sources[index];
                });
                allDocuments.push(...docs);
                totalCount += result.data.totalCount || 0;
            }
        });
        
        return {
            documents: allDocuments,
            totalCount: totalCount
        };
    }

    getDateMonthsAgo(months) {
        const date = new Date();
        date.setMonth(date.getMonth() - months);
        return date.toISOString().split('T')[0];
    }

    calculateRelevanceScore(results, query) {
        // Simplified relevance scoring
        const queryTerms = query.toLowerCase().split(' ');
        const scores = results.documents.map(doc => {
            const content = (doc.title + ' ' + doc.summary).toLowerCase();
            const matches = queryTerms.filter(term => content.includes(term));
            return matches.length / queryTerms.length;
        });
        
        return scores.length > 0 ? 
            Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) : 0;
    }

    /**
     * Make API request to Lexis (traditional research API)
     */
    async makeRequest(endpoint, method = 'GET', data = null) {
        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Client-ID': this.clientId,
            'User-Agent': 'ESQs-Legal-Research/1.0'
        };

        const config = {
            method: method,
            headers: headers
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            config.body = JSON.stringify(data);
        }

        try {
            // Simulated response for demo - replace with actual Lexis API
            const simulatedResponse = this.generateSimulatedResponse(endpoint, data);
            
            return {
                success: true,
                data: simulatedResponse
            };
            
        } catch (error) {
            console.error('Lexis API Error:', error);
            throw error;
        }
    }

    /**
     * Make API request to Decisis Analytics (requires Enterprise subscription)
     */
    async makeDecisRequest(endpoint, method = 'GET', data = null) {
        if (!this.hasDecisAccess) {
            throw new Error('Decisis API access not available. Enterprise subscription required.');
        }

        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Client-ID': this.clientId,
            'Client-Secret': this.clientSecret,
            'User-Agent': 'ESQs-Decisis-Analytics/1.0'
        };

        const config = {
            method: method,
            headers: headers
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            config.body = JSON.stringify(data);
        }

        try {
            // Simulated Decisis response for demo - replace with actual Decisis API
            const simulatedResponse = this.generateSimulatedDecisResponse(endpoint, data);
            
            return {
                success: true,
                data: simulatedResponse
            };
            
        } catch (error) {
            console.error('Decisis API Error:', error);
            throw error;
        }
    }

    /**
     * Generate simulated Lexis response for demo
     */
    generateSimulatedResponse(endpoint, data) {
        if (endpoint === '/search') {
            return {
                documents: [
                    {
                        id: 'case_001',
                        title: 'Sample Legal Case',
                        court: 'Utah Supreme Court',
                        date: '2024-01-15',
                        citation: '2024 UT 15',
                        summary: 'Legal summary of the case...',
                        relevanceScore: 95
                    }
                ],
                totalCount: 1,
                searchTime: 0.25
            };
        }
        
        return {
            status: 'success',
            message: 'Simulated response'
        };
    }

    /**
     * Generate simulated Decisis response for demo
     */
    generateSimulatedDecisResponse(endpoint, data) {
        if (endpoint.includes('/judges/search')) {
            return {
                judgeId: 'judge_12345',
                caseVolume: 1247,
                averageCaseLength: 8.5,
                reverralRate: 12.3,
                motionGrantRates: {
                    overall: 67.2,
                    summary_judgment: 45.8,
                    dismiss: 23.1,
                    continuance: 89.4
                },
                settledCasePercentage: 72.8,
                sentencingTrends: {
                    averageSentence: '2.3 years',
                    belowGuidelines: 23.1,
                    aboveGuidelines: 8.7
                },
                proceduralPreferences: [
                    'Strict adherence to deadlines',
                    'Prefers written briefs over oral argument',
                    'Values concise presentations'
                ],
                lastUpdated: new Date().toISOString()
            };
        }
        
        if (endpoint === '/cases/predict') {
            return {
                winProbability: 68.4,
                expectedDuration: 14.2,
                settlementLikelihood: 76.3,
                averageSettlementAmount: 125000,
                confidence: 84.7,
                similarCases: 156,
                lastUpdated: new Date().toISOString()
            };
        }
        
        if (endpoint.includes('/motions/analytics')) {
            return {
                overallSuccessRate: 67.2,
                averageDecisionTime: 21.5,
                seasonalTrends: {
                    spring: 71.2,
                    summer: 62.8,
                    fall: 69.1,
                    winter: 65.4
                },
                byJudge: {
                    'Judge Smith': 72.1,
                    'Judge Johnson': 58.3,
                    'Judge Williams': 69.7
                },
                byCourt: {
                    'District Court': 65.2,
                    'Superior Court': 71.8,
                    'Appeals Court': 58.9
                },
                successFactors: [
                    'Thorough legal research cited',
                    'Clear factual basis presented',
                    'Proper procedural compliance'
                ],
                recommendations: [
                    'File early in the week for better outcomes',
                    'Include comprehensive case citations',
                    'Follow court-specific formatting requirements'
                ],
                lastUpdated: new Date().toISOString()
            };
        }
        
        if (endpoint === '/status') {
            return {
                status: 'active',
                subscription: 'enterprise',
                features: ['judicial-analytics', 'case-predictions', 'motion-analytics'],
                lastAccess: new Date().toISOString()
            };
        }
        
        return {
            status: 'success',
            message: 'Simulated Decisis response'
        };
    }

    /**
     * Get connection status (including Decisis availability)
     */
    getStatus() {
        return {
            connected: this.isConnected,
            clientId: this.clientId,
            availableJurisdictions: Object.keys(this.jurisdictions),
            lastConnection: new Date().toISOString(),
            decisAccess: {
                available: this.hasDecisAccess,
                features: this.hasDecisAccess ? Object.keys(this.decisFeatures) : [],
                info: !this.hasDecisAccess ? this.getDecisInfo() : null
            }
        };
    }
}

// Global instance
const lexisResearch = new LexisIntegration();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LexisIntegration;
}
