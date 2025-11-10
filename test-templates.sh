#!/bin/bash

# Test Script for Template System
# This script tests all templates and creates example webinars

echo "🧪 Template System Test Script"
echo "=============================="
echo ""

cd "/Volumes/WD/CODE/Webinar Play 2"

# Test 1: Create webinar with DEFAULT template
echo "📝 Test 1: Creating webinar with DEFAULT template..."
psql -U aribafarheen -d webinar_db -c "
INSERT INTO webinars (id, title, slug, description, duration, status, \"hostId\", \"registrationTemplate\", \"createdAt\", \"updatedAt\")
VALUES (
  'test-default-001',
  'Test Webinar - Default Template',
  'test-default',
  'This webinar uses the beautiful default template with gradient header, countdown, and full features.',
  60,
  'SCHEDULED',
  (SELECT id FROM users LIMIT 1),
  'default',
  NOW(),
  NOW()
);

INSERT INTO schedules (\"webinarId\", \"scheduleType\", \"scheduledAt\", timezone, \"createdAt\", \"updatedAt\")
VALUES (
  'test-default-001',
  'specific',
  NOW() + INTERVAL '7 days',
  'America/New_York',
  NOW(),
  NOW()
);
" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "✅ Default template webinar created"
  echo "   URL: http://localhost:3003/w/test-default"
else
  echo "❌ Failed to create default template webinar"
fi

echo ""

# Test 2: Create webinar with MINIMAL template
echo "📝 Test 2: Creating webinar with MINIMAL template..."
psql -U aribafarheen -d webinar_db -c "
INSERT INTO webinars (id, title, slug, description, duration, status, \"hostId\", \"registrationTemplate\", \"createdAt\", \"updatedAt\")
VALUES (
  'test-minimal-001',
  'Test Webinar - Minimal Template',
  'test-minimal',
  'This webinar uses the clean, professional minimal template with simple blue design.',
  60,
  'SCHEDULED',
  (SELECT id FROM users LIMIT 1),
  'minimal',
  NOW(),
  NOW()
);

INSERT INTO schedules (\"webinarId\", \"scheduleType\", \"scheduledAt\", timezone, \"createdAt\", \"updatedAt\")
VALUES (
  'test-minimal-001',
  'specific',
  NOW() + INTERVAL '7 days',
  'America/New_York',
  NOW(),
  NOW()
);
" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "✅ Minimal template webinar created"
  echo "   URL: http://localhost:3003/w/test-minimal"
else
  echo "❌ Failed to create minimal template webinar"
fi

echo ""

# Test 3: Create webinar with URGENCY template
echo "📝 Test 3: Creating webinar with URGENCY template..."
psql -U aribafarheen -d webinar_db -c "
INSERT INTO webinars (id, title, slug, description, duration, status, \"hostId\", \"registrationTemplate\", \"createdAt\", \"updatedAt\")
VALUES (
  'test-urgency-001',
  'Test Webinar - Urgency Template',
  'test-urgency',
  'This webinar uses the high-pressure urgency template with red design and countdown.',
  60,
  'SCHEDULED',
  (SELECT id FROM users LIMIT 1),
  'urgency',
  NOW(),
  NOW()
);

INSERT INTO schedules (\"webinarId\", \"scheduleType\", \"scheduledAt\", timezone, \"createdAt\", \"updatedAt\")
VALUES (
  'test-urgency-001',
  'specific',
  NOW() + INTERVAL '7 days',
  'America/New_York',
  NOW(),
  NOW()
);
" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "✅ Urgency template webinar created"
  echo "   URL: http://localhost:3003/w/test-urgency"
else
  echo "❌ Failed to create urgency template webinar"
fi

echo ""

# Test 4: Create webinar with CUSTOM template
echo "📝 Test 4: Creating webinar with CUSTOM HTML template..."
psql -U aribafarheen -d webinar_db -c "
INSERT INTO webinars (
  id, title, slug, description, duration, status, \"hostId\", 
  \"registrationTemplate\", \"customHtml\", \"customCss\",
  \"createdAt\", \"updatedAt\"
)
VALUES (
  'test-custom-001',
  'Test Webinar - Custom HTML',
  'test-custom',
  'This webinar uses custom HTML with variable replacement and custom styling.',
  60,
  'SCHEDULED',
  (SELECT id FROM users LIMIT 1),
  'custom',
  '<div class=\"hero\">
    <div class=\"badge\">FREE LIVE TRAINING</div>
    <h1>{{webinar.title}}</h1>
    <p class=\"description\">{{webinar.description}}</p>
    <p class=\"duration\">Duration: {{webinar.duration}} minutes</p>
    <button class=\"cta-button\" data-action=\"register\">
      REGISTER NOW - IT''S FREE
    </button>
  </div>
  <div class=\"schedules-section\">
    <h2>Choose Your Time:</h2>
    {{schedules}}
  </div>',
  'body {
    font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif;
    margin: 0;
    padding: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  .hero {
    text-align: center;
    padding: 80px 20px;
    max-width: 800px;
    margin: 0 auto;
  }
  .badge {
    display: inline-block;
    background: #ffd700;
    color: #667eea;
    padding: 8px 20px;
    border-radius: 20px;
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 20px;
  }
  .hero h1 {
    font-size: 48px;
    margin: 20px 0;
    text-shadow: 0 2px 10px rgba(0,0,0,0.3);
  }
  .description {
    font-size: 20px;
    margin: 20px 0;
    opacity: 0.95;
  }
  .duration {
    font-size: 16px;
    margin: 10px 0;
    opacity: 0.9;
  }
  .cta-button {
    background: #ff6b6b;
    color: white;
    border: none;
    padding: 20px 40px;
    font-size: 20px;
    font-weight: bold;
    border-radius: 50px;
    cursor: pointer;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    transition: transform 0.2s;
    margin-top: 30px;
  }
  .cta-button:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 40px rgba(0,0,0,0.4);
  }
  .schedules-section {
    max-width: 800px;
    margin: 40px auto;
    padding: 40px 20px;
    background: rgba(255,255,255,0.1);
    border-radius: 20px;
    backdrop-filter: blur(10px);
  }
  .schedules-section h2 {
    text-align: center;
    margin-bottom: 30px;
    font-size: 32px;
  }',
  NOW(),
  NOW()
);

INSERT INTO schedules (\"webinarId\", \"scheduleType\", \"scheduledAt\", timezone, \"createdAt\", \"updatedAt\")
VALUES (
  'test-custom-001',
  'specific',
  NOW() + INTERVAL '7 days',
  'America/New_York',
  NOW(),
  NOW()
);
" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "✅ Custom HTML template webinar created"
  echo "   URL: http://localhost:3003/w/test-custom"
else
  echo "❌ Failed to create custom template webinar"
fi

echo ""
echo "=============================="
echo "✨ Test webinars created!"
echo ""
echo "Visit these URLs to test each template:"
echo ""
echo "  1. Default Template:"
echo "     http://localhost:3003/w/test-default"
echo ""
echo "  2. Minimal Template:"
echo "     http://localhost:3003/w/test-minimal"
echo ""
echo "  3. Urgency Template:"
echo "     http://localhost:3003/w/test-urgency"
echo ""
echo "  4. Custom HTML Template:"
echo "     http://localhost:3003/w/test-custom"
echo ""
echo "=============================="
echo ""
echo "📊 To clean up test data later, run:"
echo "psql -U aribafarheen -d webinar_db -c \"DELETE FROM webinars WHERE id LIKE 'test-%'\""
echo ""
