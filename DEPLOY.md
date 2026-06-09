# Deployment Checklist for CareerCraft AI

Follow these step-by-step instructions to deploy the CareerCraft AI platform.

---

## 📋 PRE-DEPLOYMENT
- [ ] All tests passing locally.
- [ ] `npm run build` succeeds with zero errors.
- [ ] `.env` is listed in `.gitignore` and not committed to git.
- [ ] API URL configured for production in `frontend/src/utils/api.js`.
- [ ] Health check endpoint `/api/health` working locally.
- [ ] Mobile layout tested and fully responsive.

---

## 🚀 DEPLOY BACKEND TO RENDER
1. **Push your code** to your GitHub repository.
2. Go to [render.com](https://render.com) and log in or create an account.
3. Click **New +** (top right) and select **Web Service**.
4. Connect your GitHub repository.
5. Configure the service parameters:
   - **Name**: `careercraft-backend` (or similar)
   - **Environment**: `Python`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT`
6. Add the following **Environment Variables** in the Environment tab:
   - `ANTHROPIC_API_KEY`: *[Your Anthropic Claude API Key]*
   - `FLASK_ENV`: `production`
   - `DATABASE_URL`: `database/careercraft.db`
   - `ALLOWED_ORIGINS`: `https://your-frontend-domain.vercel.app` *(add this once you have the Vercel URL)*
7. Click **Create Web Service** and wait for the deployment build to complete.
8. Once the status is green, copy the service live URL and verify the health check endpoint:
   `https://your-backend-subdomain.onrender.com/api/health`

---

## ⚡ DEPLOY FRONTEND TO VERCEL
1. Copy the live Render backend URL from the previous step.
2. In your local codebase, open `frontend/src/utils/api.js` and replace `'https://your-backend.onrender.com'` with your actual Render live URL:
   ```javascript
   const API_URL = import.meta.env.MODE === 'production'
     ? 'https://your-backend-subdomain.onrender.com'
     : 'http://localhost:5000';
   ```
3. Commit and push the update to your GitHub repository.
4. Go to [vercel.com](https://vercel.com) and log in or create an account.
5. Click **Add New** and select **Project**.
6. Import your GitHub repository.
7. Configure the Vercel project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
8. Click **Deploy**. Vercel will build the frontend assets and provision a live domain.
9. Verify the live URL once deployment finishes. Copy the Vercel URL, go to Render settings, and update the `ALLOWED_ORIGINS` environment variable to permit cross-origin requests from the live Vercel domain.

---

## 🧪 POST-DEPLOYMENT VERIFICATION
- [ ] Open the live Vercel URL in your browser.
- [ ] Complete the skill assessment diagnostic flow.
- [ ] Confirm the personalized dashboard displays your metrics.
- [ ] Launch a lesson, read it, and complete the post-lesson quiz.
- [ ] Test the mock interview chatbots (Tech, HR, or Mixed).
- [ ] Test the Group Discussion simulation.
- [ ] Verify the layout and interaction elements on a mobile device.
- [ ] Share the URL with a friend to test from another network.
