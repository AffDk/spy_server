// Service Worker for background connection maintenance
console.log('Service Worker: Starting...');

const CACHE_NAME = 'spy-game-v1';
const BACKGROUND_SYNC_TAG = 'background-connection-sync';

// Install service worker
self.addEventListener('install', (event) => {
    console.log('Service Worker: Install Event');
    self.skipWaiting();
});

// Activate service worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activate Event');
    event.waitUntil(self.clients.claim());
});

// Handle background sync
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background Sync Event', event.tag);
    
    if (event.tag === BACKGROUND_SYNC_TAG) {
        event.waitUntil(maintainConnection());
    }
});

// Maintain connection in background
async function maintainConnection() {
    console.log('Service Worker: Maintaining connection in background...');
    
    try {
        // Try to ping the server
        const response = await fetch('/health-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'service-worker-ping',
                timestamp: Date.now()
            })
        });
        
        if (response.ok) {
            console.log('Service Worker: Background ping successful');
            
            // Notify main thread that connection is maintained
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
                client.postMessage({
                    type: 'background-connection-maintained',
                    timestamp: Date.now()
                });
            });
        }
    } catch (error) {
        console.log('Service Worker: Background ping failed:', error);
        
        // Notify main thread of connection issues
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'background-connection-failed',
                timestamp: Date.now()
            });
        });
    }
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
    console.log('Service Worker: Message received:', event.data);
    
    if (event.data && event.data.type === 'start-background-sync') {
        // Register background sync
        event.waitUntil(
            self.registration.sync.register(BACKGROUND_SYNC_TAG)
        );
    }
});

// Intercept fetch requests to maintain connection
self.addEventListener('fetch', (event) => {
    // Don't intercept Socket.io or health check requests
    if (event.request.url.includes('socket.io') || 
        event.request.url.includes('health-check')) {
        return;
    }
    
    // For other requests, add connection headers
    const modifiedRequest = new Request(event.request, {
        headers: {
            ...event.request.headers,
            'X-Connection-Maintenance': 'true'
        }
    });
    
    event.respondWith(fetch(modifiedRequest));
});