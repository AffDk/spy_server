# 🕵️ Spy Word Game

A multiplayer web-based game combining elements of Spyfall and Kahoot, where players try to identify the spies among them while spies try to blend in without knowing the secret word.

## 🎮 Game Overview

**Spy Word Game** is a real-time multiplayer social deduction game where:
- **Civilians** receive a secret word and must discuss it without revealing it to spies
- **Spies** don't know the word and must try to blend in by participating in the discussion
- **Host** manages the game session and controls timing
- **Everyone** tries to figure out who the spies are before time runs out

### Game Flow
1. **Setup**: Host creates a game session with custom duration (5-60 minutes)
2. **Lobby**: Players join via URL/QR code and wait for game start
3. **Assignment**: Spies are randomly selected (1 spy per 3 players minimum)
4. **Discussion**: Players discuss the secret word while spies try to blend in
5. **Revelation**: When time expires, spies are revealed

## 🚀 Quick Start

### Installation

```bash
# Clone or extract the project
cd spy_server

# Install dependencies
npm install

# Start the server
npm start
```

The server will start on `http://localhost:3000`

### First Game

1. **Open your browser** and go to `http://localhost:3000`
2. **Set game duration** (5-60 minutes) and click "Start Game Session"
3. **Share the join URL** with players or show them the QR code
4. **Wait for players** to join (minimum 4 required)
5. **Start the game** when ready
6. **Begin discussion** when the timer starts
7. **Reveal spies** when time expires

## 📋 Features

### 🎯 Core Gameplay
- **Real-time multiplayer** via WebSocket connections
- **Secure randomization** using Node.js crypto module
- **Scalable architecture** supports up to 100 players per session
- **Cross-platform compatibility** (desktop and mobile browsers)

### 🎨 User Interface
- **Responsive design** optimized for mobile and desktop
- **Visual timer** with color-coded warnings
- **Role assignment** with clear spy/civilian indicators
- **Game status tracking** throughout all phases

### 🔊 Audio & Notifications
- **Web Audio API** for game end alarms
- **Browser notifications** to wake inactive tabs
- **Visual alerts** with flashing animations
- **Mobile-friendly** touch interactions

### 🛠 Host Controls
- **Session management** (create, start, abort, close)
- **Lobby controls** (extend time, kick players)
- **Game monitoring** (player count, timer, spy reveal)
- **Round management** (new rounds with different words/spies)

### 📱 Player Features
- **Simple joining** via URL or QR code
- **Nickname validation** prevents duplicates
- **Role display** shows spy status and word (for civilians)
- **Real-time updates** for all game state changes
- **Graceful disconnection** handling

## 🏗 Technical Architecture

### Backend (Node.js)
- **Express.js** HTTP server
- **Socket.io** WebSocket communication
- **CSV parsing** for word list management
- **QR code generation** for easy mobile joining
- **In-memory session storage** (no database required)

### Frontend (Vanilla JS)
- **Responsive HTML5/CSS3** interface
- **Socket.io client** for real-time communication
- **Web Audio API** for sound effects
- **Notification API** for background alerts
- **Local storage** for user preferences

### File Structure
```
spy_server/
├── server.js              # Main server application
├── package.json           # Dependencies and scripts
├── word_list.csv          # Game words (Persian/English)
├── public/                # Client-side assets
│   ├── index.html         # Host setup page
│   ├── game-host.html     # Host control panel
│   ├── game-client.html   # Player game interface
│   ├── test.html          # Testing utilities
│   ├── styles.css         # Responsive styling
│   └── script.js          # Shared utilities
├── __tests__/             # Jest unit tests
├── test-simulator.js      # Integration test simulator
└── README.md              # This file
```

## 🧪 Testing

### Automated Testing

```bash
# Run unit tests
npm test

# Run integration tests with simulator
npm run test:integration

# Interactive test mode
node test-simulator.js
```

### Manual Testing

1. **Single Device Testing**
   ```bash
   # Start server
   npm start
   
   # Open multiple browser tabs/windows
   # Navigate to http://localhost:3000
   # Create game in one tab, join from others
   ```

2. **Multi-Device Testing**
   ```bash
   # Use ngrok for public URL
   npx ngrok http 3000
   
   # Share the ngrok URL with other devices
   # Test mobile browser compatibility
   ```

3. **Test Page**
   - Visit `http://localhost:3000/test`
   - Use built-in testing tools
   - Simulate multiple players
   - Test audio/notification features

### Testing Scenarios

#### ✅ Basic Flow Test
1. Create game session (5-60 min duration)
2. Join with 4+ players
3. Start game and assign roles
4. Run timer and end game
5. Reveal spies and start new round

#### ✅ Edge Cases Test
- Less than 4 players (should block start)
- Duplicate nicknames (should prevent join)
- Host disconnection (should abort game)
- Invalid game duration (should show error)
- Network interruption (should handle gracefully)

