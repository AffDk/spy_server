const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const crypto = require('crypto');
const QRCode = require('qrcode');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Game state storage
const gameSessions = new Map();
const wordList = new Set();

// Load words from CSV file
function loadWords() {
    return new Promise((resolve, reject) => {
        const words = new Set();
        fs.createReadStream('word_list.csv')
            .pipe(csv({ headers: false }))
            .on('data', (row) => {
                const word = Object.values(row)[0];
                if (word && word.trim()) {
                    words.add(word.trim().replace(/,$/, ''));
                }
            })
            .on('end', () => {
                wordList.clear();
                words.forEach(word => wordList.add(word));
                console.log(`Loaded ${wordList.size} words from CSV`);
                resolve(words);
            })
            .on('error', reject);
    });
}

// Generate secure random session ID
function generateSessionId() {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
}

// Generate secure random selection
function getSecureRandom(max) {
    const randomBuffer = crypto.randomBytes(4);
    const randomInt = randomBuffer.readUInt32BE(0);
    return randomInt % max;
}

// Shuffle array using secure randomization
function secureshuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = getSecureRandom(i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Game session class
class GameSession {
    constructor(sessionId, duration, host) {
        this.sessionId = sessionId;
        this.duration = duration; // in minutes
        this.host = host;
        this.players = new Map(); // socketId -> {nickname, socketId, isHost}
        this.allPlayerNicknames = new Set(); // All nicknames that have joined (persistent)
        this.spies = new Set(); // socketId set for spies
        this.spyNicknames = new Set(); // Persistent spy nicknames (survives disconnections)
        this.currentWord = null;
        this.previousWord = null;
        this.phase = 'lobby'; // lobby, game, ended
        this.gameTimer = null;
        this.gameStartTime = null;
        this.registrationOpen = true;
    }

    addPlayer(socketId, nickname) {
        if (!this.registrationOpen) {
            throw new Error('Registration is closed');
        }

        // Check for duplicate nicknames only among active players
        // This allows reconnections with the same nickname if the player is not currently active
        const normalizedNickname = nickname.toLowerCase().trim();
        
        // Check active players only - allow reconnection with same nickname if not currently active
        for (const player of this.players.values()) {
            if (player.nickname.toLowerCase().trim() === normalizedNickname) {
                throw new Error('Nickname already taken');
            }
        }

        // Add to both active players and persistent nickname list
        this.players.set(socketId, {
            socketId,
            nickname,
            isHost: socketId === this.host
        });
        
        this.allPlayerNicknames.add(nickname);
    }

    removePlayer(socketId) {
        // Don't remove from allPlayerNicknames - keep it for persistent tracking
        // Only remove from active players
        this.players.delete(socketId);
        this.spies.delete(socketId);
    }

    getPlayerList() {
        return Array.from(this.players.values()).map(p => ({
            nickname: p.nickname,
            isHost: p.isHost
        }));
    }

    selectSpies() {
        const playerIds = Array.from(this.players.keys());
        const spyCount = Math.max(Math.floor(playerIds.length / 3), 1);
        const shuffledPlayers = secureshuffle(playerIds);
        
        this.spies.clear();
        this.spyNicknames.clear(); // Reset spy nicknames for new selection
        
        for (let i = 0; i < spyCount; i++) {
            const spySocketId = shuffledPlayers[i];
            this.spies.add(spySocketId);
            
            // Store the spy's nickname persistently
            const spyPlayer = this.players.get(spySocketId);
            if (spyPlayer) {
                this.spyNicknames.add(spyPlayer.nickname);
            }
        }
    }

    selectRandomWord() {
        const words = Array.from(wordList);
        if (words.length === 0) {
            throw new Error('No words available');
        }

        let selectedWord;
        do {
            const randomIndex = getSecureRandom(words.length);
            selectedWord = words[randomIndex];
        } while (selectedWord === this.previousWord && words.length > 1);

        this.previousWord = this.currentWord;
        this.currentWord = selectedWord;
        return selectedWord;
    }

    getSpyNicknames() {
        // Return persistent spy nicknames instead of relying on active connections
        return Array.from(this.spyNicknames);
    }
}

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/host/:sessionId', (req, res) => {
    const sessionId = req.params.sessionId;
    if (!gameSessions.has(sessionId)) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'game-host.html'));
});

app.get('/join/:sessionId', (req, res) => {
    const sessionId = req.params.sessionId;
    if (!gameSessions.has(sessionId)) {
        return res.status(404).send('Game session not found');
    }
    res.sendFile(path.join(__dirname, 'public', 'game-client.html'));
});

