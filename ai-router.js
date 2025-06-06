/**
 * AI RAID Router - Smart Query Routing System
 * Routes queries to the optimal AI based on content, complexity, and token conservation
 */

class AIRouter {
    constructor() {
        this.tokenLimits = {
            claude: 200000,    // High for complex reasoning
            gemini: 100000,    // Medium for fast processing
            openai: 150000,    // Medium-high for general tasks
            synthesis: 300000  // Highest for multi-AI queries
        };
        
        this.tokenUsage = this.loadTokenUsage();
        this.aiCapabilities = {
            claude: {
                strengths: ['legal reasoning', 'case analysis', 'complex logic', 'strategy'],
                speed: 'medium',
                cost: 'high',
                quality: 'highest'
            },
            gemini: {
                strengths: ['document processing', 'quick summaries', 'google integration', 'fast queries'],
                speed: 'fast',
                cost: 'low',
                quality: 'good'
            },
            openai: {
                strengths: ['document generation', 'creative writing', 'general tasks', 'code'],
                speed: 'medium',
                cost: 'medium',
                quality: 'high'
            }
        };
    }

    /**
     * Route query to optimal AI
     */
    async routeQuery(query, forceAI = null) {
        try {
            // If specific AI is requested
            if (forceAI && forceAI !== 'auto' && forceAI !== 'synthesis') {
                return await this.sendToAI(query, forceAI);
            }

            // If synthesis is requested, use multiple AIs
            if (forceAI === 'synthesis') {
                return await this.synthesizeResponse(query);
            }

            // Auto-route based on query analysis
            const optimalAI = this.analyzeQuery(query);
            return await this.sendToAI(query, optimalAI);

        } catch (error) {
            console.error('Routing error:', error);
            throw new Error(`AI routing failed: ${error.message}`);
        }
    }

    /**
     * Analyze query to determine optimal AI
     */
    analyzeQuery(query) {
        const lowerQuery = query.toLowerCase();
        
        // Legal reasoning keywords -> Claude
        const legalKeywords = [
            'case law', 'precedent', 'analyze', 'strategy', 'motion', 'brief', 
            'argument', 'judge', 'court', 'legal theory', 'constitutional',
            'contract analysis', 'liability', 'damages', 'evidence'
        ];
        
        // Quick processing keywords -> Gemini
        const quickKeywords = [
            'summarize', 'quick', 'overview', 'bullet points', 'list',
            'document review', 'extract', 'key points', 'timeline'
        ];
        
        // Document generation keywords -> OpenAI
        const documentKeywords = [
            'draft', 'write', 'compose', 'letter', 'email', 'template',
            'format', 'style', 'create document', 'generate'
        ];

        // Check for legal complexity
        if (this.hasLegalComplexity(query)) {
            return 'claude';
        }

        // Check for quick processing needs
        if (quickKeywords.some(keyword => lowerQuery.includes(keyword))) {
            return 'gemini';
        }

        // Check for document generation
        if (documentKeywords.some(keyword => lowerQuery.includes(keyword))) {
            return 'openai';
        }

        // Check for legal keywords
        if (legalKeywords.some(keyword => lowerQuery.includes(keyword))) {
            return 'claude';
        }

        // Default based on query length and complexity
        if (query.length > 500 || this.hasComplexSentenceStructure(query)) {
            return 'claude';
        }

        if (query.length < 100) {
            return 'gemini';
        }

        return 'openai'; // Default middle ground
    }

    /**
     * Check for legal complexity indicators
     */
    hasLegalComplexity(query) {
        const complexityIndicators = [
            /\b(analyze|analysis)\b.*\b(case|legal|law)\b/i,
            /\b(motion|brief|pleading)\b/i,
            /\b(judge|court|jurisdiction)\b/i,
            /\b(precedent|case law|statute)\b/i,
            /\b(liability|damages|evidence)\b/i,
            /\b(constitutional|amendment|rights)\b/i,
            /\b(contract|agreement|clause)\b/i
        ];

        return complexityIndicators.some(pattern => pattern.test(query));
    }

