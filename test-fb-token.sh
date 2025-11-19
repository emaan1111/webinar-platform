#!/bin/bash
# Test Facebook Access Token
# This script checks if your Facebook token is valid and shows expiration

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🔍 Testing Facebook Access Token..."
echo ""

# Load token from .env
if [ -f .env ]; then
    source .env
else
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

if [ -z "$FB_ACCESS_TOKEN" ]; then
    echo -e "${RED}❌ FB_ACCESS_TOKEN not found in .env${NC}"
    exit 1
fi

echo -e "${BLUE}Token:${NC} ${FB_ACCESS_TOKEN:0:20}..."
echo ""

# Test 1: Check token validity
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 1: Checking token validity and expiration..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s -G \
  -d "input_token=$FB_ACCESS_TOKEN" \
  -d "access_token=$FB_ACCESS_TOKEN" \
  "https://graph.facebook.com/debug_token")

echo "$RESPONSE" | grep -q '"is_valid":true'
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Token is VALID${NC}"
    
    # Extract expiration
    if echo "$RESPONSE" | grep -q '"expires_at"'; then
        EXPIRES_AT=$(echo "$RESPONSE" | grep -o '"expires_at":[0-9]*' | cut -d':' -f2)
        if [ "$EXPIRES_AT" != "0" ]; then
            EXPIRES_DATE=$(date -r "$EXPIRES_AT" 2>/dev/null || date -d "@$EXPIRES_AT" 2>/dev/null || echo "Unknown")
            CURRENT_TIME=$(date +%s)
            DAYS_LEFT=$(( ($EXPIRES_AT - $CURRENT_TIME) / 86400 ))
            
            if [ $DAYS_LEFT -gt 30 ]; then
                echo -e "${GREEN}✅ Long-lived token${NC}"
            elif [ $DAYS_LEFT -gt 7 ]; then
                echo -e "${YELLOW}⚠️  Token expires in $DAYS_LEFT days${NC}"
            elif [ $DAYS_LEFT -gt 0 ]; then
                echo -e "${YELLOW}⚠️  Token expires soon: $DAYS_LEFT days${NC}"
            else
                echo -e "${RED}❌ Token expired or expiring today${NC}"
            fi
            
            echo -e "${BLUE}   Expires:${NC} $EXPIRES_DATE"
            echo -e "${BLUE}   Days left:${NC} $DAYS_LEFT days"
        else
            echo -e "${GREEN}✅ Token never expires (System User)${NC}"
        fi
    fi
    
    # Check permissions
    if echo "$RESPONSE" | grep -q '"ads_management"'; then
        echo -e "${GREEN}✅ Has ads_management permission${NC}"
    else
        echo -e "${RED}❌ Missing ads_management permission${NC}"
    fi
    
    if echo "$RESPONSE" | grep -q '"ads_read"'; then
        echo -e "${GREEN}✅ Has ads_read permission${NC}"
    else
        echo -e "${RED}❌ Missing ads_read permission${NC}"
    fi
else
    echo -e "${RED}❌ Token is INVALID${NC}"
    echo ""
    echo "Error details:"
    echo "$RESPONSE" | grep -o '"message":"[^"]*"' | cut -d':' -f2
    echo ""
    echo "🔧 To fix: Get a new token from:"
    echo "   https://developers.facebook.com/tools/explorer/"
    exit 1
fi

echo ""

# Test 2: Try to fetch actual data
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 2: Fetching sample Facebook Ads data..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

DATA_RESPONSE=$(curl -s -G \
  -d "fields=spend,impressions,clicks" \
  -d "time_range={'since':'2025-11-18','until':'2025-11-19'}" \
  -d "time_increment=1" \
  -d "access_token=$FB_ACCESS_TOKEN" \
  "https://graph.facebook.com/v22.0/$FB_AD_ACCOUNT_ID/insights")

echo "$DATA_RESPONSE" | grep -q '"data"'
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Successfully fetched Facebook Ads data${NC}"
    
    # Show sample data
    SPEND=$(echo "$DATA_RESPONSE" | grep -o '"spend":"[^"]*"' | head -1 | cut -d':' -f2 | tr -d '"')
    IMPRESSIONS=$(echo "$DATA_RESPONSE" | grep -o '"impressions":"[^"]*"' | head -1 | cut -d':' -f2 | tr -d '"')
    CLICKS=$(echo "$DATA_RESPONSE" | grep -o '"clicks":"[^"]*"' | head -1 | cut -d':' -f2 | tr -d '"')
    
    if [ ! -z "$SPEND" ]; then
        echo -e "${BLUE}   Sample data (last 2 days):${NC}"
        echo -e "   Spend: \$$SPEND"
        echo -e "   Impressions: $IMPRESSIONS"
        echo -e "   Clicks: $CLICKS"
    fi
else
    echo -e "${RED}❌ Failed to fetch Facebook Ads data${NC}"
    echo ""
    echo "Error details:"
    echo "$DATA_RESPONSE" | grep -o '"message":"[^"]*"' | cut -d':' -f2
    
    if echo "$DATA_RESPONSE" | grep -q "ads_management"; then
        echo ""
        echo -e "${YELLOW}⚠️  Permission error detected${NC}"
        echo "   Your token needs 'ads_management' and 'ads_read' permissions"
        echo ""
        echo "🔧 To fix:"
        echo "   1. Go to: https://developers.facebook.com/tools/explorer/"
        echo "   2. Add permissions: ads_management, ads_read"
        echo "   3. Generate new token"
        echo "   4. Extend to long-lived token"
        echo "   5. Update FB_ACCESS_TOKEN in .env"
    fi
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ All tests passed!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Your Facebook token is working correctly! 🎉"
echo ""
echo "📊 You can now view reports at:"
echo "   http://localhost:3000/dashboard/reports"
echo ""
