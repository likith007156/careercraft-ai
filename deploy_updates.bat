@echo off
echo Committing and pushing CareerCraft AI bug fixes to GitHub...
git add frontend/src/components/ErrorBoundary.jsx frontend/src/pages/Learn.jsx backend/services/claude_service.py backend/routes/progress.py backend/routes/dashboard.py
git commit -m "Fix Vite ErrorBoundary crash, Learn page markdown parsing, stable Anthropic model ID, progress analytics caching, and dashboard streak ordering"
git push origin main
echo Done! Please check your Vercel and Render dashboards for the deployment status.
pause

