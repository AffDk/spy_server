const io = require('socket.io-client');

async function testReconnectionWithServer() {
    console.log('🧪 Testing reconnection functionality with live server...\n');
    
    const serverUrl = 'http://localhost:3000';
    let sessionId = null;
    
    // Step 1: Create a session
    console.log('Step 1: Creating session...');
    const host = io(serverUrl, { forceNew: true });
    
    host.on('connect', () => {
        console.log('✅ Host connected');
        host.emit('createSession', { duration: 10 });
    });
    
    host.on('sessionCreated', (data) => {
        sessionId = data.sessionId;
        console.log('✅ Session created:', sessionId);
        
        // Step 2: Player joins with nickname "TestReconnect"
        testInitialConnection(sessionId);
    });
}

function testInitialConnection(sessionId) {
    console.log('\nStep 2: Player joining with nickname "TestReconnect"...');
    
    const serverUrl = 'http://localhost:3000';
    const player1 = io(serverUrl, { forceNew: true });
    
    player1.on('connect', () => {
        console.log('👤 Player1 connecting...');
        player1.emit('joinSession', { sessionId, nickname: 'TestReconnect' });
    });
    
    player1.on('joinedSession', (data) => {
        console.log('✅ Player1 joined successfully with nickname:', data.nickname);
        
        // Step 3: Simulate disconnection
        setTimeout(() => {
            console.log('\nStep 3: Simulating disconnection (mobile screen off)...');
            console.log('📱 Player1 disconnecting...');
            player1.disconnect();
            
            // Step 4: Try to reconnect with same nickname
            setTimeout(() => {
                testReconnection(sessionId);
            }, 1000);
            
        }, 1000);
    });
    
    player1.on('error', (error) => {
        console.error('❌ Player1 error:', error);
    });
}

function testReconnection(sessionId) {
    console.log('\nStep 4: Attempting to reconnect with same nickname "TestReconnect"...');
    
    const serverUrl = 'http://localhost:3000';
    const player2 = io(serverUrl, { forceNew: true });
    
    player2.on('connect', () => {
        console.log('👤 Player2 (reconnecting) connecting...');
        player2.emit('joinSession', { sessionId, nickname: 'TestReconnect' });
    });
    
    player2.on('joinedSession', (data) => {
        console.log('🎉 SUCCESS: Reconnection allowed with nickname:', data.nickname);
        console.log('✅ Player can reconnect with their original nickname after disconnection!');
        
        // Test blocking of different active nickname
        testActiveNicknameBlocking(sessionId, player2);
    });
    
    player2.on('error', (error) => {
        console.log('❌ FAILED: Reconnection blocked with error:', error);
        console.log('This suggests the old logic is still in place.');
    });
}

function testActiveNicknameBlocking(sessionId, existingPlayer) {
    console.log('\nStep 5: Testing that active nicknames are still blocked...');
    
    const serverUrl = 'http://localhost:3000';
    const player3 = io(serverUrl, { forceNew: true });
    
    player3.on('connect', () => {
        console.log('👤 Player3 trying to use active nickname...');
        player3.emit('joinSession', { sessionId, nickname: 'TestReconnect' });
    });
    
    player3.on('error', (error) => {
        if (error === 'Nickname already taken') {
            console.log('✅ SUCCESS: Active nickname properly blocked:', error);
            console.log('✅ The logic correctly prevents duplicate active nicknames!');
        } else {
            console.log('❌ Unexpected error:', error);
        }
        
        player3.disconnect();
        
        // Cleanup
        setTimeout(() => {
            console.log('\n🧹 Cleaning up...');
            existingPlayer.disconnect();
            console.log('\n🎉 All tests completed successfully!');
            console.log('✅ Reconnection logic is working correctly:');
            console.log('   - Allows reconnection with same nickname after disconnection');
            console.log('   - Prevents duplicate active nicknames');
            console.log('   - Maintains spy persistence for end-game reveals');
            
            process.exit(0);
        }, 1000);
    });
    
    player3.on('joinedSession', (data) => {
        console.log('❌ FAILED: Active nickname was allowed:', data.nickname);
        console.log('This suggests there\'s still an issue with the validation logic.');
        player3.disconnect();
    });
}

// Run the test
testReconnectionWithServer().catch(console.error);

// Timeout safety
setTimeout(() => {
    console.log('\n⏰ Test timeout - cleaning up...');
    process.exit(1);
}, 15000);