app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'test.html'));
});

// Service worker endpoint
app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Service-Worker-Allowed', '/');
    res.sendFile(path.join(__dirname, 'public', 'sw.js'));
});

// PWA manifest endpoint
app.get('/manifest.json', (req, res) => {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.sendFile(path.join(__dirname, 'public', 'manifest.json'));
});

// Server-Sent Events fallback for ultra-stubborn mobile browsers
const sseClients = new Map(); // sessionId -> Set of response objects

app.get('/events/:sessionId/:nickname', (req, res) => {
    const { sessionId, nickname } = req.params;
    
    // Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
        'X-Accel-Buffering': 'no' // Disable nginx buffering
    });
    
    console.log(`SSE connection opened: ${nickname} in session ${sessionId}`);
    
    // Add client to SSE clients
    if (!sseClients.has(sessionId)) {
        sseClients.set(sessionId, new Set());
    }
    sseClients.get(sessionId).add(res);
    
    // Send initial connection confirmation
    res.write(`data: ${JSON.stringify({
        type: 'sse-connected',
        sessionId,
        nickname,
        timestamp: Date.now()
    })}\n\n`);
    
    // Send keep-alive every 10 seconds
    const keepAlive = setInterval(() => {
        if (!res.destroyed) {
            res.write(`data: ${JSON.stringify({
                type: 'keep-alive',
                timestamp: Date.now()
            })}\n\n`);
        } else {
            clearInterval(keepAlive);
        }
    }, 10000);
    
    // Clean up on disconnect
    req.on('close', () => {
        console.log(`SSE connection closed: ${nickname} in session ${sessionId}`);
        clearInterval(keepAlive);
        if (sseClients.has(sessionId)) {
            sseClients.get(sessionId).delete(res);
            if (sseClients.get(sessionId).size === 0) {
                sseClients.delete(sessionId);
            }
        }
    });
});

// Function to broadcast via SSE
function broadcastSSE(sessionId, data) {
    if (sseClients.has(sessionId)) {
        const clients = sseClients.get(sessionId);
        clients.forEach(res => {
            if (!res.destroyed) {
                try {
                    res.write(`data: ${JSON.stringify(data)}\n\n`);
                } catch (error) {
                    console.log('SSE write error:', error);
                    clients.delete(res);
                }
            } else {
                clients.delete(res);
            }
        });
    }
}

// Emergency health check endpoint for mobile fallback
app.post('/health-check', express.json(), (req, res) => {
    const { sessionId, nickname, timestamp, type } = req.body;
    
    if (type === 'service-worker-ping') {
        console.log('Service worker ping received');
        res.json({
            status: 'ok',
            type: 'service-worker-response',
            serverTime: Date.now()
        });
        return;
    }
    
    console.log(`Health check from ${nickname} in session ${sessionId}`);
    
    const session = gameSessions.get(sessionId);
    if (session) {
        res.json({
            status: 'ok',
            sessionExists: true,
            playerCount: session.players.size,
            gameState: session.gameState,
            serverTime: Date.now()
        });
    } else {
        res.json({
            status: 'ok',
            sessionExists: false,
            serverTime: Date.now()
        });
    }
});

// API endpoint to add words
app.post('/api/add-word', (req, res) => {
    const { word } = req.body;
    
    if (!word || !word.trim()) {
        return res.status(400).json({ error: 'Word is required' });
    }

    const trimmedWord = word.trim();
    
    // Check for duplicates (case-insensitive)
    const existingWords = Array.from(wordList).map(w => w.toLowerCase());
    if (existingWords.includes(trimmedWord.toLowerCase())) {
        return res.status(409).json({ error: 'Word already in list' });
    }

    // Add to memory
    wordList.add(trimmedWord);

    // Append to CSV file
    fs.appendFileSync('word_list.csv', `\n${trimmedWord},`);

    res.json({ success: true, message: 'Word added successfully' });
});

