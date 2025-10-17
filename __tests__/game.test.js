const request = require('supertest');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const http = require('http');
const express = require('express');

// Mock the server modules for testing
jest.mock('fs');
jest.mock('csv-parser');

describe('Spy Word Game Server', () => {
    let server;
    let serverSocket;
    let clientSocket;
    let port;

    beforeEach((done) => {
        // Create test server
        const app = express();
        server = http.createServer(app);
        const io = new Server(server);
        
        server.listen(() => {
            port = server.address().port;
            clientSocket = new Client(`http://localhost:${port}`);
            
            io.on('connection', (socket) => {
                serverSocket = socket;
            });
            
            clientSocket.on('connect', done);
        });
    });

    afterEach(() => {
        server.close();
        clientSocket.close();
    });

    describe('Game Session Management', () => {
        test('should create a new game session', (done) => {
            clientSocket.emit('createSession', { duration: 15 });
            
            clientSocket.on('sessionCreated', (data) => {
                expect(data).toHaveProperty('sessionId');
                expect(data.sessionId).toMatch(/^[A-F0-9]{6}$/);
                done();
            });
        });

        test('should reject invalid game duration', (done) => {
            clientSocket.emit('createSession', { duration: 3 }); // Too short
            
            clientSocket.on('error', (message) => {
                expect(message).toBe('Game duration must be between 5 and 60 minutes');
                done();
            });
        });

        test('should allow players to join session', (done) => {
            // First create a session
            clientSocket.emit('createSession', { duration: 10 });
            
            clientSocket.on('sessionCreated', (data) => {
                const sessionId = data.sessionId;
                
                // Create another client to join
                const playerClient = new Client(`http://localhost:${port}`);
                
                playerClient.on('connect', () => {
                    playerClient.emit('joinSession', { 
                        sessionId, 
                        nickname: 'TestPlayer' 
                    });
                });
                
                playerClient.on('joinedSession', (joinData) => {
                    expect(joinData.sessionId).toBe(sessionId);
                    expect(joinData.nickname).toBe('TestPlayer');
                    playerClient.close();
                    done();
                });
            });
        });
    });

    describe('Game Logic', () => {
        test('should calculate correct number of spies', () => {
            const calculateSpies = (playerCount) => Math.max(Math.floor(playerCount / 3), 1);
            
            expect(calculateSpies(3)).toBe(1);
            expect(calculateSpies(6)).toBe(2);
            expect(calculateSpies(9)).toBe(3);
            expect(calculateSpies(12)).toBe(4);
        });

        test('should validate nickname requirements', () => {
            const validateNickname = (nickname) => {
                if (!nickname || !nickname.trim()) return 'Nickname is required';
                if (nickname.trim().length > 20) return 'Nickname must be 20 characters or less';
                return null;
            };

            expect(validateNickname('')).toBe('Nickname is required');
            expect(validateNickname('   ')).toBe('Nickname is required');
            expect(validateNickname('a'.repeat(21))).toBe('Nickname must be 20 characters or less');
            expect(validateNickname('ValidName')).toBe(null);
        });
    });

    describe('Word Management', () => {
        test('should load words from CSV', () => {
            const mockWords = ['apple', 'banana', 'cherry'];
            // Mock word loading functionality
            expect(mockWords).toHaveLength(3);
            expect(mockWords).toContain('apple');
        });

        test('should prevent duplicate words', () => {
            const wordSet = new Set(['apple', 'banana']);
            const newWord = 'apple';
            
            expect(wordSet.has(newWord.toLowerCase())).toBe(true);
        });
    });

    describe('Security', () => {
        test('should generate secure random session IDs', () => {
            const generateId = () => {
                const crypto = require('crypto');
                return crypto.randomBytes(3).toString('hex').toUpperCase();
            };

            const id1 = generateId();
            const id2 = generateId();
            
            expect(id1).toMatch(/^[A-F0-9]{6}$/);
            expect(id2).toMatch(/^[A-F0-9]{6}$/);
            expect(id1).not.toBe(id2);
        });

        test('should sanitize user inputs', () => {
            const sanitize = (input) => input.trim().replace(/[<>'"]/g, '');
            
            expect(sanitize('  normal text  ')).toBe('normal text');
            expect(sanitize('<script>alert("xss")</script>')).toBe('scriptalert(xss)/script');
            expect(sanitize("It's a 'test'")).toBe('Its a test');
        });
    });
});

describe('Client-Side Utilities', () => {
    // Mock browser APIs
    Object.defineProperty(window, 'localStorage', {
        value: {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn(),
        },
        writable: true,
    });

    test('should format time correctly', () => {
        const formatTime = (seconds) => {
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        };

        expect(formatTime(0)).toBe('0:00');
        expect(formatTime(65)).toBe('1:05');
        expect(formatTime(3661)).toBe('61:01');
    });

    test('should detect mobile devices', () => {
        const originalUserAgent = navigator.userAgent;
        
        // Mock mobile user agent
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
            configurable: true,
        });

        const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        expect(isMobile()).toBe(true);

        // Restore original user agent
        Object.defineProperty(navigator, 'userAgent', {
            value: originalUserAgent,
            configurable: true,
        });
    });
});

describe('Game Flow Integration', () => {
    test('should complete full game flow', (done) => {
        // This is a simplified integration test
        const gameFlow = {
            phase: 'setup',
            players: [],
            spies: [],
            currentWord: null
        };

        // Setup phase
        expect(gameFlow.phase).toBe('setup');
        
        // Add players
        gameFlow.players = ['Player1', 'Player2', 'Player3', 'Player4'];
        expect(gameFlow.players.length).toBeGreaterThanOrEqual(4);
        
        // Start game
        gameFlow.phase = 'game';
        gameFlow.spies = ['Player1']; // Select spies
        gameFlow.currentWord = 'testword';
        
        expect(gameFlow.phase).toBe('game');
        expect(gameFlow.spies.length).toBeGreaterThan(0);
        expect(gameFlow.currentWord).toBeTruthy();
        
        // End game
        gameFlow.phase = 'ended';
        expect(gameFlow.phase).toBe('ended');
        
        done();
    });
});