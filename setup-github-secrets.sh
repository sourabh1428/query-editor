#!/bin/bash

# GitHub Secrets Setup Helper Script
# This script helps you prepare the values for GitHub secrets

echo "🔐 GitHub Secrets Setup Helper"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

echo "This script will help you prepare the GitHub secrets needed for CI/CD deployment."
echo ""

# Check if PEM file exists
if [ ! -f "khushi-learn.pem" ]; then
    print_error "PEM file 'khushi-learn.pem' not found in current directory!"
    echo "Please make sure the PEM file is in the same directory as this script."
    exit 1
fi

print_status "Found PEM file: khushi-learn.pem"
echo ""

# Display PEM file content for EC2_SSH_KEY secret
echo "📋 SECRET 1: EC2_SSH_KEY"
echo "========================"
print_info "Copy the ENTIRE content below (including BEGIN/END lines) for the EC2_SSH_KEY secret:"
echo ""
echo -e "${YELLOW}--- START COPYING FROM HERE ---${NC}"
cat khushi-learn.pem
echo -e "${YELLOW}--- END COPYING HERE ---${NC}"
echo ""
echo ""

# Display EC2 host for EC2_HOST secret
echo "📋 SECRET 2: EC2_HOST"
echo "===================="
print_info "Use this value for the EC2_HOST secret:"
echo ""
echo -e "${YELLOW}15.206.178.18${NC}"
echo ""
echo ""

# Instructions
echo "🚀 SETUP INSTRUCTIONS"
echo "====================="
echo ""
echo "1. Go to your GitHub repository"
echo "2. Click on Settings → Secrets and variables → Actions"
echo "3. Click 'New repository secret'"
echo ""
echo "4. Create first secret:"
echo "   Name: EC2_SSH_KEY"
echo "   Value: [Copy the PEM content from above]"
echo ""
echo "5. Create second secret:"
echo "   Name: EC2_HOST"
echo "   Value: 15.206.178.18"
echo ""
echo "6. Commit and push to main branch to trigger deployment!"
echo ""

print_status "Setup complete! Your secrets are ready to be added to GitHub."
print_warning "Keep your PEM file secure and never commit it to your repository!"

echo ""
echo "🔗 Quick Links:"
echo "• GitHub Secrets: https://github.com/sourabh1428/query-editor/settings/secrets/actions"
echo "• GitHub Actions: https://github.com/sourabh1428/query-editor/actions"
echo ""

print_info "After setting up secrets, push any commit to main branch to trigger deployment!" 