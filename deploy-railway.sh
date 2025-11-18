#!/bin/bash

# 🚀 Railway Deployment Script
# This script helps you deploy to Railway quickly

set -e  # Exit on error

echo "🚀 Railway Deployment Helper"
echo "================================"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "⚠️  Railway CLI not found!"
    echo ""
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
    echo "✅ Railway CLI installed!"
    echo ""
fi

# Check if logged in
echo "📝 Checking Railway authentication..."
if railway whoami &> /dev/null; then
    echo "✅ Already logged in to Railway"
else
    echo "🔐 Please log in to Railway..."
    railway login
fi

echo ""
echo "🔍 Current Railway project status:"
railway status || echo "⚠️  Not linked to a Railway project yet"

echo ""
echo "What would you like to do?"
echo "1) Link to existing Railway project"
echo "2) Deploy to Railway"
echo "3) View logs"
echo "4) Set environment variables"
echo "5) Run database migrations"
echo "6) Create admin user"
echo "7) Open Railway dashboard"
echo "8) Exit"
echo ""

read -p "Enter your choice (1-8): " choice

case $choice in
    1)
        echo "🔗 Linking to Railway project..."
        railway link
        ;;
    2)
        echo "🚀 Deploying to Railway..."
        echo ""
        echo "📦 Building locally first to catch errors..."
        npm run build
        echo ""
        echo "✅ Build successful! Deploying to Railway..."
        railway up
        echo ""
        echo "✅ Deployment complete!"
        echo "🌐 Visit your app:"
        railway open
        ;;
    3)
        echo "📜 Viewing Railway logs..."
        railway logs
        ;;
    4)
        echo "⚙️ Environment Variables Setup"
        echo ""
        echo "Setting required environment variables..."
        echo ""
        
        # Generate NEXTAUTH_SECRET if needed
        echo "Generating NEXTAUTH_SECRET..."
        NEXTAUTH_SECRET=$(openssl rand -base64 32)
        railway variables set NEXTAUTH_SECRET="$NEXTAUTH_SECRET"
        
        # Ask for OpenAI API key
        read -p "Enter your OPENAI_API_KEY (or press Enter to skip): " OPENAI_KEY
        if [ ! -z "$OPENAI_KEY" ]; then
            railway variables set OPENAI_API_KEY="$OPENAI_KEY"
        fi
        
        # Ask for other variables
        read -p "Do you want to set up ClickFunnels integration? (y/n): " cf_choice
        if [ "$cf_choice" = "y" ]; then
            read -p "Enter CLICKFUNNELS_API_KEY: " CF_KEY
            read -p "Enter CLICKFUNNELS_WORKSPACE_ID: " CF_WORKSPACE
            railway variables set CLICKFUNNELS_API_KEY="$CF_KEY"
            railway variables set CLICKFUNNELS_WORKSPACE_ID="$CF_WORKSPACE"
        fi
        
        echo ""
        echo "✅ Environment variables set!"
        echo ""
        echo "Current variables:"
        railway variables
        ;;
    5)
        echo "🗄️ Running database migrations..."
        railway run npx prisma db push
        echo "✅ Migrations complete!"
        ;;
    6)
        echo "👤 Creating admin user..."
        railway run node create-admin-user.js
        echo "✅ Admin user created!"
        ;;
    7)
        echo "🌐 Opening Railway dashboard..."
        railway open
        ;;
    8)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✨ Done!"
