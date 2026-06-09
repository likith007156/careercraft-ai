@echo off
echo Committing and pushing Vercel monorepo configuration...
git add package.json vercel.json
git commit -m "Configure root monorepo build for Vercel"
git push origin main
echo Done! Please check your Vercel dashboard for the deployment status of careercraft-ai.
pause
