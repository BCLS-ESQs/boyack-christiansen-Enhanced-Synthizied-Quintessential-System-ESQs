/**
 * AI Router - REAL API CONNECTIONS
 * Securely connects to Claude, OpenAI, and Gemini APIs
 */

class AIRouter {
    constructor() {
        // 🔒 SECURE - Load from environment variables
        this.apiKeys = {
            claude: this.getEnvVar('CLAUDE_API_KEY'),
            gemini: this.getEnvVar('GEMINI_API_KEY'), 
            openai: this.getEnvVar('OPENAI_API_KEY')
        };
        
        this.apiEndpoints = {
            claude: 'https://api.anthropic.com/v1/messages',
            gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
            openai: 'https://api.openai.com/v1/chat/completions'
        };
        
        this.tokenUsage = this.loadTokenUsage();
        console.log('🔑 API Router initialized with secure keys');
    }

    /**
     * Get environment variable securely
     */
    getEnvVar(name) {
        // Node.js environment
        if (typeof process !== 'undefined' && process.env) {
            return process.env[name];
        }
        
        // Browser environment (development only!)
        if (typeof window !== 'undefined' && window.ENV_VARS) {
            return window.ENV_VARS[name];
        }
        
        console.warn(`⚠️ ${name} not found in environment variables`);
        return null;
    }

    /**
     * 🤖 REAL OpenAI API Connection
     */
    async sendToOpenAI(query) {
        if (!this.apiKeys.openai) {
            throw new Error('OpenAI API key not configured');
        }

        try {
            const response = await fetch(this.apiEndpoints.openai, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKeys.openai}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-4o',  // Latest model
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a legal AI assistant specializing in case analysis, document drafting, and legal research. Provide thorough, professional responses with proper legal context.'
                        },
                        {
                            role: 'user', 
                            content: query
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            return {
                content: `**OpenAI Legal Analysis:**\n\n${data.choices[0].message.content}`,
                confidence: 85,
                tokensUsed: data.usage?.total_tokens || 0
            };

        } catch (error) {
            console.error('OpenAI API Error:', error);
            throw new Error(`OpenAI request failed: ${error.message}`);
        }
    }

    /**
     * 🧠 REAL Claude API Connection  
     */
    async sendToClaude(query) {
        if (!this.apiKeys.claude) {
            throw new Error('Claude API key not configured');
        }

        try {
            const response = await fetch(this.apiEndpoints.claude, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKeys.claude}`,
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-sonnet-20240229',
                    max_tokens: 1000,
                    messages: [
                        {
                            role: 'user',
                            content: `As a legal AI assistant, please analyze this query with detailed legal reasoning: ${query}`
                        }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            return {
                content: `**Claude Legal Analysis:**\n\n${data.content[0].text}`,
                confidence: 92,
                tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens || 0
            };

        } catch (error) {
            console.error('Claude API Error:', error);
            throw new Error(`Claude request failed: ${error.message}`);
        }
    }

    /**
     * ⚡ REAL Gemini API Connection
     */
    async sendToGemini(query) {
        if (!this.apiKeys.gemini) {
            throw new Error('Gemini API key not configured');
        }

        try {
            const response = await fetch(`${this.apiEndpoints.gemini}?key=${this.apiKeys.gemini}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: `As a legal AI assistant, provide quick analysis for: ${query}`
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1000
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            return {
                content: `**Gemini Quick Analysis:**\n\n${data.candidates[0].content.parts[0].text}`,
                confidence: 88,
                tokensUsed: data.usageMetadata?.totalTokenCount || 0
            };

        } catch (error) {
            console.error('Gemini API Error:', error);
            throw new Error(`Gemini request failed: ${error.message}`);
        }
    }

    /**
     * Send query to specific AI with error handling
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
            this.updateTokenUsage(aiName, response.tokensUsed);

            return {
                content: response.content,
                aiUsed: this.capitalize(aiName),
                tokensUsed: response.tokensUsed,
                responseTime: Date.now() - startTime,
                confidence: response.confidence || 85
            };

        } catch (error) {
            console.error(`${aiName} error:`, error);
            
            // Return fallback response instead of crashing
            return {
                content: `⚠️ **${this.capitalize(aiName)} Unavailable**\n\nAPI connection failed: ${error.message}\n\nPlease check your API key configuration.`,
                aiUsed: `${this.capitalize(aiName)} (Error)`,
                tokensUsed: 0,
                responseTime: Date.now() - startTime,
                confidence: 0,
                error: true
            };
        }
    }

    /**
     * Route query with mandatory synthesis
     */
    async routeQuery(query, processingMode = 'normal') {
        try {
            return await this.synthesizeResponse(query, processingMode);
        } catch (error) {
            console.error('Routing error:', error);
            throw new Error(`AI synthesis failed: ${error.message}`);
        }
    }

