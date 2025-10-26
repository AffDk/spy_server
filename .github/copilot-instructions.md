# Spy Word Game - AI Agent Instructions

## Project Overview
Real-time multiplayer social deduction game built with Express.js + Socket.io. Players join sessions via URLs/QR codes, get assigned roles (spy/civilian), and discuss a secret word while spies try to blend in.

## Core Architecture Patterns

### WebSocket-First Communication
- **Primary**: Socket.io WebSocket connections (`io.on('connection', ...)`)
- **Fallback**: Server-Sent Events endpoint (`/events/:sessionId/:nickname`) for mobile reliability
- **Emergency**: REST health-check endpoint (`/health-check`) for connection monitoring
- Events follow `camelCase` naming: `joinSession`, `playersUpdated`, `gameStarted`

### In-Memory State Management
```javascript
const gameSessions = new Map(); // sessionId -> GameSession instance
class GameSession {
    constructor(sessionId, duration, host) {
        this.players = new Map(); // socketId -> player data
        this.spies = new Set();   // socketId set for spies
        this.phase = 'lobby';     // 'lobby' | 'game' | 'ended'
    }
}
```
- No database - sessions reset on server restart (by design)
- Clean up disconnected players in `socket.on('disconnect')`

### Security & Randomization
- Session IDs: `crypto.randomBytes(3).toString('hex').toUpperCase()` (6-char hex)
- Spy selection: Custom `secureshuffle()` using `crypto.randomBytes()` for unbiased distribution
- Input validation: Nickname length/duplicates, duration bounds (5-60 min)

### Mobile-First Reliability
- Multiple connection fallbacks: WebSocket → SSE → health-check polling
- Aggressive reconnection with exponential backoff in client code
- Keep-alive mechanisms: `ping/pong`, `keep-alive`, `touch-keep-alive` events
- Background/foreground mode detection and recovery

## Key Development Workflows

### Local Development
```bash
npm run dev     # nodemon auto-restart on file changes
npm test        # Jest unit tests
npm run test:integration  # Socket.io integration simulator
```

### Testing Approach
- **Unit**: `__tests__/game.test.js` - game logic, validation, security
- **Integration**: `test-simulator.js` - full WebSocket session simulation with multiple virtual players
- **Manual**: Visit `/test` for browser-based testing tools

### Production Deployment
- **Docker**: Multi-stage build with `node:18-slim`, production-only deps
- **Railway/Render**: Auto-deploys from git push, handles `PORT` env var
- Health endpoint at `/` for platform monitoring

## Critical Files & Their Roles

### `server.js` - Monolithic Backend
- Express routes: `/` (host setup), `/join/:id` (player), `/host/:id` (host panel)
- Socket.io event handlers: All game logic in single file
- CSV word loading: `loadWords()` populates `wordList` Set on startup
- **Pattern**: Each socket event checks authorization (`session.host === socket.id`)

### `public/game-*.html` - Phase-Based UIs
- **Shared pattern**: Multiple divs with `.hidden` class, show/hide phases
- `game-host.html`: Session management, timer controls, spy reveal
- `game-client.html`: Join → lobby → role display → end phases
- **Connection strategy**: Initialize Socket.io client, fall back to SSE if needed

### `word_list.csv` - Game Content
- Simple format: `word,` (trailing comma for CSV parser compatibility)
- Loaded once at startup, cached in memory Set
- Add words via POST `/api/add-word` (appends to file + memory)

## Common Patterns to Follow

### Socket Event Handling
```javascript
socket.on('eventName', (data) => {
    const { sessionId } = data;
    const session = gameSessions.get(sessionId);
    
    // Always validate session exists
    if (!session) {
        socket.emit('error', 'Session not found');
        return;
    }
    
    // Check authorization for host-only actions
    if (session.host !== socket.id) {
        socket.emit('error', 'Unauthorized');
        return;
    }
    
    // Broadcast updates to session room
    io.to(sessionId).emit('responseEvent', responseData);
});
```

### Client-Side Phase Management
```javascript
function showPhase(phaseId) {
    document.querySelectorAll('.container > div').forEach(div => {
        div.classList.add('hidden');
    });
    document.getElementById(phaseId).classList.remove('hidden');
}
```

### Timer Management
- Server-side: `setTimeout()` for game duration, store timer ID for cleanup
- Client-side: `setInterval()` countdown display, sync with server timestamps
- **Critical**: Always `clearTimeout()`/`clearInterval()` when phase changes

## Integration Points

### QR Code Generation
- Endpoint: GET `/api/qr/:sessionId`
- Library: `qrcode` npm package
- Returns: `{ qrCode: "data:image/png;base64...", url: "join URL" }`

### Word Management
- Runtime: Words cached in `wordList` Set, selected via `getSecureRandom()`
- Admin: POST `/api/add-word` appends to CSV + memory
- Deduplication: Previous word tracking in `GameSession.previousWord`

### Session Cleanup
- Host disconnect: Abort session, notify all players, delete from Map
- Player disconnect: Remove from session, update player counts
- Timer expiry: Automatic cleanup in `setTimeout()` callbacks

## Debugging Commands

```bash
# Enable Socket.io debug logging
DEBUG=socket.io* npm start

# Test session flow with simulator
node test-simulator.js

# Monitor active sessions (add to server.js)
app.get('/debug/sessions', (req, res) => {
    res.json(Array.from(gameSessions.entries()));
});
```

## Mobile Optimization Notes
- Use `getUserMedia()` sparingly - causes connection drops on iOS
- Service Worker at `/sw.js` handles background connection recovery  
- Touch events preferred over mouse events for keep-alive
- Aggressive reconnection every 3-5 seconds when connection lost
- SSE fallback automatically engages when WebSocket fails repeatedly