// API endpoint to generate QR code
app.get('/api/qr/:sessionId', async (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        const url = `${req.protocol}://${req.get('host')}/join/${sessionId}`;
        const qrCode = await QRCode.toDataURL(url);
        res.json({ qrCode, url });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate QR code' });
    }
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('createSession', (data) => {
        const { duration } = data;
        
        if (!duration || duration < 5 || duration > 60) {
            socket.emit('error', 'Game duration must be between 5 and 60 minutes');
            return;
        }

        const sessionId = generateSessionId();
        const session = new GameSession(sessionId, duration, socket.id);
        gameSessions.set(sessionId, session);

        socket.join(sessionId);
        socket.emit('sessionCreated', { sessionId });

        console.log(`Session ${sessionId} created with ${duration} minutes duration`);
    });

    socket.on('joinSession', (data) => {
        const { sessionId, nickname } = data;
        
        if (!sessionId || !nickname) {
            socket.emit('error', 'Session ID and nickname are required');
            return;
        }

        const session = gameSessions.get(sessionId);
        if (!session) {
            socket.emit('error', 'Session not found');
            return;
        }

        try {
            session.addPlayer(socket.id, nickname);
            socket.join(sessionId);
            
            socket.emit('joinedSession', { 
                sessionId, 
                nickname,
                phase: session.phase 
            });

            // Broadcast updated player list to all in session (including host)
            io.to(sessionId).emit('playersUpdated', {
                players: session.getPlayerList(),
                count: session.players.size
            });

            console.log(`Player ${nickname} joined session ${sessionId} (${session.players.size} total players)`);
        } catch (error) {
            socket.emit('error', error.message);
        }
    });

    socket.on('joinSessionAsHost', (data) => {
        const { sessionId } = data;
        const session = gameSessions.get(sessionId);
        
        if (!session) {
            socket.emit('error', 'Session not found');
            return;
        }

        // Update the host socket ID since they navigated to a new page
        session.host = socket.id;
        
        // Join the session room
        socket.join(sessionId);
        
        // Send current session state to host
        socket.emit('hostJoinedSession', {
            sessionId,
            phase: session.phase,
            players: session.getPlayerList(),
            playerCount: session.players.size
        });

        // Send current player list to host
        socket.emit('playersUpdated', {
            players: session.getPlayerList(),
            count: session.players.size
        });

        console.log(`Host rejoined session ${sessionId} with new socket ${socket.id}`);
    });



    socket.on('startGame', (data) => {
        const { sessionId } = data;
        const session = gameSessions.get(sessionId);
        
        if (!session || session.host !== socket.id) {
            socket.emit('error', 'Unauthorized or session not found');
            return;
        }

        if (session.players.size < 4) {
            socket.emit('error', 'Minimum 4 players required');
            return;
        }

        // Close registration
        session.registrationOpen = false;

        // Assign roles
        session.selectSpies();
        session.selectRandomWord();
        session.phase = 'game';

        // Send roles to players
        for (const [socketId, player] of session.players) {
            const playerSocket = io.sockets.sockets.get(socketId);
            if (playerSocket) {
                if (session.spies.has(socketId)) {
                    playerSocket.emit('roleAssigned', { role: 'spy' });
                } else {
                    playerSocket.emit('roleAssigned', { 
                        role: 'civilian', 
                        word: session.currentWord 
                    });
                }
            }
        }

        io.to(sessionId).emit('gameStarted', {
            duration: session.duration * 60 // Convert to seconds
        });

        console.log(`Game started in session ${sessionId} with word: ${session.currentWord}`);
    });

    socket.on('startTimer', (data) => {
        const { sessionId } = data;
        const session = gameSessions.get(sessionId);
        
        if (!session || session.host !== socket.id || session.phase !== 'game') {
            socket.emit('error', 'Unauthorized or invalid session state');
            return;
        }

        session.gameStartTime = Date.now();
        const gameDuration = session.duration * 60 * 1000; // Convert to milliseconds

        // Start game timer
        session.gameTimer = setTimeout(() => {
            session.phase = 'ended';
            
            // Trigger alarm
            io.to(sessionId).emit('gameEnded', {
                spies: session.getSpyNicknames()
            });

            console.log(`Game ended in session ${sessionId}`);
        }, gameDuration);

        io.to(sessionId).emit('timerStarted', {
            duration: session.duration * 60,
            startTime: session.gameStartTime
        });
    });

    socket.on('newRound', (data) => {
        const { sessionId } = data;
        const session = gameSessions.get(sessionId);
        
        if (!session || session.host !== socket.id) {
            socket.emit('error', 'Unauthorized or session not found');
            return;
        }

        // Clear existing timer
        if (session.gameTimer) {
            clearTimeout(session.gameTimer);
        }

        // Reset for new round
        session.phase = 'game';
        session.selectSpies();
        session.selectRandomWord();
        session.gameStartTime = null;
        session.registrationOpen = false; // Keep registration closed for new rounds

        // Send new roles to players
        console.log(`Sending roles to ${session.players.size} players in session ${sessionId}`);
        for (const [socketId, player] of session.players) {
            const playerSocket = io.sockets.sockets.get(socketId);
            if (playerSocket) {
                if (session.spies.has(socketId)) {
                    console.log(`Assigning SPY role to ${player.nickname} (${socketId})`);
                    playerSocket.emit('roleAssigned', { role: 'spy' });
                } else {
                    console.log(`Assigning CIVILIAN role to ${player.nickname} (${socketId}) with word: ${session.currentWord}`);
                    playerSocket.emit('roleAssigned', { 
                        role: 'civilian', 
                        word: session.currentWord 
                    });
                }
            } else {
                console.log(`Warning: Player socket ${socketId} (${player.nickname}) not found - removing from session`);
                // Remove disconnected players
                session.players.delete(socketId);
                session.spies.delete(socketId);
            }
        }

        // First emit that new round started
        io.to(sessionId).emit('newRoundStarted');
        
        // Then emit game started to ensure proper UI state
        io.to(sessionId).emit('gameStarted', {
            duration: session.duration * 60
        });
        
        console.log(`New round started in session ${sessionId} with word: ${session.currentWord}, spies: ${session.getSpyNicknames().join(', ')}`);
    });

    socket.on('abortGame', (data) => {
        const { sessionId } = data;
        const session = gameSessions.get(sessionId);
        
        if (!session || session.host !== socket.id) {
            socket.emit('error', 'Unauthorized or session not found');
            return;
        }

        // Clear game timer
        if (session.gameTimer) clearTimeout(session.gameTimer);

        // Notify all players
        io.to(sessionId).emit('gameAborted');

        // Disconnect all players
        for (const socketId of session.players.keys()) {
            const playerSocket = io.sockets.sockets.get(socketId);
            if (playerSocket) {
                playerSocket.leave(sessionId);
            }
        }

        // Clean up session
        gameSessions.delete(sessionId);
        console.log(`Session ${sessionId} aborted`);
    });

    socket.on('closeGame', (data) => {
        const { sessionId } = data;
        const session = gameSessions.get(sessionId);
        
        if (!session || session.host !== socket.id) {
            socket.emit('error', 'Unauthorized or session not found');
            return;
        }

        // Clear game timer
        if (session.gameTimer) clearTimeout(session.gameTimer);

        // Notify all players
        io.to(sessionId).emit('gameClosed');

        // Clean up session
        gameSessions.delete(sessionId);
        console.log(`Session ${sessionId} closed`);
    });

    // Handle mobile heartbeat ping/pong
    socket.on('ping', () => {
        // Respond to client ping with pong
        socket.emit('pong');
    });
    
    // Handle aggressive mobile keep-alive events
    socket.on('keep-alive', (data) => {
        // Acknowledge keep-alive
        socket.emit('keep-alive-ack', { timestamp: Date.now() });
    });
    
    socket.on('background-mode', (data) => {
        console.log(`Socket ${socket.id} entered background mode`);
        // Send immediate acknowledgment
        socket.emit('background-ack', { timestamp: Date.now() });
    });
    
    socket.on('foreground-mode', (data) => {
        console.log(`Socket ${socket.id} returned to foreground`);
        // Send session status update
        const sessionId = data.sessionId;
        const session = gameSessions.get(sessionId);
        if (session && session.players.has(socket.id)) {
            socket.emit('session-status', {
                status: 'connected',
                playerCount: session.players.size,
                gameState: session.gameState,
                timestamp: Date.now()
            });
        }
    });
    
    socket.on('window-blur', (data) => {
        // Track window blur for connection management
        console.log(`Socket ${socket.id} window blurred`);
    });
    
    socket.on('page-freeze', (data) => {
        console.log(`Socket ${socket.id} page frozen`);
    });
    
    socket.on('touch-keep-alive', (data) => {
        // Acknowledge touch-based keep-alive
        socket.emit('touch-ack', { timestamp: Date.now() });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        // Find and clean up sessions where this socket was involved
        for (const [sessionId, session] of gameSessions) {
            if (session.players.has(socket.id)) {
                session.removePlayer(socket.id);
                
                // If host disconnected, abort the session
                if (session.host === socket.id) {
                    if (session.gameTimer) clearTimeout(session.gameTimer);
                    
                    io.to(sessionId).emit('gameAborted');
                    gameSessions.delete(sessionId);
                } else {
                    // Update player list for remaining players
                    io.to(sessionId).emit('playersUpdated', {
                        players: session.getPlayerList(),
                        count: session.players.size
                    });
                }
                break;
            }
        }
    });
});

// Initialize server
async function startServer() {
    try {
        await loadWords();
        server.listen(PORT, () => {
            console.log(`Spy Word Game server running on port ${PORT}`);
            console.log(`Visit http://localhost:${PORT} to start a game`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

startServer();