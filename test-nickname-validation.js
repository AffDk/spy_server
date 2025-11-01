const io = require('socket.io-client');

// Test script to verify nickname validation and spy reveal functionality
async function testNicknameValidation() {
    console.log('🧪 Testing nickname validation and spy reveal...');
    
    const serverUrl = 'http://localhost:3000';
    let sessionId = null;
    
    // Create host socket
    const host = io(serverUrl);
    
    host.on('connect', () => {
        console.log('✅ Host connected');
        host.emit('createSession', { duration: 5 });
    });
    
    host.on('sessionCreated', (data) => {
        sessionId = data.sessionId;
        console.log(`📝 Session created: ${sessionId}`);
        
        // Test nickname validation
        testDuplicateNicknames(sessionId);
    });
    
    host.on('gameEnded', (data) => {
        console.log('🎉 Game ended!');
        console.log('🕵️ Spies revealed:', data.spies);
        
        if (data.spies && data.spies.length > 0) {
            console.log('✅ SUCCESS: Spy nicknames are available even after potential disconnections');
        } else {
            console.log('❌ FAILED: No spy nicknames found');
        }
        
        // Clean up
        setTimeout(() => {
            host.disconnect();
            process.exit(0);
        }, 1000);
    });
    
    host.on('error', (error) => {
        console.error('❌ Host error:', error);
    });
}

async function testDuplicateNicknames(sessionId) {
    console.log('\n🔍 Testing duplicate nickname validation...');
    
    const serverUrl = 'http://localhost:3000';
    
    // Create first player with nickname "TestPlayer"
    const player1 = io(serverUrl);
    
    player1.on('connect', () => {
        console.log('👤 Player1 connected');
        player1.emit('joinSession', { sessionId, nickname: 'TestPlayer' });
    });
    
    player1.on('joinedSession', (data) => {
        console.log('✅ Player1 joined successfully with nickname:', data.nickname);
        
        // Now try to create second player with same nickname
        const player2 = io(serverUrl);
        
        player2.on('connect', () => {
            console.log('👤 Player2 connected, trying duplicate nickname...');
            player2.emit('joinSession', { sessionId, nickname: 'TestPlayer' });
        });
        
        player2.on('error', (error) => {
            console.log('✅ SUCCESS: Duplicate nickname rejected:', error);
            player2.disconnect();
            
            // Create more players to reach minimum for game start
            createMorePlayers(sessionId, player1);
        });
        
        player2.on('joinedSession', (data) => {
            console.log('❌ FAILED: Duplicate nickname was allowed:', data.nickname);
            player2.disconnect();
        });
    });
    
    player1.on('error', (error) => {
        console.error('❌ Player1 error:', error);
    });
}

async function createMorePlayers(sessionId, existingPlayer) {
    console.log('\n👥 Creating more players to start the game...');
    
    const serverUrl = 'http://localhost:3000';
    const players = [existingPlayer];
    
    // Create 3 more players to reach minimum of 4
    for (let i = 2; i <= 4; i++) {
        const player = io(serverUrl);
        players.push(player);
        
        player.on('connect', () => {
            console.log(`👤 Player${i} connected`);
            player.emit('joinSession', { sessionId, nickname: `Player${i}` });
        });
        
        player.on('joinedSession', (data) => {
            console.log(`✅ Player${i} joined:`, data.nickname);
        });
        
        player.on('roleAssigned', (data) => {
            console.log(`🎭 Player${i} role:`, data.role);
            if (data.role === 'civilian' && data.word) {
                console.log(`📝 Player${i} word:`, data.word);
            }
        });
        
        player.on('gameStarted', () => {
            console.log(`🚀 Player${i} received game started event`);
        });
        
        player.on('timerStarted', (data) => {
            console.log(`⏱️ Player${i} received timer started:`, data.duration, 'seconds');
        });
        
        player.on('gameEnded', (data) => {
            console.log(`🎉 Player${i} received game ended, spies:`, data.spies);
        });
        
        // Simulate disconnection for one of the players after joining
        if (i === 3) {
            setTimeout(() => {
                console.log(`📱 Simulating Player${i} mobile disconnection...`);
                player.disconnect();
            }, 2000);
        }
    }
    
    // Wait a bit for all players to join, then start the game
    setTimeout(() => {
        console.log('\n🎯 Starting the game...');
        // The host will start the game automatically through the existing host socket
        // We need to join the host to the session room first
        
        // Start game simulation
        setTimeout(() => {
            console.log('🚀 Host starting the game...');
            existingPlayer.emit('startGame', { sessionId });
            
            // Start timer after a short delay
            setTimeout(() => {
                console.log('⏰ Host starting the timer...');
                existingPlayer.emit('startTimer', { sessionId });
                
                // End game quickly for testing
                setTimeout(() => {
                    console.log('⏰ Simulating game end...');
                    // Game will end automatically after the timer
                }, 1000);
            }, 1000);
        }, 3000);
    }, 2000);
}

// Run the test
testNicknameValidation().catch(console.error);