    /**
     * Check for complex sentence structure
     */
    hasComplexSentenceStructure(query) {
        const sentences = query.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const avgWordsPerSentence = query.split(/\s+/).length / sentences.length;
        
        return avgWordsPerSentence > 20 || sentences.length > 3;
    }

    /**
     * Send query to specific AI
     */
    async sendToAI(query, aiName) {
        const startTime = Date.now();
        
        try {
            let response;
            
            switch (aiName) {
                case 'claude':
                    response = await this.sendToClaude(query);
                    break;
                case 'gemini':
                    response = await this.sendToGemini(query);
                    break;
                case 'openai':
                    response = await this.sendToOpenAI(query);
                    break;
                default:
                    throw new Error(`Unknown AI: ${aiName}`);
            }

            // Track usage
            const tokensUsed = this.estimateTokens(query + response.content);
            this.updateTokenUsage(aiName, tokensUsed);

            return {
                content: response.content,
                aiUsed: this.capitalize(aiName),
                tokensUsed: tokensUsed,
                responseTime: Date.now() - startTime,
                confidence: response.confidence || 85
            };

        } catch (error) {
            console.error(`${aiName} error:`, error);
            throw new Error(`${aiName} unavailable: ${error.message}`);
        }
    }

    /**
     * Synthesize response from multiple AIs
     */
    async synthesizeResponse(query) {
        const startTime = Date.now();
        
        try {
            // Determine which AIs to use based on query
            const aisToUse = this.selectAIsForSynthesis(query);
            
            // Send to multiple AIs in parallel
            const promises = aisToUse.map(ai => 
                this.sendToAI(query, ai).catch(error => ({
                    error: true,
                    ai: ai,
                    message: error.message
                }))
            );

            const responses = await Promise.all(promises);
            const validResponses = responses.filter(r => !r.error);
            
            if (validResponses.length === 0) {
                throw new Error('All AIs failed to respond');
            }

            // Synthesize the responses
            const synthesized = this.combineResponses(validResponses, query);
            
            return {
                content: synthesized.content,
                aiUsed: 'Multi-AI Synthesis',
                tokensUsed: synthesized.totalTokens,
                responseTime: Date.now() - startTime,
                confidence: synthesized.confidence,
                contributingAIs: validResponses.map(r => r.aiUsed)
            };

        } catch (error) {
            console.error('Synthesis error:', error);
            throw new Error(`Synthesis failed: ${error.message}`);
        }
    }

    /**
     * Select AIs for synthesis based on query type
     */
    selectAIsForSynthesis(query) {
        const lowerQuery = query.toLowerCase();
        
        // For legal analysis: Claude + Gemini for speed
        if (this.hasLegalComplexity(query)) {
            return ['claude', 'gemini'];
        }
        
        // For document generation: OpenAI + Claude for quality
        if (lowerQuery.includes('draft') || lowerQuery.includes('write')) {
            return ['openai', 'claude'];
        }
        
        // For research: All three for comprehensive coverage
        if (lowerQuery.includes('research') || lowerQuery.includes('find')) {
            return ['claude', 'gemini', 'openai'];
        }
        
        // Default: Claude + Gemini for balance of quality and speed
        return ['claude', 'gemini'];
    }

    /**
     * Combine multiple AI responses intelligently
     */
    combineResponses(responses, originalQuery) {
        let combinedContent = `**Multi-AI Analysis:**\n\n`;
        let totalTokens = 0;
        let totalConfidence = 0;

        // Sort responses by confidence
        responses.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

        responses.forEach((response, index) => {
            combinedContent += `**${response.aiUsed} Response:**\n`;
            combinedContent += `${response.content}\n\n`;
            
            if (index < responses.length - 1) {
                combinedContent += `---\n\n`;
            }
            
            totalTokens += response.tokensUsed || 0;
            totalConfidence += response.confidence || 85;
        });

        // Add synthesis summary if multiple responses
        if (responses.length > 1) {
            combinedContent += `**Synthesis Summary:**\n`;
            combinedContent += `This analysis combines insights from ${responses.length} AI systems `;
            combinedContent += `(${responses.map(r => r.aiUsed).join(', ')}) to provide `;
            combinedContent += `comprehensive coverage of your query about: "${originalQuery}"\n\n`;
            combinedContent += `Each AI contributes its unique strengths to ensure accuracy and completeness.`;
        }

        return {
            content: combinedContent,
            totalTokens: totalTokens,
            confidence: Math.round(totalConfidence / responses.length)
        };
    }

