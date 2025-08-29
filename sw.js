/**
 * ESQs Service Worker - Progressive Web App Support
 * Enables offline functionality and caching for Enhanced Synthesized Quintessential System
 */

const CACHE_NAME = 'esqs-v1.0.0';
const DYNAMIC_CACHE = 'esqs-dynamic-v1.0.0';

// Core files to cache for offline functionality
const CORE_CACHE_FILES = [
    '/',
    '/index.html',
    '/manifest.json',
    '/esqs-session-manager.js',
    '/mobile-app.js',
    '/ai-router.js',
    '/lexis-integration.js',
    '/dropbox-archive-integration.js',
    '/github-integration.js',
    '/practicepanther-integration.js',
    '/esqs-billing-timer.js'
];

// API endpoints that should be cached dynamically
const CACHEABLE_APIS = [
    '/api/',
    'https://api.openai.com',
    'https://api.anthropic.com',
    'https://generativelanguage.googleapis.com'
];

/**
 * Service Worker Installation
 */
self.addEventListener('install', (event) => {
    console.log('🔧 ESQs Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 ESQs Service Worker: Caching core files...');
                return cache.addAll(CORE_CACHE_FILES.map(url => new Request(url, {credentials: 'same-origin'})));
            })
            .then(() => {
                console.log('✅ ESQs Service Worker: Installation complete');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ ESQs Service Worker: Installation failed:', error);
            })
    );
});

/**
 * Service Worker Activation
 */
self.addEventListener('activate', (event) => {
    console.log('🚀 ESQs Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
                            console.log('🗑️ ESQs Service Worker: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ ESQs Service Worker: Activation complete');
                return self.clients.claim();
            })
    );
});

/**
 * Fetch Event Handler - Network-first with cache fallback
 */
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Handle API requests with network-first strategy
    if (isAPIRequest(url)) {
        event.respondWith(handleAPIRequest(request));
        return;
    }
    
    // Handle core app files with cache-first strategy
    if (isCoreFile(url)) {
        event.respondWith(handleCoreFileRequest(request));
        return;
    }
    
    // Default strategy: network-first with cache fallback
    event.respondWith(handleDefaultRequest(request));
});

/**
 * Handle API requests with network-first strategy
 */
async function handleAPIRequest(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Fallback to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline response for failed API calls
        return new Response(JSON.stringify({
            error: 'ESQs offline mode - API unavailable',
            offline: true,
            timestamp: new Date().toISOString()
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Handle core app files with cache-first strategy
 */
async function handleCoreFileRequest(request) {
    try {
        // Try cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fallback to network
        const networkResponse = await fetch(request);
        
        // Update cache with fresh content
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Return offline page if available
        return caches.match('/index.html');
    }
}

/**
 * Handle default requests with network-first strategy
 */
async function handleDefaultRequest(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Fallback to cache
        const cachedResponse = await caches.match(request);
        return cachedResponse || caches.match('/index.html');
    }
}

/**
 * Check if request is for an API endpoint
 */
function isAPIRequest(url) {
    return CACHEABLE_APIS.some(api => url.href.includes(api));
}

/**
 * Check if request is for a core app file
 */
function isCoreFile(url) {
    return CORE_CACHE_FILES.some(file => url.pathname === file || url.pathname.endsWith(file));
}

/**
 * Handle background sync for offline actions
 */
self.addEventListener('sync', (event) => {
    if (event.tag === 'esqs-sync') {
        console.log('🔄 ESQs Service Worker: Background sync triggered');
        event.waitUntil(syncOfflineActions());
    }
});

/**
 * Sync offline actions when connection is restored
 */
async function syncOfflineActions() {
    try {
        // Get offline actions from IndexedDB or localStorage
        const offlineActions = await getOfflineActions();
        
        for (const action of offlineActions) {
            try {
                await processOfflineAction(action);
                await removeOfflineAction(action.id);
            } catch (error) {
                console.error('Failed to sync offline action:', error);
            }
        }
        
        console.log('✅ ESQs Service Worker: Offline sync complete');
    } catch (error) {
        console.error('❌ ESQs Service Worker: Offline sync failed:', error);
    }
}

/**
 * Handle push notifications for ESQs updates
 */
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        
        const options = {
            body: data.body || 'ESQs update available',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            data: data.data || {},
            actions: [
                {
                    action: 'open',
                    title: 'Open ESQs'
                },
                {
                    action: 'dismiss',
                    title: 'Dismiss'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title || 'ESQs Notification', options)
        );
    }
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

/**
 * Utility functions for offline action management
 */
async function getOfflineActions() {
    // Placeholder - implement with IndexedDB
    return [];
}

async function processOfflineAction(action) {
    // Placeholder - implement action processing
    console.log('Processing offline action:', action);
}

async function removeOfflineAction(actionId) {
    // Placeholder - implement action removal
    console.log('Removing offline action:', actionId);
}

console.log('🌐 ESQs Service Worker: Loaded and ready');