    /**
     * Synthesize response from multiple AIs
     */
    async synthesizeResponse(query, processingMode = 'normal') {
        const startTime = Date.now();
        
        try {
            const aisToUse = this.selectAIsForMode(query, processingMode);
            
            // Send to multiple AIs in parallel
            const promises = aisToUse.map(ai => this.sendToAI(query, ai));
            const responses = await Promise.all(promises);
            
            // Filter out error responses for synthesis
            const validResponses = responses.filter(r => !r.error);
            
            if (validResponses.length === 0) {
                return {
                    content: `❌ **All AIs Unavailable**\n\nAll API connections failed. Please check:\n• API keys are correctly set\n• Internet connection\n• API quotas/billing`,
                    aiUsed: 'ESQs System Error',
                    tokensUsed: 0,
                    error: true
                };
            }

            // Synthesize available responses
            const synthesized = this.combineResponses(validResponses, query, processingMode);
            
            return {
                content: synthesized.content,
                aiUsed: `${processingMode === 'deep' ? 'Deep Think' : 'Normal'} Synthesis`,
                tokensUsed: synthesized.totalTokens,
                responseTime: Date.now() - startTime,
                confidence: synthesized.confidence,
                contributingAIs: validResponses.map(r => r.aiUsed),
                processingMode: processingMode
            };

        } catch (error) {
            console.error('Synthesis error:', error);
            throw new Error(`Synthesis failed: ${error.message}`);
        }
    }

    /**
     * Select AIs based on processing mode
     */
    selectAIsForMode(query, processingMode) {
        if (processingMode === 'deep') {
            return ['claude', 'gemini', 'openai']; // All AIs for deep think
        } else {
            // Smart selection for normal mode
            if (this.hasLegalComplexity(query)) {
                return ['claude', 'gemini']; // Legal focus
            }
            if (query.toLowerCase().includes('draft') || query.toLowerCase().includes('write')) {
                return ['openai', 'claude']; // Generation focus
            }
            return ['claude', 'gemini']; // Default balanced
        }
    }

    /**
     * Check for legal complexity
     */
    hasLegalComplexity(query) {
        const legalKeywords = [
            'case law', 'precedent', 'motion', 'brief', 'court', 'judge',
            'statute', 'contract', 'liability', 'analysis', 'legal'
        ];
        
        const lowerQuery = query.toLowerCase();
        return legalKeywords.some(keyword => lowerQuery.includes(keyword));
    }

    /**
     * Combine multiple AI responses
     */
    combineResponses(responses, originalQuery, processingMode) {
        let combinedContent = `**${processingMode === 'deep' ? 'Deep Think Analysis' : 'Multi-AI Synthesis'}:**\n\n`;
        let totalTokens = 0;
        let totalConfidence = 0;

        responses.forEach((response, index) => {
            const aiName = response.aiUsed;
            combinedContent += `### ${aiName} Analysis:\n`;
            combinedContent += `${response.content}\n\n`;
            
            totalTokens += response.tokensUsed || 0;
            totalConfidence += response.confidence || 85;
        });
        
        if (processingMode === 'deep') {
            combinedContent += `---\n\n### 🧠 **ESQs Synthesis:**\n`;
            combinedContent += `Comprehensive analysis from ${responses.length} AI systems for: "${originalQuery}"\n\n`;
            combinedContent += `**Confidence Level:** ${Math.round(totalConfidence / responses.length)}%\n`;
            combinedContent += `**Total Tokens:** ${totalTokens}`;
        }

        return {
            content: combinedContent,
            totalTokens: totalTokens,
            confidence: Math.round(totalConfidence / responses.length)
        };
    }

    // Utility methods
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    updateTokenUsage(ai, tokens) {
        this.tokenUsage[ai] = (this.tokenUsage[ai] || 0) + tokens;
        this.saveTokenUsage();
    }

    loadTokenUsage() {
        try {
            const saved = localStorage.getItem('esqs-token-usage');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    }

    saveTokenUsage() {
        localStorage.setItem('esqs-token-usage', JSON.stringify(this.tokenUsage));
    }
}

// 🔒 For browser development ONLY - NEVER commit real keys!
if (typeof window !== 'undefined') {
    // Set your keys here for local testing:
    window.ENV_VARS = {
        // Uncomment and add your keys for local testing:
        // OPENAI_API_KEY: 'sk-proj-your-key-here',
        // CLAUDE_API_KEY: 'sk-ant-api03-your-key-here', 
        // GEMINI_API_KEY: 'AIza-your-key-here'
    };
}

// Global router instance
const aiRouter = new AIRouter();

// Global function for the UI
async function routeQuery(query, processingMode) {
    return await aiRouter.routeQuery(query, processingMode);
}
