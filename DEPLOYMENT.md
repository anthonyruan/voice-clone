# Deploying to Render.com

This guide will help you deploy the Voice Clone App to Render.com.

## Prerequisites

1. GitHub account with this repository pushed
2. Render.com account (sign up at https://render.com)
3. Fish Audio API key from https://fish.audio/go-api/

## Deployment Steps

### Option 1: Using render.yaml (Recommended)

1. **Push to GitHub**
   ```bash
   git add render.yaml DEPLOYMENT.md
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **Create New Web Service on Render**
   - Go to https://dashboard.render.com/
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository: `anthonyruan/voice-clone`
   - Render will automatically detect `render.yaml`
   - Click "Apply"

3. **Configure Environment Variables**
   - In the Render dashboard, go to your service
   - Navigate to "Environment" tab
   - Add the following secret:
     - `FISH_AUDIO_API_KEY`: Your Fish Audio API key

4. **Wait for Deployment**
   - Render will automatically build and deploy your app
   - First deployment takes ~5-10 minutes
   - Access your app at: `https://voice-clone-app.onrender.com`

### Option 2: Manual Web Service Creation

1. **Create New Web Service**
   - Go to https://dashboard.render.com/
   - Click "New +" → "Web Service"
   - Connect GitHub repository: `anthonyruan/voice-clone`

2. **Configure Service**
   - **Name**: `voice-clone-app`
   - **Region**: Oregon (or nearest to you)
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Runtime**: `Node`
   - **Build Command**: `cd voice-clone-app && npm install && npm run build`
   - **Start Command**: `cd voice-clone-app && npm run start`
   - **Plan**: Free (or your preferred plan)

3. **Add Environment Variables**
   - Click "Advanced" → "Add Environment Variable"
   - Add these variables:
     ```
     NODE_ENV=production
     FISH_AUDIO_API_KEY=your_actual_api_key_here
     CORS_ALLOWED_ORIGINS=https://voice-clone-app.onrender.com
     MAX_FILE_SIZE_MB=10
     ```

4. **Add Persistent Disk (Important!)**
   - Click "Advanced" → "Add Disk"
   - **Name**: `voice-clone-data`
   - **Mount Path**: `/opt/render/project/src/voice-clone-app/data`
   - **Size**: 1 GB
   - This preserves your SQLite database across deployments

5. **Create Web Service**
   - Click "Create Web Service"
   - Wait for deployment to complete

## Important Considerations

### 1. SQLite Database Persistence

⚠️ **Critical**: Without a persistent disk, your database will be reset on every deployment!

- The `render.yaml` includes disk configuration
- If using manual setup, make sure to add a disk at `/opt/render/project/src/voice-clone-app/data`
- Alternative: Migrate to PostgreSQL for production (requires code changes)

### 2. File Storage for Generated Audio

Generated audio files are stored in `public/audio/`. Consider:
- These files will also be lost without persistent storage
- For production, consider using cloud storage (AWS S3, Cloudinary, etc.)
- Current setup stores files locally in the disk

### 3. Free Tier Limitations

Render Free Tier includes:
- ✅ 750 hours/month (enough for 1 app running 24/7)
- ✅ Automatic HTTPS
- ❌ Spins down after 15 minutes of inactivity (cold starts take ~30 seconds)
- ❌ Limited to 512 MB RAM
- ❌ Limited CPU

### 4. better-sqlite3 Compatibility

The app uses `better-sqlite3` which requires native compilation:
- Render should compile it correctly during build
- If you encounter issues, the build logs will show compilation errors
- Alternative: Switch to `@libsql/client` or PostgreSQL

### 5. Cold Starts

On the free tier:
- App spins down after 15 minutes of inactivity
- First request after spindown takes ~30 seconds to wake up
- Upgrade to paid plan ($7/month) for always-on instances

## Monitoring Your Deployment

### Check Build Logs
- Go to your service dashboard
- Click "Logs" tab
- Look for:
  ```
  ✓ Starting...
  ✓ Ready in XXXms
  ```

### Verify Environment
After deployment, check:
- Database file created: `/opt/render/project/src/voice-clone-app/data/voice-clone.db`
- App accessible at your Render URL
- API routes working: `https://your-app.onrender.com/api/models`

### Common Issues

**Build fails with "Module not found"**
- Check that `buildCommand` includes the correct path
- Ensure all dependencies are in `package.json`

**Database resets on every deploy**
- Verify persistent disk is mounted at correct path
- Check disk configuration in Render dashboard

**500 Internal Server Error**
- Check environment variables are set correctly
- Review logs for missing `FISH_AUDIO_API_KEY`

**App is slow to respond**
- This is normal on free tier after spindown (cold start)
- First request wakes up the service (~30 seconds)

## Updating Your App

After making changes:

```bash
git add .
git commit -m "Your update message"
git push origin main
```

Render will automatically:
1. Detect the push
2. Rebuild your app
3. Deploy the new version
4. Keep your database intact (if disk is configured)

## Alternative: Upgrade to Paid Plan

For production use, consider upgrading ($7/month):
- ✅ No cold starts (always running)
- ✅ More RAM and CPU
- ✅ Better performance
- ✅ Custom domains

## Need Help?

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com/
- Fish Audio API: https://fish.audio/docs

---

**Your app will be live at**: `https://voice-clone-app.onrender.com`

(or `https://your-chosen-name.onrender.com` if you customize the service name)
