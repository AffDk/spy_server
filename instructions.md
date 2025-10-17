# Project: Spy Word Game Web Server

Implement a full-stack web application for a multiplayer "Spy Word" game, similar to Spyfall combined with Kahoot/Slido mechanics. The host (game master) sets up a game session via a web interface. Players join via a shared URL from any browser (including mobile on Android/iOS). The server handles real-time connections using WebSockets for low-latency communication. Use Node.js with Express for the HTTP server, Socket.io for WebSockets, and ensure it's OS-agnostic (runs on Windows/Linux/macOS). Clients connect over the public web (no same-WiFi requirement), so the server should be deployable to a cloud host like Heroku or Vercel for public access during testing (suggest using ngrok for local dev testing, or if possible a localhost server).

Key principles:
- All communication is server-mediated; clients do not connect directly to each other.
- Use `icon.png` (assume it's provided in the project root) as:
  - Favicon for the web app.
  - Background image for all game pages (host and client views).
- Store game state (players, words, timers) in memory on the server (no database needed for simplicity).
- Handle up to 100 players per session; use efficient data structures like Maps for player tracking.
- Ensure cross-platform client compatibility: browsers on desktop/mobile (Chrome, Safari, Firefox, etc.).
- For alarms/audio: Use Web Audio API for audible alerts; attempt to request user permission for notifications to wake screens (note: web limitations prevent guaranteed screen wake/unlock; inform in README).
- Word list: Load from `word_list.csv` (CSV file with one word per line or comma-separated; parse accordingly). Allow host to add unique words before starting.
- Randomization: Use Node's `crypto` module for secure random selection; ensure new rounds differ from previous (new word and spies).
- Error handling: Graceful failures, clear UI feedback (e.g., pop-ups, messages).
- Security: Basic validation/sanitization for inputs (nicknames, words); no auth needed.

## 1. File Structure and Setup
- Create `server.js` (main entry point: start Express server on port 3000, serve static files, handle Socket.io).
- Create `public/` folder for client-side assets:
  - `index.html`: Host setup page.
  - `game-host.html`: Host game control page.
  - `game-client.html`: Player client page (loaded via join URL).
  - `styles.css`: Global styles, including `icon.png` as background (`body { background-image: url('/icon.png'); background-size: cover; }`).
  - `script.js`: Shared client logic.
  - `client-host.js`: Host-specific JS.
  - `client-player.js`: Player-specific JS.
- `word_list.csv`: Initial file with comma-separated words (e.g., "apple,banana,cat").
- `package.json`: Dependencies: express, socket.io, csv-parser (for word loading).
- `.gitignore`: Ignore `node_modules/`, `.env`, `*.log`, `dist/`.
- `README.md`: Detailed setup, run instructions (`npm install; npm start`), testing guide (below).
- Testing framework: Use Jest for unit tests (server logic, randomization). For integration: Provide a `test-simulator.js` script to simulate multiple clients (e.g., open virtual sockets/tabs programmatically or use Puppeteer for browser automation to mimic 4+ players).

## 2. Host Game Setup Phase
- **Initial Page (`index.html`)**: Form for game settings.
  - Input field for game duration: Integer minutes, minimum 5, maximum 60.
    - Validation: Client-side debounce (validate only on Enter keypress or form submit, not per keystroke). Server re-validates on submit.
    - Error: If invalid, show message "Time must be 5-60 minutes" and prevent submission.
  - Button to add words to `word_list.csv`: Input new word, check for duplicates (case-insensitive), warn if exists ("Word already in list"), append if unique (server-side file write).
  - "Start Session" button: Validates settings, generates unique session ID (e.g., random 6-char code), starts lobby timer (default 90 seconds, configurable via code).
- **Session Initiation**:
  - On start, generate join URL: `http://localhost:3000/join/<sessionId>` (or public domain).
  - Display URL and QR code (use qrcode library) on host page.
  - Start lobby timer: Accept player connections via Socket.io on `/join/<sessionId>`.
- **Player Joining**:
  - Clients load `game-client.html` via join URL.
  - Require nickname input: Validate non-empty, unique per session (server checks).
  - On submit: Register player in server state (e.g., Map<sessionId, Array<{socketId, nickname}>>).
  - Lobby timer runs: Display countdown on host page (real-time via Socket.io broadcasts).
  - Host page shows connected players list (nicknames count).
- **Lobby End**:
  - When timer expires, close registration (no new joins).
  - Check player count:
    - If < 4: Host pop-up error "Minimum 4 players required", then abort session (clear state, redirect to setup).
  - Host options (buttons on host page):
    - "Start Game": Proceed to role assignment.
    - "Extend Timer (+30s)": Reset lobby timer to 30s, reopen joins, keep existing players.
    - "Abort": Clear session, disconnect all players (emit 'disconnect' event), redirect host to setup.
  - Broadcast player updates to host and clients during lobby.

## 3. Game Process Phase
- **Role Assignment** (on "Start Game"):
  - Calculate spies: `Math.max(Math.floor(totalPlayers / 3), 1)`.
  - Randomly select spies from players (shuffle array, pick first N; make sure randomization is updated every time).
  - Pick random word from `word_list.csv` (load/parse once at server start, cache in memory; ensure different from prevWord).
  - Privately notify players via Socket.io:
    - Non-spies: Display word (e.g., "Your word is: xxx") on their client page.
    - Spies: Display "You are a spy!" (no word).
  - Host page: Shows "All roles assigned. Click to start timer." button.
- **Main Game Timer**:
  - On host "Start Game Timer" button:
    - Broadcast start event with duration (from setup, in seconds).
    - Countdown timer on all clients (visual clock) and host.
    - Use Socket.io to sync timer (server broadcasts ticks or remaining time every second).
- **Game End**:
  - When timer hits 0:
    - Broadcast alarm to clients: 5-second audio alarm (Web Audio API tone/beep), flashing red screen (CSS animation: `@keyframes flash { 0% { background: red; } 50% { background: white; } }`).
    - Request notification permission for audible alert even if tab inactive.
    - After 5s: Clients show "Game Over" message.
  - Host page: Reveal spy nicknames (list them).
  - Host options:
    - "Close Game": Disconnect all clients (emit 'gameEnd', server closes sockets), clear session.
    - "New Round": Reset to role assignment (new random word/spies, different from prev; restart timer setup? Or reuse duration).
- **Abort/Disconnect**:
  - Host abort anytime: Emit 'abort' to clients (show "Game aborted"), clear state, disconnect sockets, redirect host.
  - Client disconnect: Optional "Leave Game" button emits 'leave' to server (remove from player list); handle socket 'disconnect' event gracefully.

## 4. Additional Features
- **Testing Functionality**:
  - Add `/test` endpoint/route: Host-only page to simulate:
    - Connection test: Auto-join fake players (4-10 simulated sockets).
    - Alarm test: Skip full timer, trigger alarm after short delay (e.g., 10s).
    - Full dry-run: Setup -> join sim players -> assign roles -> short timer -> end/alarm -> reveal.
  - In `test-simulator.js`: Use Socket.io-client to open multiple virtual connections, automate nickname/role views.
- **Word Management**: Before game start (setup phase), host can add words via form; server appends to CSV if unique.
- **Persistence**: Words in CSV persist across restarts; game sessions are in-memory (lost on server restart).

## 5. Client-Side Implementation Notes
- Use vanilla JS or minimal framework (no React for simplicity).
- Socket.io client connects on page load with sessionId from URL.
- Responsive design for mobile (use CSS media queries).
- Handle offline/reconnects: Socket.io auto-reconnect; if player drops mid-game, remove from list, notify host.

## 6. Server-Side Implementation Notes
- Routes:
  - `/`: Serve host setup (`index.html`).
  - `/host/<sessionId>`: Host control page.
  - `/join/<sessionId>`: Player join page.
- Socket.io events:
  - 'join': {sessionId, nickname} -> register player.
  - 'startTimer', 'assignRoles', 'gameEnd', 'abort', etc.
  - Broadcast to room (use Socket.io rooms per sessionId).
- Timers: Use `setTimeout` or `setInterval` on server for accuracy, broadcast updates.
- Handle scalability: For 100 players, use efficient emits (e.g., to room, not individual).

## 7. Documentation and Testing
- **README.md**:
  - Setup: `npm init -y; npm i express socket.io csv-parser qrcode`.
  - Run: `node server.js`.
  - Test locally: Host on localhost:3000, use ngrok for public URL to test mobile joins.
  - Full test flow: 1. Setup game (5-60min). 2. Share URL, join with 4+ nicknames (use multiple tabs/devices or simulator). 3. Lobby end -> start. 4. Roles -> timer -> end (alarm). 5. Reveal -> new round/close.
  - Edge cases: <4 players, abort, add duplicate word, disconnect mid-game.
  - Deploy: Instructions for Heroku/Vercel.
- **Testing Framework**:
  - Unit tests (Jest): Test word loading, spy calc, randomization uniqueness.
  - Integration: Puppeteer script to automate browser tests (open host, sim joins, assert UI/events).
  - Provide `npm test` script.