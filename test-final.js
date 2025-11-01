const io = require('socket.io-client');

async function testImplementation() {
    console.log('🧪 Testing our implementation with actual server...\n');
    
    const serverUrl = 'http://localhost:3000';
    let sessionId = null;
    let testsPassed = 0;
    let totalTests = 3;
    
    // Test 1: Create session and test nickname validation
    console.log('Test 1: Creating session and testing nickname validation...');
    
    const host = io(serverUrl, { forceNew: true });
    
    host.on('connect', () => {
        console.log('✅ Host connected');
        host.emit('createSession', { duration: 5 });
    });
    
    host.on('sessionCreated', (data) => {
        sessionId = data.sessionId;
        console.log('✅ Session created:', sessionId);
        testsPassed++;
        
        // Test nickname validation
        testNicknameValidation(sessionId);
    });
    
    host.on('error', (error) => {
        console.error('❌ Host error:', error);
    });
}

function testNicknameValidation(sessionId) {
    console.log('\nTest 2: Testing duplicate nickname validation...');
    
    const serverUrl = 'http://localhost:3000';
    
    // Create first player
    const player1 = io(serverUrl, { forceNew: true });
    
    player1.on('connect', () => {
        console.log('👤 Player1 connecting...');
        player1.emit('joinSession', { sessionId, nickname: 'TestPlayer' });
    });
    
    player1.on('joinedSession', (data) => {
        console.log('✅ Player1 joined with nickname:', data.nickname);
        
        // Try to join with duplicate nickname
        const player2 = io(serverUrl, { forceNew: true });
        
        player2.on('connect', () => {
            console.log('👤 Player2 trying duplicate nickname...');
            player2.emit('joinSession', { sessionId, nickname: 'TestPlayer' });
        });
        
        player2.on('error', (error) => {
            if (error === 'Nickname already taken') {
                console.log('✅ Duplicate nickname correctly rejected!');
                testsPassed++;
                player2.disconnect();
                testSpyPersistence(sessionId, player1);
            } else {
                console.log('❌ Wrong error message:', error);
            }
        });
        
        player2.on('joinedSession', () => {
            console.log('❌ FAILED: Duplicate nickname was allowed!');
            player2.disconnect();
        });
    });
    
    player1.on('error', (error) => {
        console.error('❌ Player1 error:', error);
    });
}

function testSpyPersistence(sessionId, player1) {
    console.log('\nTest 3: Testing spy nickname persistence...');
    
    const serverUrl = 'http://localhost:3000';
    const players = [player1];
    
    // Create enough players to start a game (need 4 total)
    for (let i = 2; i <= 4; i++) {
        const player = io(serverUrl, { forceNew: true });
        players.push(player);
        
        player.on('connect', () => {
            player.emit('joinSession', { sessionId, nickname: `Player${i}` });
        });
        
        player.on('joinedSession', () => {
            console.log(`✅ Player${i} joined`);
        });
    }
    
    // Wait for all players to join, then start the game
    setTimeout(() => {
        console.log('🚀 Starting game...');
        
        // Get host socket and start game
        const host = io(serverUrl, { forceNew: true });
        
        host.on('connect', () => {
            host.emit('joinSessionAsHost', { sessionId });
        });
        
        host.on('hostJoinedSession', () => {
            console.log('✅ Host joined session');
            
            // Start the game
            host.emit('startGame', { sessionId });
            
            // Start timer after a short delay
            setTimeout(() => {
                host.emit('startTimer', { sessionId });
                console.log('⏰ Timer started, waiting for game to end...');
            }, 1000);
        });
        
        host.on('gameEnded', (data) => {
            console.log('🎉 Game ended!');
            console.log('🕵️ Spies revealed:', data.spies);
            
            if (data.spies && data.spies.length > 0) {
                console.log('✅ SUCCESS: Spy nicknames are properly revealed!');
                testsPassed++;
            } else {
                console.log('❌ FAILED: No spy nicknames found');
            }
            
            // Final results
            console.log(`\n🏆 Tests completed: ${testsPassed}/${totalTests} passed`);
            
            if (testsPassed === totalTests) {
                console.log('🎉 ALL TESTS PASSED! Implementation is working correctly.');
            } else {
                console.log('❌ Some tests failed. Check the implementation.');
            }
            
            // Cleanup
            setTimeout(() => {
                players.forEach(p => p.disconnect());
                host.disconnect();
                process.exit(0);
            }, 1000);
        });
        
        // Disconnect one player after roles are assigned to simulate mobile disconnection
        setTimeout(() => {
            console.log('📱 Simulating Player3 disconnection...');
            if (players[2]) {
                players[2].disconnect();
            }
        }, 2000);
        
    }, 2000);
}

// Run the test
testImplementation().catch(console.error);

// Cleanup after 30 seconds if something goes wrong
setTimeout(() => {
    console.log('\n⏰ Test timeout - cleaning up...');
    process.exit(1);
}, 30000);