#### ✅ Load Testing
- 10+ simultaneous players
- Multiple concurrent game sessions
- Rapid join/leave scenarios
- Extended game durations

## 🔧 Configuration

### Game Settings
```javascript
// In server.js - modify these constants
const MIN_PLAYERS = 4;           // Minimum players to start
const MAX_PLAYERS = 100;         // Maximum players per session
const LOBBY_DURATION = 90;       // Lobby time in seconds
const MIN_GAME_DURATION = 5;     // Minimum game minutes
const MAX_GAME_DURATION = 60;    // Maximum game minutes
```

### Word Management
```bash
# Add words to CSV file
echo "newword," >> word_list.csv

# Or use the web interface at /
# Click "Add Custom Words" section
```

### Environment Variables
```bash
# Optional: Set custom port
export PORT=8080

# Optional: Set custom hostname
export HOST=0.0.0.0
```

## 🌐 Deployment

### Local Development
```bash
npm install
npm run dev  # Uses nodemon for auto-restart
```

### Production Deployment

#### Heroku
```bash
# Create Heroku app
heroku create spy-word-game

# Deploy
git push heroku main

# Open app
heroku open
```

#### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Manual Server
```bash
# Install dependencies
npm install --production

# Start with PM2 (recommended)
npm install -g pm2
pm2 start server.js --name spy-game

# Or use forever
npm install -g forever
forever start server.js
```

### Public Testing with ngrok
```bash
# Install ngrok
npm install -g ngrok

# Start server
npm start

# In another terminal, expose to internet
ngrok http 3000

# Share the https://xyz.ngrok.io URL
```

## 🎯 Game Rules & Strategy

### For Civilians
- **Know the word** but don't say it directly
- **Ask questions** that only word-knowers would understand
- **Watch for confusion** from players who seem lost
- **Build consensus** on who seems suspicious

### For Spies
- **Listen carefully** to pick up clues about the word
- **Ask safe questions** that work for any topic
- **Deflect suspicion** by participating naturally
- **Coordinate subtly** with other spies (if multiple)

### For Hosts
- **Manage timing** based on group dynamics
- **Extend lobby** if more players are coming
- **Start new rounds** to keep the game going
- **Moderate discussions** if needed (external to game)

## 🔐 Security Considerations

### Input Validation
- Nickname length and character restrictions
- Game duration bounds checking
- Session ID format validation
- Basic XSS prevention in text inputs

### Session Management
- Secure random session ID generation
- Host-only administrative controls
- Automatic cleanup of abandoned sessions
- Rate limiting on session creation

### Network Security
- HTTPS recommended for production
- CORS headers configured appropriately
- Socket.io namespace isolation
- Input sanitization on all user data

## 🐛 Troubleshooting

### Common Issues

**"Connection Failed"**
- Check if server is running on correct port
- Verify firewall settings allow connections
- Ensure WebSocket support in browser

**"Session Not Found"**
- Session may have expired or been closed
- Check URL for typos in session ID
- Host may have aborted the game

**"Audio Not Working"**
- Browser may block autoplay audio
- User interaction required to enable audio
- Check browser's audio permissions

**"Notifications Not Showing"**
- Browser notification permissions required
- May not work in private/incognito mode
- iOS Safari has limited notification support

### Debug Mode
```bash
# Enable debug logging
DEBUG=socket.io* npm start

# Or set environment variable
export DEBUG=socket.io*
node server.js
```

### Log Analysis
```bash
# Monitor server logs in real-time
tail -f server.log

# Check for common error patterns
grep -i error server.log
grep -i "socket" server.log
```

## 🤝 Contributing

### Development Setup
```bash
# Fork the repository
git clone <your-fork-url>
cd spy_server

# Install dependencies
npm install

# Install dev dependencies
npm install --dev

# Run tests
npm test

# Start development server
npm run dev
```

### Code Style
- Use ES6+ features where appropriate
- Follow existing naming conventions
- Add comments for complex logic
- Write tests for new features

### Pull Request Process
1. Create feature branch from `main`
2. Make changes with appropriate tests
3. Update documentation if needed
4. Submit pull request with clear description

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Spyfall** game concept inspiration
- **Socket.io** for real-time communication
- **Express.js** for web server framework
- **QR code** library for mobile joining
- **Jest** for testing framework

## 📞 Support

### Getting Help
- 📧 Create an issue for bug reports
- 💬 Use discussions for questions
- 📖 Check this README for common solutions
- 🔍 Search existing issues first

### Feature Requests
- Describe the use case clearly
- Explain why it would be beneficial
- Consider implementation complexity
- Check if similar features exist

---

**Made with ❤️ for social gaming enthusiasts**

*Have fun playing and may the best detective win!* 🕵️‍♀️🕵️‍♂️