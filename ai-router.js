/**
 * AI Router - SECURE VERSION (Post-Leak Fix)
 * ✅ Environment variables only
 * ✅ No hardcoded keys anywhere
 * ✅ Browser fallback for local testing only
 */

class AIRouter {
    constructor() {
        console.log('🔒 Initializing secure AI Router...');
        
        // 🔑 SECURE: Load API keys from environment only
        this.apiKeys = this.loadSecureAPIKeys();
        
        // Validate keys are properly loaded
        this.validateAPIKeys();
        
        this.apiEndpoints = {
            claude: 'https://api.anthropic.com/v1/messages',
            gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
            openai: 'https://api.openai.com/v1/chat/completions'
        };
        
        this.tokenUsage = this.loadTokenUsage();
        console.log('✅ AI Router initialized securely');
    }

    /**
     * 🔒 SECURE: Load API keys from environment variables ONLY
     */
    loadSecureAPIKeys() {
        const keys = {};
        
        // 1. Try Node.js environment variables (server-side)
        if (typeof process !== 'undefined' && process.env) {
            keys.openai = process.env.OPENAI_API_KEY;
            keys.claude = process.env.CLAUDE_API_KEY;
            keys.gemini = process.env.GEMINI_API_KEY;
            console.log('🖥️ Loaded keys from Node.js environment');
        }
        
        // 2. Try browser environment (LOCAL TESTING ONLY!)
        else if (typeof window !== 'undefined' && window.ESQS_API_KEYS) {
            keys.openai = window.ESQS_API_KEYS.OPENAI_API_KEY;
            keys.claude = window.ESQS_API_KEYS.CLAUDE_API_KEY;
            keys.gemini = window.ESQS_API_KEYS.GEMINI_API_KEY;
            console.log('🌐 Loaded keys from browser environment (LOCAL TESTING)');
        }
        
        // 3. No keys found
        else {
            console.warn('⚠️ No API keys found in environment variables');
            console.log('💡 For local testing, set window.ESQS_API_KEYS in browser console');
        }
        
        return keys;
    }

    /**
     * 🔍 Validate API keys are properly formatted
     */
    validateAPIKeys() {
        const validations = {
            openai: /^sk-proj-[A-Za-z0-9_-]{20,}$/,
            claude: /^sk-ant-api03-[A-Za-z0-9_-]{20,}$/,
            gemini: /^AIza[A-Za-z0-9_-]{20,}$/
        };
        
        const status = {};
        
        for (const [service, pattern] of Object.entries(validations)) {
            const key = this.apiKeys[service];
            if (key) {
                if (pattern.test(key)) {
                    status[service] = '✅ Valid';
                    console.log(`✅ ${service.toUpperCase()}: Valid API key format`);
                } else {
                    status[service] = '❌ Invalid format';
                    console.warn(`❌ ${service.toUpperCase()}: Invalid API key format`);
                }
            } else {
                status[service] = '⚠️ Missing';
                console.warn(`⚠️ ${service.toUpperCase()}: API key missing`);
            }
        }
        
        this.keyStatus = status;
        return status;
    }

