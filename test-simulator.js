const io = require('socket.io-client');
const readline = require('readline');

class GameTestSimulator {
    constructor() {
        this.hostSocket = null;
        this.playerSockets = [];
        this.sessionId = null;
        this.serverUrl = 'http://localhost:3000';
    }

    async createSession(duration = 5) {
        console.log('🎮 Creating game session...');
        
        this.hostSocket = io(this.serverUrl);
        
        return new Promise((resolve, reject) => {
            this.hostSocket.on('connect', () => {
                console.log('✅ Host connected to server');
                this.hostSocket.emit('createSession', { duration });
            });

            this.hostSocket.on('sessionCreated', (data) => {
                this.sessionId = data.sessionId;
                console.log(`🎯 Session created: ${this.sessionId}`);
                console.log(`🔗 Join URL: ${this.serverUrl}/join/${this.sessionId}`);
                resolve(data.sessionId);
            });

            this.hostSocket.on('error', (error) => {
                console.error('❌ Host error:', error);
                reject(error);
            });

            this.hostSocket.on('playersUpdated', (data) => {
                console.log(`👥 Players updated: ${data.count} connected`);
                data.players.forEach(player => {
                    console.log(`  - ${player.nickname}${player.isHost ? ' (Host)' : ''}`);
                });
            });

            this.hostSocket.on('lobbyEnded', (data) => {
                console.log(`⏰ Lobby ended with ${data.playerCount} players`);
            });

            this.hostSocket.on('gameStarted', () => {
                console.log('🚀 Game started! Roles assigned.');
            });

            this.hostSocket.on('timerStarted', (data) => {
                console.log(`⏱️ Game timer started: ${data.duration} seconds`);
            });

            this.hostSocket.on('gameEnded', (data) => {
                console.log('🎉 Game ended!');
                console.log('🕵️ Spies were:', data.spies.join(', '));
            });
        });
    }

    async addSimulatedPlayers(count = 4) {
        console.log(`🤖 Adding ${count} simulated players...`);
        
        const playerNames = [
            'Alice_Bot', 'Bob_Bot', 'Charlie_Bot', 'Diana_Bot',
            'Eve_Bot', 'Frank_Bot', 'Grace_Bot', 'Henry_Bot'
        ];

        for (let i = 0; i < count; i++) {
            const playerName = playerNames[i] || `Player_${i + 1}`;
            await this.addPlayer(playerName);
            
            // Add delay between connections
            await this.delay(500);
        }
    }

    async addPlayer(nickname) {
        return new Promise((resolve, reject) => {
            const playerSocket = io(this.serverUrl);
            
            playerSocket.on('connect', () => {
                console.log(`🔌 ${nickname} connecting...`);
                playerSocket.emit('joinSession', { 
                    sessionId: this.sessionId, 
                    nickname 
                });
            });

            playerSocket.on('joinedSession', (data) => {
                console.log(`✅ ${nickname} joined successfully`);
                this.playerSockets.push({ socket: playerSocket, nickname });
                resolve(playerSocket);
            });

            playerSocket.on('roleAssigned', (data) => {
                if (data.role === 'spy') {
                    console.log(`🕵️ ${nickname} is a SPY`);
                } else {
                    console.log(`👤 ${nickname} is a CIVILIAN (word: ${data.word})`);
                }
            });

            playerSocket.on('gameEnded', (data) => {
                console.log(`🎯 ${nickname} received game end signal`);
            });

            playerSocket.on('error', (error) => {
                console.error(`❌ ${nickname} error:`, error);
                reject(error);
            });
        });
    }

    async startGame() {
        if (!this.hostSocket) {
            throw new Error('No host session created');
        }

        console.log('🎮 Starting game...');
        this.hostSocket.emit('startGame', { sessionId: this.sessionId });
        
        await this.delay(1000);
        
        console.log('⏱️ Starting game timer...');
        this.hostSocket.emit('startTimer', { sessionId: this.sessionId });
    }

    async runFullTest(gameDurationMinutes = 1) {
        try {
            console.log('🧪 Starting full game simulation test...\n');
            
            // Step 1: Create session
            await this.createSession(gameDurationMinutes);
            
            // Step 2: Add players
            await this.addSimulatedPlayers(6);
            
            // Step 3: Wait for lobby
            console.log('⏰ Waiting 5 seconds for lobby...');
            await this.delay(5000);
            
            // Step 4: Start game
            await this.startGame();
            
            // Step 5: Wait for game to end (or simulate short game)
            const gameTimeMs = gameDurationMinutes * 60 * 1000;
            console.log(`⏳ Waiting ${gameDurationMinutes} minute(s) for game to complete...`);
            
            if (gameDurationMinutes <= 1) {
                // For testing, wait the full duration
                await this.delay(gameTimeMs);
            } else {
                // For longer games, provide updates
                const updateInterval = 30000; // 30 seconds
                const updates = Math.floor(gameTimeMs / updateInterval);
                
                for (let i = 0; i < updates; i++) {
                    await this.delay(updateInterval);
                    const remaining = gameDurationMinutes - ((i + 1) * updateInterval / 60000);
                    console.log(`⏳ ${remaining.toFixed(1)} minutes remaining...`);
                }
            }
            
            console.log('\n✅ Full test simulation completed!');
            
        } catch (error) {
            console.error('\n❌ Test simulation failed:', error);
        }
    }

