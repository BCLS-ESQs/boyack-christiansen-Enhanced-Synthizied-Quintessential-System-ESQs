/**
 * Mobile App Features & PWA Functionality
 * Handles offline capabilities, push notifications, and mobile-specific features
 */

class MobileApp {
    constructor() {
        this.isOnline = navigator.onLine;
        this.offlineQueue = [];
        this.notificationPermission = 'default';
        this.installPrompt = null;
        
        this.initializeApp();
    }

    /**
     * Initialize mobile app features
     */
    initializeApp() {
        this.registerServiceWorker();
        this.setupOfflineHandling();
        this.setupNotifications();
        this.setupInstallPrompt();
        this.setupMobileOptimizations();
        this.loadOfflineData();
    }

    /**
     * Register service worker for offline functionality
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration);
                
                // Listen for updates
                registration.addEventListener('updatefound', () => {
                    this.showUpdateAvailable();
                });
                
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }

    /**
     * Setup offline handling
     */
    setupOfflineHandling() {
        // Online/offline event listeners
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showConnectionStatus('online');
            this.processOfflineQueue();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showConnectionStatus('offline');
        });

        // Initial status
        this.showConnectionStatus(this.isOnline ? 'online' : 'offline');
    }

    /**
     * Show connection status
     */
    showConnectionStatus(status) {
        const existingStatus = document.querySelector('.connection-status');
        if (existingStatus) {
            existingStatus.remove();
        }

        if (status === 'offline') {
            const statusBar = document.createElement('div');
            statusBar.className = 'connection-status';
            statusBar.innerHTML = `
                <div style="background: #ff6b35; color: white; padding: 8px 15px; text-align: center; font-size: 14px; position: fixed; top: 0; left: 0; right: 0; z-index: 1000;">
                    📱 Offline Mode - Queries will be saved and sent when connection returns
                </div>
            `;
            document.body.insertBefore(statusBar, document.body.firstChild);
            
            // Adjust body padding
            document.body.style.paddingTop = '40px';
        } else {
            document.body.style.paddingTop = '0';
            this.showToast('🌐 Back online! Processing queued requests...', 'success');
        }
    }

    /**
     * Queue request for offline processing
     */
    queueOfflineRequest(query, selectedAI) {
        const request = {
            id: Date.now(),
            query: query,
            selectedAI: selectedAI,
            timestamp: new Date().toISOString(),
            status: 'queued'
        };

        this.offlineQueue.push(request);
        this.saveOfflineQueue();
        
        this.showToast('📱 Query saved for when connection returns', 'info');
        
        return {
            content: `**Offline Mode**\n\nYour query has been saved and will be processed when internet connection is restored.\n\n**Query:** ${query}\n**Selected AI:** ${selectedAI}\n**Queued at:** ${new Date().toLocaleString()}\n\nThe AI RAID system will automatically process this request once you're back online.`,
            aiUsed: 'Offline Queue',
            tokensUsed: 0,
            responseTime: 0,
            confidence: 100
        };
    }

    /**
     * Process offline queue when back online
     */
    async processOfflineQueue() {
        if (this.offlineQueue.length === 0) return;

        this.showToast(`📱 Processing ${this.offlineQueue.length} queued requests...`, 'info');

        for (const request of this.offlineQueue) {
            try {
                // Process the queued request
                const response = await aiRouter.routeQuery(request.query, request.selectedAI);
                
                // Show notification if supported
                this.showNotification('Query Processed', {
                    body: `Your offline query has been processed: "${request.query.substring(0, 50)}..."`,
                    badge: '/favicon.png'
                });

                // Remove from queue
                this.offlineQueue = this.offlineQueue.filter(q => q.id !== request.id);
                
            } catch (error) {
                console.error('Failed to process offline request:', error);
                request.status = 'failed';
            }
        }

        this.saveOfflineQueue();
        
        if (this.offlineQueue.length === 0) {
            this.showToast('✅ All offline queries processed!', 'success');
        }
    }

    /**
     * Setup push notifications
     */
    async setupNotifications() {
        if ('Notification' in window) {
            this.notificationPermission = Notification.permission;
            
            if (this.notificationPermission === 'default') {
                // Show permission request after user interaction
                setTimeout(() => {
                    this.requestNotificationPermission();
                }, 5000);
            }
        }
    }

    /**
     * Request notification permission
     */
    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            this.notificationPermission = permission;
            
            if (permission === 'granted') {
                this.showToast('🔔 Notifications enabled!', 'success');
                this.scheduleWelcomeNotification();
            }
        }
    }

    /**
     * Show notification
     */
    showNotification(title, options = {}) {
        if (this.notificationPermission === 'granted' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, {
                    icon: '/favicon.png',
                    badge: '/favicon.png',
                    vibrate: [100, 50, 100],
                    ...options
                });
            });
        }
    }

    /**
     * Schedule welcome notification
     */
    scheduleWelcomeNotification() {
        setTimeout(() => {
            this.showNotification('AI RAID Ready', {
                body: 'Your legal AI assistance system is ready to help!',
                actions: [
                    { action: 'open', title: 'Open App' }
                ]
            });
        }, 2000);
    }

    /**
     * Setup install prompt
     */
    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.installPrompt = e;
            this.showInstallPrompt();
        });

        // Handle install completion
        window.addEventListener('appinstalled', () => {
            this.hideInstallPrompt();
            this.showToast('📱 AI RAID installed successfully!', 'success');
        });
    }

    /**
     * Show install prompt
     */
    showInstallPrompt() {
        const prompt = document.getElementById('install-prompt');
        if (prompt) {
            prompt.classList.add('show');
            prompt.onclick = () => this.triggerInstall();
        }
    }

    /**
     * Hide install prompt
     */
    hideInstallPrompt() {
        const prompt = document.getElementById('install-prompt');
        if (prompt) {
            prompt.classList.remove('show');
        }
    }

    /**
     * Trigger PWA install
     */
    async triggerInstall() {
        if (this.installPrompt) {
            this.installPrompt.prompt();
            
            const { outcome } = await this.installPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('User accepted install');
            } else {
                console.log('User dismissed install');
            }
            
            this.installPrompt = null;
            this.hideInstallPrompt();
        }
    }

    /**
     * Setup mobile-specific optimizations
     */
    setupMobileOptimizations() {
        // Prevent zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (event) => {
            const now = new Date().getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // Handle viewport changes (keyboard open/close)
        let viewportHeight = window.innerHeight;
        window.addEventListener('resize', () => {
            const currentHeight = window.innerHeight;
            const diff = viewportHeight - currentHeight;
            
            // Keyboard likely opened
            if (diff > 150) {
                document.body.classList.add('keyboard-open');
            } else {
                document.body.classList.remove('keyboard-open');
            }
        });

        // Haptic feedback for buttons (if supported)
        if ('vibrate' in navigator) {
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('send-button') || 
                    e.target.classList.contains('quick-action')) {
                    navigator.vibrate(50);
                }
            });
        }

        // Handle safe area insets for notched devices
        this.handleSafeAreaInsets();
    }

    /**
     * Handle safe area insets for devices with notches
     */
    handleSafeAreaInsets() {
        const style = document.createElement('style');
        style.textContent = `
            .keyboard-open .main-interface {
                padding-bottom: 20px;
            }
            
            @media (max-height: 600px) {
                .quick-actions {
                    display: none;
                }
                .response-area {
                    max-height: 200px;
                    overflow-y: auto;
                }
            }
            
            @supports (padding: max(0px)) {
                body {
                    padding-left: max(20px, env(safe-area-inset-left));
                    padding-right: max(20px, env(safe-area-inset-right));
                    padding-bottom: max(20px, env(safe-area-inset-bottom));
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Save offline queue to storage
     */
    saveOfflineQueue() {
        try {
            localStorage.setItem('ai-raid-offline-queue', JSON.stringify(this.offlineQueue));
        } catch (error) {
            console.error('Failed to save offline queue:', error);
        }
    }

    /**
     * Load offline queue from storage
     */
    loadOfflineData() {
        try {
            const saved = localStorage.getItem('ai-raid-offline-queue');
            if (saved) {
                this.offlineQueue = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load offline data:', error);
            this.offlineQueue = [];
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = message;
        
        const style = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3'};
            color: white;
            padding: 12px 20px;
            border-radius: 25px;
            font-size: 14px;
            z-index: 1001;
            animation: slideUpToast 0.3s ease-out;
            max-width: 90vw;
            text-align: center;
        `;
        
        toast.setAttribute('style', style);
        
        // Add animation CSS if not already added
        if (!document.querySelector('#toast-animations')) {
            const animationStyle = document.createElement('style');
            animationStyle.id = 'toast-animations';
            animationStyle.textContent = `
                @keyframes slideUpToast {
                    from {
                        transform: translateX(-50%) translateY(100px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(-50%) translateY(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(animationStyle);
        }
        
        document.body.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideUpToast 0.3s ease-out reverse';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }
        }, 3000);
    }

    /**
     * Show update available notification
     */
    showUpdateAvailable() {
        const updateBar = document.createElement('div');
        updateBar.innerHTML = `
            <div style="background: #4CAF50; color: white; padding: 10px 15px; text-align: center; cursor: pointer; position: fixed; bottom: 0; left: 0; right: 0; z-index: 1000;">
                🔄 New version available! Tap to update
            </div>
        `;
        
        updateBar.onclick = () => {
            window.location.reload();
        };
        
        document.body.appendChild(updateBar);
    }

    /**
     * Get offline queue status
     */
    getOfflineStatus() {
        return {
            isOnline: this.isOnline,
            queuedRequests: this.offlineQueue.length,
            notificationsEnabled: this.notificationPermission === 'granted',
            isInstalled: window.matchMedia('(display-mode: standalone)').matches
        };
    }

    /**
     * Clear offline data
     */
    clearOfflineData() {
        this.offlineQueue = [];
        this.saveOfflineQueue();
        localStorage.removeItem('ai-raid-history');
        this.showToast('📱 Offline data cleared', 'success');
    }
}

// Global mobile app instance
const mobileApp = new MobileApp();

// Extend the global routeQuery to handle offline
const originalRouteQuery = window.routeQuery;
window.routeQuery = async function(query, selectedAI) {
    if (!mobileApp.isOnline) {
        return mobileApp.queueOfflineRequest(query, selectedAI);
    }
    
    try {
        return await originalRouteQuery(query, selectedAI);
    } catch (error) {
        // If online but AI fails, queue for later
        if (error.message.includes('unavailable')) {
            return mobileApp.queueOfflineRequest(query, selectedAI);
        }
        throw error;
    }
};

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileApp;
}
