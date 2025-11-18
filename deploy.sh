#!/bin/bash

# 🚀 One-Click Deploy to Railway
# This script commits your changes and deploys

set -e

echo "🚀 Deploying to Railway..."
echo "================================"
echo ""

# Show what will be deployed
echo "📝 Files changed:"
git status --short
echo ""

# Confirm
read -p "Ready to commit and deploy? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

# Add all changes
echo "📦 Adding changes..."
git add .

# Commit with message
echo "💾 Committing changes..."
git commit -m "Add AI silent mode feature

- AI now stays completely quiet when uncertain
- Enhanced system prompt with examples
- Added detection for 'I don't know' responses
- Improved natural conversation flow
- Added deployment guides and scripts
- AI Assistant UI with document management"

# Push to GitHub (triggers Railway auto-deploy)
echo "🚀 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Deployed to Railway!"
echo ""
echo "Railway will automatically:"
echo "  1. Detect your push"
echo "  2. Build your app"
echo "  3. Deploy to production"
echo "  4. Make it live in ~2-5 minutes"
echo ""
echo "📊 Monitor deployment:"
echo "  • Railway Dashboard: https://railway.app"
echo "  • Or run: railway logs"
echo ""
echo "🎉 Your AI silent mode is now deploying!"