    async cleanup() {
        console.log('🧹 Cleaning up connections...');
        
        // Disconnect all players
        this.playerSockets.forEach(({ socket, nickname }) => {
            socket.disconnect();
            console.log(`🔌 Disconnected ${nickname}`);
        });
        
        // Disconnect host
        if (this.hostSocket) {
            this.hostSocket.disconnect();
            console.log('🔌 Disconnected host');
        }
        
        this.playerSockets = [];
        this.hostSocket = null;
        this.sessionId = null;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Interactive CLI for manual testing
class InteractiveTester {
    constructor() {
        this.simulator = new GameTestSimulator();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async start() {
        console.log('🎮 Spy Word Game Test Simulator');
        console.log('================================\n');
        
        while (true) {
            const action = await this.prompt(`
Choose an action:
1. Run full automated test (1 minute game)
2. Run full automated test (5 minute game) 
3. Create session only
4. Add simulated players to existing session
5. Start game manually
6. Cleanup and exit
7. Custom test

Enter choice (1-7): `);

            try {
                switch (action.trim()) {
                    case '1':
                        await this.simulator.runFullTest(1);
                        break;
                    case '2':
                        await this.simulator.runFullTest(5);
                        break;
                    case '3':
                        const duration = await this.prompt('Game duration in minutes (5-60): ');
                        await this.simulator.createSession(parseInt(duration) || 5);
                        break;
                    case '4':
                        const playerCount = await this.prompt('Number of players to add (1-10): ');
                        await this.simulator.addSimulatedPlayers(parseInt(playerCount) || 4);
                        break;
                    case '5':
                        await this.simulator.startGame();
                        break;
                    case '6':
                        await this.simulator.cleanup();
                        console.log('👋 Goodbye!');
                        this.rl.close();
                        return;
                    case '7':
                        await this.customTest();
                        break;
                    default:
                        console.log('❌ Invalid choice. Please try again.');
                }
            } catch (error) {
                console.error('❌ Error:', error.message);
            }
            
            console.log('\n' + '='.repeat(50) + '\n');
        }
    }

    async customTest() {
        console.log('\n🛠️ Custom Test Configuration');
        
        const duration = await this.prompt('Game duration (minutes): ');
        const players = await this.prompt('Number of players: ');
        const autoStart = await this.prompt('Auto-start game? (y/n): ');
        
        await this.simulator.createSession(parseInt(duration) || 5);
        await this.simulator.addSimulatedPlayers(parseInt(players) || 4);
        
        if (autoStart.toLowerCase() === 'y') {
            await this.simulator.delay(2000);
            await this.simulator.startGame();
        }
        
        console.log('✅ Custom test setup complete');
    }

    prompt(question) {
        return new Promise((resolve) => {
            this.rl.question(question, (answer) => {
                resolve(answer);
            });
        });
    }
}

// Command line execution
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Spy Word Game Test Simulator

Usage:
  node test-simulator.js                    # Interactive mode
  node test-simulator.js --auto             # Run automated test (1 min)
  node test-simulator.js --auto --long      # Run automated test (5 min)
  node test-simulator.js --players N        # Create session with N players
  
Options:
  --help, -h          Show this help message
  --auto              Run automated full test
  --long              Use longer game duration (with --auto)
  --players N         Number of players to simulate
  --duration N        Game duration in minutes
        `);
        process.exit(0);
    }

    const simulator = new GameTestSimulator();

    if (args.includes('--auto')) {
        const duration = args.includes('--long') ? 5 : 1;
        console.log(`🤖 Running automated test with ${duration} minute game...`);
        
        simulator.runFullTest(duration).then(() => {
            console.log('\n🎉 Automated test completed');
            process.exit(0);
        }).catch((error) => {
            console.error('\n❌ Automated test failed:', error);
            process.exit(1);
        });
    } else if (args.includes('--players')) {
        const playerIndex = args.indexOf('--players');
        const playerCount = parseInt(args[playerIndex + 1]) || 4;
        const durationIndex = args.indexOf('--duration');
        const duration = durationIndex >= 0 ? parseInt(args[durationIndex + 1]) || 5 : 5;
        
        console.log(`🎮 Creating session with ${playerCount} players (${duration} min game)...`);
        
        simulator.createSession(duration)
            .then(() => simulator.addSimulatedPlayers(playerCount))
            .then(() => {
                console.log('✅ Session ready. Use interactive mode or web interface to start game.');
                console.log('Press Ctrl+C to exit.');
            })
            .catch((error) => {
                console.error('❌ Setup failed:', error);
                process.exit(1);
            });
    } else {
        // Interactive mode
        const tester = new InteractiveTester();
        tester.start().catch((error) => {
            console.error('❌ Interactive tester failed:', error);
            process.exit(1);
        });
    }
}

module.exports = { GameTestSimulator, InteractiveTester };