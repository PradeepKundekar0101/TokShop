#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "📦 Installing and Building ALL Apps (Admin + Marketplace)..."
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "📁 Working directory: $SCRIPT_DIR"
echo ""

# Install and build admin app
echo "1️⃣ Installing admin-app dependencies..."
cd "$SCRIPT_DIR/admin-app"
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
    echo "   Running npm install..."
    npm install
else
    echo "   node_modules exists, running npm install to ensure all deps are present..."
    npm install
fi

if [ ! -d "node_modules/tsx" ]; then
    echo "   ❌ ERROR: tsx not installed in admin-app!"
    exit 1
fi

echo "   ✅ Dependencies installed"
echo "   Building admin-app..."
npm run build

if [ ! -f "dist/server.js" ]; then
    echo "   ❌ ERROR: Build failed - dist/server.js not found!"
    exit 1
fi
echo "   ✅ Build complete"

# Install and build marketplace app
echo ""
echo "2️⃣ Installing marketplace-app dependencies..."
cd "$SCRIPT_DIR/marketplace-app"
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
    echo "   Running npm install..."
    npm install
else
    echo "   node_modules exists, running npm install to ensure all deps are present..."
    npm install
fi

if [ ! -d "node_modules/tsx" ]; then
    echo "   ❌ ERROR: tsx not installed in marketplace-app!"
    exit 1
fi

echo "   ✅ Dependencies installed"
echo "   Building marketplace-app..."
npm run build

if [ ! -f "dist/server.js" ]; then
    echo "   ❌ ERROR: Build failed - dist/server.js not found!"
    exit 1
fi
echo "   ✅ Build complete"

cd "$SCRIPT_DIR"

echo ""
echo "✅ All apps installed and built successfully!"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║         ✅  Installation Complete!                        ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "🎯 NEXT STEP: Start the apps with PM2"
echo ""
echo "   pm2 start ecosystem.config.cjs"
echo "   pm2 save"
echo "   pm2 startup systemd"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Check status:"
echo "   pm2 status"
echo ""
echo "📋 View logs:"
echo "   pm2 logs tokshop-admin"
echo "   pm2 logs tokshop-marketplace"
