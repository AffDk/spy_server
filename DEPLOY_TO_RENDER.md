# Deploy to Render

## Alternative Hosting Solution

Since Railway is having issues with our file structure, here's how to deploy to Render instead:

### 1. Create Render Account
1. Go to https://render.com/
2. Sign up with your GitHub account

### 2. Deploy from GitHub
1. Click "New +"
2. Select "Web Service"
3. Connect your GitHub repository `spy_server`
4. Configure settings:
   - **Name**: `spy-word-game`
   - **Region**: Choose closest to you
   - **Branch**: `master`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 3. Environment Variables (if needed)
- Set `NODE_ENV=production`

### 4. Deployment
- Render will automatically detect it's a Node.js app
- It should properly copy all files including the `public` directory
- You'll get a URL like: `https://spy-word-game.onrender.com`

## Why Render might work better:
- Better GitHub integration
- More straightforward file handling
- Free tier available
- Automatic HTTPS

Try Render and let me know if you'd like help with the setup process!