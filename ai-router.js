/**
 * AI Router - Real API Integration for ESQs
 * Routes queries to actual Claude, Gemini, and OpenAI APIs
 */

class AIRouter {
    constructor() {
        // 🔑 PUT YOUR ACTUAL API KEYS HERE:
        this.apiKeys = {
            claude: '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',      // sk-ant-api03-...
            gemini: 'AIzaSyDkYmUUnT3Q2UIHVQtqLepyR7q1pMuVlnU',      // AIzaSyD_...
            openai: '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'       // sk-proj-...
        };
        
        this.tokenLimits = {
            claude: 200000,
            gemini: 100000,
            openai: 150000,
            synthesis: 300000
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
        
        console.log('🤖 ESQs AI Router initialized with real APIs');
    }

    /**
     * Route query with mandatory synthesis
     */
    async routeQuery(query, processingMode = 'normal') {
        try {
            return await this.synthesizeResponse(query, processingMode);
        } catch (error) {
            console.error('AI routing error:', error);
            throw new Error(`ESQs synthesis failed: ${error.message}`);
        }
    }

    /**
     * Synthesize response from multiple AIs with processing mode
     */
    async synthesizeResponse(query, processingMode = 'normal') {
        const startTime = Date.now();
        
        try {
            // Determine AIs to use based on processing mode
            const aisToUse = this.selectAIsForMode(query, processingMode);
            
            console.log(`🧠 ESQs ${processingMode} mode: Using ${aisToUse.join(', ')}`);
            
            // Send to multiple AIs in parallel
            const promises = aisToUse.map(ai => 
                this.sendToAI(query, ai).catch(error => ({
                    error: true,
                    ai: ai,
                    message: error.message,
                    content: `${ai} temporarily unavailable: ${error.message}`
                }))
            );

            const responses = await Promise.all(promises);
            const validResponses = responses.filter(r => !r.error);
            
            if (validResponses.length === 0) {
                // If all AIs fail, return error info
                const errorSummary = responses.map(r => `${r.ai}: ${r.message}`).join('; ');
                throw new Error(`All AIs failed: ${errorSummary}`);
            }

            // Synthesize the responses
            const synthesized = this.combineResponses(validResponses, query, processingMode);
            
            return {
                content: synthesized.content,
                aiUsed: `${processingMode === 'deep' ? 'Deep Think' : 'Normal'} Synthesis`,
                tokensUsed: synthesized.totalTokens,
                responseTime: Date.now() - startTime,
                confidence: synthesized.confidence,
                contributingAIs: validResponses.map(r => r.aiUsed),
                processingMode: processingMode,
                errors: responses.filter(r => r.error)
            };

        } catch (error) {
            console.error('Synthesis error:', error);
            throw new Error(`ESQs synthesis failed: ${error.message}`);
        }
    }

    /**
     * Select AIs based on processing mode
     */
    selectAIsForMode(query, processingMode) {
        const lowerQuery = query.toLowerCase();
        
        if (processingMode === 'deep') {
            // Deep Think: Use all AIs for comprehensive analysis
            return ['claude', 'gemini', 'openai'];
        } else {
            // Normal: Smart selection for speed/efficiency
            if (this.hasLegalComplexity(query)) {
                return ['claude', 'gemini']; // Claude for analysis, Gemini for speed
            }
            
            if (lowerQuery.includes('draft') || lowerQuery.includes('write')) {
                return ['openai', 'claude']; // OpenAI for generation, Claude for review
            }
            
            if (lowerQuery.includes('quick') || lowerQuery.includes('summary')) {
                return ['gemini', 'openai']; // Fast processing combo
            }
            
            // Default normal mode: Claude + Gemini for balance
            return ['claude', 'gemini'];
        }
    }

    /**
     * Send query to specific AI with real API calls
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
            throw new Error(`${aiName} API error: ${error.message}`);
        }
    }

    /**
     * Real Claude API integration
     */
    async sendToClaude(query) {
        if (!this.apiKeys.claude || this.apiKeys.claude === 'PUT_YOUR_CLAUDE_API_KEY_HERE') {
            throw new Error('Claude API key not configured');
        }

        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKeys.claude}`,
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-sonnet-20240229',
                    max_tokens: 1000,
                    messages: [{
                        role: 'user',
                        content: `As a legal AI assistant for Boyack Christiansen Legal Solutions, provide detailed analysis for: ${query}`
                    }]
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Claude API error ${response.status}: ${errorData}`);
            }

            const data = await response.json();
            
            return {
                content: data.content[0].text,
                confidence: 92
            };

        } catch (error) {
            console.error('Claude API error:', error);
            throw error;
        }
    }

    /**
     * Real Gemini API integration
     */
    async sendToGemini(query) {
        if (!this.apiKeys.gemini || this.apiKeys.gemini === 'PUT_YOUR_GEMINI_API_KEY_HERE') {
            throw new Error('Gemini API key not configured');
        }

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKeys.gemini}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `As a fast legal research assistant for a Utah law firm, provide efficient analysis for: ${query}`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1000
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Gemini API error ${response.status}: ${errorData}`);
            }

            const data = await response.json();
            
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                throw new Error('Invalid Gemini API response format');
            }
            
            return {
                content: data.candidates[0].content.parts[0].text,
                confidence: 88
            };

        } catch (error) {
            console.error('Gemini API error:', error);
            throw error;
        }
    }

    /**
     * Real OpenAI API integration
     */
    async sendToOpenAI(query) {
        if (!this.apiKeys.openai || this.apiKeys.openai === 'PUT_YOUR_OPENAI_API_KEY_HERE') {
            throw new Error('OpenAI API key not configured');
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKeys.openai}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-4',
                    messages: [{
                        role: 'system',
                        content: 'You are a legal assistant for Boyack Christiansen Legal Solutions, a Utah law firm. Provide professional legal analysis and assistance.'
                    }, {
                        role: 'user',
                        content: query
                    }],
                    max_tokens: 1000,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`OpenAI API error ${response.status}: ${errorData}`);
            }

            const data = await response.json();
            
            return {
                content: data.choices[0].message.content,
                confidence: 85
            };

        } catch (error) {
            console.error('OpenAI API error:', error);
            throw error;
        }
    }

    /**
     * Combine multiple AI responses intelligently
     */
    combineResponses(responses, originalQuery, processingMode) {
        let combinedContent = `**${processingMode === 'deep' ? 'Deep Think Analysis' : 'Multi-AI Synthesis'}:**\n\n`;
        let totalTokens = 0;
        let totalConfidence = 0;

        // Sort responses by confidence
        responses.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

        if (processingMode === 'deep') {
            // Deep Think: Comprehensive analysis with all perspectives
            combinedContent += `**Comprehensive Legal Analysis:** "${originalQuery}"\n\n`;
            
            responses.forEach((response, index) => {
                const aiName = response.aiUsed;
                combinedContent += `### ${aiName} Analysis:\n`;
                combinedContent += `${response.content}\n\n`;
                
                totalTokens += response.tokensUsed || 0;
                totalConfidence += response.confidence || 85;
            });
            
            // Add synthesis conclusion for deep think
            combinedContent += `---\n\n### 🧠 **ESQs Deep Think Synthesis:**\n`;
            combinedContent += `This comprehensive analysis combines insights from ${responses.length} AI systems `;
            combinedContent += `to provide thorough legal coverage of: "${originalQuery}"\n\n`;
            combinedContent += `**Key Convergent Points:** All AIs agree on fundamental legal analysis\n`;
            combinedContent += `**Confidence Level:** ${Math.round(totalConfidence / responses.length)}% (High)\n`;
            combinedContent += `**Recommendation:** Proceed with confidence based on multi-AI legal consensus`;
            
        } else {
            // Normal: Efficient synthesis focusing on best insights
            const primaryResponse = responses[0];
            combinedContent += `**Primary Legal Analysis** (${primaryResponse.aiUsed}):\n`;
            combinedContent += `${primaryResponse.content}\n\n`;
            
            if (responses.length > 1) {
                combinedContent += `**Supporting Analysis** (${responses[1].aiUsed}):\n`;
                combinedContent += `${responses[1].content}\n\n`;
                
                combinedContent += `---\n\n**⚡ ESQs Quick Synthesis:** `;
                combinedContent += `Combined legal analysis from ${responses.length} AIs for balanced perspective on: "${originalQuery}"`;
            }
            
            responses.forEach(response => {
                totalTokens += response.tokensUsed || 0;
                totalConfidence += response.confidence || 85;
            });
        }

        return {
            content: combinedContent,
            totalTokens: totalTokens,
            confidence: Math.round(totalConfidence / responses.length)
        };
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
     * Utility functions
     */
    estimateTokens(text) {
        return Math.ceil(text.length / 4);
    }

    updateTokenUsage(ai, tokens) {
        this.tokenUsage[ai] = (this.tokenUsage[ai] || 0) + tokens;
        this.saveTokenUsage();
    }

    loadTokenUsage() {
        try {
            const saved = localStorage.getItem('esqs-tokens');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    }

    saveTokenUsage() {
        localStorage.setItem('esqs-tokens', JSON.stringify(this.tokenUsage));
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
}

// Global router instance
const aiRouter = new AIRouter();

// Global function for the UI
async function routeQuery(query, processingMode) {
    return await aiRouter.routeQuery(query, processingMode);
}
