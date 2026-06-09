@echo off
cd /d "c:\Users\kiran\Desktop\My Assistant"
echo === GIT STATUS ===
git status --short
echo === GIT REMOTE ===
git remote -v
echo === GIT LOG ===
git log --oneline -5
