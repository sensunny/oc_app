#!/bin/bash

# Patient Management App - Build and Deploy Script
# This script helps you build and deploy your Expo app with Firebase FCM

set -e

echo "🚀 Patient Management App - Build and Deploy Helper"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo -e "${RED}❌ EAS CLI is not installed${NC}"
    echo "Install it with: npm install -g eas-cli"
    exit 1
fi

echo -e "${GREEN}✅ EAS CLI is installed${NC}"
echo ""

# Menu
echo "What would you like to do?"
echo ""
echo "1) Build for Development (iOS)"
echo "2) Build for Development (Android)"
echo "3) Build for Preview/Testing (iOS)"
echo "4) Build for Preview/Testing (Android)"
echo "5) Build for Production (iOS)"
echo "6) Build for Production (Android)"
echo "7) Submit to App Store (iOS)"
echo "8) Submit to Play Store (Android)"
echo "9) Check build status"
echo "10) Push to Git branch"
echo ""

read -p "Enter your choice (1-10): " choice

case $choice in
    1)
        echo -e "${YELLOW}🔨 Building Development version for iOS...${NC}"
        eas build --profile development --platform ios
        ;;
    2)
        echo -e "${YELLOW}🔨 Building Development version for Android...${NC}"
        eas build --profile development --platform android
        ;;
    3)
        echo -e "${YELLOW}🔨 Building Preview version for iOS...${NC}"
        eas build --profile preview --platform ios
        ;;
    4)
        echo -e "${YELLOW}🔨 Building Preview version for Android...${NC}"
        eas build --profile preview --platform android
        ;;
    5)
        echo -e "${YELLOW}🔨 Building Production version for iOS...${NC}"
        eas build --profile production --platform ios
        ;;
    6)
        echo -e "${YELLOW}🔨 Building Production version for Android...${NC}"
        eas build --profile production --platform android
        ;;
    7)
        echo -e "${YELLOW}📤 Submitting to App Store...${NC}"
        eas submit --platform ios
        ;;
    8)
        echo -e "${YELLOW}📤 Submitting to Play Store...${NC}"
        eas submit --platform android
        ;;
    9)
        echo -e "${YELLOW}📊 Checking build status...${NC}"
        eas build:list
        ;;
    10)
        echo -e "${YELLOW}🌿 Git Operations${NC}"
        echo ""
        read -p "Enter branch name (e.g., fcm-pure-firebase): " branch_name

        echo "Current git status:"
        git status
        echo ""

        read -p "Create new branch and commit? (y/n): " confirm
        if [ "$confirm" = "y" ]; then
            git checkout -b "$branch_name"
            git add -A

            read -p "Enter commit message: " commit_msg
            git commit -m "$commit_msg"

            echo ""
            echo -e "${GREEN}✅ Changes committed to branch: $branch_name${NC}"
            echo ""

            read -p "Push to remote? (y/n): " push_confirm
            if [ "$push_confirm" = "y" ]; then
                git push -u origin "$branch_name"
                echo -e "${GREEN}✅ Pushed to remote: $branch_name${NC}"
            fi
        fi
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ Done!${NC}"
echo ""
echo "Next steps:"
echo "- Development builds: Install on device and connect to dev server with 'npx expo start --dev-client'"
echo "- Preview builds: Download and install for testing"
echo "- Production builds: Submit to app stores"
echo ""
echo "📚 See DEPLOYMENT_GUIDE.md for detailed instructions"