    /**
     * Send to Claude API (simulated)
     */
    async sendToClaude(query) {
        // Simulate API call delay
        await this.delay(1000 + Math.random() * 2000);
        
        // Simulate Claude response
        return {
            content: `**Claude Legal Analysis:**\n\nI've analyzed your query regarding: "${query}"\n\nThis requires careful legal consideration of multiple factors including precedent, statutory requirements, and jurisdictional specifics. Based on the complexity of this matter, I recommend a thorough review of relevant case law and consultation with local court rules.\n\n**Key Considerations:**\n- Legal precedent analysis\n- Procedural requirements\n- Strategic implications\n- Risk assessment\n\n*This analysis is provided for informational purposes and should be verified with current legal authorities.*`,
            confidence: 92
        };
    }

    /**
     * Send to Gemini API (simulated)
     */
    async sendToGemini(query) {
        // Simulate API call delay (faster)
        await this.delay(500 + Math.random() * 1000);
        
        // Simulate Gemini response
        return {
            content: `**Gemini Quick Analysis:**\n\n✅ **Query:** ${query}\n\n📋 **Summary:**\nFast processing of your request with key points extracted and organized for immediate review.\n\n🔍 **Key Points:**\n• Relevant legal framework identified\n• Procedural steps outlined\n• Timeline considerations noted\n• Documentation requirements listed\n\n⚡ **Quick Action Items:**\n1. Review applicable statutes\n2. Check local court rules\n3. Prepare required documentation\n4. Consider filing deadlines\n\n*Processed quickly for immediate decision-making support.*`,
            confidence: 88
        };
    }

    /**
     * Send to OpenAI API (simulated)
     */
    async sendToOpenAI(query) {
        // Simulate API call delay
        await this.delay(800 + Math.random() * 1500);
        
        // Simulate OpenAI response
        return {
            content: `**OpenAI Response:**\n\nRegarding your inquiry: "${query}"\n\nI can help you structure this request effectively. Here's a comprehensive approach:\n\n**Structured Analysis:**\n\nThe matter you've presented involves several important considerations that should be addressed systematically. A well-organized response would include:\n\n1. **Initial Assessment:** Review of the fundamental issues\n2. **Research Phase:** Identification of relevant authorities\n3. **Strategy Development:** Formation of approach based on findings\n4. **Implementation:** Execution of planned actions\n\n**Recommended Next Steps:**\n- Gather all relevant documentation\n- Research applicable legal standards\n- Develop timeline for action items\n- Prepare preliminary strategy outline\n\nThis framework provides a solid foundation for addressing your specific needs while ensuring thoroughness and accuracy.`,
            confidence: 85
        };
    }

    /**
     * Utility functions
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    estimateTokens(text) {
        // Rough token estimation (4 characters per token average)
        return Math.ceil(text.length / 4);
    }

    updateTokenUsage(ai, tokens) {
        this.tokenUsage[ai] = (this.tokenUsage[ai] || 0) + tokens;
        this.saveTokenUsage();
    }

    loadTokenUsage() {
        try {
            const saved = localStorage.getItem('ai-raid-tokens');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    }

    saveTokenUsage() {
        localStorage.setItem('ai-raid-tokens', JSON.stringify(this.tokenUsage));
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Get usage statistics
     */
    getUsageStats() {
        return {
            tokenUsage: this.tokenUsage,
            limits: this.tokenLimits,
            percentUsed: Object.keys(this.tokenLimits).reduce((acc, ai) => {
                acc[ai] = Math.round(((this.tokenUsage[ai] || 0) / this.tokenLimits[ai]) * 100);
                return acc;
            }, {})
        };
    }

    /**
     * Reset usage stats
     */
    resetUsage() {
        this.tokenUsage = {};
        this.saveTokenUsage();
    }
}

// Global router instance
const aiRouter = new AIRouter();

// Global function for the UI
async function routeQuery(query, selectedAI) {
    return await aiRouter.routeQuery(query, selectedAI);
}