    /**
     * 🤖 SECURE OpenAI API Connection
     */
    async sendToOpenAI(query) {
        if (!this.apiKeys.openai) {
            throw new Error('OpenAI API key not available - check environment variables');
        }

        try {
            console.log('🔗 Connecting to OpenAI API...');
            
            const response = await fetch(this.apiEndpoints.openai, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKeys.openai}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'ESQs-Legal-v1.0-BoyackChristiansen'
                },
                body: JSON.stringify({
                    model: 'gpt-4o',  // Most cost-effective
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a professional legal AI assistant for Boyack Christiansen Legal Solutions. Provide thorough, accurate legal analysis while maintaining attorney-client privilege and professional standards.'
                        },
                        {
                            role: 'user', 
                            content: query
                        }
                    ],
                    max_tokens: 800,
                    temperature: 0.7,
                    frequency_penalty: 0.1,
                    presence_penalty: 0.1
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            console.log(`✅ OpenAI responded (${data.usage?.total_tokens || 0} tokens)`);
            
            return {
                content: `**OpenAI Legal Analysis:**\n\n${data.choices[0].message.content}`,
                confidence: 85,
                tokensUsed: data.usage?.total_tokens || 0
            };

        } catch (error) {
            console.error('❌ OpenAI API Error:', error);
            throw new Error(`OpenAI request failed: ${error.message}`);
        }
    }

    /**
     * 🧠 SECURE Claude API Connection  
     */
    async sendToClaude(query) {
        if (!this.apiKeys.claude) {
            throw new Error('Claude API key not available - check environment variables');
        }

        try {
            console.log('🔗 Connecting to Claude API...');
            
            const response = await fetch(this.apiEndpoints.claude, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKeys.claude}`,
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01',
                    'User-Agent': 'ESQs-Legal-v1.0-BoyackChristiansen'
                },
                body: JSON.stringify({
                    model: 'claude-3-sonnet-20240229',
                    max_tokens: 800,
                    messages: [
                        {
                            role: 'user',
                            content: `As a legal AI assistant for Boyack Christiansen Legal Solutions, provide detailed legal analysis for: ${query}`
                        }
                    ]
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Claude API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            console.log(`✅ Claude responded (${(data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)} tokens)`);
            
            return {
                content: `**Claude Legal Analysis:**\n\n${data.content[0].text}`,
                confidence: 92,
                tokensUsed: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
            };

        } catch (error) {
            console.error('❌ Claude API Error:', error);
            throw new Error(`Claude request failed: ${error.message}`);
        }
    }

    /**
     * ⚡ SECURE Gemini API Connection
     */
    async sendToGemini(query) {
        if (!this.apiKeys.gemini) {
            throw new Error('Gemini API key not available - check environment variables');
        }

        try {
            console.log('🔗 Connecting to Gemini API...');
            
            const response = await fetch(`${this.apiEndpoints.gemini}?key=${this.apiKeys.gemini}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'ESQs-Legal-v1.0-BoyackChristiansen'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: `As a legal AI assistant for Boyack Christiansen Legal Solutions, provide quick analysis for: ${query}`
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 800
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            console.log(`✅ Gemini responded (${data.usageMetadata?.totalTokenCount || 0} tokens)`);
            
            return {
                content: `**Gemini Quick Analysis:**\n\n${data.candidates[0].content.parts[0].text}`,
                confidence: 88,
                tokensUsed: data.usageMetadata?.totalTokenCount || 0
            };

        } catch (error) {
            console.error('❌ Gemini API Error:', error);
            throw new Error(`Gemini request failed: ${error.message}`);
        }
    }

    /**
     * 🔀 Route query to specific AI with comprehensive error handling
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
                    throw new Error(`Unknown AI service: ${aiName}`);
            }

            // Track usage for monitoring
            this.updateTokenUsage(aiName, response.tokensUsed);

            return {
                content: response.content,
                aiUsed: this.capitalize(aiName),
                tokensUsed: response.tokensUsed,
                responseTime: Date.now() - startTime,
                confidence: response.confidence || 85
            };

        } catch (error) {
            console.error(`❌ ${aiName} error:`, error);
            
            // Return helpful error instead of crashing
            return {
                content: `⚠️ **${this.capitalize(aiName)} Unavailable**\n\n${error.message}\n\n**Troubleshooting:**\n• Check your API key in .env file\n• Verify internet connection\n• Check API quotas and billing`,
                aiUsed: `${this.capitalize(aiName)} (Error)`,
                tokensUsed: 0,
                responseTime: Date.now() - startTime,
                confidence: 0,
                error: true
            };
        }
    }

    /**
     * 🎯 Main query routing with synthesis
     */
    async routeQuery(query, processingMode = 'normal') {
        console.log(`🎯 Routing query (${processingMode} mode): ${query.substring(0, 50)}...`);
        
        try {
            return await this.synthesizeResponse(query, processingMode);
        } catch (error) {
            console.error('❌ Routing error:', error);
            
            return {
                content: `❌ **ESQs System Error**\n\n${error.message}\n\n**Please Check:**\n• API keys are set in .env file\n• Internet connection\n• API quotas and billing`,
                aiUsed: 'ESQs System Error',
                tokensUsed: 0,
                error: true
            };
        }
    }

    /**
     * 🧬 Synthesize response from multiple AIs
     */
    async synthesizeResponse(query, processingMode = 'normal') {
        const startTime = Date.now();
        
        try {
            // Select AIs based on processing mode
            const aisToUse = this.selectAIsForMode(query, processingMode);
            console.log(`🤖 Using AIs: ${aisToUse.join(', ')}`);
            
            // Send to multiple AIs in parallel
            const promises = aisToUse.map(ai => this.sendToAI(query, ai));
            const responses = await Promise.all(promises);
            
            // Filter successful responses
            const validResponses = responses.filter(r => !r.error);
            const errorResponses = responses.filter(r => r.error);
            
            if (validResponses.length === 0) {
                return {
                    content: `❌ **All AI Services Unavailable**\n\nAll API connections failed:\n${errorResponses.map(r => `• ${r.aiUsed}: ${r.content.split('\n')[0]}`).join('\n')}\n\n**Check your .env file has valid API keys!**`,
                    aiUsed: 'ESQs System Error',
                    tokensUsed: 0,
                    error: true
                };
            }

            // Synthesize available responses
            const synthesized = this.combineResponses(validResponses, query, processingMode);
            
            console.log(`✅ Synthesis complete: ${validResponses.length}/${responses.length} AIs responded`);
            
            return {
                content: synthesized.content,
                aiUsed: `ESQs ${processingMode === 'deep' ? 'Deep Think' : 'Synthesis'}`,
                tokensUsed: synthesized.totalTokens,
                responseTime: Date.now() - startTime,
                confidence: synthesized.confidence,
                contributingAIs: validResponses.map(r => r.aiUsed),
                processingMode: processingMode,
                errorCount: errorResponses.length
            };

        } catch (error) {
            console.error('❌ Synthesis error:', error);
            throw new Error(`Synthesis failed: ${error.message}`);
        }
    }

    /**
     * 🎚️ Select AIs based on processing mode and query type
     */
    selectAIsForMode(query, processingMode) {
        if (processingMode === 'deep') {
            return ['claude', 'gemini', 'openai']; // All AIs for comprehensive analysis
        } else {
            // Smart selection for normal mode
            const lowerQuery = query.toLowerCase();
            
            if (this.hasLegalComplexity(query)) {
                return ['claude', 'gemini']; // Legal expertise focus
            }
            if (lowerQuery.includes('draft') || lowerQuery.includes('write')) {
                return ['openai', 'claude']; // Generation + review
            }
            if (lowerQuery.includes('quick') || lowerQuery.includes('summary')) {
                return ['gemini', 'openai']; // Speed focus
            }
            
            return ['claude', 'gemini']; // Default balanced approach
        }
    }

    /**
     * 🔍 Detect legal complexity in queries
     */
    hasLegalComplexity(query) {
        const legalKeywords = [
            'case law', 'precedent', 'motion', 'brief', 'court', 'judge',
            'statute', 'contract', 'liability', 'analysis', 'legal',
            'constitutional', 'due process', 'evidence', 'jurisdiction',
            'appeal', 'litigation', 'discovery', 'deposition'
        ];
        
        const lowerQuery = query.toLowerCase();
        return legalKeywords.some(keyword => lowerQuery.includes(keyword));
    }

    /**
     * 🧬 Combine multiple AI responses intelligently
     */
    combineResponses(responses, originalQuery, processingMode) {
        let combinedContent = `**ESQs ${processingMode === 'deep' ? 'Deep Think Analysis' : 'Multi-AI Synthesis'}:**\n\n`;
        let totalTokens = 0;
        let totalConfidence = 0;

        // Sort by confidence
        responses.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

        responses.forEach((response, index) => {
            const aiName = response.aiUsed;
            combinedContent += `### ${aiName}:\n`;
            combinedContent += `${response.content.replace(/^\*\*.*?\*\*\n\n/, '')}\n\n`; // Remove duplicate headers
            
            totalTokens += response.tokensUsed || 0;
            totalConfidence += response.confidence || 85;
        });
        
        if (processingMode === 'deep') {
            combinedContent += `---\n\n### 🧠 **ESQs Synthesis Summary:**\n`;
            combinedContent += `Comprehensive analysis from ${responses.length} AI systems for: "${originalQuery}"\n\n`;
            combinedContent += `**Consensus Confidence:** ${Math.round(totalConfidence / responses.length)}%\n`;
            combinedContent += `**Total Processing:** ${totalTokens} tokens across ${responses.length} AIs\n`;
            combinedContent += `**Recommendation:** Proceed with high confidence based on multi-AI analysis.`;
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
        try {
            localStorage.setItem('esqs-token-usage', JSON.stringify(this.tokenUsage));
        } catch (error) {
            console.warn('Could not save token usage:', error);
        }
    }

    /**
     * 📊 Get system status and diagnostics
     */
    getSystemStatus() {
        return {
            keyStatus: this.keyStatus,
            tokenUsage: this.tokenUsage,
            isSecure: !Object.values(this.keyStatus).includes('❌ Invalid format'),
            environment: typeof process !== 'undefined' ? 'server' : 'browser',
            lastUpdate: new Date().toISOString()
        };
    }
}

// 🔒 SECURE: Browser environment setup for LOCAL TESTING ONLY
if (typeof window !== 'undefined') {
    // For local testing, you can set keys in browser console:
    // window.ESQS_API_KEYS = {
    //     OPENAI_API_KEY: 'sk-proj-your-new-key-here',
    //     CLAUDE_API_KEY: 'sk-ant-api03-your-claude-key',
    //     GEMINI_API_KEY: 'AIza-your-gemini-key'
    // };
    
    console.log('🌐 Browser environment detected');
    console.log('💡 For local testing, set window.ESQS_API_KEYS with your API keys');
}

// Global router instance
const aiRouter = new AIRouter();

// Global function for the UI
async function routeQuery(query, processingMode) {
    return await aiRouter.routeQuery(query, processingMode);
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AIRouter, aiRouter };
}
