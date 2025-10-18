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

### Production Deployment (Always Online)

#### 🚀 Railway (Recommended - Free & Easy)
Railway offers excellent Node.js support with free tier perfect for this game.

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy from your current directory
railway up

# Get your live URL
railway domain
```

**Why Railway?**
- ✅ Free tier with 500 hours/month (enough for always-on)
- ✅ Automatic deployments from GitHub
- ✅ Built-in environment variables
- ✅ WebSocket support
- ✅ Custom domains

#### 🌐 Render (Great Alternative - Free Tier)
```bash
# 1. Push your code to GitHub (you've already done this!)
# 2. Go to https://render.com
# 3. Connect your GitHub repository
# 4. Choose "Web Service"
# 5. Configure:
#    - Build Command: npm install
#    - Start Command: npm start
#    - Port: 3000
```

**Why Render?**
- ✅ Free tier (with some limitations)
- ✅ Automatic deployments from GitHub
- ✅ Free SSL certificates
- ✅ Easy setup via web interface

#### ☁️ Heroku (Classic Choice)
```bash
# Install Heroku CLI from https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login

# Create Heroku app
heroku create your-spy-word-game

# Deploy
git push heroku master

# Open your live app
heroku open
```

**Note:** Heroku removed their free tier, so this requires a paid plan (~$5-7/month).

#### ⚡ Vercel (Serverless)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (follow prompts)
vercel --prod

# Your app will be live at https://your-project.vercel.app
```

**Note:** Vercel is serverless, which works great for the frontend but may have limitations with persistent WebSocket connections.

#### 🔥 Firebase Hosting + Cloud Functions
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project
firebase init

# Deploy
firebase deploy
```

#### 🐳 DigitalOcean App Platform
1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Connect your GitHub repository
3. Configure build settings:
   - Build Command: `npm install`
   - Run Command: `npm start`
4. Deploy with one click

#### 📋 Quick Comparison

| Platform | Free Tier | Always On | WebSockets | Setup Difficulty |
|----------|-----------|-----------|------------|------------------|
| **Railway** | ✅ 500hrs/month | ✅ Yes | ✅ Yes | ⭐⭐ Easy |
| **Render** | ✅ Limited | ⚠️ Sleeps | ✅ Yes | ⭐ Very Easy |
| **Heroku** | ❌ Paid only | ✅ Yes | ✅ Yes | ⭐⭐ Easy |
| **Vercel** | ✅ Generous | ✅ Yes | ⚠️ Limited | ⭐ Very Easy |
| **DigitalOcean** | ❌ $5+/month | ✅ Yes | ✅ Yes | ⭐⭐⭐ Medium |

### 🎯 Recommended: Deploy to Railway (Step-by-Step)

Railway is perfect for your Spy Word Game because it supports WebSockets and stays online 24/7 on the free tier.

#### Step 1: Prepare Your Repository
Your code is already on GitHub, so you're ready! If not:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/spy_server.git
git push -u origin main
```

#### Step 2: Deploy to Railway
1. **Go to [Railway.app](https://railway.app)**
2. **Sign up** with your GitHub account
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your `spy_server` repository**
6. **Railway will automatically:**
   - Detect it's a Node.js app
   - Run `npm install`
   - Start with `npm start`
   - Generate a public URL

#### Step 3: Configure Environment (Optional)
```bash
# If you want to set custom environment variables
# In Railway dashboard > Variables tab, add:
PORT=3000
NODE_ENV=production
```

#### Step 4: Get Your Live URL
After deployment (takes 2-3 minutes):
- Your game will be live at `https://yourproject-production.up.railway.app`
- Share this URL with anyone worldwide!
- No ngrok needed - it's always online

#### Step 5: Enable Custom Domain (Optional)
In Railway dashboard:
1. Go to Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed

### 🔄 Automatic Updates
Once deployed, every time you push to GitHub:
```bash
git add .
git commit -m "Updated game features"
git push origin main
```
Railway will automatically redeploy your updated game!

### 🛠 Production Deployment Tips

#### Environment Configuration
Most cloud platforms automatically handle:
- ✅ `PORT` environment variable (your app uses `process.env.PORT`)
- ✅ Node.js version (specified in `package.json`)
- ✅ Dependencies installation (`npm install`)
- ✅ SSL certificates (HTTPS)

#### Performance Considerations
- **Memory**: Your app uses in-memory storage, perfect for cloud deployment
- **WebSockets**: All recommended platforms support Socket.io
- **File Storage**: Word list (`word_list.csv`) is included in deployment
- **Sessions**: Game sessions reset on server restart (by design)

#### Monitoring Your Live Game
After deployment, you can:
- View logs in your platform's dashboard
- Monitor active connections and memory usage
- Set up alerts for downtime
- Check performance metrics

### 🌍 Going Live Checklist

Before sharing your game publicly:

1. **✅ Test Deployment**
   ```bash
   # Visit your live URL
   # Create a test game
   # Join from multiple devices/browsers
   ```

2. **✅ Performance Test**
   - Test with 10+ players
   - Run a full game cycle
   - Check mobile browser compatibility

3. **✅ Share Your Game**
   - Your live URL works globally
   - No firewall or network restrictions
   - Players can join from any device with internet

4. **✅ Optional Customization**
   - Add your own words to the CSV
   - Customize game duration limits
   - Modify the UI styling

### Public Testing with ngrok

#### Step-by-Step Setup for ngrok Account Holders

1. **Install ngrok** (if not already done):
   ```bash
   npm install -g ngrok
   ```

2. **Authenticate** (one-time setup - you've already done this!):
   ```bash
   ngrok config add-authtoken YOUR_NGROK_AUTH_TOKEN
   ```

3. **Start your game server**:
   ```bash
   npm start
   ```

4. **In a new terminal, start ngrok**:
   ```bash
   # Basic tunnel (recommended for testing)
   ngrok http 3000
   
   # Or with custom subdomain (if available on your plan)
   ngrok http 3000 --subdomain=spy-word-game
   
   # Or with custom domain (if you have one configured)
   ngrok http 3000 --domain=your-domain.ngrok-free.app
   ```

5. **Share the URL**: Copy the HTTPS URL from ngrok output (e.g., `https://abc123.ngrok-free.app`) and share it with players

#### Benefits with Your ngrok Account
- ✅ **No time limits**: Sessions don't expire after 2 hours
- ✅ **Better performance**: Priority routing and faster connections
- ✅ **Access logs**: See connection details in your ngrok dashboard
- ✅ **Custom domains**: Use consistent URLs (if configured)
- ✅ **HTTPS included**: Automatic SSL certificates

#### Alternative: ngrok Web Interface
If the command line isn't working, you can also:
1. Visit [ngrok dashboard](https://dashboard.ngrok.com/tunnels/agents)
2. Download the ngrok agent for Windows
3. Run it with a GUI interface

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

**"Mobile Connection Drops When Screen Turns Off"**
- This is a common mobile browser limitation
- The game now uses aggressive reconnection strategies
- Keep the browser tab active when possible
- Use "Add to Home Screen" on mobile for better stability
- Connection will automatically restore when screen turns back on
- Consider enabling "Stay Awake" mode during games

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