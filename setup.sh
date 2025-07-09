#!/bin/bash

echo "🔍 Checking for file conflicts..."

# Check what files exist
echo "📁 Checking root files:"
ls -la | grep -E "(App\.|index\.)"

# Check App files
if [ -f "App.tsx" ] && [ -f "App.js" ]; then
    echo "⚠️  WARNING: Both App.tsx and App.js exist!"
    echo "This will cause conflicts!"
fi

# Check index files
if [ ! -f "index.js" ]; then
    echo "❌ ERROR: index.js is missing!"
else
    echo "✅ index.js exists"
    echo "Content:"
    head -10 index.js
fi

# Check if index.ts exists
if [ -f "index.ts" ]; then
    echo "⚠️  WARNING: index.ts exists - React Native expects index.js!"
fi

# Fix the issues
echo ""
echo "🔧 Fixing issues..."

# 1. Remove TypeScript files if JavaScript files exist
if [ -f "App.tsx" ] && [ -f "App.js" ]; then
    echo "Backing up App.tsx to App.tsx.backup"
    mv App.tsx App.tsx.backup
fi

if [ -f "index.ts" ]; then
    echo "Backing up index.ts to index.ts.backup"
    mv index.ts index.ts.backup
fi

# 2. Create proper index.js
echo "Creating correct index.js..."
cat > index.js << 'EOF'
/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

console.log('Registering app:', appName);

AppRegistry.registerComponent(appName, () => App);

// Add error handling
if (__DEV__) {
    console.log('App registered successfully in DEV mode');
}
EOF

# 3. Verify app.json
echo ""
echo "📋 Checking app.json:"
if [ -f "app.json" ]; then
    cat app.json
else
    echo "Creating app.json..."
    cat > app.json << 'EOF'
{
  "name": "BrainBites",
  "displayName": "BrainBites"
}
EOF
fi

echo ""
echo "✅ Fixed! Now run:"
echo "1. npx react-native start --reset-cache"
echo "2. npx react-native run-android"